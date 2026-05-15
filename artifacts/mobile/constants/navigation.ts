import { Ionicons } from "@expo/vector-icons";

export type NavItem = {
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

