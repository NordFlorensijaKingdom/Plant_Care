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
  HEALTH_STATUS_CONFIG,
  HealthStatus,
  CareHistoryEntry,
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

type DetailTab = "gallery" | "notes" | "reminders" | "history";

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
      Alert.alert("Нет названия", "Введите название напоминания.");
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
      Alert.alert("Неверная дата", "Введите корректные дату и время.");
      return;
    }
    const date = new Date(y, m - 1, d, h, min, 0).getTime();
    if (date <= Date.now()) {
      Alert.alert("Дата в прошлом", "Выберите будущие дату и время.");
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
        Новое напоминание
      </Text>

      <TextInput
        style={inputStyle}
        value={title}
        onChangeText={setTitle}
        placeholder="например, подкормка, пересадка..."
        placeholderTextColor={colors.mutedForeground}
        returnKeyType="next"
      />

      {/* Date row */}
      <View style={formStyles.dateRow}>
        <View style={formStyles.dateField}>
          <Text style={[formStyles.dateLabel, { color: colors.mutedForeground }]}>
            Месяц
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
            День
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
            Год
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
            Час
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
            Мин
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
          Повтор:
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
              {r === "once" ? "Один раз" : "Ежегодно"}
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
            Отмена
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleAdd}
          style={[formStyles.formBtn, { backgroundColor: uiColor }]}
        >
          <Ionicons name="alarm-outline" size={15} color="#FFFFFF" />
          <Text style={[formStyles.formBtnText, { color: "#FFFFFF" }]}>
            Запланировать
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HealthLogForm({
  onAdd,
  onCancel,
  uiColor,
  colors,
  textColor,
}: {
  onAdd: (status: HealthStatus, comment?: string) => void;
  onCancel: () => void;
  uiColor: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  textColor: string;
}) {
  const [status, setStatus] = useState<HealthStatus>("good");
  const [comment, setComment] = useState("");

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
        Проверка здоровья
      </Text>

      <View style={formStyles.statusRow}>
        {(["excellent", "good", "needs_attention", "sick"] as HealthStatus[]).map(
          (s) => {
            const config = HEALTH_STATUS_CONFIG[s];
            const selected = s === status;
            const Icon = config.Icon;
            return (
              <TouchableOpacity
                key={s}
                onPress={() => setStatus(s)}
                style={[
                  formStyles.statusChip,
                  {
                    borderColor: selected ? uiColor : colors.border,
                    backgroundColor: selected ? uiColor + "18" : colors.background,
                  },
                ]}
              >
                <Icon size={14} color={selected ? uiColor : config.color} />
                <Text
                  style={[
                    formStyles.statusChipText,
                    { color: selected ? uiColor : textColor },
                  ]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </TouchableOpacity>
            );
          }
        )}
      </View>

      <TextInput
        style={[inputStyle, formStyles.healthComment]}
        value={comment}
        onChangeText={setComment}
        placeholder="Комментарий (необязательно)"
        placeholderTextColor={colors.mutedForeground}
        multiline
      />

      <View style={formStyles.formActions}>
        <TouchableOpacity
          onPress={onCancel}
          style={[formStyles.formBtn, { backgroundColor: colors.muted }]}
        >
          <Text style={[formStyles.formBtnText, { color: colors.mutedForeground }]}>
            Отмена
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onAdd(status, comment)}
          style={[formStyles.formBtn, { backgroundColor: uiColor }]}
        >
          <Ionicons name="checkmark" size={15} color="#FFFFFF" />
          <Text style={[formStyles.formBtnText, { color: "#FFFFFF" }]}>
            Сохранить
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
  statusRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 34,
  },
  statusChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  healthComment: { height: 92, paddingTop: 10, textAlignVertical: "top" as any },
});

// ---- Main Screen ----

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    plants,
    waterPlant,
    mistPlant,
    addHealthLog,
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
  const [showHealthForm, setShowHealthForm] = useState(false);

  if (!plant) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Растение не найдено.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: theme.uiColor, marginTop: 12 }}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const plantId = plant.id;
  const plantName = plant.name;

  const waterProgress = getProgress(plant.lastWatered, plant.wateringInterval);
  const mistProgress = getProgress(plant.lastMisted, plant.mistingInterval);
  const waterRemaining = getTimeRemaining(plant.lastWatered, plant.wateringInterval);
  const mistRemaining = getTimeRemaining(plant.lastMisted, plant.mistingInterval);

  const progressBarColor = (p: number) =>
    p >= 1 ? "#E53E3E" : p >= 0.75 ? "#F4A261" : theme.uiColor;

  const effectiveCard = theme.cardColor ?? colors.card;
  const effectiveSecondary = theme.secondaryTextColor ?? colors.mutedForeground;

  async function handleWater() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    waterPlant(plantId);
  }

  async function handleMist() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mistPlant(plantId);
  }

  async function handleAddHealthLog(status: HealthStatus, comment?: string) {
    addHealthLog(plantId, status, comment);
    setShowHealthForm(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleAddPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Нужно разрешение", "Разрешите доступ к фото.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      addPhoto(plantId, result.assets[0].uri);
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }

  function handleAddNote() {
    if (!newNoteText.trim()) return;
    addNote(plantId, newNoteText.trim());
    setNewNoteText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function saveEditNote() {
    if (!editingNoteId || !editingNoteText.trim()) return;
    updateNote(plantId, editingNoteId, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function confirmDeleteNote(noteId: string) {
    Alert.alert("Удалить заметку", "Удалить эту заметку?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => deleteNote(plantId, noteId) },
    ]);
  }

  function confirmDeletePhoto(index: number) {
    Alert.alert("Удалить фото", "Удалить это фото?", [
      { text: "Отмена", style: "cancel" },
      { text: "Удалить", style: "destructive", onPress: () => deletePhoto(plantId, index) },
    ]);
  }

  function handleDeletePlant() {
    Alert.alert(
      "Удалить растение",
      `Удалить ${plantName} из вашего сада? Это действие нельзя отменить.`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: () => {
            deletePlant(plantId);
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
    await addReminder(plantId, { title, date, recurrence });
    setShowReminderForm(false);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  function confirmDeleteReminder(reminderId: string) {
    Alert.alert("Удалить напоминание", "Удалить это напоминание?", [
      { text: "Отмена", style: "cancel" },
      {
        text: "Удалить",
        style: "destructive",
        onPress: () => {
          deleteReminder(plantId, reminderId);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        },
      },
    ]);
  }

  const tabs: { key: DetailTab; label: string; icon: string }[] = [
    { key: "gallery", label: "Фото", icon: "images-outline" },
    { key: "notes", label: "Заметки", icon: "document-text-outline" },
    { key: "reminders", label: "Напоминания", icon: "alarm-outline" },
    { key: "history", label: "История", icon: "time-outline" },
  ];

  const sortedLogs: CareHistoryEntry[] = [...(plant.history ?? [])].sort(
    (a, b) => b.timestamp - a.timestamp
  );

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
                  : effectiveSecondary,
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

      {plant.catalogId ? (
        <TouchableOpacity
          onPress={() => router.push(`/plant-db/${plant.catalogId}`)}
          style={[
            styles.catalogLink,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Ionicons name="book-outline" size={16} color={theme.uiColor} />
          <Text style={[styles.catalogLinkText, { color: theme.textColor }]}>
            Открыть рекомендации из базы
          </Text>
          <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      ) : null}

      {/* Care cards */}
      {(plant.wateringEnabled || plant.mistingEnabled) && (
        <View style={styles.careRow}>
          {plant.wateringEnabled && (
            <View
              style={[
                styles.careCard,
                { backgroundColor: effectiveCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.careCardHeader}>
                <Ionicons
                  name="water"
                  size={15}
                  color={progressBarColor(waterProgress)}
                />
                <Text style={[styles.careLabel, { color: effectiveSecondary }]}>
                  Полив
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
                <Text style={styles.careBtnText}>Полить</Text>
              </TouchableOpacity>
            </View>
          )}

          {plant.mistingEnabled && (
            <View
              style={[
                styles.careCard,
                { backgroundColor: effectiveCard, borderColor: colors.border },
              ]}
            >
              <View style={styles.careCardHeader}>
                <Ionicons
                  name="rainy"
                  size={15}
                  color={progressBarColor(mistProgress)}
                />
                <Text style={[styles.careLabel, { color: effectiveSecondary }]}>
                  Опрыскивание
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
                <Text style={styles.careBtnText}>Опрыскать</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={[styles.tabBar, { borderColor: colors.border, backgroundColor: effectiveCard }]}>
        {tabs.map((tab) => {
          const count =
            tab.key === "notes"
              ? plant.notes.length
              : tab.key === "reminders"
              ? plant.reminders.length
              : tab.key === "gallery"
              ? plant.photoAlbum.length
              : tab.key === "history"
              ? plant.history.length
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
                numberOfLines={1}
                ellipsizeMode="tail"
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
                Фото пока нет
              </Text>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[styles.emptyTabBtn, { backgroundColor: theme.uiColor }]}
              >
                <Ionicons name="add" size={16} color="#FFFFFF" />
                <Text style={styles.emptyTabBtnText}>Добавить фото</Text>
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
              { backgroundColor: effectiveCard, borderColor: colors.border },
            ]}
          >
            <TextInput
              style={[styles.noteInput, { color: theme.textColor }]}
              placeholder="Напишите заметку..."
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
                Заметок пока нет
              </Text>
            </View>
          ) : (
            [...plant.notes].reverse().map((note) => (
              <View
                key={note.id}
                style={[
                  styles.noteCard,
                  { backgroundColor: effectiveCard, borderColor: colors.border },
                ]}
              >
                <View style={styles.noteCardHeader}>
                  <Text style={[styles.noteTimestamp, { color: effectiveSecondary }]}>
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
                          Отмена
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveEditNote}
                        style={[styles.editNoteBtn, { backgroundColor: theme.uiColor }]}
                      >
                        <Text style={[styles.editNoteBtnText, { color: "#FFFFFF" }]}>
                          Сохранить
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
      ) : activeTab === "history" ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.notesContent,
            { paddingBottom: Platform.OS === "web" ? 34 : insets.bottom + 16 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {!showHealthForm && (
            <TouchableOpacity
              onPress={() => setShowHealthForm(true)}
              style={[styles.addReminderBtn, { borderColor: theme.uiColor }]}
            >
              <Ionicons name="heart-outline" size={18} color={theme.uiColor} />
              <Text style={[styles.addReminderText, { color: theme.uiColor }]}>
                Добавить проверку здоровья
              </Text>
            </TouchableOpacity>
          )}

          {showHealthForm && (
            <HealthLogForm
              onAdd={handleAddHealthLog}
              onCancel={() => setShowHealthForm(false)}
              uiColor={theme.uiColor}
              colors={colors}
              textColor={theme.textColor}
            />
          )}

          {sortedLogs.length === 0 && !showHealthForm ? (
            <View style={styles.emptyTab}>
              <Ionicons name="time-outline" size={40} color={colors.mutedForeground} />
              <Text style={[styles.emptyTabText, { color: colors.mutedForeground }]}>
                Записей пока нет
              </Text>
              <Text style={[styles.emptyTabSubText, { color: colors.mutedForeground }]}>
                Здесь будет история поливов, опрыскиваний и проверок здоровья
              </Text>
            </View>
          ) : (
            sortedLogs.map((log) => {
              const isHealth = log.type === "health";
              const healthStatus = log.healthStatus ?? "good";
              const isBad =
                isHealth &&
                (healthStatus === "needs_attention" || healthStatus === "sick");
              const accent =
                healthStatus === "sick" ? colors.destructive : colors.warning;
              const HealthIcon = HEALTH_STATUS_CONFIG[healthStatus]?.Icon;
              const title =
                log.type === "water"
                  ? "Полив"
                  : log.type === "mist"
                  ? "Опрыскивание"
                  : "Проверка здоровья";

              return (
                <View
                  key={log.id}
                  style={[
                    styles.historyCard,
                    {
                      backgroundColor: effectiveCard,
                      borderColor: isBad ? accent : colors.border,
                    },
                  ]}
                >
                  <View style={styles.historyLeft}>
                    <View
                      style={[
                        styles.historyIconBg,
                        {
                          backgroundColor: (isBad ? accent : theme.uiColor) + "18",
                        },
                      ]}
                    >
                      {log.type === "water" ? (
                        <Ionicons
                          name="water"
                          size={18}
                          color={isBad ? accent : theme.uiColor}
                        />
                      ) : log.type === "mist" ? (
                        <Ionicons
                          name="rainy"
                          size={18}
                          color={isBad ? accent : theme.uiColor}
                        />
                      ) : HealthIcon ? (
                        <HealthIcon
                          size={18}
                          color={isBad ? accent : theme.uiColor}
                        />
                      ) : null}
                    </View>
                    <View style={styles.historyInfo}>
                      <View style={styles.historyTitleRow}>
                        <Text style={[styles.historyTitle, { color: theme.textColor }]}>
                          {title}
                        </Text>
                        {isHealth && <HealthBadge status={healthStatus} />}
                      </View>
                      <Text style={[styles.historyDate, { color: effectiveSecondary }]}>
                        {new Date(log.timestamp).toLocaleString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      {!!log.comment && (
                        <Text
                          style={[styles.historyComment, { color: effectiveSecondary }]}
                        >
                          {log.comment}
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              );
            })
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
                Добавить напоминание
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
                Напоминаний пока нет
              </Text>
              <Text style={[styles.emptyTabSubText, { color: colors.mutedForeground }]}>
                Добавляйте напоминания о подкормке, пересадке и других делах
              </Text>
            </View>
          ) : (
            plant.reminders.map((reminder) => (
              <View
                key={reminder.id}
                style={[
                  styles.reminderCard,
                  { backgroundColor: effectiveCard, borderColor: colors.border },
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
                      style={[styles.reminderDate, { color: effectiveSecondary }]}
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
                      {reminder.recurrence === "yearly" ? "Ежегодно" : "Один раз"}
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
  catalogLink: {
    marginTop: 12,
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catalogLinkText: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
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
    paddingHorizontal: 6,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flexShrink: 1, minWidth: 0 },
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
  historyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  historyLeft: { flexDirection: "row", gap: 10 },
  historyIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  historyInfo: { flex: 1, gap: 3 },
  historyTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  historyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  historyDate: { fontSize: 12, fontFamily: "Inter_400Regular" },
  historyComment: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
});
