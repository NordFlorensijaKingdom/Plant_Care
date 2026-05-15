import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAV_ITEMS } from "@/constants/navigation";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export const QUICK_ACCESS_BAR_HEIGHT = 64;

export function QuickAccessBar() {
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const appSettings = useAppSettings();

  const items = useMemo(() => {
    const current = pathname === "" ? "/" : pathname;
    const selected = appSettings.quickAccessPages;
    const byHref = new Map(NAV_ITEMS.map((i) => [i.href, i]));
    const resolved = selected.map((href) => byHref.get(href)).filter(Boolean) as typeof NAV_ITEMS;

    return resolved.slice(0, 3).map((i) => ({
      ...i,
      active: i.href === "/" ? current === "/" : current === i.href || current.startsWith(i.href + "/"),
    }));
  }, [appSettings.quickAccessPages, pathname]);

  if (items.length === 0) return null;

  return (
    <View
      style={[
        styles.wrap,
        {
          height: QUICK_ACCESS_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {items.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.replace(item.href as any)}
            style={styles.item}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.active ? theme.uiColor : colors.mutedForeground}
            />
            <Text
              style={[
                styles.label,
                { color: item.active ? theme.uiColor : colors.mutedForeground },
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    gap: 4,
  },
  item: { alignItems: "center", justifyContent: "center", minWidth: 72, gap: 4, paddingHorizontal: 6 },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
});

