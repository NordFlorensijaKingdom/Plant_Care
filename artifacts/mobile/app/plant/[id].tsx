import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  Recurrence,
  getProgress,
  getTimeRemaining,
  usePlants,
} from "@/context/PlantContext";
import { HealthBadge } from "@/components/HealthBadge";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 3;

type DetailTab = "gallery" | "notes" | "reminders";

// Reminder add form component (extracted to avoid hook-in-loop issue)
function ReminderForm({
  onAdd,
  onCancel,
  uiColor,
  colors,
  textColor,
}: {
  onAdd: (title: string, date: number, recurrence: Recurrence) => void;
  onCancel: () => void;
  uiColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  textColor: string;
}) {
  const now = new Date();
  const [title, setTitle] = useState("");
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [day, setDay] = useState(String(now.getDate()));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [hour, setHour] = useState("9");
  const [minute, setMinute] = useState("00");
  const [recurrence, setRecurrence] = useState<Recurrence>("once");

  function handleAdd() {
    if (!title.trim()) {
      Alert.alert("Missing title", "Please enter a reminder title.");
      return;
    }
    const m = parseInt(month);
    const d = parseInt(day);
    const y = parseInt(year);
    const h = parseInt(hour);
    const min = parseInt(minute);
    if (
      isNaN(m) || m < 1 || m > 12 ||
      isNaN(d) || d < 1 || d > 31 ||
      isNaN(y) || y < 2024 ||
      isNaN(h) || h < 0 || h > 23 ||
      isNaN(min) || min < 0 || min > 59
    ) {
      Alert.alert("Invalid date", "Please enter a valid date and time.");
      return;
    }
    const date = new Date(y, m - 1, d, h, min, 0).getTime();
    if (date <= Date.now()) {
      Alert.alert("Past date", "Please choose a future date and time.");
      return;
    }
    onAdd(title.trim(), date, recurrence);
  }

  const inputStyle = [
    formStyles.input,
    { backgroundColor: colors.background, borderColor: colors.border, color: textColor },
  ];

  return (
    <View
      style={[
        formStyles.form,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <Text style={[formStyles.formTitle, { color: textColor }]}>
        New Reminder
      </Text>

      <TextInput
        style={inputStyle}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Fertilize, Repot..."
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="next"
      />

      {/* Date row */}
      <View style={formStyles.dateRow}>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Month
          </Text>
          <TextInput
            style={[inputStyle, formStyles.dateInput]}
            value={month}
            onChangeText={setMonth}
            keyboardType="number-pad"
            placeholder="MM"
            placeholderTextColor={colors.mutedForeground}
            maxLength={2}
          />
        </View>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Day
          </Text>
          <TextInput
            style={[inputStyle, formStyles.dateInput]}
            value={day}
            onChangeText={setDay}
            keyboardType="number-pad"
            placeholder="DD"
            placeholderTextColor={colors.mutedForeground}
            maxLength={2}
          />
        </View>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Year
          </Text>
          <TextInput
            style={[inputStyle, formStyles.dateInput]}
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            placeholder="YYYY"
            placeholderTextColor={colors.mutedForeground}
            maxLength={4}
          />
        </View>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Hour
          </Text>
          <TextInput
            style={[inputStyle, formStyles.dateInput]}
            value={hour}
            onChangeText={setHour}
            keyboardType="number-pad"
            placeholder="HH"
            placeholderTextColor={colors.mutedForeground}
            maxLength={2}
          />
        </View>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Min
          </Text>
          <TextInput
            style={[inputStyle, formStyles.dateInput]}
            value={minute}
            onChangeText={setMinute}
            keyboardType="number-pad"
            placeholder="MM"
            placeholderTextColor={colors.mutedForeground}
            maxLength={2}
          />
        </View>
      </View>

      {/* Recurrence */}
      <View style={formStyles.recurrenceRow}>
        <Text style={[formStyles.dateLabel, { color: colors.mutedForeground, alignSelf: "center" }]}>
          Repeat:
        </Text>
        {(["once", "yearly"] as Recurrence[]).map((r) => (
          <TouchableOpacity
            key={r}
            onPress={() => setRecurrence(r)}
            style={[
              formStyles.recurrenceBtn,
              {
                backgroundColor: recurrence === r ? uiColor : colors.muted,
                borderColor: recurrence === r ? uiColor : colors.border,
              },
            ]}
          >
            <Text
              style={[
                formStyles.recurrenceText,
                { color: recurrence === r ? "#FFFFFF" : colors.mutedForeground },
              ]}
            >
              {r === "once" ? "Once" : "Yearly"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={formStyles.formActions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[formStyles.formBtn, { backgroundColor: colors.muted }]}
        >
          <Text style={[formStyles.formBtnText, { color: colors.mutedForeground }]}>
            Cancel
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAdd}
          style={[formStyles.formBtn, { backgroundColor: uiColor }]}
        >
          <Ionicons name="alarm-outline" size={15} color="#FFFFFF" />
          <Text style={[formStyles.formBtnText, { color: "#FFFFFF" }]}>
            Schedule
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formStyles = StyleSheet.create({
  form: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 10,
  },
  formTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  input: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  dateRow: { flexDirection: "row", gap: 6 },
  dateField: { flex: 1, gap: 3 },
  dateLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  dateInput: { paddingHorizontal: 6, textAlign: "center" },
  recurrenceRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  recurrenceBtn: {
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  recurrenceText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  formActions: { flexDirection: "row", gap: 8 },
  formBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    height: 40,
    borderRadius: 10,
  },
  formBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});

// ---- Main Screen ----

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    plants,
    waterPlant,
    mistPlant,
    addNote,
    updateNote,
    deleteNote,
    addPhoto,
    deletePhoto,
    deletePlant,
    addReminder,
    deleteReminder,
  } = usePlants();
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const plant = plants.find((p) => p.id === id);

  const [activeTab, setActiveTab] = useState<DetailTab>("gallery");
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");
  const [showReminderForm, setShowReminderForm] = useState(false);

  if (!plant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Plant not found.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.uiColor, marginTop: 12 }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const waterProgress = getProgress(plant.lastWatered, plant.wateringInterval);
  const mistProgress = getProgress(plant.lastMisted, plant.mistingInterval);
  const waterRemaining = getTimeRemaining(plant.lastWatered, plant.wateringInterval);
  const mistRemaining = getTimeRemaining(plant.lastMisted, plant.mistingInterval);

  const progressBarColor = (p: number) =>
    p >= 1 ? "#E53E3E" : p >= 0.75 ? "#F4A261" : theme.uiColor;

  async function handleWater() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    waterPlant(plant.id);
  }

  async function handleMist() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mistPlant(plant.id);
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      addPhoto(plant.id, result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleAddNote() {
    if (!newNoteText.trim()) return;
    addNote(plant.id, newNoteText.trim());
    setNewNoteText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function saveEditNote() {
    if (!editingNoteId || !editingNoteText.trim()) return;
    updateNote(plant.id, editingNoteId, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function confirmDeleteNote(noteId: string) {
    Alert.alert("Delete Note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteNote(plant.id, noteId) },
    ]);
  }

  function confirmDeletePhoto(index: number) {
    Alert.alert("Delete Photo", "Remove this photo?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deletePhoto(plant.id, index) },
    ]);
  }

  function handleDeletePlant() {
    Alert.alert(
      "Delete Plant",
      `Remove ${plant.name} from your garden? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePlant(plant.id);
            router.back();
          },
        },
      ]
    );
  }

  async function handleAddReminder(
    title: string,
    date: number,
    recurrence: Recurrence
  ) {
    await addReminder(plant.id, { title, date, recurrence });
    setShowReminderForm(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function confirmDeleteReminder(reminderId: string) {
    Alert.alert("Delete Reminder", "Remove this reminder?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          deleteReminder(plant.id, reminderId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    ]);
  }

  const tabs: { key: DetailTab; label: string; icon: string }[] = [
    { key: "gallery", label: "Gallery", icon: "images-outline" },
    { key: "notes", label: "Notes", icon: "document-text-outline" },
    { key: "reminders", label: "Reminders", icon: "alarm-outline" },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Hero */}
      <View
        style={[
          styles.hero,
          { backgroundColor: plant.mainPhoto ? "transparent" : colors.muted },
        ]}
      >
        {plant.mainPhoto ? (
          <Image
            source={{ uri: plant.mainPhoto }}
            style={styles.heroImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: colors.muted }]}>
            <Ionicons name="leaf" size={64} color={theme.uiColor} />
          </View>
        )}
        {plant.mainPhoto && (
          <View style={styles.heroOverlay} />
        )}

        {/* Nav */}
        <View style={[styles.heroNav, { paddingTop: topPad + 8 }]}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={[
              styles.navBtn,
              {
                backgroundColor: plant.mainPhoto
                  ? "rgba(0,0,0,0.3)"
                  : colors.card,
              },
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={plant.mainPhoto ? "#FFFFFF" : theme.uiColor}
            />
          </TouchableOpacity>
          <View style={styles.heroNavRight}>
            <TouchableOpacity
              onPress={() => router.push(`/edit/${plant.id}`)}
              style={[
                styles.navBtn,
                {
                  backgroundColor: plant.mainPhoto
                    ? "rgba(0,0,0,0.3)"
                    : colors.card,
                },
              ]}
            >
              <Ionicons
                name="pencil"
                size={18}
                color={plant.mainPhoto ? "#FFFFFF" : theme.uiColor}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDeletePlant}
              style={[
                styles.navBtn,
                {
                  backgroundColor: plant.mainPhoto
                    ? "rgba(0,0,0,0.3)"
                    : colors.card,
                },
              ]}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={plant.mainPhoto ? "#FFFFFF" : colors.destructive}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Plant info overlay */}
        <View style={styles.heroInfo}>
          <Text
            style={[
              styles.heroName,
              { color: plant.mainPhoto ? "#FFFFFF" : theme.textColor },
            ]}
          >
            {plant.name}
          </Text>
          <Text
            style={[
              styles.heroSpecies,
              {
                color: plant.mainPhoto
                  ? "rgba(255,255,255,0.8)"
                  : colors.mutedForeground,
              },
            ]}
          >
            {plant.species}
          </Text>
          <View style={{ marginTop: 6 }}>
            <HealthBadge status={plant.healthStatus} size="md" />
          </View>
        </View>
      </View>

      {/* Care cards */}
      <View style={styles.careRow}>
        <View
          style={[
            styles.careCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.careCardHeader}>
            <Ionicons name="water" size={15} color={progressBarColor(waterProgress)} />
            <Text style={[styles.careLabel, { color: colors.mutedForeground }]}>
              Watering
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(waterProgress * 100, 100)}%` as any,
                  backgroundColor: progressBarColor(waterProgress),
                },
              ]}
            />
          </View>
          <Text style={[styles.careTime, { color: progressBarColor(waterProgress) }]}>
            {waterRemaining}
          </Text>
          <TouchableOpacity
            onPress={handleWater}
            style={[styles.careBtn, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="water" size={13} color="#FFFFFF" />
            <Text style={styles.careBtnText}>Water</Text>
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.careCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.careCardHeader}>
            <Ionicons name="rainy" size={15} color={progressBarColor(mistProgress)} />
            <Text style={[styles.careLabel, { color: colors.mutedForeground }]}>
              Misting
            </Text>
          </View>
          <View style={[styles.progressTrack, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(mistProgress * 100, 100)}%` as any,
                  backgroundColor: progressBarColor(mistProgress),
                },
              ]}
            />
          </View>
          <Text style={[styles.careTime, { color: progressBarColor(mistProgress) }]}>
            {mistRemaining}
          </Text>
          <TouchableOpacity
            onPress={handleMist}
            style={[styles.careBtn, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="rainy" size={13} color="#FFFFFF" />
            <Text style={styles.careBtnText}>Mist</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderColor: colors.border, backgroundColor: colors.card }]}>
        {tabs.map((tab) => {
          const count =
            tab.key === "notes"
              ? plant.notes.length
              : tab.key === "reminders"
              ? plant.reminders.length
              : tab.key === "gallery"
              ? plant.photoAlbum.length
              : 0;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[
                styles.tabItem,
                activeTab === tab.key && {
                  borderBottomColor: theme.uiColor,
                  borderBottomWidth: 2,
                },
              ]}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? theme.uiColor : colors.mutedForeground}
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.key
                        ? theme.uiColor
                        : colors.mutedForeground,
                  },
                ]}
              >
                {tab.label}
                {count > 0 ? ` (${count})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      {activeTab === "gallery" ? (
        <FlatList
          data={plant.photoAlbum}
          keyExtractor={(_, i) => i.toString()}
          numColumns={3}
          scrollEnabled={!!plant.photoAlbum.length}
          contentContainerStyle={[
            styles.galleryContent,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons name="images-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTabText, { color: colors.mutedForeground }]}>
                No photos yet
              </Text>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[styles.emptyTabBtn, { backgroundColor: theme.uiColor }]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.emptyTabBtnText}>Add Photo</Text>
              </TouchableOpacity>
            </View>
          }
          ListFooterComponent={
            plant.photoAlbum.length > 0 ? (
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[
                  styles.addPhotoTile,
                  { backgroundColor: colors.muted, width: PHOTO_SIZE, height: PHOTO_SIZE },
                ]}
              >
                <Ionicons name="add" size={28} color={theme.uiColor} />
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onLongPress={() => confirmDeletePhoto(index)}
              style={[styles.photoTile, { width: PHOTO_SIZE, height: PHOTO_SIZE }]}
            >
              <Image
                source={{ uri: item }}
                style={styles.photoTileImg}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      ) : activeTab === "notes" ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.notesContent,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Add note row */}
          <View
            style={[
              styles.addNoteRow,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.noteInput, { color: theme.textColor }]}
              placeholder="Write a note..."
              placeholderTextColor={colors.mutedForeground}
              value={newNoteText}
              onChangeText={setNewNoteText}
              multiline
              returnKeyType="done"
            />
            <TouchableOpacity
              onPress={handleAddNote}
              disabled={!newNoteText.trim()}
              style={[
                styles.noteAddBtn,
                { backgroundColor: newNoteText.trim() ? theme.uiColor : colors.muted },
              ]}
            >
              <Ionicons
                name="send"
                size={16}
                color={newNoteText.trim() ? "#FFFFFF" : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {plant.notes.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons name="document-text-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTabText, { color: colors.mutedForeground }]}>
                No notes yet
              </Text>
            </View>
          ) : (
            [...plant.notes].reverse().map((note) => (
              <View
                key={note.id}
                style={[
                  styles.noteCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.noteCardHeader}>
                  <Text style={[styles.noteTimestamp, { color: colors.mutedForeground }]}>
                    {new Date(note.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setEditingNoteId(note.id);
                        setEditingNoteText(note.text);
                      }}
                      style={styles.noteActionBtn}
                    >
                      <Ionicons name="pencil-outline" size={15} color={theme.uiColor} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteNote(note.id)}
                      style={styles.noteActionBtn}
                    >
                      <Ionicons name="trash-outline" size={15} color={colors.destructive} />
                    </TouchableOpacity>
                  </View>
                </View>

                {editingNoteId === note.id ? (
                  <View style={styles.editNoteWrapper}>
                    <TextInput
                      style={[
                        styles.editNoteInput,
                        {
                          borderColor: theme.uiColor,
                          color: theme.textColor,
                          backgroundColor: colors.background,
                        },
                      ]}
                      value={editingNoteText}
                      onChangeText={setEditingNoteText}
                      multiline
                      autoFocus
                    />
                    <View style={styles.editNoteActions}>
                      <TouchableOpacity
                        onPress={() => setEditingNoteId(null)}
                        style={[styles.editNoteBtn, { backgroundColor: colors.muted }]}
                      >
                        <Text style={[styles.editNoteBtnText, { color: colors.mutedForeground }]}>
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveEditNote}
                        style={[styles.editNoteBtn, { backgroundColor: theme.uiColor }]}
                      >
                        <Text style={[styles.editNoteBtnText, { color: "#FFFFFF" }]}>
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text style={[styles.noteText, { color: theme.textColor }]}>
                    {note.text}
                  </Text>
                )}
              </View>
            ))
          )}
        </ScrollView>
      ) : (
        /* Reminders tab */
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.notesContent,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Add reminder button */}
          {!showReminderForm && (
            <TouchableOpacity
              onPress={() => setShowReminderForm(true)}
              style={[styles.addReminderBtn, { borderColor: theme.uiColor }]}
            >
              <Ionicons name="alarm-outline" size={18} color={theme.uiColor} />
              <Text style={[styles.addReminderText, { color: theme.uiColor }]}>
                Add Reminder
              </Text>
            </TouchableOpacity>
          )}

          {showReminderForm && (
            <ReminderForm
              onAdd={handleAddReminder}
              onCancel={() => setShowReminderForm(false)}
              uiColor={theme.uiColor}
              colors={colors}
              textColor={theme.textColor}
            />
          )}

          {plant.reminders.length === 0 && !showReminderForm ? (
            <View style={styles.emptyTab}>
              <Ionicons name="alarm-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTabText, { color: colors.mutedForeground }]}>
                No reminders set
              </Text>
              <Text style={[styles.emptyTabSubText, { color: colors.mutedForeground }]}>
                Add reminders for fertilizing, repotting, and more
              </Text>
            </View>
          ) : (
            plant.reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.reminderLeft}>
                  <View
                    style={[
                      styles.reminderIconBg,
                      { backgroundColor: theme.uiColor + "18" },
                    ]}
                  >
                    <Ionicons name="alarm" size={18} color={theme.uiColor} />
                  </View>
                  <View style={styles.reminderInfo}>
                    <Text style={[styles.reminderTitle, { color: theme.textColor }]}>
                      {reminder.title}
                    </Text>
                    <Text
                      style={[styles.reminderDate, { color: colors.mutedForeground }]}
                    >
                      {new Date(reminder.date).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </View>
                </View>
                <View style={styles.reminderRight}>
                  <View
                    style={[
                      styles.recurrenceBadge,
                      { backgroundColor: theme.uiColor + "18" },
                    ]}
                  >
                    <Text style={[styles.recurrenceBadgeText, { color: theme.uiColor }]}>
                      {reminder.recurrence === "yearly" ? "Yearly" : "Once"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => confirmDeleteReminder(reminder.id)}
                    style={styles.noteActionBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.destructive} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  hero: { height: 230, position: "relative" },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  heroNavRight: { flexDirection: "row", gap: 8 },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: { position: "absolute", bottom: 14, left: 16, right: 16 },
  heroName: { fontSize: 22, fontFamily: "Inter_700Bold" },
  heroSpecies: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  careRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  careCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 5,
  },
  careCardHeader: { flexDirection: "row", alignItems: "center", gap: 5 },
  careLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  progressTrack: { height: 5, borderRadius: 99, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 99 },
  careTime: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  careBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 30,
    borderRadius: 8,
    marginTop: 2,
  },
  careBtnText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 12 },
  tabBar: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  galleryContent: { padding: 14, gap: 2 },
  photoTile: { margin: 1, overflow: "hidden", borderRadius: 4 },
  photoTileImg: { width: "100%", height: "100%" },
  addPhotoTile: {
    margin: 1,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTab: {
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 40,
  },
  emptyTabText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyTabSubText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyTabBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 4,
  },
  emptyTabBtnText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 14 },
  notesContent: { padding: 14, gap: 10 },
  addNoteRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    gap: 8,
    marginBottom: 4,
  },
  noteInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    maxHeight: 100,
    minHeight: 36,
  },
  noteAddBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  noteCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  noteCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  noteTimestamp: { fontSize: 11, fontFamily: "Inter_400Regular" },
  noteActions: { flexDirection: "row", gap: 8 },
  noteActionBtn: { padding: 2 },
  noteText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  editNoteWrapper: { gap: 8 },
  editNoteInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    minHeight: 60,
  },
  editNoteActions: {
    flexDirection: "row",
    gap: 8,
    justifyContent: "flex-end",
  },
  editNoteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editNoteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Reminders
  addReminderBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: "dashed",
    marginBottom: 4,
  },
  addReminderText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  reminderCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  reminderLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  reminderIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  reminderInfo: { flex: 1 },
  reminderTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  reminderDate: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  reminderRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  recurrenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  recurrenceBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
