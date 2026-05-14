import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export type Language = "en" | "ru";

export interface AppSettings {
  quietHoursEnabled: boolean;
  notificationsEnabled: boolean;
  language: Language;
}

interface AppSettingsContextType extends AppSettings {
  setQuietHoursEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setLanguage: (language: Language) => void;
}

function inferLanguage(): Language {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    if (typeof locale === "string" && locale.toLowerCase().startsWith("ru")) return "ru";
  } catch {}
  return "en";
}

const defaults: AppSettings = { quietHoursEnabled: true, notificationsEnabled: false, language: inferLanguage() };
const STORAGE_KEY = "plant_care_settings_v2";

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(defaults);

  const update = useCallback((patch: Partial<AppSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  useEffect(() => {
    let active = true;

    async function inferNotificationsEnabled(): Promise<boolean> {
      if (Platform.OS === "web") return false;
      try {
        const N = await import("expo-notifications");
        const { status } = await N.getPermissionsAsync();
        return status === "granted";
      } catch {
        return false;
      }
    }

    (async () => {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<AppSettings>;
          const merged = { ...defaults, ...parsed };
          if (active) setSettings(merged);
          if (typeof parsed.notificationsEnabled !== "boolean") {
            const inferred = await inferNotificationsEnabled();
            if (active) update({ notificationsEnabled: inferred });
          }
          return;
        } catch {}
      }

      const inferred = await inferNotificationsEnabled();
      if (active) {
        setSettings({ ...defaults, notificationsEnabled: inferred });
        AsyncStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ ...defaults, notificationsEnabled: inferred })
        );
      }
    })();

    return () => {
      active = false;
    };
  }, [update]);

  const setQuietHoursEnabled = useCallback((enabled: boolean) => {
    update({ quietHoursEnabled: enabled });
  }, [update]);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    update({ notificationsEnabled: enabled });
  }, [update]);

  const setLanguage = useCallback((language: Language) => {
    update({ language });
  }, [update]);

  return (
    <AppSettingsContext.Provider
      value={{ ...settings, setQuietHoursEnabled, setNotificationsEnabled, setLanguage }}
    >
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings(): AppSettingsContextType {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error("useAppSettings must be used within AppSettingsProvider");
  return ctx;
}
