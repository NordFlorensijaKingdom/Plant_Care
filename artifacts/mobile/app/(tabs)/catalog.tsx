import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { CareDifficulty, LightLevel } from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  filterPlantCatalog,
  filterProblems,
  getPlantCatalog,
  type PlantCatalogEntry,
  type PlantProblemEntry,
} from "@/utils/plantEncyclopedia";
import { CARE_PLAN_TEMPLATES } from "@/utils/carePlans";

type Mode = "plants" | "problems";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.uiColor + "18" : colors.muted,
          borderColor: selected ? theme.uiColor : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: selected ? theme.uiColor : colors.mutedForeground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function Segmented({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  const colors = useColors();
  const theme = useTheme();
  return (
    <View style={[styles.segmented, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      {([
        { id: "plants", label: "Каталог" },
        { id: "problems", label: "Проблемы" },
      ] as const).map((m) => {
        const selected = mode === m.id;
        return (
          <Pressable
            key={m.id}
            onPress={() => onChange(m.id)}
            style={[
              styles.segmentBtn,
              selected && { backgroundColor: theme.uiColor + "22", borderColor: theme.uiColor },
              !selected && { borderColor: "transparent" },
            ]}
          >
            <Text style={[styles.segmentText, { color: selected ? theme.uiColor : colors.mutedForeground }]}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function lightLabel(l: LightLevel): string {
  if (l === "low") return "Низкий свет";
  if (l === "bright") return "Яркий свет";
  return "Средний свет";
}

function difficultyLabel(d: CareDifficulty): string {
  if (d === "easy") return "Лёгкий уход";
  if (d === "hard") return "Сложный уход";
  return "Средний уход";
}

function planLabel(id: string): string {
  return CARE_PLAN_TEMPLATES.find((t) => t.id === id)?.title ?? id;
}

function PlantRow({ item }: { item: PlantCatalogEntry }) {
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/plant-db/${item.id}`)}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {item.latinName}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>

      <View style={styles.tagRow}>
        <Text style={[styles.tag, { color: colors.mutedForeground }]}>{lightLabel(item.lightLevel)}</Text>
        <Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text>
        <Text style={[styles.tag, { color: colors.mutedForeground }]}>{planLabel(item.carePlanId)}</Text>
        <Text style={[styles.dot, { color: colors.mutedForeground }]}>•</Text>
        <Text style={[styles.tag, { color: colors.mutedForeground }]}>{difficultyLabel(item.difficulty)}</Text>
      </View>

      <Text style={[styles.quickLine, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.quickTips.watering}
      </Text>
    </Pressable>
  );
}

function ProblemRow({ item }: { item: PlantProblemEntry }) {
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push(`/problems/${item.id}`)}
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.cardTitle, { color: theme.textColor }]} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]} numberOfLines={2}>
            {item.symptoms[0] ?? ""}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
      </View>
    </Pressable>
  );
}

export default function CatalogScreen() {
  const colors = useColors();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [mode, setMode] = useState<Mode>("plants");
  const [query, setQuery] = useState("");
  const [light, setLight] = useState<LightLevel | null>(null);
  const [plan, setPlan] = useState<string | null>(null);
  const [diff, setDiff] = useState<CareDifficulty | null>(null);

  const plants = useMemo(() => {
    return filterPlantCatalog(query, {
      lightLevels: light ? [light] : undefined,
      carePlanIds: plan ? [plan] : undefined,
      difficulties: diff ? [diff] : undefined,
    });
  }, [query, light, plan, diff]);

  const problems = useMemo(() => filterProblems(query), [query]);

  const total = mode === "plants" ? getPlantCatalog().length : problems.length;
  const shown = mode === "plants" ? plants.length : problems.length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <Text style={[styles.title, { color: theme.textColor }]}>База растений</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          {shown} из {total}
        </Text>

        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={mode === "plants" ? "Поиск по названию..." : "Поиск по проблемам..."}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: theme.textColor }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery("")} style={styles.clearBtn}>
              <Ionicons name="close-circle" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : null}
        </View>

        <Segmented mode={mode} onChange={setMode} />

        {mode === "plants" ? (
          <View style={styles.filters}>
            <View style={styles.filterRow}>
              <Chip
                label="Низкий"
                selected={light === "low"}
                onPress={() => setLight(light === "low" ? null : "low")}
              />
              <Chip
                label="Средний"
                selected={light === "medium"}
                onPress={() => setLight(light === "medium" ? null : "medium")}
              />
              <Chip
                label="Яркий"
                selected={light === "bright"}
                onPress={() => setLight(light === "bright" ? null : "bright")}
              />
            </View>
            <View style={styles.filterRow}>
              {CARE_PLAN_TEMPLATES.map((t) => (
                <Chip
                  key={t.id}
                  label={t.title}
                  selected={plan === t.id}
                  onPress={() => setPlan(plan === t.id ? null : t.id)}
                />
              ))}
              <Chip
                label="Лёгкий"
                selected={diff === "easy"}
                onPress={() => setDiff(diff === "easy" ? null : "easy")}
              />
              <Chip
                label="Сложный"
                selected={diff === "hard"}
                onPress={() => setDiff(diff === "hard" ? null : "hard")}
              />
            </View>
          </View>
        ) : null}
      </View>

      {mode === "plants" ? (
        <FlatList
          data={plants}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <PlantRow item={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={problems}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => <ProblemRow item={item} />}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 26, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 2 },
  searchWrap: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  clearBtn: { padding: 4 },
  segmented: {
    marginTop: 12,
    borderWidth: 1,
    borderRadius: 14,
    flexDirection: "row",
    overflow: "hidden",
  },
  segmentBtn: {
    flex: 1,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  segmentText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  filters: { marginTop: 12, gap: 10 },
  filterRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  list: { padding: 16, gap: 12 },
  card: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  cardSubtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", marginTop: 8 },
  tag: { fontSize: 12, fontFamily: "Inter_500Medium" },
  dot: { marginHorizontal: 6, fontSize: 12, fontFamily: "Inter_500Medium" },
  quickLine: { marginTop: 8, fontSize: 12, fontFamily: "Inter_400Regular" },
});

