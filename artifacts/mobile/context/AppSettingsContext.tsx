import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface AppSettings {
  quietHoursEnabled: boolean;
}

interface AppSettingsContextType extends AppSettings {
  setQuietHoursEnabled: (enabled: boolean) => void;
}

const defaults: AppSettings = { quietHoursEnabled: true };
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

  const save = useCallback((updated: AppSettings) => {
    setSettings(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setQuietHoursEnabled = useCallback(
    (enabled: boolean) => save({ ...settings, quietHoursEnabled: enabled }),
    [save, settings]
  );

  return (
    <AppSettingsContext.Provider value={{ ...settings, setQuietHoursEnabled }}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
