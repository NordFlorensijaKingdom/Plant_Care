import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
};

export const NAV_ITEMS: NavItem[] = [
  { label: "Сегодня", href: "/today", icon: "sunny-outline" },
  { label: "Календарь", href: "/calendar", icon: "calendar-outline" },
  { label: "Мой сад", href: "/", icon: "leaf-outline" },
  { label: "Каталог", href: "/catalog", icon: "book-outline" },
  { label: "Добавить растение", href: "/add", icon: "add-circle-outline" },
  { label: "Настройки", href: "/settings", icon: "settings-outline" },
];

export function NavigationMenuButton() {
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);

  const items = useMemo(() => {
    const current = pathname === "" ? "/" : pathname;
    return NAV_ITEMS.map((i) => ({
      ...i,
      active:
        i.href === "/"
          ? current === "/"
          : current === i.href || current.startsWith(i.href + "/"),
    }));
  }, [pathname]);

  const topPad = Platform.OS === "web" ? 10 : insets.top + 8;

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.iconBtn,
          { backgroundColor: colors.muted, borderColor: colors.border },
        ]}
      >
        <Ionicons name="menu" size={20} color={theme.uiColor} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.overlay}>
          <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
          <View style={[styles.menu, { top: topPad, backgroundColor: colors.card, borderColor: colors.border }]}>
            {items.map((item) => (
              <TouchableOpacity
                key={item.href}
                onPress={() => {
                  setOpen(false);
                  router.replace(item.href as any);
                }}
                style={[
                  styles.row,
                  {
                    backgroundColor: item.active ? theme.uiColor + "18" : "transparent",
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name={item.icon}
                  size={18}
                  color={item.active ? theme.uiColor : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.rowText,
                    { color: item.active ? theme.uiColor : theme.textColor },
                  ]}
                  numberOfLines={1}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  overlay: { flex: 1 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.25)" },
  menu: {
    position: "absolute",
    right: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 8,
    width: 240,
    gap: 6,
  },
  row: {
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowText: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
});
