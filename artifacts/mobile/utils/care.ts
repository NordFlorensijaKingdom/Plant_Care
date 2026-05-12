export type CareTaskType = "water" | "mist";

export interface DuePlantInput {
  id: string;
  name: string;
  wateringEnabled: boolean;
  mistingEnabled: boolean;
  lastWatered: number | null;
  lastMisted: number | null;
  wateringIntervalMs: number;
  mistingIntervalMs: number;
  snooze: { waterUntil: number | null; mistUntil: number | null };
}

export interface CareTask {
  plantId: string;
  plantName: string;
  type: CareTaskType;
  dueAt: number;
  overdueMs: number;
}

export type CalendarEventSource = "schedule" | "reminder" | "history";
export type CalendarEventType = "water" | "mist" | "reminder" | "health";

export interface CalendarEvent {
  id: string;
  plantId: string;
  plantName: string;
  type: CalendarEventType;
  source: CalendarEventSource;
  timestamp: number;
  title: string;
  details?: string;
}

export interface CalendarPlantInput {
  id: string;
  name: string;
  wateringEnabled: boolean;
  mistingEnabled: boolean;
  lastWatered: number | null;
  lastMisted: number | null;
  wateringIntervalMs: number;
  mistingIntervalMs: number;
  snooze: { waterUntil: number | null; mistUntil: number | null };
  reminders: { id: string; title: string; date: number; recurrence: "once" | "yearly" }[];
  history: { id: string; timestamp: number; type: "water" | "mist" | "health"; healthStatus?: string }[];
}

export function parseISODateToMs(value: string): number | null {
  const raw = value.trim();
  if (!raw) return null;
  const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const monthIndex = Number(m[2]) - 1;
  const day = Number(m[3]);
  if (!Number.isFinite(year) || !Number.isFinite(monthIndex) || !Number.isFinite(day)) {
    return null;
  }
  const d = new Date(year, monthIndex, day, 0, 0, 0, 0);
  if (
    d.getFullYear() !== year ||
    d.getMonth() !== monthIndex ||
    d.getDate() !== day
  ) {
    return null;
  }
  return d.getTime();
}

export function adjustForQuietHours(triggerMs: number, quietHoursEnabled: boolean): number {
  if (!quietHoursEnabled) return triggerMs;
  const d = new Date(triggerMs);
  const hour = d.getHours();
  const inQuiet = hour >= 22 || hour < 8;
  if (!inQuiet) return triggerMs;

  const adjusted = new Date(d);
  if (hour >= 22) {
    adjusted.setDate(adjusted.getDate() + 1);
  }
  adjusted.setHours(8, 0, 0, 0);
  return adjusted.getTime();
}

export function computeDueCareTasks(plants: DuePlantInput[], now: number): CareTask[] {
  const tasks: CareTask[] = [];

  for (const p of plants) {
    if (p.wateringEnabled) {
      const dueAt = p.lastWatered == null ? now : p.lastWatered + p.wateringIntervalMs;
      const snoozed = p.snooze.waterUntil != null && now < p.snooze.waterUntil;
      if (!snoozed && now >= dueAt) {
        tasks.push({
          plantId: p.id,
          plantName: p.name,
          type: "water",
          dueAt,
          overdueMs: Math.max(0, now - dueAt),
        });
      }
    }

    if (p.mistingEnabled) {
      const dueAt = p.lastMisted == null ? now : p.lastMisted + p.mistingIntervalMs;
      const snoozed = p.snooze.mistUntil != null && now < p.snooze.mistUntil;
      if (!snoozed && now >= dueAt) {
        tasks.push({
          plantId: p.id,
          plantName: p.name,
          type: "mist",
          dueAt,
          overdueMs: Math.max(0, now - dueAt),
        });
      }
    }
  }

  tasks.sort((a, b) => b.overdueMs - a.overdueMs);
  return tasks;
}

function buildOccurrences(
  enabled: boolean,
  lastAction: number | null,
  intervalMs: number,
  snoozeUntil: number | null,
  rangeStart: number,
  rangeEnd: number
): number[] {
  if (!enabled) return [];
  if (!Number.isFinite(intervalMs) || intervalMs <= 0) return [];
  let next = lastAction == null ? rangeStart : lastAction + intervalMs;
  if (next < rangeStart) {
    const delta = rangeStart - next;
    const steps = Math.ceil(delta / intervalMs);
    next += steps * intervalMs;
  }
  if (snoozeUntil != null && snoozeUntil > next) next = snoozeUntil;
  const out: number[] = [];
  while (next < rangeEnd) {
    out.push(next);
    next += intervalMs;
  }
  return out;
}

function formatLocalTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function computeCalendarEvents(
  plants: CalendarPlantInput[],
  rangeStart: number,
  rangeEnd: number
): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const p of plants) {
    const wateringDates = buildOccurrences(
      p.wateringEnabled,
      p.lastWatered,
      p.wateringIntervalMs,
      p.snooze.waterUntil,
      rangeStart,
      rangeEnd
    );
    for (const ts of wateringDates) {
      events.push({
        id: `schedule-water-${p.id}-${ts}`,
        plantId: p.id,
        plantName: p.name,
        type: "water",
        source: "schedule",
        timestamp: ts,
        title: "Полив",
        details: formatLocalTime(ts),
      });
    }

    const mistingDates = buildOccurrences(
      p.mistingEnabled,
      p.lastMisted,
      p.mistingIntervalMs,
      p.snooze.mistUntil,
      rangeStart,
      rangeEnd
    );
    for (const ts of mistingDates) {
      events.push({
        id: `schedule-mist-${p.id}-${ts}`,
        plantId: p.id,
        plantName: p.name,
        type: "mist",
        source: "schedule",
        timestamp: ts,
        title: "Опрыскивание",
        details: formatLocalTime(ts),
      });
    }

    for (const r of p.reminders) {
      if (r.recurrence === "once") {
        if (r.date >= rangeStart && r.date < rangeEnd) {
          events.push({
            id: `reminder-${p.id}-${r.id}-${r.date}`,
            plantId: p.id,
            plantName: p.name,
            type: "reminder",
            source: "reminder",
            timestamp: r.date,
            title: r.title,
            details: formatLocalTime(r.date),
          });
        }
        continue;
      }

      const base = new Date(r.date);
      const startYear = new Date(rangeStart).getFullYear();
      const endYear = new Date(rangeEnd - 1).getFullYear();
      for (let y = startYear; y <= endYear; y++) {
        const dt = new Date(
          y,
          base.getMonth(),
          base.getDate(),
          base.getHours(),
          base.getMinutes(),
          base.getSeconds(),
          base.getMilliseconds()
        ).getTime();
        if (dt < rangeStart || dt >= rangeEnd) continue;
        events.push({
          id: `reminder-yearly-${p.id}-${r.id}-${dt}`,
          plantId: p.id,
          plantName: p.name,
          type: "reminder",
          source: "reminder",
          timestamp: dt,
          title: r.title,
          details: formatLocalTime(dt),
        });
      }
    }

    for (const h of p.history) {
      if (h.timestamp < rangeStart || h.timestamp >= rangeEnd) continue;
      if (h.type === "health") {
        events.push({
          id: `history-health-${p.id}-${h.id}`,
          plantId: p.id,
          plantName: p.name,
          type: "health",
          source: "history",
          timestamp: h.timestamp,
          title: "Здоровье",
          details: typeof h.healthStatus === "string" ? h.healthStatus : undefined,
        });
        continue;
      }
      events.push({
        id: `history-${h.type}-${p.id}-${h.id}`,
        plantId: p.id,
        plantName: p.name,
        type: h.type,
        source: "history",
        timestamp: h.timestamp,
        title: h.type === "water" ? "Полив" : "Опрыскивание",
        details: formatLocalTime(h.timestamp),
      });
    }
  }

  events.sort((a, b) => a.timestamp - b.timestamp || a.plantName.localeCompare(b.plantName));
  return events;
}
