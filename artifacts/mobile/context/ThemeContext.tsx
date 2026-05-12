import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// ---- Preset palettes ----

export const PRIMARY_TEXT_PRESETS = [
  "#1A2E25",
  "#0D1B14",
  "#2D3748",
  "#1A1A2E",
  "#7B3F00",
  "#5C2D52",
  "#FFFFFF",
  "#F8FBF9",
  "#E2E8F0",
];

export const SECONDARY_TEXT_PRESETS = [
  "#6B8F7A",
  "#52735D",
  "#718096",
  "#94A3B8",
  "#A0AEC0",
  "#6B7280",
  "#9CA3AF",
  "#B4C5BC",
  "#8FA89A",
];

export const ACCENT_PRESETS = [
  "#2D6A4F",
  "#52B788",
  "#40916C",
  "#1B4332",
  "#3182CE",
  "#6366F1",
  "#805AD5",
  "#D69E2E",
  "#DD6B20",
  "#D53F8C",
  "#E53E3E",
  "#319795",
];

export const CARD_BG_PRESETS = [
  "#FFFFFF",
  "#F8FBF9",
  "#EFF6F2",
  "#E8F4F0",
  "#F0F4FF",
  "#FFF8F0",
  "#1A2E25",
  "#0D1B14",
  "#1E293B",
  "#1A1A2E",
  "#1C1C1E",
  "#2A2A35",
];

export const BACKGROUND_PRESETS = [
  "#F0F7F4",
  "#FFFFFF",
  "#EFF6F2",
  "#FFF8F0",
  "#0D1B14",
  "#1A2E25",
  "#111827",
  "#1E293B",
];

// ---- Types ----

export interface ThemeSettings {
  textColor: string;
  secondaryTextColor: string | null;
  uiColor: string;
  cardColor: string | null;
  backgroundColor: string | null;
  backgroundImage: string | null;
}

interface ThemeContextType extends ThemeSettings {
  setTextColor: (color: string) => void;
  setSecondaryTextColor: (color: string | null) => void;
  setUiColor: (color: string) => void;
  setCardColor: (color: string | null) => void;
  setBackgroundColor: (color: string | null) => void;
  setBackgroundImage: (uri: string | null) => void;
  resetTheme: () => void;
}

// ---- Defaults ----

export const defaults: ThemeSettings = {
  textColor: "#1A2E25",
  secondaryTextColor: null,
  uiColor: "#2D6A4F",
  cardColor: null,
  backgroundColor: null,
  backgroundImage: null,
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "plant_care_theme_v2";

// ---- Provider ----

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ThemeSettings>(defaults);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...defaults, ...JSON.parse(raw) });
        } catch {
          // ignore
        }
      } else {
        // Migrate from v1
        AsyncStorage.getItem("plant_care_theme_v1").then((old) => {
          if (old) {
            try {
              const parsed = JSON.parse(old);
              const migrated: ThemeSettings = {
                ...defaults,
                textColor: parsed.textColor ?? defaults.textColor,
                uiColor: parsed.uiColor ?? defaults.uiColor,
                backgroundImage: parsed.backgroundImage ?? null,
              };
              setSettings(migrated);
              AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            } catch {
              // ignore
            }
          }
        });
      }
    });
  }, []);

  const save = useCallback((updated: ThemeSettings) => {
    setSettings(updated);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const setTextColor = useCallback(
    (color: string) => save({ ...settings, textColor: color }),
    [settings, save]
  );

  const setSecondaryTextColor = useCallback(
    (color: string | null) => save({ ...settings, secondaryTextColor: color }),
    [settings, save]
  );

  const setUiColor = useCallback(
    (color: string) => save({ ...settings, uiColor: color }),
    [settings, save]
  );

  const setCardColor = useCallback(
    (color: string | null) => save({ ...settings, cardColor: color }),
    [settings, save]
  );

  const setBackgroundColor = useCallback(
    (color: string | null) => save({ ...settings, backgroundColor: color }),
    [settings, save]
  );

  const setBackgroundImage = useCallback(
    (uri: string | null) => save({ ...settings, backgroundImage: uri }),
    [settings, save]
  );

  const resetTheme = useCallback(() => save(defaults), [save]);

  return (
    <ThemeContext.Provider
      value={{
        ...settings,
        setTextColor,
        setSecondaryTextColor,
        setUiColor,
        setCardColor,
        setBackgroundColor,
        setBackgroundImage,
        resetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
