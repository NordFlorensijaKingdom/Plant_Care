import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ColorPickerModal } from "@/components/ColorPickerModal";
import {
  ACCENT_PRESETS,
  BACKGROUND_PRESETS,
  CARD_BG_PRESETS,
  PRIMARY_TEXT_PRESETS,
  SECONDARY_TEXT_PRESETS,
  defaults,
  useTheme,
} from "@/context/ThemeContext";
import { useAppSettings } from "@/context/AppSettingsContext";
import { useColors } from "@/hooks/useColors";
import { useI18n } from "@/i18n";

// ---- Sub-components ----

function ColorSwatch({
  color,
  isSelected,
  onPress,
  size = 34,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
  size?: number;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.swatch,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          borderWidth: isSelected ? 3 : 1.5,
          borderColor: isSelected ? "#FFFFFF" : "rgba(0,0,0,0.1)",
          shadowColor: color,
          shadowOpacity: isSelected ? 0.55 : 0,
          shadowRadius: 5,
          shadowOffset: { width: 0, height: 2 },
          elevation: isSelected ? 4 : 0,
        },
      ]}
    >
      {isSelected && (
        <Ionicons
          name="checkmark"
          size={size * 0.4}
          color={isDark(color) ? "#FFFFFF" : "#000000"}
        />
      )}
    </TouchableOpacity>
  );
}

function isDark(hex: string): boolean {
  const h = hex.replace("#", "");
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return r * 0.299 + g * 0.587 + b * 0.114 < 128;
}

interface ColorSectionProps {
  label: string;
  description: string;
  icon: string;
  presets: string[];
  currentColor: string | null;
  defaultColor: string;
  onSelect: (color: string) => void;
  onReset?: () => void;
  pickerTitle: string;
  preview: React.ReactNode;
}

function ColorSection({
  label,
  description,
  icon,
  presets,
  currentColor,
  defaultColor,
  onSelect,
  onReset,
  pickerTitle,
  preview,
}: ColorSectionProps) {
  const colors = useColors();
  const theme = useTheme();
  const { t } = useI18n();
  const [pickerOpen, setPickerOpen] = useState(false);

  const activeColor = currentColor ?? defaultColor;
  const isCustom =
    currentColor !== null && !presets.includes(currentColor);

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      {/* Header */}
      <View style={styles.sectionCardHeader}>
        <View style={[styles.iconBg, { backgroundColor: theme.uiColor + "18" }]}>
          <Ionicons name={icon as any} size={18} color={theme.uiColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionLabel, { color: theme.textColor }]}>
            {label}
          </Text>
          <Text style={[styles.sectionDesc, { color: colors.mutedForeground }]}>
            {description}
          </Text>
        </View>
        {/* Active color chip */}
        <View style={[styles.activeChip, { backgroundColor: activeColor + "20", borderColor: activeColor + "50" }]}>
          <View style={[styles.activeChipDot, { backgroundColor: activeColor }]} />
          <Text style={[styles.activeChipText, { color: activeColor }]}>
            {activeColor.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Preset swatches */}
      <View style={styles.swatchGrid}>
        {presets.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            isSelected={activeColor === c && !isCustom}
            onPress={() => {
              onSelect(c);
              Haptics.selectionAsync();
            }}
          />
        ))}
        {/* Custom picker button */}
        <TouchableOpacity
          onPress={() => setPickerOpen(true)}
          style={[
            styles.customBtn,
            {
              borderColor: isCustom ? activeColor : colors.border,
              backgroundColor: isCustom ? activeColor + "18" : "transparent",
            },
          ]}
        >
          <Ionicons
            name="color-palette-outline"
            size={16}
            color={isCustom ? activeColor : colors.mutedForeground}
          />
          <Text
            style={[
              styles.customBtnText,
              { color: isCustom ? activeColor : colors.mutedForeground },
            ]}
          >
            {t("settings.custom")}
          </Text>
          {isCustom && (
            <View
              style={[styles.customActiveDot, { backgroundColor: activeColor }]}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View
        style={[
          styles.previewArea,
          { borderTopColor: colors.border },
        ]}
      >
        <Text style={[styles.previewLabel, { color: colors.mutedForeground }]}>{t("settings.preview")}</Text>
        {preview}
      </View>

      {/* Reset to default link */}
      {onReset && currentColor !== null && (
        <TouchableOpacity onPress={onReset} style={styles.resetLink}>
          <Ionicons name="refresh-outline" size={12} color={colors.mutedForeground} />
          <Text style={[styles.resetLinkText, { color: colors.mutedForeground }]}>
            {t("settings.reset_to_default")}
          </Text>
        </TouchableOpacity>
      )}

      {/* Color picker modal */}
      <ColorPickerModal
        visible={pickerOpen}
        initialColor={activeColor}
        title={pickerTitle}
        onClose={() => setPickerOpen(false)}
        onConfirm={(hex) => {
          onSelect(hex);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </View>
  );
}

// ---- Main screen ----

export default function SettingsScreen() {
  const colors = useColors();
  const theme = useTheme();
  const appSettings = useAppSettings();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const effectiveSecondary = theme.secondaryTextColor ?? "#6B8F7A";
  const effectiveCard = theme.cardColor ?? colors.card;

  async function toggleNotifications(val: boolean) {
    if (!val) {
      appSettings.setNotificationsEnabled(false);
      return;
    }

    if (Platform.OS !== "web") {
      try {
        const Notifications = await import("expo-notifications");
        const { status, canAskAgain } = await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          if (canAskAgain) {
            const result = await Notifications.requestPermissionsAsync();
            if (result.status === "granted") {
              appSettings.setNotificationsEnabled(true);
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              return;
            }
          }
          Alert.alert(
            t("settings.notifications.blocked_title"),
            t("settings.notifications.blocked_body")
          );
          return;
        }
        appSettings.setNotificationsEnabled(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {
        Alert.alert(t("settings.notifications.unavailable_title"), t("settings.notifications.unavailable_body"));
      }
    } else {
      appSettings.setNotificationsEnabled(true);
    }
  }

  async function pickBackground() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(t("settings.photos.permission_title"), t("settings.photos.permission_body"));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      theme.setBackgroundImage(result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  }

  function removeBackground() {
    theme.setBackgroundImage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function handleResetAll() {
    Alert.alert(
      t("settings.reset_all.title"),
      t("settings.reset_all.body"),
      [
        { text: t("settings.reset_all.cancel"), style: "cancel" },
        {
          text: t("settings.reset_all.confirm"),
          style: "destructive",
          onPress: () => {
            theme.resetTheme();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }

  const shLabel = [styles.sectionHeader, { color: colors.mutedForeground }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.textColor }]}>{t("settings.title")}</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {t("settings.subtitle")}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
        ]}
      >
        {/* ── CUSTOM THEME ── */}
        <Text style={shLabel}>{t("settings.section.custom_theme")}</Text>

        {/* 1. Primary Text */}
        <ColorSection
          label={t("settings.color.primary.label")}
          description={t("settings.color.primary.desc")}
          icon="text-outline"
          presets={PRIMARY_TEXT_PRESETS}
          currentColor={theme.textColor !== defaults.textColor ? theme.textColor : null}
          defaultColor={defaults.textColor}
          onSelect={theme.setTextColor}
          pickerTitle={t("settings.color.primary.picker")}
          preview={
            <View style={styles.previewRow}>
              <Text style={[styles.previewPlantName, { color: theme.textColor }]}>
                Boston Fern
              </Text>
              <Text style={[styles.previewSmallLabel, { color: theme.textColor }]}>
                Add Plant
              </Text>
            </View>
          }
        />

        {/* 2. Secondary Text */}
        <ColorSection
          label={t("settings.color.secondary.label")}
          description={t("settings.color.secondary.desc")}
          icon="chatbubble-ellipses-outline"
          presets={SECONDARY_TEXT_PRESETS}
          currentColor={theme.secondaryTextColor}
          defaultColor="#6B8F7A"
          onSelect={theme.setSecondaryTextColor}
          onReset={() => theme.setSecondaryTextColor(null)}
          pickerTitle={t("settings.color.secondary.picker")}
          preview={
            <View style={styles.previewRow}>
              <Text style={[styles.previewSpecies, { color: effectiveSecondary }]}>
                Nephrolepis exaltata
              </Text>
              <Text style={[styles.previewSmallLabel, { color: effectiveSecondary }]}>
                3 days ago
              </Text>
            </View>
          }
        />

        {/* 3. Accent Elements */}
        <ColorSection
          label={t("settings.color.accent.label")}
          description={t("settings.color.accent.desc")}
          icon="color-fill-outline"
          presets={ACCENT_PRESETS}
          currentColor={theme.uiColor !== defaults.uiColor ? theme.uiColor : null}
          defaultColor={defaults.uiColor}
          onSelect={theme.setUiColor}
          pickerTitle={t("settings.color.accent.picker")}
          preview={
            <View style={styles.previewRow}>
              <View style={[styles.previewBtn, { backgroundColor: theme.uiColor }]}>
                <Ionicons name="water" size={13} color="#FFFFFF" />
                <Text style={styles.previewBtnText}>Water</Text>
              </View>
              <View style={[styles.previewBadge, { backgroundColor: theme.uiColor + "22", borderColor: theme.uiColor + "55" }]}>
                <Ionicons name="leaf" size={12} color={theme.uiColor} />
                <Text style={[styles.previewBadgeText, { color: theme.uiColor }]}>Icon</Text>
              </View>
              <Switch
                value
                trackColor={{ false: colors.muted, true: theme.uiColor + "80" }}
                thumbColor={theme.uiColor}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          }
        />

        {/* 4. Card Backgrounds */}
        <ColorSection
          label={t("settings.color.card.label")}
          description={t("settings.color.card.desc")}
          icon="albums-outline"
          presets={CARD_BG_PRESETS}
          currentColor={theme.cardColor}
          defaultColor={colors.card}
          onSelect={theme.setCardColor}
          onReset={() => theme.setCardColor(null)}
          pickerTitle={t("settings.color.card.picker")}
          preview={
            <View
              style={[
                styles.previewCardMini,
                {
                  backgroundColor: effectiveCard,
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={[styles.previewCardDot, { backgroundColor: theme.uiColor }]} />
              <View style={styles.previewCardLines}>
                <View style={[styles.previewCardLine, { backgroundColor: theme.textColor, width: "60%" }]} />
                <View style={[styles.previewCardLine, { backgroundColor: effectiveSecondary, width: "40%", height: 6 }]} />
              </View>
            </View>
          }
        />

        <ColorSection
          label={t("settings.color.bg.label")}
          description={t("settings.color.bg.desc")}
          icon="color-filter-outline"
          presets={BACKGROUND_PRESETS}
          currentColor={theme.backgroundColor}
          defaultColor={colors.systemBackground}
          onSelect={(c) => theme.setBackgroundColor(c)}
          onReset={() => theme.setBackgroundColor(null)}
          pickerTitle={t("settings.color.bg.picker")}
          preview={
            <View
              style={[
                styles.previewBgMini,
                { backgroundColor: theme.backgroundColor ?? colors.systemBackground, borderColor: colors.border },
              ]}
            >
              <View style={[styles.previewBgDot, { backgroundColor: theme.uiColor }]} />
              <View style={styles.previewCardLines}>
                <View style={[styles.previewCardLine, { backgroundColor: theme.textColor, width: "52%" }]} />
                <View style={[styles.previewCardLine, { backgroundColor: effectiveSecondary, width: "35%", height: 6 }]} />
              </View>
            </View>
          }
        />

        {/* ── BACKGROUND WALLPAPER ── */}
        <Text style={[shLabel, { marginTop: 24 }]}>{t("settings.section.background_wallpaper")}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {theme.backgroundImage ? (
            <View style={styles.bgPreviewRow}>
              <Image
                source={{ uri: theme.backgroundImage }}
                style={styles.bgThumb}
                contentFit="cover"
              />
              <View style={styles.bgActions}>
                <Text style={[styles.bgSelectedText, { color: theme.textColor }]}>
                  {t("settings.wallpaper.set")}
                </Text>
                <View style={styles.bgBtnRow}>
                  <TouchableOpacity
                    onPress={pickBackground}
                    style={[styles.bgBtn, { backgroundColor: theme.uiColor + "20" }]}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={theme.uiColor} />
                    <Text style={[styles.bgBtnText, { color: theme.uiColor }]}>{t("settings.wallpaper.change")}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={removeBackground}
                    style={[styles.bgBtn, { backgroundColor: colors.destructive + "15" }]}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                    <Text style={[styles.bgBtnText, { color: colors.destructive }]}>{t("settings.wallpaper.remove")}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickBackground}
              style={[styles.bgPicker, { borderColor: colors.border }]}
            >
              <Ionicons name="image-outline" size={28} color={colors.mutedForeground} />
              <Text style={[styles.bgPickerText, { color: colors.mutedForeground }]}>
                {t("settings.wallpaper.choose")}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={[shLabel, { marginTop: 24 }]}>{t("settings.section.language")}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.langLabel, { color: colors.mutedForeground }]}>
            {t("settings.language.label")}
          </Text>
          <View style={styles.langRow}>
            {([
              { id: "en", label: t("settings.language.en") },
              { id: "ru", label: t("settings.language.ru") },
            ] as const).map((opt) => {
              const selected = appSettings.language === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => appSettings.setLanguage(opt.id)}
                  style={[
                    styles.langBtn,
                    {
                      backgroundColor: selected ? theme.uiColor : colors.muted,
                      borderColor: selected ? theme.uiColor : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.langBtnText, { color: selected ? "#FFFFFF" : colors.mutedForeground }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── NOTIFICATIONS ── */}
        <Text style={[shLabel, { marginTop: 24 }]}>{t("settings.section.notifications")}</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="notifications-outline" size={20} color={theme.uiColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.textColor }]}>
                  {t("settings.notifications.watering.label")}
                </Text>
                <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                  {t("settings.notifications.watering.desc")}
                </Text>
              </View>
            </View>
            <Switch
              value={appSettings.notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.muted, true: theme.uiColor + "80" }}
              thumbColor={appSettings.notificationsEnabled ? theme.uiColor : colors.border}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="moon-outline" size={20} color={theme.uiColor} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.textColor }]}>
                  {t("settings.notifications.quiet.label")}
                </Text>
                <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                  {t("settings.notifications.quiet.desc")}
                </Text>
              </View>
            </View>
            <Switch
              value={appSettings.quietHoursEnabled}
              onValueChange={appSettings.setQuietHoursEnabled}
              trackColor={{ false: colors.muted, true: theme.uiColor + "80" }}
              thumbColor={appSettings.quietHoursEnabled ? theme.uiColor : colors.border}
            />
          </View>
        </View>

        {/* ── DANGER ZONE ── */}
        <Text style={[shLabel, { marginTop: 24 }]}>{t("settings.section.danger_zone")}</Text>
        <TouchableOpacity
          onPress={handleResetAll}
          style={[
            styles.resetBtn,
            { backgroundColor: colors.card, borderColor: colors.destructive + "40" },
          ]}
        >
          <Ionicons name="refresh-circle-outline" size={20} color={colors.destructive} />
          <Text style={[styles.resetText, { color: colors.destructive }]}>
            {t("settings.reset_all.button")}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  content: { padding: 16, gap: 0 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  sectionCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  sectionLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  sectionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  activeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  activeChipDot: { width: 8, height: 8, borderRadius: 4 },
  activeChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 0.5 },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    alignItems: "center",
  },
  swatch: {
    alignItems: "center",
    justifyContent: "center",
  },
  customBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 17,
    borderWidth: 1.5,
  },
  customBtnText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  customActiveDot: { width: 7, height: 7, borderRadius: 3.5, marginLeft: 2 },
  previewArea: {
    borderTopWidth: 1,
    paddingTop: 12,
    gap: 8,
  },
  previewLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  },
  previewPlantName: { fontSize: 16, fontFamily: "Inter_700Bold" },
  previewSpecies: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  previewSmallLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
  },
  previewBtnText: { color: "#FFFFFF", fontSize: 13, fontFamily: "Inter_600SemiBold" },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  previewBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  previewCardMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewCardDot: { width: 32, height: 32, borderRadius: 8 },
  previewCardLines: { flex: 1, gap: 5 },
  previewCardLine: { height: 8, borderRadius: 4 },
  previewBgMini: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  previewBgDot: { width: 32, height: 32, borderRadius: 8 },
  resetLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
  },
  resetLinkText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 4 },
  bgPreviewRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  bgThumb: { width: 72, height: 72, borderRadius: 12 },
  bgActions: { flex: 1, gap: 8 },
  bgSelectedText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  bgBtnRow: { flexDirection: "row", gap: 8 },
  bgBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  bgBtnText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bgPicker: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: "dashed",
  },
  bgPickerText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  langLabel: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 10 },
  langRow: { flexDirection: "row", gap: 8 },
  langBtn: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  langBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginVertical: 12, opacity: 0.5 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  switchLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  switchDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
