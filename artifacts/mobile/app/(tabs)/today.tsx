import * as Haptics from "expo-haptics";
import React, { useMemo } from "react";
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
import { Bell, Check, Clock, Droplet, SprayCan } from "lucide-react-native";

import { NavigationMenuButton } from "@/components/NavigationMenu";
import { usePlants, getIntervalMs } from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { computeDueCareTasks } from "@/utils/care";

type TaskItem = ReturnType<typeof computeDueCareTasks>[number];

function formatOverdue(ms: number): string {
  if (ms <= 0) return "Сейчас";
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `Просрочено на ${days}д`;
  if (hours > 0) return `Просрочено на ${hours}ч`;
  return `Просрочено на ${mins}м`;
}

export default function TodayScreen() {
  const colors = useColors();
  const theme = useTheme();
  const { plants, loading, waterPlant, mistPlant, snoozeCare } = usePlants();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const hasWallpaper = !!theme.backgroundImage;

  const tasks = useMemo(() => {
    const now = Date.now();
    return computeDueCareTasks(
      plants.map((p) => ({
        id: p.id,
        name: p.name,
        wateringEnabled: p.wateringEnabled,
        mistingEnabled: p.mistingEnabled,
        lastWatered: p.lastWatered,
        lastMisted: p.lastMisted,
        wateringIntervalMs: getIntervalMs(p.wateringInterval),
        mistingIntervalMs: getIntervalMs(p.mistingInterval),
        snooze: p.snooze,
      })),
      now
    );
  }, [plants]);

  async function handleDone(task: TaskItem) {
    if (task.type === "water") waterPlant(task.plantId);
    else mistPlant(task.plantId);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }

  async function handleSnooze(task: TaskItem) {
    snoozeCare(task.plantId, task.type, 3600 * 1000);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }

  const headerBg = hasWallpaper ? "transparent" : colors.background;

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: hasWallpaper ? "transparent" : colors.background },
      ]}
    >
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textColor }]}>Сегодня</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {tasks.length} задач(и) по уходу
          </Text>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <View
            style={[
              styles.headerBadge,
              { backgroundColor: theme.uiColor + "18", borderColor: theme.uiColor + "33" },
            ]}
          >
            <Bell size={16} color={theme.uiColor} />
            <Text style={[styles.headerBadgeText, { color: theme.uiColor }]}>
              К уходу
            </Text>
          </View>
          <NavigationMenuButton />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Clock size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Загрузка...
          </Text>
        </View>
      ) : tasks.length === 0 ? (
        <View style={styles.center}>
          <Check size={42} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: theme.textColor }]}>
            Всё сделано
          </Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            На сегодня задач по уходу нет
          </Text>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(t) => `${t.plantId}-${t.type}`}
          contentContainerStyle={[
            styles.list,
            {
              paddingBottom:
                Platform.OS === "web" ? 34 : 24 + insets.bottom,
            },
          ]}
          renderItem={({ item }) => (
            <View
              style={[
                styles.taskCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.taskTop}>
                <View
                  style={[
                    styles.taskIconBg,
                    { backgroundColor: theme.uiColor + "18" },
                  ]}
                >
                  {item.type === "water" ? (
                    <Droplet size={18} color={theme.uiColor} />
                  ) : (
                    <SprayCan size={18} color={theme.uiColor} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.taskPlant, { color: theme.textColor }]}>
                    {item.plantName}
                  </Text>
                  <Text style={[styles.taskMeta, { color: colors.mutedForeground }]}>
                    {item.type === "water" ? "Полив" : "Опрыскивание"} ·{" "}
                    {formatOverdue(item.overdueMs)}
                  </Text>
                </View>
              </View>

              <View style={styles.taskActions}>
                <TouchableOpacity
                  onPress={() => handleSnooze(item)}
                  style={[
                    styles.btn,
                    { backgroundColor: colors.muted, borderColor: colors.border },
                  ]}
                >
                  <Clock size={16} color={colors.mutedForeground} />
                  <Text style={[styles.btnText, { color: colors.mutedForeground }]}>
                    +1 час
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDone(item)}
                  style={[
                    styles.btn,
                    { backgroundColor: theme.uiColor, borderColor: theme.uiColor },
                  ]}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={[styles.btnText, { color: "#FFFFFF" }]}>
                    Выполнено
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
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
    gap: 12,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  headerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 34,
    borderRadius: 12,
    borderWidth: 1,
  },
  headerBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 12 },
  taskCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  taskTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  taskIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  taskPlant: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  taskMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  taskActions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
