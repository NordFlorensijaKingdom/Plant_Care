import React, { useMemo, useState } from "react";
import {
  FlatList,
  ImageBackground,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Droplet, Heart, SprayCan } from "lucide-react-native";

import { getIntervalMs, usePlants } from "@/context/PlantContext";
import { useTheme } from "@/context/ThemeContext";
import { useColors } from "@/hooks/useColors";
import { CalendarEvent, computeCalendarEvents } from "@/utils/care";
import { useI18n } from "@/i18n";

type Mode = "day" | "week";

function startOfDayMs(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function startOfWeekMs(ts: number): number {
  const d = new Date(startOfDayMs(ts));
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d.getTime();
}

function dayKey(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function weekdayShort(ts: number, locale: string): string {
  return new Date(ts).toLocaleDateString(locale, { weekday: "short" });
}

function buildDayRow(weekStart: number): number[] {
  const day = 24 * 3600 * 1000;
  return Array.from({ length: 7 }, (_, i) => weekStart + i * day);
}

function formatWeekLabel(weekStart: number, locale: string): string {
  const d = new Date(weekStart);
  const m = d.toLocaleString(locale, { month: "long" });
  return `${m} ${d.getFullYear()}`;
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function eventIcon(event: CalendarEvent, color: string) {
  if (event.type === "water") return <Droplet size={18} color={color} />;
  if (event.type === "mist") return <SprayCan size={18} color={color} />;
  if (event.type === "health") return <Heart size={18} color={color} />;
  return <Bell size={18} color={color} />;
}

export default function CalendarScreen() {
  const colors = useColors();
  const theme = useTheme();
  const { plants, loading } = usePlants();
  const { locale, t } = useI18n();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const hasWallpaper = !!theme.backgroundImage;

  const [mode, setMode] = useState<Mode>("week");
  const [selectedDay, setSelectedDay] = useState(() => startOfDayMs(Date.now()));
  const [query, setQuery] = useState("");

  const weekStart = useMemo(() => startOfWeekMs(selectedDay), [selectedDay]);
  const weekEnd = weekStart + 7 * 24 * 3600 * 1000;
  const days = useMemo(() => buildDayRow(weekStart), [weekStart]);

  const events = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = computeCalendarEvents(
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
        reminders: p.reminders.map((r) => ({
          id: r.id,
          title: r.title,
          date: r.date,
          recurrence: r.recurrence,
        })),
        history: p.history.map((h) => ({
          id: h.id,
          timestamp: h.timestamp,
          type: h.type,
          healthStatus: h.healthStatus,
        })),
      })),
      weekStart,
      weekEnd
    );
    if (!q) return base;
    return base.filter((e) => e.plantName.toLowerCase().includes(q));
  }, [plants, query, weekStart, weekEnd]);

  const sections = useMemo(() => {
    const byDay = new Map<string, CalendarEvent[]>();
    for (const e of events) {
      const k = dayKey(e.timestamp);
      const list = byDay.get(k);
      if (list) list.push(e);
      else byDay.set(k, [e]);
    }
    return days.map((d) => ({
      dayMs: d,
      key: dayKey(d),
      items: byDay.get(dayKey(d)) ?? [],
    }));
  }, [days, events]);

  const dayEvents = useMemo(() => {
    const key = dayKey(selectedDay);
    return events.filter((e) => dayKey(e.timestamp) === key);
  }, [events, selectedDay]);

  const headerBg = hasWallpaper ? "transparent" : colors.background;

  const content = (
    <View style={[styles.container, { backgroundColor: hasWallpaper ? "transparent" : colors.background }]}>
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
          <Text style={[styles.title, { color: theme.textColor }]}>{t("calendar.title")}</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {t("calendar.subtitle", {
              mode: mode === "week" ? t("calendar.mode.week") : t("calendar.mode.day"),
              label: formatWeekLabel(weekStart, locale),
            })}
          </Text>
        </View>
        <View style={styles.modeRow}>
          <TouchableOpacity
            onPress={() => setMode("day")}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === "day" ? theme.uiColor : colors.muted,
                borderColor: mode === "day" ? theme.uiColor : colors.border,
              },
            ]}
          >
            <Text style={[styles.modeText, { color: mode === "day" ? "#FFFFFF" : colors.mutedForeground }]}>
              {t("calendar.mode.day")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("week")}
            style={[
              styles.modeBtn,
              {
                backgroundColor: mode === "week" ? theme.uiColor : colors.muted,
                borderColor: mode === "week" ? theme.uiColor : colors.border,
              },
            ]}
          >
            <Text style={[styles.modeText, { color: mode === "week" ? "#FFFFFF" : colors.mutedForeground }]}>
              {t("calendar.mode.week")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.navRow, { borderBottomColor: colors.border, backgroundColor: hasWallpaper ? "transparent" : colors.background }]}>
        <TouchableOpacity
          onPress={() => setSelectedDay((d) => startOfDayMs(d - 7 * 24 * 3600 * 1000))}
          style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <ChevronLeft size={18} color={colors.mutedForeground} />
        </TouchableOpacity>

        <View style={styles.daysRow}>
          {days.map((d) => {
            const selected = dayKey(d) === dayKey(selectedDay);
            return (
              <TouchableOpacity
                key={d}
                onPress={() => setSelectedDay(d)}
                style={[
                  styles.dayBtn,
                  {
                    backgroundColor: selected ? theme.uiColor + "22" : "transparent",
                    borderColor: selected ? theme.uiColor : colors.border,
                  },
                ]}
              >
                <Text style={[styles.dayWeek, { color: selected ? theme.uiColor : colors.mutedForeground }]}>
                  {weekdayShort(d, locale)}
                </Text>
                <Text style={[styles.dayNum, { color: selected ? theme.uiColor : theme.textColor }]}>
                  {new Date(d).getDate()}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          onPress={() => setSelectedDay((d) => startOfDayMs(d + 7 * 24 * 3600 * 1000))}
          style={[styles.navBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
        >
          <ChevronRight size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchRow, { backgroundColor: hasWallpaper ? "transparent" : colors.background }]}>
        <View style={[styles.searchInputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <CalendarDays size={18} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder={t("calendar.filter_placeholder")}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: theme.textColor }]}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{t("calendar.loading")}</Text>
        </View>
      ) : mode === "day" ? (
        dayEvents.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyTitle, { color: theme.textColor }]}>{t("calendar.empty_title")}</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {t("calendar.empty_body")}
            </Text>
          </View>
        ) : (
          <FlatList
            data={dayEvents}
            keyExtractor={(e) => e.id}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
            ]}
            renderItem={({ item }) => (
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.cardTop}>
                  <View style={[styles.iconBg, { backgroundColor: theme.uiColor + "18" }]}>
                    {eventIcon(item, theme.uiColor)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.cardTitle, { color: theme.textColor }]}>{item.plantName}</Text>
                    <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                      {item.title}
                      {item.source === "history"
                        ? item.details
                          ? ` · ${item.details}`
                          : ""
                        : ` · ${formatTime(item.timestamp)}`}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(s) => s.key}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: Platform.OS === "web" ? 84 + 34 : 80 + insets.bottom },
          ]}
          renderItem={({ item: section }) => (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.textColor }]}>
                {new Date(section.dayMs).toLocaleDateString(locale, {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
              {section.items.length === 0 ? (
                <Text style={[styles.sectionEmpty, { color: colors.mutedForeground }]}>{t("calendar.no_events")}</Text>
              ) : (
                section.items.map((ev) => (
                  <View
                    key={ev.id}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: colors.border,
                        opacity: ev.source === "history" ? 0.85 : 1,
                      },
                    ]}
                  >
                    <View style={styles.cardTop}>
                      <View style={[styles.iconBg, { backgroundColor: theme.uiColor + "18" }]}>
                        {eventIcon(ev, theme.uiColor)}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.textColor }]}>{ev.plantName}</Text>
                        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]}>
                          {ev.title}
                          {ev.source === "history"
                            ? ev.details
                              ? ` · ${ev.details}`
                              : ""
                            : ` · ${formatTime(ev.timestamp)}`}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  if (hasWallpaper) {
    return (
      <ImageBackground source={{ uri: theme.backgroundImage! }} style={styles.bg} resizeMode="cover">
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
  modeRow: { flexDirection: "row", gap: 8 },
  modeBtn: {
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  modeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  navRow: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  daysRow: { flex: 1, flexDirection: "row", justifyContent: "space-between", gap: 6 },
  dayBtn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  dayWeek: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
  dayNum: { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 1 },
  searchRow: { paddingHorizontal: 16, paddingTop: 12 },
  searchInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 13, fontFamily: "Inter_400Regular", marginTop: 6, textAlign: "center" },
  list: { padding: 16, gap: 12 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  sectionEmpty: { fontSize: 12, fontFamily: "Inter_400Regular" },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  cardTop: { flexDirection: "row", gap: 12, alignItems: "center" },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  cardMeta: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
});
