import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { getPlantProblemById } from "@/utils/plantEncyclopedia";

function Section({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  const colors = useColors();
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{title}</Text>
      {items.map((t) => (
        <Text key={t} style={[styles.bullet, { color: colors.mutedForeground }]}>
          • {t}
        </Text>
      ))}
    </View>
  );
}

export default function ProblemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const entry = id ? getPlantProblemById(id) : null;

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>Материал не найден</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.uiColor }}>Назад</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 12, borderBottomColor: colors.border, backgroundColor: colors.background },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.uiColor} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textColor }]} numberOfLines={2}>
          {entry.title}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 34 : 24 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Section title="Признаки" items={entry.symptoms} />
        <Section title="Вероятные причины" items={entry.likelyCauses} />
        <Section title="Что можно сделать безопасно" items={entry.safeActions} />
        <Section title="Чего лучше избегать" items={entry.avoidActions} />
        <Section title="Когда стоит усилить меры" items={entry.whenToEscalate} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  backBtn: { padding: 6, marginLeft: -6 },
  title: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold" },
  content: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 8 },
  bullet: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
});
