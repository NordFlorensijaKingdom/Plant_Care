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

export interface Plant {
  id: string;
  name: string;
  species: string;
  mainPhoto: string | null;
  wateringInterval: TimeInterval;
  mistingInterval: TimeInterval;
  notes: Note[];
  photoAlbum: string[];
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
  const totalHours = Math.floor(remaining / (3600 * 1000));
  const days = Math.floor(totalHours / 24);
  const hours = totalHours % 24;
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((remaining % (3600 * 1000)) / 60000);
  if (totalHours > 0) return `${totalHours}h`;
  return `${mins}m`;
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

interface PlantContextType {
  plants: Plant[];
  loading: boolean;
  addPlant: (
    plant: Omit<
      Plant,
      "id" | "createdAt" | "notes" | "photoAlbum" | "lastWatered" | "lastMisted"
    >
  ) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  waterPlant: (id: string) => void;
  mistPlant: (id: string) => void;
  addNote: (plantId: string, text: string) => void;
  updateNote: (plantId: string, noteId: string, text: string) => void;
  deleteNote: (plantId: string, noteId: string) => void;
  addPhoto: (plantId: string, uri: string) => void;
  deletePhoto: (plantId: string, photoIndex: number) => void;
}

const PlantContext = createContext<PlantContextType | null>(null);

const STORAGE_KEY = "plant_care_plants_v1";

async function scheduleWateringNotification(plant: Plant): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const intervalMs = getIntervalMs(plant.wateringInterval);
    const trigger = new Date(Date.now() + intervalMs);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to water!",
        body: `${plant.name} needs watering`,
        data: { plantId: plant.id, type: "watering" },
      },
      trigger: { type: "date", date: trigger } as any,
      identifier: `watering-${plant.id}`,
    });
  } catch {
    // Silently fail
  }
}

async function scheduleMistingNotification(plant: Plant): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications");
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== "granted") return;
    const intervalMs = getIntervalMs(plant.mistingInterval);
    const trigger = new Date(Date.now() + intervalMs);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time to mist!",
        body: `${plant.name} needs misting`,
        data: { plantId: plant.id, type: "misting" },
      },
      trigger: { type: "date", date: trigger } as any,
      identifier: `misting-${plant.id}`,
    });
  } catch {
    // Silently fail
  }
}

export function PlantProvider({ children }: { children: React.ReactNode }) {
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          const parsed = JSON.parse(raw) as Plant[];
          setPlants(parsed);
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
      plantData: Omit<
        Plant,
        | "id"
        | "createdAt"
        | "notes"
        | "photoAlbum"
        | "lastWatered"
        | "lastMisted"
      >
    ) => {
      const newPlant: Plant = {
        ...plantData,
        id: generateId(),
        notes: [],
        photoAlbum: [],
        lastWatered: null,
        lastMisted: null,
        createdAt: Date.now(),
      };
      persist([...plants, newPlant]);
    },
    [plants, persist]
  );

  const updatePlant = useCallback(
    (id: string, updates: Partial<Plant>) => {
      const updated = plants.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      );
      persist(updated);
    },
    [plants, persist]
  );

  const deletePlant = useCallback(
    (id: string) => {
      persist(plants.filter((p) => p.id !== id));
    },
    [plants, persist]
  );

  const waterPlant = useCallback(
    (id: string) => {
      const updated = plants.map((p) => {
        if (p.id !== id) return p;
        const watered = { ...p, lastWatered: Date.now() };
        scheduleWateringNotification(watered);
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
        scheduleMistingNotification(misted);
        return misted;
      });
      persist(updated);
    },
    [plants, persist]
  );

  const addNote = useCallback(
    (plantId: string, text: string) => {
      const note: Note = {
        id: generateId(),
        text,
        timestamp: Date.now(),
      };
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
          notes: p.notes.map((n) =>
            n.id === noteId ? { ...n, text } : n
          ),
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

  return (
    <PlantContext.Provider
      value={{
        plants,
        loading,
        addPlant,
        updatePlant,
        deletePlant,
        waterPlant,
        mistPlant,
        addNote,
        updateNote,
        deleteNote,
        addPhoto,
        deletePhoto,
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
