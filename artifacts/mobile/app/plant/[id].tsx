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
  getProgress,
  getTimeRemaining,
  usePlants,
} from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const PHOTO_SIZE = (SCREEN_WIDTH - 48) / 3;

type Tab = "gallery" | "notes";

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { plants, waterPlant, mistPlant, addNote, updateNote, deleteNote, addPhoto, deletePhoto, deletePlant } =
    usePlants();
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const plant = plants.find((p) => p.id === id);

  const [activeTab, setActiveTab] = useState<Tab>("gallery");
  const [newNoteText, setNewNoteText] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  if (!plant) {
    return (
      <View
        style={[styles.center, { backgroundColor: colors.background }]}
      >
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
      allowsMultipleSelection: false,
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

  function startEditNote(noteId: string, text: string) {
    setEditingNoteId(noteId);
    setEditingNoteText(text);
  }

  function saveEditNote() {
    if (!editingNoteId) return;
    updateNote(plant.id, editingNoteId, editingNoteText.trim());
    setEditingNoteId(null);
    setEditingNoteText("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  function confirmDeleteNote(noteId: string) {
    Alert.alert("Delete Note", "Remove this note?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deleteNote(plant.id, noteId),
      },
    ]);
  }

  function confirmDeletePhoto(index: number) {
    Alert.alert("Delete Photo", "Remove this photo?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => deletePhoto(plant.id, index),
      },
    ]);
  }

  function handleDeletePlant() {
    Alert.alert(
      "Delete Plant",
      `Remove ${plant.name} from your collection? This cannot be undone.`,
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

  const progressBarColor = (progress: number) =>
    progress >= 1 ? "#E53E3E" : progress >= 0.75 ? "#F4A261" : theme.uiColor;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header / Hero */}
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
          <View
            style={[
              styles.heroPlaceholder,
              { backgroundColor: colors.muted },
            ]}
          >
            <Ionicons name="leaf" size={64} color={theme.uiColor} />
          </View>
        )}

        {/* Overlay overlay */}
        <View
          style={[
            styles.heroOverlay,
            {
              backgroundColor: plant.mainPhoto
                ? "rgba(0,0,0,0.4)"
                : "transparent",
            },
          ]}
        />

        {/* Nav */}
        <View
          style={[
            styles.heroNav,
            { paddingTop: topPad + 8 },
          ]}
        >
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
              size={20}
              color={plant.mainPhoto ? "#FFFFFF" : colors.destructive}
            />
          </TouchableOpacity>
        </View>

        {/* Name overlay */}
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
        </View>
      </View>

      {/* Care Cards */}
      <View style={styles.careRow}>
        {/* Watering Card */}
        <View
          style={[
            styles.careCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.careCardHeader}>
            <Ionicons
              name="water"
              size={16}
              color={progressBarColor(waterProgress)}
            />
            <Text
              style={[styles.careLabel, { color: colors.mutedForeground }]}
            >
              Watering
            </Text>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.muted }]}
          >
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
          <Text
            style={[
              styles.careTime,
              { color: progressBarColor(waterProgress) },
            ]}
          >
            {waterRemaining}
          </Text>
          <TouchableOpacity
            onPress={handleWater}
            style={[styles.careBtn, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="water" size={14} color="#FFFFFF" />
            <Text style={styles.careBtnText}>Water</Text>
          </TouchableOpacity>
        </View>

        {/* Misting Card */}
        <View
          style={[
            styles.careCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.careCardHeader}>
            <Ionicons
              name="rainy"
              size={16}
              color={progressBarColor(mistProgress)}
            />
            <Text
              style={[styles.careLabel, { color: colors.mutedForeground }]}
            >
              Misting
            </Text>
          </View>
          <View
            style={[styles.progressTrack, { backgroundColor: colors.muted }]}
          >
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
          <Text
            style={[
              styles.careTime,
              { color: progressBarColor(mistProgress) },
            ]}
          >
            {mistRemaining}
          </Text>
          <TouchableOpacity
            onPress={handleMist}
            style={[styles.careBtn, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="rainy" size={14} color="#FFFFFF" />
            <Text style={styles.careBtnText}>Mist</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View
        style={[
          styles.tabBar,
          { borderColor: colors.border, backgroundColor: colors.card },
        ]}
      >
        {(["gallery", "notes"] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[
              styles.tabItem,
              activeTab === tab && {
                borderBottomColor: theme.uiColor,
                borderBottomWidth: 2,
              },
            ]}
          >
            <Ionicons
              name={tab === "gallery" ? "images-outline" : "document-text-outline"}
              size={18}
              color={activeTab === tab ? theme.uiColor : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab ? theme.uiColor : colors.mutedForeground,
                },
              ]}
            >
              {tab === "gallery" ? "Gallery" : "Notes"}
              {tab === "notes" && plant.notes.length > 0
                ? ` (${plant.notes.length})`
                : ""}
              {tab === "gallery" && plant.photoAlbum.length > 0
                ? ` (${plant.photoAlbum.length})`
                : ""}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      {activeTab === "gallery" ? (
        <FlatList
          data={plant.photoAlbum}
          keyExtractor={(_, i) => i.toString()}
          numColumns={3}
          scrollEnabled={plant.photoAlbum.length > 0}
          contentContainerStyle={[
            styles.galleryContent,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 16,
            },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyTab}>
              <Ionicons
                name="images-outline"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[styles.emptyTabText, { color: colors.mutedForeground }]}
              >
                No photos yet
              </Text>
              <TouchableOpacity
                onPress={handleAddPhoto}
                style={[
                  styles.emptyTabBtn,
                  { backgroundColor: theme.uiColor },
                ]}
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
                  {
                    backgroundColor: colors.muted,
                    width: PHOTO_SIZE,
                    height: PHOTO_SIZE,
                  },
                ]}
              >
                <Ionicons name="add" size={28} color={theme.uiColor} />
              </TouchableOpacity>
            ) : null
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              onLongPress={() => confirmDeletePhoto(index)}
              style={[
                styles.photoTile,
                { width: PHOTO_SIZE, height: PHOTO_SIZE },
              ]}
            >
              <Image
                source={{ uri: item }}
                style={styles.photoTileImg}
                contentFit="cover"
              />
            </TouchableOpacity>
          )}
        />
      ) : (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[
            styles.notesContent,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : insets.bottom + 16,
            },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Add note input */}
          <View
            style={[
              styles.addNoteRow,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                styles.noteInput,
                { color: theme.textColor },
              ]}
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
                {
                  backgroundColor: newNoteText.trim()
                    ? theme.uiColor
                    : colors.muted,
                },
              ]}
            >
              <Ionicons
                name="send"
                size={16}
                color={newNoteText.trim() ? "#FFFFFF" : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>

          {/* Notes list */}
          {plant.notes.length === 0 ? (
            <View style={styles.emptyTab}>
              <Ionicons
                name="document-text-outline"
                size={40}
                color={colors.mutedForeground}
              />
              <Text
                style={[
                  styles.emptyTabText,
                  { color: colors.mutedForeground },
                ]}
              >
                No notes yet
              </Text>
            </View>
          ) : (
            [...plant.notes].reverse().map((note) => (
              <View
                key={note.id}
                style={[
                  styles.noteCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.noteCardHeader}>
                  <Text
                    style={[
                      styles.noteTimestamp,
                      { color: colors.mutedForeground },
                    ]}
                  >
                    {new Date(note.timestamp).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                  <View style={styles.noteActions}>
                    <TouchableOpacity
                      onPress={() => startEditNote(note.id, note.text)}
                      style={styles.noteActionBtn}
                    >
                      <Ionicons
                        name="pencil-outline"
                        size={15}
                        color={theme.uiColor}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDeleteNote(note.id)}
                      style={styles.noteActionBtn}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={15}
                        color={colors.destructive}
                      />
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
                        style={[
                          styles.editNoteBtn,
                          { backgroundColor: colors.muted },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editNoteBtnText,
                            { color: colors.mutedForeground },
                          ]}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={saveEditNote}
                        style={[
                          styles.editNoteBtn,
                          { backgroundColor: theme.uiColor },
                        ]}
                      >
                        <Text
                          style={[
                            styles.editNoteBtnText,
                            { color: "#FFFFFF" },
                          ]}
                        >
                          Save
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Text
                    style={[styles.noteText, { color: theme.textColor }]}
                  >
                    {note.text}
                  </Text>
                )}
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
  hero: {
    height: 240,
    position: "relative",
  },
  heroImage: { width: "100%", height: "100%", position: "absolute" },
  heroPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  heroNav: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  navBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  heroInfo: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
  },
  heroName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  heroSpecies: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  careRow: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  careCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 6,
  },
  careCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  careLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  progressTrack: {
    height: 5,
    borderRadius: 99,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 99,
  },
  careTime: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  careBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    height: 32,
    borderRadius: 8,
    marginTop: 2,
  },
  careBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
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
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
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
  emptyTabText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
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
  emptyTabBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
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
  noteCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
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
  editNoteActions: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  editNoteBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  editNoteBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
