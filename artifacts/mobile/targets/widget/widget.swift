import SwiftUI
import WidgetKit

private let appGroup = "group.com.user.plantcare.widget"
private let dataKey = "plantWidgetData"

struct PlantWidgetData: Codable {
    let id: String
    let name: String
    let species: String
    let healthLabel: String
    let healthColor: String
    let wateringEnabled: Bool
    let waterProgress: Double
    let waterRemaining: String
    let mistingEnabled: Bool
    let mistProgress: Double
    let mistRemaining: String
}

struct PlantEntry: TimelineEntry {
    let date: Date
    let data: PlantWidgetData?
}

struct Provider: TimelineProvider {
    func placeholder(in context: Context) -> PlantEntry {
        PlantEntry(date: Date(), data: nil)
    }

    func getSnapshot(in context: Context, completion: @escaping (PlantEntry) -> Void) {
        completion(PlantEntry(date: Date(), data: loadData()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<PlantEntry>) -> Void) {
        let entry = PlantEntry(date: Date(), data: loadData())
        let next = Calendar.current.date(byAdding: .minute, value: 15, to: Date()) ?? Date().addingTimeInterval(900)
        completion(Timeline(entries: [entry], policy: .after(next)))
    }
}

private func loadData() -> PlantWidgetData? {
    let defaults = UserDefaults(suiteName: appGroup)
    let raw = defaults?.string(forKey: dataKey) ?? ""
    if raw.isEmpty { return nil }
    guard let data = raw.data(using: .utf8) else { return nil }
    return try? JSONDecoder().decode(PlantWidgetData.self, from: data)
}

private func colorFromHex(_ hex: String) -> Color {
    var h = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if h.hasPrefix("#") { h.removeFirst() }
    if h.count == 6 { h.append("FF") }
    guard h.count == 8, let v = UInt64(h, radix: 16) else { return Color.green }
    let r = Double((v & 0xFF000000) >> 24) / 255.0
    let g = Double((v & 0x00FF0000) >> 16) / 255.0
    let b = Double((v & 0x0000FF00) >> 8) / 255.0
    let a = Double(v & 0x000000FF) / 255.0
    return Color(.sRGB, red: r, green: g, blue: b, opacity: a)
}

private struct ProgressRow: View {
    let systemName: String
    let progress: Double
    let remaining: String
    let accent: Color

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: systemName)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(progress >= 1 ? Color.red : accent)
                .frame(width: 18)
            GeometryReader { geo in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.black.opacity(0.08))
                    Capsule().fill(fillColor).frame(width: geo.size.width * CGFloat(min(max(progress, 0), 1)))
                }
            }
            .frame(height: 7)
            Text(remaining)
                .font(.system(size: 12, weight: .semibold))
                .foregroundColor(Color.black.opacity(0.55))
                .frame(width: 56, alignment: .trailing)
        }
    }

    private var fillColor: Color {
        if progress >= 1 { return Color.red }
        if progress >= 0.75 { return Color.orange }
        return accent
    }
}

private struct PlantCardView: View {
    let entry: PlantEntry

    var body: some View {
        if let data = entry.data {
            content(data)
        } else {
            empty
        }
    }

    private func content(_ data: PlantWidgetData) -> some View {
        let accent = colorFromHex(data.healthColor)

        return VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top, spacing: 12) {
                ZStack {
                    Circle().fill(accent.opacity(0.14))
                    Image(systemName: "leaf.fill")
                        .font(.system(size: 22, weight: .semibold))
                        .foregroundColor(accent)
                }
                .frame(width: 44, height: 44)

                VStack(alignment: .leading, spacing: 4) {
                    Text(data.name)
                        .font(.system(size: 18, weight: .bold))
                        .foregroundColor(Color.black.opacity(0.9))
                        .lineLimit(1)
                    Text(data.species)
                        .font(.system(size: 13, weight: .regular))
                        .foregroundColor(Color.black.opacity(0.55))
                        .lineLimit(1)
                    Text(data.healthLabel)
                        .font(.system(size: 12, weight: .semibold))
                        .foregroundColor(accent)
                        .padding(.horizontal, 10)
                        .padding(.vertical, 6)
                        .background(accent.opacity(0.14))
                        .clipShape(Capsule())
                }

                Spacer()

                VStack(spacing: 10) {
                    if data.wateringEnabled {
                        Image(systemName: "drop.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(accent)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.04))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                    if data.mistingEnabled {
                        Image(systemName: "cloud.rain.fill")
                            .font(.system(size: 14, weight: .semibold))
                            .foregroundColor(accent)
                            .frame(width: 36, height: 36)
                            .background(Color.black.opacity(0.04))
                            .clipShape(RoundedRectangle(cornerRadius: 12, style: .continuous))
                    }
                }
            }

            VStack(spacing: 10) {
                if data.wateringEnabled {
                    ProgressRow(
                        systemName: "drop",
                        progress: data.waterProgress,
                        remaining: data.waterRemaining,
                        accent: accent
                    )
                }
                if data.mistingEnabled {
                    ProgressRow(
                        systemName: "cloud.rain",
                        progress: data.mistProgress,
                        remaining: data.mistRemaining,
                        accent: accent
                    )
                }
            }
        }
        .padding(16)
        .containerBackground(for: .widget) {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Color.white)
        }
        .widgetURL(URL(string: "plant-care-app://plant/\(data.id)"))
    }

    private var empty: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("Выберите растение")
                .font(.system(size: 16, weight: .bold))
                .foregroundColor(Color.black.opacity(0.85))
            Text("Откройте настройки и выберите растение для виджета")
                .font(.system(size: 12, weight: .regular))
                .foregroundColor(Color.black.opacity(0.55))
                .lineLimit(2)
        }
        .padding(16)
        .containerBackground(for: .widget) {
            RoundedRectangle(cornerRadius: 22, style: .continuous)
                .fill(Color.white)
        }
    }
}

@main
struct PlantCardWidget: Widget {
    let kind: String = "PlantCardWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: Provider()) { entry in
            PlantCardView(entry: entry)
        }
        .configurationDisplayName("Карточка растения")
        .description("Показывает уход для выбранного растения.")
        .supportedFamilies([.systemMedium, .systemLarge])
    }
}

