import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  HEALTH_STATUS_CONFIG,
  HealthStatus,
  TimeUnit,
  usePlants,
} from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { parseISODateToMs } from "@/utils/care";

type UnitOption = TimeUnit;

function UnitPicker({
  value,
  onChange,
  uiColor,
  colors,
  disabled,
}: {
  value: UnitOption;
  onChange: (v: UnitOption) => void;
  uiColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.unitRow, disabled && { opacity: 0.4 }]}>
      {(["hours", "days"] as UnitOption[]).map((unit) => (
        <TouchableOpacity
          key={unit}
          onPress={() => !disabled && onChange(unit)}
          disabled={disabled}
          style={[
            styles.unitBtn,
            {
              backgroundColor: value === unit ? uiColor : colors.muted,
              borderColor: value === unit ? uiColor : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.unitText,
              { color: value === unit ? "#FFFFFF" : colors.mutedForeground },
            ]}
          >
            {unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function HealthStatusPicker({
  value,
  onChange,
  textColor,
}: {
  value: HealthStatus;
  onChange: (v: HealthStatus) => void;
  textColor: string;
}) {
  const statuses = Object.keys(HEALTH_STATUS_CONFIG) as HealthStatus[];
  return (
    <View style={styles.healthGrid}>
      {statuses.map((status) => {
        const cfg = HEALTH_STATUS_CONFIG[status];
        const selected = value === status;
        return (
          <TouchableOpacity
            key={status}
            onPress={() => onChange(status)}
            style={[
              styles.healthBtn,
              {
                backgroundColor: selected ? cfg.color + "22" : "transparent",
                borderColor: selected ? cfg.color : cfg.color + "44",
                borderWidth: selected ? 2 : 1,
              },
            ]}
          >
            <Ionicons name={cfg.icon as any} size={18} color={cfg.color} />
            <Text
              style={[
                styles.healthBtnText,
                { color: selected ? cfg.color : textColor, opacity: selected ? 1 : 0.7 },
              ]}
            >
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LevelPicker({
  label,
  value,
  onChange,
  uiColor,
  colors,
}: {
  label: string;
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
  uiColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.levelSection}>
      <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <View style={styles.levelRow}>
        {([1, 2, 3, 4, 5] as const).map((n) => {
          const selected = n === value;
          return (
            <TouchableOpacity
              key={n}
              onPress={() => onChange(n)}
              style={[
                styles.levelBtn,
                {
                  backgroundColor: selected ? uiColor : colors.muted,
                  borderColor: selected ? uiColor : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.levelBtnText,
                  { color: selected ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function formatISODate(ms: number | null): string {
  if (!ms) return "";
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function EditPlantScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plants, editPlant } = usePlants();
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const plant = plants.find((p) => p.id === id);

  const [name, setName] = useState(plant?.name ?? "");
  const [species, setSpecies] = useState(plant?.species ?? "");
  const [mainPhoto, setMainPhoto] = useState<string | null>(plant?.mainPhoto ?? null);
  const [location, setLocation] = useState(plant?.location ?? "");
  const [purchaseDateText, setPurchaseDateText] = useState(
    formatISODate(plant?.purchaseDate ?? null)
  );
  const [lastRepottedText, setLastRepottedText] = useState(
    formatISODate(plant?.lastRepotted ?? null)
  );
  const [lightLevel, setLightLevel] = useState<1 | 2 | 3 | 4 | 5>(
    (plant?.lightLevel ?? 3) as any
  );
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(
    (plant?.difficulty ?? 3) as any
  );
  const [healthStatus, setHealthStatus] = useState<HealthStatus>(
    plant?.healthStatus ?? "good"
  );
  const [wateringEnabled, setWateringEnabled] = useState(
    plant?.wateringEnabled ?? true
  );
  const [mistingEnabled, setMistingEnabled] = useState(
    plant?.mistingEnabled ?? true
  );
  const [waterValue, setWaterValue] = useState(
    String(plant?.wateringInterval.value ?? 3)
  );
  const [waterUnit, setWaterUnit] = useState<TimeUnit>(
    plant?.wateringInterval.unit ?? "days"
  );
  const [mistValue, setMistValue] = useState(
    String(plant?.mistingInterval.value ?? 1)
  );
  const [mistUnit, setMistUnit] = useState<TimeUnit>(
    plant?.mistingInterval.unit ?? "days"
  );

  if (!plant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Plant not found.</Text>
      </View>
    );
  }

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setMainPhoto(result.assets[0].uri);
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) setMainPhoto(result.assets[0].uri);
  }

  function handlePhotoPress() {
    Alert.alert("Change Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickPhoto },
      { text: "Remove Photo", style: "destructive", onPress: () => setMainPhoto(null) },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Missing name", "Please enter a plant name.");
      return;
    }
    if (!species.trim()) {
      Alert.alert("Missing species", "Please enter the plant species.");
      return;
    }
    const purchaseDate = parseISODateToMs(purchaseDateText);
    if (purchaseDateText.trim() && purchaseDate == null) {
      Alert.alert("Invalid date", "Purchase date must be YYYY-MM-DD.");
      return;
    }
    const lastRepotted = parseISODateToMs(lastRepottedText);
    if (lastRepottedText.trim() && lastRepotted == null) {
      Alert.alert("Invalid date", "Last repotted date must be YYYY-MM-DD.");
      return;
    }
    const wVal = parseFloat(waterValue);
    const mVal = parseFloat(mistValue);
    if (wateringEnabled && (isNaN(wVal) || wVal <= 0)) {
      Alert.alert("Invalid interval", "Please enter a valid watering interval.");
      return;
    }
    if (mistingEnabled && (isNaN(mVal) || mVal <= 0)) {
      Alert.alert("Invalid interval", "Please enter a valid misting interval.");
      return;
    }
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    editPlant(id!, {
      name: name.trim(),
      species: species.trim(),
      mainPhoto,
      location: location.trim(),
      purchaseDate,
      lastRepotted,
      lightLevel,
      difficulty,
      healthStatus,
      wateringEnabled,
      mistingEnabled,
      wateringInterval: { value: wVal || 3, unit: waterUnit },
      mistingInterval: { value: mVal || 1, unit: mistUnit },
    });
    router.back();
  }

  const inputStyle = [
    styles.input,
    { backgroundColor: colors.card, borderColor: colors.border, color: theme.textColor },
  ];
  const labelStyle = [styles.label, { color: theme.textColor }];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={22} color={theme.uiColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>Edit Plant</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtnText, { color: theme.uiColor }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo picker */}
        <TouchableOpacity onPress={handlePhotoPress} style={styles.photoPickerWrapper}>
          <View style={[styles.photoPicker, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            {mainPhoto ? (
              <Image source={{ uri: mainPhoto }} style={styles.photoPreview} contentFit="cover" />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera-outline" size={32} color={colors.mutedForeground} />
                <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>Change Photo</Text>
              </View>
            )}
          </View>
          <View style={[styles.photoEditBadge, { backgroundColor: theme.uiColor }]}>
            <Ionicons name="pencil" size={12} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

        {/* Basic info */}
        <View style={styles.section}>
          <Text style={labelStyle}>Plant Name *</Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Living Room Fern"
            placeholderTextColor={colors.mutedForeground}
          />
          <Text style={[labelStyle, { marginTop: 16 }]}>Species *</Text>
          <TextInput
            style={inputStyle}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g. Nephrolepis exaltata"
            placeholderTextColor={colors.mutedForeground}
          />
        </View>

        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="information-circle-outline" size={20} color={theme.uiColor} />
            <Text style={[styles.sectionCardTitle, { color: theme.textColor }]}>Details</Text>
          </View>
          <Text style={[styles.sectionCardDesc, { color: colors.mutedForeground }]}>
            Optional information to help you track this plant.
          </Text>
          <Text style={labelStyle}>Location</Text>
          <TextInput
            style={inputStyle}
            value={location}
            onChangeText={setLocation}
            placeholder="e.g. Living room"
            placeholderTextColor={colors.mutedForeground}
          />

          <Text style={[labelStyle, { marginTop: 12 }]}>Purchase date</Text>
          <TextInput
            style={inputStyle}
            value={purchaseDateText}
            onChangeText={setPurchaseDateText}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[labelStyle, { marginTop: 12 }]}>Last repotted</Text>
          <TextInput
            style={inputStyle}
            value={lastRepottedText}
            onChangeText={setLastRepottedText}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.mutedForeground}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <LevelPicker
            label="Light level"
            value={lightLevel}
            onChange={setLightLevel}
            uiColor={theme.uiColor}
            colors={colors}
          />
          <LevelPicker
            label="Care difficulty"
            value={difficulty}
            onChange={setDifficulty}
            uiColor={theme.uiColor}
            colors={colors}
          />
        </View>

        {/* Health Status */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="heart-outline" size={20} color={theme.uiColor} />
            <Text style={[styles.sectionCardTitle, { color: theme.textColor }]}>Health Status</Text>
          </View>
          <Text style={[styles.sectionCardDesc, { color: colors.mutedForeground }]}>
            How is this plant doing right now?
          </Text>
          <HealthStatusPicker
            value={healthStatus}
            onChange={setHealthStatus}
            textColor={theme.textColor}
          />
        </View>

        {/* Watering */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="water" size={20} color={theme.uiColor} />
            <Text style={[styles.sectionCardTitle, { color: theme.textColor }]}>Watering</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
                {wateringEnabled ? "Alerts on" : "Muted"}
              </Text>
              <Switch
                value={wateringEnabled}
                onValueChange={setWateringEnabled}
                trackColor={{ false: colors.muted, true: theme.uiColor + "88" }}
                thumbColor={wateringEnabled ? theme.uiColor : colors.mutedForeground}
              />
            </View>
          </View>
          <Text style={[styles.sectionCardDesc, { color: colors.mutedForeground }]}>
            How often does this plant need watering?
          </Text>
          <View style={[styles.intervalRow, !wateringEnabled && { opacity: 0.4 }]}>
            <TextInput
              style={[
                styles.numberInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: theme.textColor },
              ]}
              value={waterValue}
              onChangeText={setWaterValue}
              keyboardType="decimal-pad"
              placeholder="3"
              placeholderTextColor={colors.mutedForeground}
              editable={wateringEnabled}
            />
            <Text style={[styles.everyLabel, { color: colors.mutedForeground }]}>every</Text>
            <UnitPicker
              value={waterUnit}
              onChange={setWaterUnit}
              uiColor={theme.uiColor}
              colors={colors}
              disabled={!wateringEnabled}
            />
          </View>
        </View>

        {/* Misting */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionCardHeader}>
            <Ionicons name="rainy" size={20} color={theme.uiColor} />
            <Text style={[styles.sectionCardTitle, { color: theme.textColor }]}>Misting</Text>
            <View style={styles.toggleRow}>
              <Text style={[styles.toggleLabel, { color: colors.mutedForeground }]}>
                {mistingEnabled ? "Alerts on" : "Muted"}
              </Text>
              <Switch
                value={mistingEnabled}
                onValueChange={setMistingEnabled}
                trackColor={{ false: colors.muted, true: theme.uiColor + "88" }}
                thumbColor={mistingEnabled ? theme.uiColor : colors.mutedForeground}
              />
            </View>
          </View>
          <Text style={[styles.sectionCardDesc, { color: colors.mutedForeground }]}>
            How often does this plant need misting?
          </Text>
          <View style={[styles.intervalRow, !mistingEnabled && { opacity: 0.4 }]}>
            <TextInput
              style={[
                styles.numberInput,
                { backgroundColor: colors.background, borderColor: colors.border, color: theme.textColor },
              ]}
              value={mistValue}
              onChangeText={setMistValue}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
              editable={mistingEnabled}
            />
            <Text style={[styles.everyLabel, { color: colors.mutedForeground }]}>every</Text>
            <UnitPicker
              value={mistUnit}
              onChange={setMistUnit}
              uiColor={theme.uiColor}
              colors={colors}
              disabled={!mistingEnabled}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.uiColor }]}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 0 },
  photoPickerWrapper: { alignSelf: "center", marginBottom: 24 },
  photoPicker: {
    width: 120,
    height: 120,
    borderRadius: 24,
    borderWidth: 2,
    borderStyle: "dashed",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  photoPreview: { width: "100%", height: "100%" },
  photoPlaceholder: { alignItems: "center", gap: 6 },
  photoLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  photoEditBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  section: { marginBottom: 16 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  sectionCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  sectionCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionCardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", flex: 1 },
  sectionCardDesc: { fontSize: 12, fontFamily: "Inter_400Regular" },
  toggleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  intervalRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  numberInput: {
    width: 60,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  everyLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  unitRow: { flexDirection: "row", gap: 6 },
  unitBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  healthGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  healthBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    minWidth: "46%",
    flex: 1,
  },
  healthBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  levelSection: { marginTop: 12, gap: 8 },
  levelLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  levelRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  levelBtn: {
    width: 44,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  levelBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
  saveButtonText: { color: "#FFFFFF", fontSize: 16, fontFamily: "Inter_600SemiBold" },
});
