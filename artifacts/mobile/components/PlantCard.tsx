import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useColorScheme,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useTheme } from "@/context/ThemeContext";
import {
  Plant,
  getProgress,
  getTimeRemaining,
  usePlants,
} from "@/context/PlantContext";
import { useColors } from "@/hooks/useColors";

interface WaterBarProps {
  progress: number;
  color: string;
  trackColor: string;
}

function WaterBar({ progress, color, trackColor }: WaterBarProps) {
  const width = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(progress, { duration: 900 });
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const barColor =
    progress >= 1
      ? "#E53E3E"
      : progress >= 0.75
      ? "#F4A261"
      : color;

  return (
    <View style={[styles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[animStyle, styles.fill, { backgroundColor: barColor }]} />
    </View>
  );
}

interface PlantCardProps {
  plant: Plant;
}

export function PlantCard({ plant }: PlantCardProps) {
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const { waterPlant, mistPlant } = usePlants();
  const colorScheme = useColorScheme();
  const hasWallpaper = !!theme.backgroundImage;

  const waterProgress = getProgress(plant.lastWatered, plant.wateringInterval);
  const mistProgress = getProgress(plant.lastMisted, plant.mistingInterval);
  const waterRemaining = getTimeRemaining(plant.lastWatered, plant.wateringInterval);
  const mistRemaining = getTimeRemaining(plant.lastMisted, plant.mistingInterval);

  // Semi-transparent card when wallpaper is active
  const cardBg = hasWallpaper
    ? colorScheme === "dark"
      ? "rgba(26,46,37,0.82)"
      : "rgba(255,255,255,0.82)"
    : colors.card;

  const scale = useSharedValue(1);
  const animCardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value) }],
  }));

  function handlePress() {
    router.push(`/plant/${plant.id}`);
  }
  function handlePressIn() {
    scale.value = 0.97;
  }
  function handlePressOut() {
    scale.value = 1;
  }

  async function handleWater() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    waterPlant(plant.id);
  }

  async function handleMist() {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    mistPlant(plant.id);
  }

  return (
    <Animated.View style={animCardStyle}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          {
            backgroundColor: cardBg,
            borderColor: hasWallpaper ? "rgba(200,221,211,0.4)" : colors.border,
            shadowColor: colors.foreground,
          },
        ]}
      >
        <View style={styles.row}>
          {/* Photo */}
          <View style={[styles.photoWrapper, { backgroundColor: colors.muted }]}>
            {plant.mainPhoto ? (
              <Image
                source={{ uri: plant.mainPhoto }}
                style={styles.photo}
                contentFit="cover"
              />
            ) : (
              <Ionicons name="leaf" size={28} color={theme.uiColor} />
            )}
          </View>

          {/* Info */}
          <View style={styles.info}>
            <Text style={[styles.name, { color: theme.textColor }]} numberOfLines={1}>
              {plant.name}
            </Text>
            <Text
              style={[styles.species, { color: colors.mutedForeground }]}
              numberOfLines={1}
            >
              {plant.species}
            </Text>

            {/* Watering Progress */}
            <View style={styles.progressRow}>
              <Ionicons
                name="water-outline"
                size={12}
                color={waterProgress >= 1 ? "#E53E3E" : theme.uiColor}
                style={styles.progressIcon}
              />
              <View style={styles.progressLabelRow}>
                <WaterBar
                  progress={waterProgress}
                  color={theme.uiColor}
                  trackColor={hasWallpaper ? "rgba(200,221,211,0.35)" : colors.muted}
                />
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      color:
                        waterProgress >= 1 ? "#E53E3E" : colors.mutedForeground,
                    },
                  ]}
                >
                  {waterRemaining}
                </Text>
              </View>
            </View>

            {/* Misting Progress */}
            <View style={styles.progressRow}>
              <Ionicons
                name="rainy-outline"
                size={12}
                color={mistProgress >= 1 ? "#E53E3E" : theme.uiColor}
                style={styles.progressIcon}
              />
              <View style={styles.progressLabelRow}>
                <WaterBar
                  progress={mistProgress}
                  color={theme.uiColor}
                  trackColor={hasWallpaper ? "rgba(200,221,211,0.35)" : colors.muted}
                />
                <Text
                  style={[
                    styles.timeLabel,
                    {
                      color:
                        mistProgress >= 1 ? "#E53E3E" : colors.mutedForeground,
                    },
                  ]}
                >
                  {mistRemaining}
                </Text>
              </View>
            </View>
          </View>

          {/* Quick actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={handleWater}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: hasWallpaper
                    ? "rgba(45,106,79,0.18)"
                    : theme.uiColor + "18",
                },
              ]}
            >
              <Ionicons name="water" size={18} color={theme.uiColor} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleMist}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: hasWallpaper
                    ? "rgba(45,106,79,0.18)"
                    : theme.uiColor + "18",
                },
              ]}
            >
              <Ionicons name="rainy" size={18} color={theme.uiColor} />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  photoWrapper: {
    width: 62,
    height: 62,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  photo: { width: "100%", height: "100%" },
  info: { flex: 1, gap: 3 },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  species: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  progressRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  progressIcon: { width: 14 },
  progressLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  track: { flex: 1, height: 5, borderRadius: 99, overflow: "hidden" },
  fill: { height: "100%", borderRadius: 99 },
  timeLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    minWidth: 32,
    textAlign: "right",
  },
  actions: { gap: 6, flexShrink: 0 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
});
