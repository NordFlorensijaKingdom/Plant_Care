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
