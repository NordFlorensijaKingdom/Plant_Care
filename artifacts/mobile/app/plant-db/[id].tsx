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
import { getPlantCatalogById } from "@/utils/plantEncyclopedia";
import { useI18n } from "@/i18n";

function planLabel(id: string, t: (key: string) => string): string {
  if (id === "succulents" || id === "tropical" || id === "flowering") {
    return t(`carePlan.${id}.title`);
  }
  return id;
}

export default function PlantDbDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const theme = useTheme();
  const router = useRouter();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const entry = id ? getPlantCatalogById(id) : null;

  if (!entry) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.mutedForeground }}>{t("plantdb.not_found")}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 12 }}>
          <Text style={{ color: theme.uiColor }}>{t("common.back")}</Text>
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
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.textColor }]} numberOfLines={1}>
            {entry.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
            {entry.latinName}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{t("plantdb.short")}</Text>
          <Text style={[styles.line, { color: colors.mutedForeground }]}>
            {t("plantdb.light")}: {entry.quickTips.light}
          </Text>
          <Text style={[styles.line, { color: colors.mutedForeground }]}>
            {t("plantdb.watering")}: {entry.quickTips.watering}
          </Text>
          <Text style={[styles.line, { color: colors.mutedForeground }]}>
            {t("plantdb.temperature")}: {entry.quickTips.temperature}
          </Text>
          <Text style={[styles.line, { color: colors.mutedForeground }]}>
            {t("plantdb.plan")}: {planLabel(entry.carePlanId, t)}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>{t("plantdb.mistakes")}</Text>
          {entry.quickTips.mistakes.map((m) => (
            <Text key={m} style={[styles.bullet, { color: colors.mutedForeground }]}>
              • {m}
            </Text>
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            router.push({ pathname: "/(tabs)/add", params: { catalogId: entry.id } });
          }}
          style={[styles.cta, { backgroundColor: theme.uiColor }]}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.ctaText}>{t("plantdb.add")}</Text>
        </TouchableOpacity>
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
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  content: { padding: 16, gap: 12 },
  card: { borderWidth: 1, borderRadius: 16, padding: 14 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 8 },
  line: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
  bullet: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6 },
  cta: {
    height: 50,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
  },
  ctaText: { color: "#FFFFFF", fontSize: 15, fontFamily: "Inter_700Bold" },
});
