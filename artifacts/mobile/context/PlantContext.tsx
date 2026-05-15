import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { AlertCircle, CircleCheck, Heart, TriangleAlert } from "lucide-react-native";

import { useAppSettings } from "@/context/AppSettingsContext";
import { adjustForQuietHours } from "@/utils/care";
import { buildPlantWidgetPayload } from "@/utils/plantWidget";
import { syncPlantWidget } from "@/utils/widgetSync";

export interface Note {
  id: string;
  text: string;
  timestamp: number;
}

export type TimeUnit = "hours" | "days";

export interface TimeInterval {
  value: number;
  unit: TimeUnit;
}

export type Recurrence = "once" | "yearly";

export interface Reminder {
  id: string;
  title: string;
  date: number;
  recurrence: Recurrence;
  notificationId: string | null;
}

export type HealthStatus = "excellent" | "good" | "needs_attention" | "sick";

export const HEALTH_STATUS_CONFIG: Record<
  HealthStatus,
  { label: string; Icon: React.ComponentType<{ size?: number; color?: string }>; color: string }
> = {
  excellent: { label: "Отлично", Icon: Heart, color: "#2D6A4F" },
  good: { label: "Хорошо", Icon: CircleCheck, color: "#52B788" },
  needs_attention: {
    label: "Нужен уход",
    Icon: AlertCircle,
    color: "#F4A261",
  },
  sick: { label: "Болеет", Icon: TriangleAlert, color: "#E53E3E" },
};

export type CareHistoryType = "water" | "mist" | "health";

export interface CareHistoryEntry {
  id: string;
  timestamp: number;
  type: CareHistoryType;
  healthStatus?: HealthStatus;
  comment?: string;
}

export type LightLevel = "low" | "medium" | "bright";
export type CareDifficulty = "easy" | "medium" | "hard";

export interface Plant {
  id: string;
  name: string;
  species: string;
  catalogId: string | null;
  carePlanId: string | null;
  mainPhoto: string | null;
  location: string;
  purchaseDate: number | null;
  lastRepotted: number | null;
  lightLevel: LightLevel;
  difficulty: CareDifficulty;
  wateringInterval: TimeInterval;
  mistingInterval: TimeInterval;
  wateringEnabled: boolean;
  mistingEnabled: boolean;
  healthStatus: HealthStatus;
  history: CareHistoryEntry[];
  snooze: { waterUntil: number | null; mistUntil: number | null };
  notes: Note[];
  photoAlbum: string[];
  reminders: Reminder[];
  lastWatered: number | null;
  lastMisted: number | null;
  createdAt: number;
}

export function getIntervalMs(interval: TimeInterval): number {
  return interval.unit === "hours"
    ? interval.value * 3600 * 1000
    : interval.value * 24 * 3600 * 1000;
}

export function getProgress(
  lastAction: number | null,
  interval: TimeInterval
): number {
  if (!lastAction) return 1;
  const intervalMs = getIntervalMs(interval);
  const elapsed = Date.now() - lastAction;
  return Math.min(elapsed / intervalMs, 1);
}

export function getTimeRemaining(
  lastAction: number | null,
  interval: TimeInterval
): string {
  if (!lastAction) return "Просрочено";
  const intervalMs = getIntervalMs(interval);
  const nextAction = lastAction + intervalMs;
  const remaining = nextAction - Date.now();
  if (remaining <= 0) return "Просрочено";
  const totalMins = Math.floor(remaining / 60000);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}д ${hours}ч`;
  if (totalHours > 0) return `${totalHours}ч`;
  return `${totalMins}м`;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

function coerceLightLevel(value: unknown): LightLevel {
  if (value === "low" || value === "medium" || value === "bright") return value;
  if (typeof value === "number") {
    if (value <= 2) return "low";
    if (value >= 4) return "bright";
    return "medium";
  }
  return "medium";
}

function coerceDifficulty(value: unknown): CareDifficulty {
  if (value === "easy" || value === "medium" || value === "hard") return value;
  if (typeof value === "number") {
    if (value <= 2) return "easy";
    if (value >= 4) return "hard";
    return "medium";
  }
  return "medium";
}

// ---- Notification helpers ----

async function cancelNotification(id: string | null): Promise<void> {
  if (!id || Platform.OS === "web") return;
  try {
    const N = await import("expo-notifications");
    await N.cancelScheduledNotificationAsync(id);
  } catch {
    // ignore
  }
}

async function scheduleCareNotification(
  identifier: string,
  title: string,
  body: string,
  triggerMs: number,
  quietHoursEnabled: boolean
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const adjusted = adjustForQuietHours(triggerMs, quietHoursEnabled);
  if (adjusted <= Date.now()) return null;
  try {
    const N = await import("expo-notifications");
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return null;
    const id = await N.scheduleNotificationAsync({
      identifier,
      content: { title, body, categoryIdentifier: "care" },
      trigger: { type: "date", date: new Date(adjusted) } as any,
    });
    return id;
  } catch {
    return null;
  }
}

async function scheduleReminderNotification(
  plantName: string,
  reminder: Reminder
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  const now = Date.now();
  if (reminder.date <= now) return null;
  try {
    const N = await import("expo-notifications");
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return null;
    const id = await N.scheduleNotificationAsync({
      identifier: `reminder-${reminder.id}`,
      content: {
        title: reminder.title,
        body: `Reminder for ${plantName}`,
      },
      trigger: { type: "date", date: new Date(reminder.date) } as any,
    });
    return id;
  } catch {
    return null;
  }
}

async function normalizeYearlyReminders(plants: Plant[]): Promise<{ updated: Plant[]; changed: boolean }> {
  const now = Date.now();
  let changed = false;

  const updated = await Promise.all(
    plants.map(async (p) => {
      if (!p.reminders?.length) return p;
      let plantChanged = false;

      const reminders = await Promise.all(
        p.reminders.map(async (r) => {
          if (r.recurrence !== "yearly") return r;
          if (r.date > now) return r;

          let next = r.date;
          while (next <= now) {
            const d = new Date(next);
            d.setFullYear(d.getFullYear() + 1);
            next = d.getTime();
          }

          if (next === r.date) return r;
          plantChanged = true;
          changed = true;

          await cancelNotification(r.notificationId);
          const scheduled = await scheduleReminderNotification(p.name, {
            ...r,
            date: next,
            notificationId: null,
          });
          return { ...r, date: next, notificationId: scheduled };
        })
      );

      if (!plantChanged) return p;
      return { ...p, reminders };
    })
  );

  return { updated, changed };
}

// ---- Context types ----

type AddPlantData = Omit<
  Plant,
  | "id"
  | "createdAt"
  | "history"
  | "snooze"
  | "notes"
  | "photoAlbum"
  | "reminders"
  | "lastWatered"
  | "lastMisted"
>;

type EditPlantData = Pick<
  Plant,
  | "name"
  | "species"
  | "carePlanId"
  | "mainPhoto"
  | "location"
  | "purchaseDate"
  | "lastRepotted"
  | "lightLevel"
  | "difficulty"
  | "wateringInterval"
  | "mistingInterval"
  | "healthStatus"
  | "wateringEnabled"
  | "mistingEnabled"
>;

interface PlantContextType {
  plants: Plant[];
  loading: boolean;
  addPlant: (data: AddPlantData) => void;
  editPlant: (id: string, data: EditPlantData) => void;
  deletePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  mistPlant: (id: string) => void;
  addHealthLog: (plantId: string, status: HealthStatus, comment?: string) => void;
  snoozeCare: (plantId: string, type: "water" | "mist", durationMs: number) => void;
  skipCare: (plantId: string, type: "water" | "mist") => void;
  addNote: (plantId: string, text: string) => void;
  updateNote: (plantId: string, noteId: string, text: string) => void;
  deleteNote: (plantId: string, noteId: string) => void;
  addPhoto: (plantId: string, uri: string) => void;
  deletePhoto: (plantId: string, photoIndex: number) => void;
  addReminder: (
    plantId: string,
    reminder: Omit<Reminder, "id" | "notificationId">
  ) => Promise<void>;
  deleteReminder: (plantId: string, reminderId: string) => void;
}

const PlantContext = createContext<PlantContextType | null>(null);
const STORAGE_KEY = "plant_care_plants_v4";
const OLD_STORAGE_KEYS = ["plant_care_plants_v3", "plant_care_plants_v2"];

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);
  const appSettings = useAppSettings();
  const { quietHoursEnabled, notificationsEnabled, widgetPlantId } = appSettings;
  const isWeb = Platform.OS === "web";
  const plantsRef = useRef<Plant[]>(plants);

  useEffect(() => {
    plantsRef.current = plants;
  }, [plants]);

  useEffect(() => {
    if (isWeb || loading) return;
    if (!widgetPlantId) {
      syncPlantWidget(null);
      return;
    }
    const plant = plants.find((p) => p.id === widgetPlantId);
    if (!plant) {
      appSettings.setWidgetPlantId(null);
      syncPlantWidget(null);
      return;
    }
    syncPlantWidget(buildPlantWidgetPayload(plant));
  }, [appSettings.setWidgetPlantId, isWeb, loading, plants, widgetPlantId]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Plant[];
          const migrated = parsed.map(migrate);
          const normalized = await normalizeYearlyReminders(migrated);
          setPlants(normalized.updated);
          if (normalized.changed) {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized.updated));
          }
          return;
        }
        for (const k of OLD_STORAGE_KEYS) {
          const old = await AsyncStorage.getItem(k);
          if (!old) continue;
          const parsed = JSON.parse(old) as any[];
          const migrated = parsed.map(migrate);
          const normalized = await normalizeYearlyReminders(migrated);
          setPlants(normalized.updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(normalized.updated));
          break;
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (isWeb || loading) return;
    const current = plantsRef.current;

    current.forEach((p) => {
      cancelNotification(`watering-${p.id}`);
      cancelNotification(`misting-${p.id}`);
    });

    if (!notificationsEnabled) return;

    current.forEach((p) => {
      if (p.wateringEnabled) {
        const baseTriggerMs =
          p.snooze.waterUntil ??
          (p.lastWatered ? p.lastWatered + getIntervalMs(p.wateringInterval) : 0);
        if (baseTriggerMs > 0) {
          scheduleCareNotification(
            `watering-${p.id}`,
            "Пора поливать!",
            `${p.name} нужно полить`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      }

      if (p.mistingEnabled) {
        const baseTriggerMs =
          p.snooze.mistUntil ??
          (p.lastMisted ? p.lastMisted + getIntervalMs(p.mistingInterval) : 0);
        if (baseTriggerMs > 0) {
          scheduleCareNotification(
            `misting-${p.id}`,
            "Пора опрыскивать!",
            `${p.name} нужно опрыскать`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      }
    });
  }, [isWeb, loading, notificationsEnabled, quietHoursEnabled]);

  const persist = useCallback(async (updated: Plant[]) => {
    setPlants(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addPlant = useCallback(
    (data: AddPlantData) => {
      const newPlant: Plant = {
        ...data,
        id: generateId(),
        history: [],
        snooze: { waterUntil: null, mistUntil: null },
        notes: [],
        photoAlbum: [],
        reminders: [],
        lastWatered: null,
        lastMisted: null,
        createdAt: Date.now(),
      };
      persist([...plants, newPlant]);
    },
    [plants, persist]
  );

  const editPlant = useCallback(
    (id: string, data: EditPlantData) => {
      const updated = plants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      persist(updated);

      const plant = updated.find((p) => p.id === id);
      if (!plant) return;

      cancelNotification(`watering-${id}`).then(() => {
        if (plant.wateringEnabled && notificationsEnabled) {
          const baseTriggerMs =
            plant.snooze.waterUntil ??
            (plant.lastWatered
              ? plant.lastWatered + getIntervalMs(plant.wateringInterval)
              : 0);
          if (baseTriggerMs <= 0) return;
          scheduleCareNotification(
            `watering-${id}`,
            "Пора поливать!",
            `${plant.name} нужно полить`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      });

      cancelNotification(`misting-${id}`).then(() => {
        if (plant.mistingEnabled && notificationsEnabled) {
          const baseTriggerMs =
            plant.snooze.mistUntil ??
            (plant.lastMisted
              ? plant.lastMisted + getIntervalMs(plant.mistingInterval)
              : 0);
          if (baseTriggerMs <= 0) return;
          scheduleCareNotification(
            `misting-${id}`,
            "Пора опрыскивать!",
            `${plant.name} нужно опрыскать`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      });
    },
    [plants, persist, quietHoursEnabled, notificationsEnabled]
  );

  const deletePlant = useCallback(
    (id: string) => {
      const plant = plants.find((p) => p.id === id);
      if (plant) {
        cancelNotification(`watering-${id}`);
        cancelNotification(`misting-${id}`);
        plant.reminders.forEach((r) => cancelNotification(r.notificationId));
      }
      persist(plants.filter((p) => p.id !== id));
    },
    [plants, persist]
  );

  const waterPlant = useCallback(
    (id: string) => {
      const updated = plants.map((p) => {
        if (p.id !== id) return p;
        const now = Date.now();
        const entry: CareHistoryEntry = {
          id: generateId(),
          timestamp: now,
          type: "water",
        };
        const watered = {
          ...p,
          lastWatered: now,
          snooze: { ...p.snooze, waterUntil: null },
          history: [...(p.history ?? []), entry],
        };
        if (watered.wateringEnabled && notificationsEnabled) {
          const triggerMs = now + getIntervalMs(watered.wateringInterval);
          scheduleCareNotification(
            `watering-${id}`,
            "Пора поливать!",
            `${watered.name} нужно полить`,
            triggerMs,
            quietHoursEnabled
          );
        }
        return watered;
      });
      persist(updated);
    },
    [plants, persist, quietHoursEnabled, notificationsEnabled]
  );

  const mistPlant = useCallback(
    (id: string) => {
      const updated = plants.map((p) => {
        if (p.id !== id) return p;
        const now = Date.now();
        const entry: CareHistoryEntry = {
          id: generateId(),
          timestamp: now,
          type: "mist",
        };
        const misted = {
          ...p,
          lastMisted: now,
          snooze: { ...p.snooze, mistUntil: null },
          history: [...(p.history ?? []), entry],
        };
        if (misted.mistingEnabled && notificationsEnabled) {
          const triggerMs = now + getIntervalMs(misted.mistingInterval);
          scheduleCareNotification(
            `misting-${id}`,
            "Пора опрыскивать!",
            `${misted.name} нужно опрыскать`,
            triggerMs,
            quietHoursEnabled
          );
        }
        return misted;
      });
      persist(updated);
    },
    [plants, persist, quietHoursEnabled, notificationsEnabled]
  );

  const addHealthLog = useCallback(
    (plantId: string, status: HealthStatus, comment?: string) => {
      const now = Date.now();
      const entry: CareHistoryEntry = {
        id: generateId(),
        timestamp: now,
        type: "health",
        healthStatus: status,
        comment: comment?.trim() ? comment.trim() : undefined,
      };
      const updated = plants.map((p) =>
        p.id === plantId
          ? {
              ...p,
              healthStatus: status,
              history: [...(p.history ?? []), entry],
            }
          : p
      );
      persist(updated);
    },
    [plants, persist]
  );

  const snoozeCare = useCallback(
    (plantId: string, type: "water" | "mist", durationMs: number) => {
      const now = Date.now();
      const until = now + durationMs;
      const updated = plants.map((p) => {
        if (p.id !== plantId) return p;
        const snooze =
          type === "water"
            ? { ...p.snooze, waterUntil: until }
            : { ...p.snooze, mistUntil: until };
        return { ...p, snooze };
      });
      persist(updated);
      const plant = updated.find((p) => p.id === plantId);
      if (!plant) return;
      cancelNotification(`${type === "water" ? "watering" : "misting"}-${plantId}`).then(
        () => {
          if (notificationsEnabled) {
            scheduleCareNotification(
              `${type === "water" ? "watering" : "misting"}-${plantId}`,
              type === "water" ? "Пора поливать!" : "Пора опрыскивать!",
              type === "water"
                ? `${plant.name} нужно полить`
                : `${plant.name} нужно опрыскать`,
              until,
              quietHoursEnabled
            );
          }
        }
      );
    },
    [plants, persist, quietHoursEnabled, notificationsEnabled]
  );

  const skipCare = useCallback(
    (plantId: string, type: "water" | "mist") => {
      const plant = plants.find((p) => p.id === plantId);
      if (!plant) return;
      const durationMs =
        type === "water"
          ? getIntervalMs(plant.wateringInterval)
          : getIntervalMs(plant.mistingInterval);
      snoozeCare(plantId, type, durationMs);
    },
    [plants, snoozeCare]
  );

  useEffect(() => {
    if (isWeb) return;
    let sub: { remove: () => void } | null = null;
    (async () => {
      try {
        const N = await import("expo-notifications");
        await N.setNotificationCategoryAsync("care", [
          {
            identifier: "care-done",
            buttonTitle: "Выполнено",
            options: { opensAppToForeground: false },
          },
          {
            identifier: "care-snooze-1h",
            buttonTitle: "+1 час",
            options: { opensAppToForeground: false },
          },
          {
            identifier: "care-skip",
            buttonTitle: "Пропустить",
            options: { opensAppToForeground: false },
          },
        ]);
        sub = N.addNotificationResponseReceivedListener((resp) => {
          const notificationId = resp.notification.request.identifier;
          const actionId = resp.actionIdentifier;
          const isWater = notificationId.startsWith("watering-");
          const isMist = notificationId.startsWith("misting-");
          if (!isWater && !isMist) return;
          const plantId = notificationId.slice(
            isWater ? "watering-".length : "misting-".length
          );
          const type = isWater ? "water" : "mist";

          if (actionId === "care-done") {
            if (type === "water") waterPlant(plantId);
            else mistPlant(plantId);
            return;
          }
          if (actionId === "care-snooze-1h") {
            snoozeCare(plantId, type, 3600 * 1000);
            return;
          }
          if (actionId === "care-skip") {
            skipCare(plantId, type);
          }
        });
      } catch {}
    })();
    return () => {
      sub?.remove();
    };
  }, [isWeb, mistPlant, skipCare, snoozeCare, waterPlant]);

  const addNote = useCallback(
    (plantId: string, text: string) => {
      const note: Note = { id: generateId(), text, timestamp: Date.now() };
      const updated = plants.map((p) =>
        p.id === plantId ? { ...p, notes: [...p.notes, note] } : p
      );
      persist(updated);
    },
    [plants, persist]
  );

  const updateNote = useCallback(
    (plantId: string, noteId: string, text: string) => {
      const updated = plants.map((p) => {
        if (p.id !== plantId) return p;
        return {
          ...p,
          notes: p.notes.map((n) => (n.id === noteId ? { ...n, text } : n)),
        };
      });
      persist(updated);
    },
    [plants, persist]
  );

  const deleteNote = useCallback(
    (plantId: string, noteId: string) => {
      const updated = plants.map((p) => {
        if (p.id !== plantId) return p;
        return { ...p, notes: p.notes.filter((n) => n.id !== noteId) };
      });
      persist(updated);
    },
    [plants, persist]
  );

  const addPhoto = useCallback(
    (plantId: string, uri: string) => {
      const updated = plants.map((p) =>
        p.id === plantId
          ? { ...p, photoAlbum: [...p.photoAlbum, uri] }
          : p
      );
      persist(updated);
    },
    [plants, persist]
  );

  const deletePhoto = useCallback(
    (plantId: string, photoIndex: number) => {
      const updated = plants.map((p) => {
        if (p.id !== plantId) return p;
        const newAlbum = [...p.photoAlbum];
        newAlbum.splice(photoIndex, 1);
        return { ...p, photoAlbum: newAlbum };
      });
      persist(updated);
    },
    [plants, persist]
  );

  const addReminder = useCallback(
    async (
      plantId: string,
      reminderData: Omit<Reminder, "id" | "notificationId">
    ) => {
      const plant = plants.find((p) => p.id === plantId);
      if (!plant) return;
      const newReminder: Reminder = {
        ...reminderData,
        id: generateId(),
        notificationId: null,
      };
      const notifId = await scheduleReminderNotification(
        plant.name,
        newReminder
      );
      newReminder.notificationId = notifId;
      const updated = plants.map((p) =>
        p.id === plantId
          ? { ...p, reminders: [...p.reminders, newReminder] }
          : p
      );
      persist(updated);
    },
    [plants, persist]
  );

  const deleteReminder = useCallback(
    (plantId: string, reminderId: string) => {
      const plant = plants.find((p) => p.id === plantId);
      if (plant) {
        const reminder = plant.reminders.find((r) => r.id === reminderId);
        if (reminder?.notificationId) {
          cancelNotification(reminder.notificationId);
        }
      }
      const updated = plants.map((p) => {
        if (p.id !== plantId) return p;
        return {
          ...p,
          reminders: p.reminders.filter((r) => r.id !== reminderId),
        };
      });
      persist(updated);
    },
    [plants, persist]
  );

  return (
    <PlantContext.Provider
      value={{
        plants,
        loading,
        addPlant,
        editPlant,
        deletePlant,
        waterPlant,
        mistPlant,
        addHealthLog,
        snoozeCare,
        skipCare,
        addNote,
        updateNote,
        deleteNote,
        addPhoto,
        deletePhoto,
        addReminder,
        deleteReminder,
      }}
    >
      {children}
    </PlantContext.Provider>
  );
}

export function usePlants(): PlantContextType {
  const ctx = useContext(PlantContext);
  if (!ctx) throw new Error("usePlants must be used within PlantProvider");
  return ctx;
}

// ---- Migration helper ----
function migrate(p: any): Plant {
  const rawHistory = Array.isArray(p?.history) ? p.history : [];
  const rawLogs = Array.isArray(p?.logs) ? p.logs : [];
  const history: CareHistoryEntry[] =
    rawHistory.length > 0
      ? rawHistory
      : rawLogs.map((l: any) => ({
          id: String(l?.id ?? generateId()),
          timestamp: Number(l?.timestamp ?? Date.now()),
          type: l?.type as CareHistoryType,
          healthStatus: l?.healthStatus as HealthStatus,
          comment: typeof l?.comment === "string" ? l.comment : undefined,
        }));

  return {
    reminders: [],
    wateringEnabled: true,
    mistingEnabled: true,
    healthStatus: "good" as HealthStatus,
    location: "",
    purchaseDate: null,
    lastRepotted: null,
    carePlanId: null,
    ...p,
    catalogId: typeof p?.catalogId === "string" ? p.catalogId : null,
    lightLevel: coerceLightLevel(p?.lightLevel),
    difficulty: coerceDifficulty(p?.difficulty),
    history: Array.isArray(history) ? history : [],
    snooze: {
      waterUntil: typeof p?.snooze?.waterUntil === "number" ? p.snooze.waterUntil : null,
      mistUntil: typeof p?.snooze?.mistUntil === "number" ? p.snooze.mistUntil : null,
    },
  };
}
