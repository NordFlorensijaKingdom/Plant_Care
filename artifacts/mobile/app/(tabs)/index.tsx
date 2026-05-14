import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PlantCard } from "@/components/PlantCard";
import { NavigationMenuButton } from "@/components/NavigationMenu";
import { usePlants } from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";

function formatPlantCount(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "растение"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
      ? "растения"
      : "растений";
  return `${count} ${word}`;
}

export default function GardenScreen() {
  const colors = useColors();
  const theme = useTheme();
  const { plants, loading } = usePlants();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const hasWallpaper = !!theme.backgroundImage;

  const headerBg = hasWallpaper
    ? "transparent"
    : colors.background;

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: hasWallpaper ? "transparent" : colors.background },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: topPad + 12,
            borderBottomColor: hasWallpaper ? "transparent" : colors.border,
            backgroundColor: headerBg,
          },
        ]}
      >
        <View>
          <Text style={[styles.title, { color: theme.textColor }]}>
            Мой сад
          </Text>
          {plants.length > 0 && (
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {formatPlantCount(plants.length)}
            </Text>
          )}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={() => router.push("/add")}
            style={[styles.addButton, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <NavigationMenuButton />
        </View>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.center}>
          <Ionicons name="leaf" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Загрузка...
          </Text>
        </View>
      ) : plants.length === 0 ? (
        <View style={styles.center}>
          <View
            style={[styles.emptyIconWrapper, { backgroundColor: colors.muted }]}
          >
            <Ionicons name="leaf-outline" size={48} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
            Пока нет растений
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Добавьте первое растение, чтобы начать учёт
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/add")}
            style={[styles.emptyButton, { backgroundColor: theme.uiColor }]}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Добавить растение</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={plants}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <PlantCard plant={item} />}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : 24 + insets.bottom,
            },
          ]}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!!plants.length}
        />
      )}
    </View>
  );

  if (hasWallpaper) {
    return (
      <ImageBackground
        source={{ uri: theme.backgroundImage! }}
        style={styles.bg}
        resizeMode="cover"
      >
        {content}
      </ImageBackground>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addButton: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingTop: 8 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyIconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  emptyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  emptyButtonText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
});
