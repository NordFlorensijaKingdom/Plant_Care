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

import {
  TEXT_COLOR_PRESETS,
  UI_COLOR_PRESETS,
  useTheme,
} from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

function ColorSwatch({
  color,
  isSelected,
  onPress,
}: {
  color: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.swatch,
        {
          backgroundColor: color,
          borderWidth: isSelected ? 3 : 0,
          borderColor: "#FFFFFF",
          shadowColor: color,
          shadowOpacity: isSelected ? 0.6 : 0,
          shadowRadius: 4,
          shadowOffset: { width: 0, height: 2 },
          elevation: isSelected ? 4 : 0,
        },
      ]}
    >
      {isSelected && (
        <Ionicons
          name="checkmark"
          size={14}
          color={
            color === "#FFFFFF" || color === "#F8FBF9" ? "#000000" : "#FFFFFF"
          }
        />
      )}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [notifEnabled, setNotifEnabled] = useState(false);

  async function toggleNotifications(val: boolean) {
    if (val && Platform.OS !== "web") {
      try {
        const Notifications = await import("expo-notifications");
        const { status, canAskAgain } =
          await Notifications.getPermissionsAsync();
        if (status !== "granted") {
          if (canAskAgain) {
            const result = await Notifications.requestPermissionsAsync();
            if (result.status === "granted") {
              setNotifEnabled(true);
              await Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              return;
            }
          }
          Alert.alert(
            "Notifications blocked",
            "Enable notifications in your device Settings to receive watering reminders."
          );
          return;
        }
        setNotifEnabled(true);
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch {
        Alert.alert("Unavailable", "Notifications are not available on this platform.");
      }
    } else {
      setNotifEnabled(val);
    }
  }

  async function pickBackground() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photos to set a background image."
      );
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

  function handleReset() {
    Alert.alert(
      "Reset Theme",
      "Restore all colors and background to defaults?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            theme.resetTheme();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          },
        },
      ]
    );
  }

  const sectionHeaderStyle = [
    styles.sectionHeader,
    { color: colors.mutedForeground },
  ];

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.textColor }]}>
          Settings
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom,
          },
        ]}
      >
        {/* Text Color */}
        <Text style={sectionHeaderStyle}>TEXT COLOR</Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.swatchGrid}>
            {TEXT_COLOR_PRESETS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                isSelected={theme.textColor === c}
                onPress={() => {
                  theme.setTextColor(c);
                  Haptics.selectionAsync();
                }}
              />
            ))}
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[
                styles.previewLabel,
                { color: colors.mutedForeground },
              ]}
            >
              Preview:
            </Text>
            <Text
              style={[
                styles.previewText,
                { color: theme.textColor },
              ]}
            >
              My Beautiful Plant
            </Text>
          </View>
        </View>

        {/* UI Color */}
        <Text style={[sectionHeaderStyle, { marginTop: 24 }]}>
          UI ELEMENT COLOR
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.swatchGrid}>
            {UI_COLOR_PRESETS.map((c) => (
              <ColorSwatch
                key={c}
                color={c}
                isSelected={theme.uiColor === c}
                onPress={() => {
                  theme.setUiColor(c);
                  Haptics.selectionAsync();
                }}
              />
            ))}
          </View>
          <View style={styles.previewRow}>
            <Text
              style={[
                styles.previewLabel,
                { color: colors.mutedForeground },
              ]}
            >
              Preview:
            </Text>
            <View
              style={[
                styles.previewBtn,
                { backgroundColor: theme.uiColor },
              ]}
            >
              <Ionicons name="water" size={14} color="#FFFFFF" />
              <Text style={styles.previewBtnText}>Water Now</Text>
            </View>
          </View>
        </View>

        {/* Background */}
        <Text style={[sectionHeaderStyle, { marginTop: 24 }]}>
          BACKGROUND WALLPAPER
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {theme.backgroundImage ? (
            <View style={styles.bgPreviewRow}>
              <Image
                source={{ uri: theme.backgroundImage }}
                style={styles.bgThumb}
                contentFit="cover"
              />
              <View style={styles.bgActions}>
                <Text
                  style={[styles.bgSelectedText, { color: theme.textColor }]}
                >
                  Custom background set
                </Text>
                <View style={styles.bgBtnRow}>
                  <TouchableOpacity
                    onPress={pickBackground}
                    style={[
                      styles.bgBtn,
                      { backgroundColor: theme.uiColor + "20" },
                    ]}
                  >
                    <Ionicons name="swap-horizontal" size={16} color={theme.uiColor} />
                    <Text style={[styles.bgBtnText, { color: theme.uiColor }]}>
                      Change
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={removeBackground}
                    style={[
                      styles.bgBtn,
                      { backgroundColor: colors.destructive + "15" },
                    ]}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={16}
                      color={colors.destructive}
                    />
                    <Text
                      style={[
                        styles.bgBtnText,
                        { color: colors.destructive },
                      ]}
                    >
                      Remove
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={pickBackground}
              style={[
                styles.bgPicker,
                { borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="image-outline"
                size={28}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.bgPickerText, { color: colors.mutedForeground }]}
              >
                Choose from gallery
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Notifications */}
        <Text style={[sectionHeaderStyle, { marginTop: 24 }]}>
          NOTIFICATIONS
        </Text>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.switchRow}>
            <View style={styles.switchInfo}>
              <Ionicons name="notifications-outline" size={20} color={theme.uiColor} />
              <View>
                <Text style={[styles.switchLabel, { color: theme.textColor }]}>
                  Watering Reminders
                </Text>
                <Text
                  style={[
                    styles.switchDesc,
                    { color: colors.mutedForeground },
                  ]}
                >
                  Get notified when plants need care
                </Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={toggleNotifications}
              trackColor={{
                false: colors.muted,
                true: theme.uiColor + "80",
              }}
              thumbColor={notifEnabled ? theme.uiColor : colors.border}
            />
          </View>
        </View>

        {/* Reset */}
        <Text style={[sectionHeaderStyle, { marginTop: 24 }]}>
          DANGER ZONE
        </Text>
        <TouchableOpacity
          onPress={handleReset}
          style={[
            styles.resetBtn,
            { backgroundColor: colors.card, borderColor: colors.destructive + "40" },
          ]}
        >
          <Ionicons name="refresh" size={18} color={colors.destructive} />
          <Text style={[styles.resetText, { color: colors.destructive }]}>
            Reset Theme to Defaults
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
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  content: { padding: 20 },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  swatchGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 14,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  previewRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  previewLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  previewText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  previewBtnText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  bgPreviewRow: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  bgThumb: {
    width: 72,
    height: 72,
    borderRadius: 12,
  },
  bgActions: { flex: 1, gap: 8 },
  bgSelectedText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
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
  bgPickerText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  switchInfo: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  switchLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  switchDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  resetBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
  },
  resetText: { fontSize: 15, fontFamily: "Inter_500Medium" },
});
