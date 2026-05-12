import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

import { useAppSettings } from "@/context/AppSettingsContext";
import { adjustForQuietHours } from "@/utils/care";

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
  { label: string; icon: string; color: string }
> = {
  excellent: { label: "Отлично", icon: "heart", color: "#2D6A4F" },
  good: { label: "Хорошо", icon: "checkmark-circle", color: "#52B788" },
  needs_attention: {
    label: "Нужен уход",
    icon: "alert-circle",
    color: "#F4A261",
  },
  sick: { label: "Болеет", icon: "warning", color: "#E53E3E" },
};

export type CareHistoryType = "water" | "mist" | "health";

export interface CareHistoryEntry {
  id: string;
  timestamp: number;
  type: CareHistoryType;
  healthStatus?: HealthStatus;
  comment?: string;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  mainPhoto: string | null;
  location: string;
  purchaseDate: number | null;
  lastRepotted: number | null;
  lightLevel: 1 | 2 | 3 | 4 | 5;
  difficulty: 1 | 2 | 3 | 4 | 5;
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
  if (!lastAction) return "Overdue";
  const intervalMs = getIntervalMs(interval);
  const nextAction = lastAction + intervalMs;
  const remaining = nextAction - Date.now();
  if (remaining <= 0) return "Overdue";
  const totalMins = Math.floor(remaining / 60000);
  const totalHours = Math.floor(totalMins / 60);
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  if (totalHours > 0) return `${totalHours}h`;
  return `${totalMins}m`;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
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
      content: { title, body },
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
  const { quietHoursEnabled } = useAppSettings();

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(async (raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Plant[];
          setPlants(parsed.map(migrate));
          return;
        }
        for (const k of OLD_STORAGE_KEYS) {
          const old = await AsyncStorage.getItem(k);
          if (!old) continue;
          const parsed = JSON.parse(old) as any[];
          const migrated = parsed.map(migrate);
          setPlants(migrated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
          break;
        }
      })
      .finally(() => setLoading(false));
  }, []);

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
        if (plant.wateringEnabled) {
          const baseTriggerMs =
            plant.snooze.waterUntil ??
            (plant.lastWatered
              ? plant.lastWatered + getIntervalMs(plant.wateringInterval)
              : 0);
          if (baseTriggerMs <= 0) return;
          scheduleCareNotification(
            `watering-${id}`,
            "Time to water!",
            `${plant.name} needs watering`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      });

      cancelNotification(`misting-${id}`).then(() => {
        if (plant.mistingEnabled) {
          const baseTriggerMs =
            plant.snooze.mistUntil ??
            (plant.lastMisted
              ? plant.lastMisted + getIntervalMs(plant.mistingInterval)
              : 0);
          if (baseTriggerMs <= 0) return;
          scheduleCareNotification(
            `misting-${id}`,
            "Time to mist!",
            `${plant.name} needs misting`,
            baseTriggerMs,
            quietHoursEnabled
          );
        }
      });
    },
    [plants, persist, quietHoursEnabled]
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
        if (watered.wateringEnabled) {
          const triggerMs = now + getIntervalMs(watered.wateringInterval);
          scheduleCareNotification(
            `watering-${id}`,
            "Time to water!",
            `${watered.name} needs watering`,
            triggerMs,
            quietHoursEnabled
          );
        }
        return watered;
      });
      persist(updated);
    },
    [plants, persist, quietHoursEnabled]
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
        if (misted.mistingEnabled) {
          const triggerMs = now + getIntervalMs(misted.mistingInterval);
          scheduleCareNotification(
            `misting-${id}`,
            "Time to mist!",
            `${misted.name} needs misting`,
            triggerMs,
            quietHoursEnabled
          );
        }
        return misted;
      });
      persist(updated);
    },
    [plants, persist, quietHoursEnabled]
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
          scheduleCareNotification(
            `${type === "water" ? "watering" : "misting"}-${plantId}`,
            type === "water" ? "Time to water!" : "Time to mist!",
            type === "water"
              ? `${plant.name} needs watering`
              : `${plant.name} needs misting`,
            until,
            quietHoursEnabled
          );
        }
      );
    },
    [plants, persist, quietHoursEnabled]
  );

  const skipCare = useCallback(
    (plantId: string, type: "water" | "mist") => {
      snoozeCare(plantId, type, 3600 * 1000);
    },
    [snoozeCare]
  );

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
    lightLevel: 3,
    difficulty: 3,
    ...p,
    history: Array.isArray(history) ? history : [],
    snooze: {
      waterUntil: typeof p?.snooze?.waterUntil === "number" ? p.snooze.waterUntil : null,
      mistUntil: typeof p?.snooze?.mistUntil === "number" ? p.snooze.mistUntil : null,
    },
  };
}
