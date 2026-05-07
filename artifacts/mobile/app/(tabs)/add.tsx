import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlants, TimeUnit } from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

type UnitOption = TimeUnit;

function UnitPicker({
  value,
  onChange,
  uiColor,
  colors,
}: {
  value: UnitOption;
  onChange: (v: UnitOption) => void;
  uiColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.unitRow}>
      {(["hours", "days"] as UnitOption[]).map((unit) => (
        <TouchableOpacity
          key={unit}
          onPress={() => onChange(unit)}
          style={[
            styles.unitBtn,
            {
              backgroundColor:
                value === unit ? uiColor : colors.muted,
              borderColor:
                value === unit ? uiColor : colors.border,
            },
          ]}
        >
          <Text
            style={[
              styles.unitText,
              {
                color: value === unit ? "#FFFFFF" : colors.mutedForeground,
              },
            ]}
          >
            {unit}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function AddPlantScreen() {
  const colors = useColors();
  const theme = useTheme();
  const { addPlant } = usePlants();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [mainPhoto, setMainPhoto] = useState<string | null>(null);
  const [waterValue, setWaterValue] = useState("3");
  const [waterUnit, setWaterUnit] = useState<TimeUnit>("days");
  const [mistValue, setMistValue] = useState("1");
  const [mistUnit, setMistUnit] = useState<TimeUnit>("days");

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow access to your photos to add plant images."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMainPhoto(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission needed",
        "Allow camera access to take plant photos."
      );
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setMainPhoto(result.assets[0].uri);
    }
  }

  function handlePhotoPress() {
    Alert.alert("Add Photo", "Choose a source", [
      { text: "Camera", onPress: takePhoto },
      { text: "Photo Library", onPress: pickPhoto },
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
    if (isNaN(wVal) || wVal <= 0) {
      Alert.alert("Invalid interval", "Please enter a valid watering interval.");
      return;
    }
    if (isNaN(mVal) || mVal <= 0) {
      Alert.alert("Invalid interval", "Please enter a valid misting interval.");
      return;
    }

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    addPlant({
      name: name.trim(),
      species: species.trim(),
      mainPhoto,
      wateringInterval: { value: wVal, unit: waterUnit },
      mistingInterval: { value: mVal, unit: mistUnit },
    });
    router.replace("/(tabs)/");
  }

  const inputStyle = [
    styles.input,
    {
      backgroundColor: colors.card,
      borderColor: colors.border,
      color: theme.textColor,
    },
  ];

  const labelStyle = [styles.label, { color: theme.textColor }];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
      ]}
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
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={22} color={theme.uiColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.textColor }]}>
          Add Plant
        </Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={[styles.saveBtnText, { color: theme.uiColor }]}>
            Save
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingBottom:
              Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Photo picker */}
        <TouchableOpacity onPress={handlePhotoPress} style={styles.photoPickerWrapper}>
          <View
            style={[
              styles.photoPicker,
              { backgroundColor: colors.muted, borderColor: colors.border },
            ]}
          >
            {mainPhoto ? (
              <Image
                source={{ uri: mainPhoto }}
                style={styles.photoPreview}
                contentFit="cover"
              />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons
                  name="camera-outline"
                  size={32}
                  color={colors.mutedForeground}
                />
                <Text
                  style={[styles.photoLabel, { color: colors.mutedForeground }]}
                >
                  Add Photo
                </Text>
              </View>
            )}
          </View>
          {mainPhoto && (
            <View
              style={[
                styles.photoEditBadge,
                { backgroundColor: theme.uiColor },
              ]}
            >
              <Ionicons name="pencil" size={12} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>

        {/* Fields */}
        <View style={styles.section}>
          <Text style={labelStyle}>Plant Name *</Text>
          <TextInput
            style={inputStyle}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Living Room Fern"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
          />

          <Text style={[labelStyle, { marginTop: 16 }]}>Species *</Text>
          <TextInput
            style={inputStyle}
            value={species}
            onChangeText={setSpecies}
            placeholder="e.g. Nephrolepis exaltata"
            placeholderTextColor={colors.mutedForeground}
            returnKeyType="next"
          />
        </View>

        {/* Watering */}
        <View
          style={[
            styles.intervalCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.intervalHeader}>
            <Ionicons name="water" size={20} color={theme.uiColor} />
            <Text style={[styles.intervalTitle, { color: theme.textColor }]}>
              Watering
            </Text>
          </View>
          <Text style={[styles.intervalDesc, { color: colors.mutedForeground }]}>
            How often does this plant need watering?
          </Text>
          <View style={styles.intervalRow}>
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: theme.textColor,
                },
              ]}
              value={waterValue}
              onChangeText={setWaterValue}
              keyboardType="decimal-pad"
              placeholder="3"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text
              style={[
                styles.everyLabel,
                { color: colors.mutedForeground },
              ]}
            >
              every
            </Text>
            <UnitPicker
              value={waterUnit}
              onChange={setWaterUnit}
              uiColor={theme.uiColor}
              colors={colors}
            />
          </View>
        </View>

        {/* Misting */}
        <View
          style={[
            styles.intervalCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.intervalHeader}>
            <Ionicons name="rainy" size={20} color={theme.uiColor} />
            <Text style={[styles.intervalTitle, { color: theme.textColor }]}>
              Misting
            </Text>
          </View>
          <Text style={[styles.intervalDesc, { color: colors.mutedForeground }]}>
            How often does this plant need misting?
          </Text>
          <View style={styles.intervalRow}>
            <TextInput
              style={[
                styles.numberInput,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                  color: theme.textColor,
                },
              ]}
              value={mistValue}
              onChangeText={setMistValue}
              keyboardType="decimal-pad"
              placeholder="1"
              placeholderTextColor={colors.mutedForeground}
            />
            <Text
              style={[
                styles.everyLabel,
                { color: colors.mutedForeground },
              ]}
            >
              every
            </Text>
            <UnitPicker
              value={mistUnit}
              onChange={setMistUnit}
              uiColor={theme.uiColor}
              colors={colors}
            />
          </View>
        </View>

        {/* Save button */}
        <TouchableOpacity
          onPress={handleSave}
          style={[styles.saveButton, { backgroundColor: theme.uiColor }]}
        >
          <Ionicons name="checkmark" size={20} color="#FFFFFF" />
          <Text style={styles.saveButtonText}>Add Plant</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: { padding: 4 },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, gap: 0 },
  photoPickerWrapper: {
    alignSelf: "center",
    marginBottom: 24,
  },
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
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  intervalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
    gap: 8,
  },
  intervalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  intervalTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  intervalDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  intervalRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
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
  everyLabel: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  unitRow: {
    flexDirection: "row",
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  unitText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
    marginTop: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
});
