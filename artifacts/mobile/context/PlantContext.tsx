import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Platform } from "react-native";

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
  date: number; // ms timestamp
  recurrence: Recurrence;
  notificationId: string | null;
}

export interface Plant {
  id: string;
  name: string;
  species: string;
  mainPhoto: string | null;
  wateringInterval: TimeInterval;
  mistingInterval: TimeInterval;
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

async function scheduleCarNotification(
  identifier: string,
  title: string,
  body: string,
  triggerMs: number
): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (triggerMs <= Date.now()) return null;
  try {
    const N = await import("expo-notifications");
    const { status } = await N.getPermissionsAsync();
    if (status !== "granted") return null;
    const id = await N.scheduleNotificationAsync({
      identifier,
      content: { title, body },
      trigger: { type: "date", date: new Date(triggerMs) } as any,
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

interface PlantContextType {
  plants: Plant[];
  loading: boolean;
  addPlant: (
    data: Omit<
      Plant,
      | "id"
      | "createdAt"
      | "notes"
      | "photoAlbum"
      | "reminders"
      | "lastWatered"
      | "lastMisted"
    >
  ) => void;
  editPlant: (
    id: string,
    data: Pick<
      Plant,
      "name" | "species" | "mainPhoto" | "wateringInterval" | "mistingInterval"
    >
  ) => void;
  deletePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  mistPlant: (id: string) => void;
  addNote: (plantId: string, text: string) => void;
  updateNote: (plantId: string, noteId: string, text: string) => void;
  deleteNote: (plantId: string, noteId: string) => void;
  addPhoto: (plantId: string, uri: string) => void;
  deletePhoto: (plantId: string, photoIndex: number) => void;
  addReminder: (plantId: string, reminder: Omit<Reminder, "id" | "notificationId">) => Promise<void>;
  deleteReminder: (plantId: string, reminderId: string) => void;
}

const PlantContext = createContext<PlantContextType | null>(null);
const STORAGE_KEY = "plant_care_plants_v2";

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Plant[];
          // Migrate: ensure reminders field exists
          setPlants(parsed.map((p) => ({ reminders: [], ...p })));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const persist = useCallback(async (updated: Plant[]) => {
    setPlants(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const addPlant = useCallback(
    (
      data: Omit<
        Plant,
        | "id"
        | "createdAt"
        | "notes"
        | "photoAlbum"
        | "reminders"
        | "lastWatered"
        | "lastMisted"
      >
    ) => {
      const newPlant: Plant = {
        ...data,
        id: generateId(),
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
    (
      id: string,
      data: Pick<
        Plant,
        "name" | "species" | "mainPhoto" | "wateringInterval" | "mistingInterval"
      >
    ) => {
      const updated = plants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      );
      persist(updated);
      // Reschedule watering/misting notifications with new intervals
      const plant = updated.find((p) => p.id === id);
      if (plant) {
        if (plant.lastWatered) {
          const triggerMs =
            plant.lastWatered + getIntervalMs(plant.wateringInterval);
          scheduleCarNotification(
            `watering-${id}`,
            "Time to water!",
            `${plant.name} needs watering`,
            triggerMs
          );
        }
        if (plant.lastMisted) {
          const triggerMs =
            plant.lastMisted + getIntervalMs(plant.mistingInterval);
          scheduleCarNotification(
            `misting-${id}`,
            "Time to mist!",
            `${plant.name} needs misting`,
            triggerMs
          );
        }
      }
    },
    [plants, persist]
  );

  const deletePlant = useCallback(
    (id: string) => {
      const plant = plants.find((p) => p.id === id);
      if (plant) {
        // Cancel all notifications for this plant
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
        const watered = { ...p, lastWatered: Date.now() };
        const triggerMs = watered.lastWatered + getIntervalMs(watered.wateringInterval);
        scheduleCarNotification(
          `watering-${id}`,
          "Time to water!",
          `${watered.name} needs watering`,
          triggerMs
        );
        return watered;
      });
      persist(updated);
    },
    [plants, persist]
  );

  const mistPlant = useCallback(
    (id: string) => {
      const updated = plants.map((p) => {
        if (p.id !== id) return p;
        const misted = { ...p, lastMisted: Date.now() };
        const triggerMs = misted.lastMisted + getIntervalMs(misted.mistingInterval);
        scheduleCarNotification(
          `misting-${id}`,
          "Time to mist!",
          `${misted.name} needs misting`,
          triggerMs
        );
        return misted;
      });
      persist(updated);
    },
    [plants, persist]
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
      // Schedule notification
      const notifId = await scheduleReminderNotification(plant.name, newReminder);
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
        return { ...p, reminders: p.reminders.filter((r) => r.id !== reminderId) };
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
