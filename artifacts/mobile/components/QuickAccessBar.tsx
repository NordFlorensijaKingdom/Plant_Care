import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAV_ITEMS } from "@/components/NavigationMenu";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

export const QUICK_ACCESS_BAR_HEIGHT = 58;

export function useQuickAccessExtraBottomPadding(): number {
  const { quickAccess } = useAppSettings();
  return quickAccess.length ? QUICK_ACCESS_BAR_HEIGHT + 12 : 0;
}

export function QuickAccessBar() {
  const colors = useColors();
  const theme = useTheme();
  const { quickAccess } = useAppSettings();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const items = useMemo(() => {
    const set = new Set(quickAccess);
    const current = pathname === "" ? "/" : pathname;
    return NAV_ITEMS.filter((i) => set.has(i.href)).map((i) => ({
      ...i,
      active:
        i.href === "/"
          ? current === "/"
          : current === i.href || current.startsWith(i.href + "/"),
    }));
  }, [pathname, quickAccess]);

  if (!items.length) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          paddingBottom: Platform.OS === "web" ? 10 : insets.bottom + 8,
        },
      ]}
    >
      <View style={[styles.bar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {items.map((item) => (
          <Pressable
            key={item.href}
            onPress={() => router.replace(item.href as any)}
            style={[
              styles.item,
              item.active && { backgroundColor: theme.uiColor + "18", borderColor: theme.uiColor + "55" },
              !item.active && { borderColor: "transparent" },
            ]}
          >
            <Ionicons
              name={item.icon}
              size={18}
              color={item.active ? theme.uiColor : colors.mutedForeground}
            />
            <Text
              numberOfLines={1}
              ellipsizeMode="tail"
              style={[
                styles.text,
                { color: item.active ? theme.uiColor : colors.mutedForeground },
              ]}
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
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  bar: {
    height: QUICK_ACCESS_BAR_HEIGHT,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: "row",
    padding: 8,
    gap: 8,
  },
  item: {
    flex: 1,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 10,
    borderWidth: 1,
  },
  text: { fontSize: 12, fontFamily: "Inter_600SemiBold", flexShrink: 1, minWidth: 0 },
});

