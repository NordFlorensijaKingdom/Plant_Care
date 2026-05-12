import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Calendar, Camera, Check, ChevronDown, Droplet, Heart, Info, Pencil, SprayCan, X } from "lucide-react-native";

import {
  HEALTH_STATUS_CONFIG,
  CareDifficulty,
  HealthStatus,
  LightLevel,
  TimeUnit,
  usePlants,
} from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

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
        const Icon = cfg.Icon;
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
            <Icon size={18} color={cfg.color} />
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

function SelectField<T extends string>({
  label,
  placeholder,
  value,
  onChange,
  colors,
  textColor,
  options,
}: {
  label: string;
  placeholder: string;
  value: T;
  onChange: (v: T) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  textColor: string;
  options: { value: T; label: string }[];
}) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value)?.label ?? "";

  return (
    <View style={styles.levelSection}>
      <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        style={[
          styles.selectInput,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: selected ? textColor : colors.mutedForeground,
              opacity: selected ? 1 : 0.8,
            },
          ]}
        >
          {selected || placeholder}
        </Text>
        <ChevronDown size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: textColor }]}>{label}</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.modalCloseBtn}>
                <Text style={[styles.modalCloseText, { color: theme.uiColor }]}>Закрыть</Text>
              </TouchableOpacity>
            </View>
            {options.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  style={[
                    styles.optionRow,
                    {
                      backgroundColor: isSelected ? theme.uiColor + "18" : "transparent",
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionText, { color: isSelected ? theme.uiColor : textColor }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
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

function DateField({
  label,
  value,
  onChange,
  colors,
  textColor,
  uiColor,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  textColor: string;
  uiColor: string;
}) {
  const [open, setOpen] = useState(false);
  const initial = value ? new Date(value) : new Date();
  const [year, setYear] = useState(String(initial.getFullYear()));
  const [month, setMonth] = useState(String(initial.getMonth() + 1).padStart(2, "0"));
  const [day, setDay] = useState(String(initial.getDate()).padStart(2, "0"));

  function resetFromValue(next: number | null) {
    const d = next ? new Date(next) : new Date();
    setYear(String(d.getFullYear()));
    setMonth(String(d.getMonth() + 1).padStart(2, "0"));
    setDay(String(d.getDate()).padStart(2, "0"));
  }

  function tryBuildDate(): number | null {
    const y = Number(year);
    const m = Number(month);
    const d = Number(day);
    if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
    if (m < 1 || m > 12) return null;
    if (d < 1 || d > 31) return null;
    const dt = new Date(y, m - 1, d, 0, 0, 0, 0);
    if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) return null;
    return dt.getTime();
  }

  const display = value ? formatISODate(value) : "";

  return (
    <View style={{ marginTop: 12 }}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
      <TouchableOpacity
        onPress={() => {
          resetFromValue(value);
          setOpen(true);
        }}
        style={[
          styles.selectInput,
          { backgroundColor: colors.background, borderColor: colors.border },
        ]}
      >
        <Text
          style={[
            styles.selectText,
            {
              color: display ? textColor : colors.mutedForeground,
              opacity: display ? 1 : 0.8,
            },
          ]}
        >
          {display || "Выбрать дату"}
        </Text>
        <Calendar size={18} color={colors.mutedForeground} />
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setOpen(false)}>
          <Pressable
            style={[
              styles.modalCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: textColor }]}>{label}</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>Год</Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: textColor },
                  ]}
                  value={year}
                  onChangeText={setYear}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>Месяц</Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: textColor },
                  ]}
                  value={month}
                  onChangeText={setMonth}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
              <View style={styles.dateField}>
                <Text style={[styles.dateLabel, { color: colors.mutedForeground }]}>День</Text>
                <TextInput
                  style={[
                    styles.dateInput,
                    { backgroundColor: colors.background, borderColor: colors.border, color: textColor },
                  ]}
                  value={day}
                  onChangeText={setDay}
                  keyboardType="number-pad"
                  maxLength={2}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  onChange(null);
                  setOpen(false);
                }}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Очистить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const now = new Date();
                  onChange(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0).getTime());
                  setOpen(false);
                }}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Сегодня</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setOpen(false)}
                style={[styles.modalBtn, { backgroundColor: colors.muted }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  const built = tryBuildDate();
                  if (built == null) {
                    Alert.alert("Неверная дата", "Проверьте год/месяц/день.");
                    return;
                  }
                  onChange(built);
                  setOpen(false);
                }}
                style={[styles.modalBtn, { backgroundColor: uiColor }]}
              >
                <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>Готово</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
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
  const [purchaseDate, setPurchaseDate] = useState<number | null>(plant?.purchaseDate ?? null);
  const [lastRepotted, setLastRepotted] = useState<number | null>(plant?.lastRepotted ?? null);
  const [lightLevel, setLightLevel] = useState<LightLevel>(plant?.lightLevel ?? "medium");
  const [difficulty, setDifficulty] = useState<CareDifficulty>(plant?.difficulty ?? "medium");
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
          <X size={22} color={theme.uiColor} />
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
                <Camera size={32} color={colors.mutedForeground} />
                <Text style={[styles.photoLabel, { color: colors.mutedForeground }]}>Change Photo</Text>
              </View>
            )}
          </View>
          <View style={[styles.photoEditBadge, { backgroundColor: theme.uiColor }]}>
            <Pencil size={12} color="#FFFFFF" />
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
            <Info size={20} color={theme.uiColor} />
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

          <DateField
            label="Дата покупки"
            value={purchaseDate}
            onChange={setPurchaseDate}
            colors={colors}
            textColor={theme.textColor}
            uiColor={theme.uiColor}
          />
          <DateField
            label="Последняя пересадка"
            value={lastRepotted}
            onChange={setLastRepotted}
            colors={colors}
            textColor={theme.textColor}
            uiColor={theme.uiColor}
          />
          <SelectField<LightLevel>
            label="Уровень света"
            placeholder="Выбрать"
            value={lightLevel}
            onChange={setLightLevel}
            colors={colors}
            textColor={theme.textColor}
            options={[
              { value: "low", label: "Низкий" },
              { value: "medium", label: "Средний" },
              { value: "bright", label: "Яркий" },
            ]}
          />
          <SelectField<CareDifficulty>
            label="Сложность ухода"
            placeholder="Выбрать"
            value={difficulty}
            onChange={setDifficulty}
            colors={colors}
            textColor={theme.textColor}
            options={[
              { value: "easy", label: "Лёгкий" },
              { value: "medium", label: "Средний" },
              { value: "hard", label: "Сложный" },
            ]}
          />
        </View>

        {/* Health Status */}
        <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionCardHeader}>
            <Heart size={20} color={theme.uiColor} />
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
            <Droplet size={20} color={theme.uiColor} />
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
            <SprayCan size={20} color={theme.uiColor} />
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
          <Check size={20} color="#FFFFFF" />
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
  selectInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  selectText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    maxWidth: 520,
  },
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  modalTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  modalCloseBtn: { paddingHorizontal: 6, paddingVertical: 4 },
  modalCloseText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  optionRow: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  dateRow: { flexDirection: "row", gap: 8 },
  dateField: { flex: 1, gap: 4 },
  dateLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dateInput: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  modalActions: { flexDirection: "row", gap: 8 },
  modalBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
