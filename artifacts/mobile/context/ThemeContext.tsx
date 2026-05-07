import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export const TEXT_COLOR_PRESETS = [
  "#1A2E25",
  "#0D1B14",
  "#FFFFFF",
  "#F8FBF9",
  "#2D3748",
  "#4A5568",
  "#2D6A4F",
  "#1A3A5C",
  "#7B3F00",
  "#5C2D52",
  "#8B4513",
  "#B7410E",
];

export const UI_COLOR_PRESETS = [
  "#2D6A4F",
  "#52B788",
  "#40916C",
  "#1B4332",
  "#3182CE",
  "#805AD5",
  "#D69E2E",
  "#DD6B20",
  "#D53F8C",
  "#E53E3E",
  "#319795",
  "#718096",
];

interface ThemeSettings {
  textColor: string;
  uiColor: string;
  backgroundImage: string | null;
}

interface ThemeContextType extends ThemeSettings {
  setTextColor: (color: string) => void;
  setUiColor: (color: string) => void;
  setBackgroundImage: (uri: string | null) => void;
  resetTheme: () => void;
}

const defaults: ThemeSettings = {
  textColor: "#1A2E25",
  uiColor: "#2D6A4F",
  backgroundImage: null,
};

const ThemeContext = createContext<ThemeContextType | null>(null);
const STORAGE_KEY = "plant_care_theme_v1";

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

  const setUiColor = useCallback(
    (color: string) => save({ ...settings, uiColor: color }),
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
        setUiColor,
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
