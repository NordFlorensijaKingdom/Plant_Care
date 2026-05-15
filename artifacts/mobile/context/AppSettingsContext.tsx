import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Platform } from "react-native";

export interface AppSettings {
  quietHoursEnabled: boolean;
  notificationsEnabled: boolean;
  quickAccessPages: string[];
}

interface AppSettingsContextType extends AppSettings {
  setQuietHoursEnabled: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setQuickAccessPages: (pages: string[]) => void;
}

const defaults: AppSettings = {
  quietHoursEnabled: true,
  notificationsEnabled: false,
  quickAccessPages: ["/today", "/calendar", "/"],
};
const STORAGE_KEY = "plant_care_settings_v1";

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

  const normalizeQuickAccessPages = useCallback((pages: string[]): string[] => {
    const unique = Array.from(new Set(pages)).filter((p) => typeof p === "string");
    const sliced = unique.slice(0, 3);
    return sliced.length === 0 ? defaults.quickAccessPages : sliced;
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
          const merged = {
            ...defaults,
            ...parsed,
            quickAccessPages: normalizeQuickAccessPages(
              Array.isArray((parsed as any).quickAccessPages)
                ? ((parsed as any).quickAccessPages as string[])
                : defaults.quickAccessPages
            ),
          };
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
  }, [normalizeQuickAccessPages, update]);

  const setQuietHoursEnabled = useCallback((enabled: boolean) => {
    update({ quietHoursEnabled: enabled });
  }, [update]);

  const setNotificationsEnabled = useCallback((enabled: boolean) => {
    update({ notificationsEnabled: enabled });
  }, [update]);

  const setQuickAccessPages = useCallback((pages: string[]) => {
    update({ quickAccessPages: normalizeQuickAccessPages(pages) });
  }, [normalizeQuickAccessPages, update]);

  return (
    <AppSettingsContext.Provider
      value={{ ...settings, setQuietHoursEnabled, setNotificationsEnabled, setQuickAccessPages }}
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
