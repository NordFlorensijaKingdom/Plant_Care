import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface AppSettings {
  quietHoursEnabled: boolean;
  notificationsEnabled: boolean;
}

interface AppSettingsContextType extends AppSettings {
  setQuietHoursEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
}

const defaults: AppSettings = { quietHoursEnabled: true, notificationsEnabled: true };
const STORAGE_KEY = "plant_care_settings_v1";

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (!raw) return;
      try {
        setSettings({ ...defaults, ...JSON.parse(raw) });
      } catch {}
    });
  }, []);

  useEffect(() => {
    if (Platform.OS === "web") return;
    if (!settings.notificationsEnabled) return;
    import("expo-notifications")
      .then((Notifications) => Notifications.getPermissionsAsync())
      .then(({ status }) => {
        if (status === "granted") return;
        setSettings((prev) => {
          if (!prev.notificationsEnabled) return prev;
          const updated = { ...prev, notificationsEnabled: false };
          AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          return updated;
        });
      })
      .catch(() => {});
  }, [settings.notificationsEnabled]);

  const save = useCallback((updated: AppSettings) => {
    setSettings(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setQuietHoursEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, quietHoursEnabled: enabled }),
    [save, settings]
  );

  const setNotificationsEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, notificationsEnabled: enabled }),
    [save, settings]
  );

  return (
    <AppSettingsContext.Provider value={{ ...settings, setQuietHoursEnabled, setNotificationsEnabled }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
