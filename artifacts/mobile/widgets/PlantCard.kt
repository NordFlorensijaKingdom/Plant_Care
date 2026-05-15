package com.user.plantcare.widgets

import android.content.Context
import android.content.Intent
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.GlanceTheme
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.action.actionStartActivity
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.defaultWeight
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.size
import androidx.glance.layout.width
import androidx.glance.text.FontStyle
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import androidx.glance.unit.sp
import org.json.JSONObject

private const val PREFS_SUFFIX = ".glance_widget"
private const val DATA_KEY = "plantWidgetData"

class PlantCard : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            GlanceTheme {
                PlantCardContent(context)
            }
        }
    }
}

private data class PlantData(
    val id: String,
    val name: String,
    val species: String,
    val healthLabel: String,
    val healthColor: String,
    val wateringEnabled: Boolean,
    val waterProgress: Double,
    val waterRemaining: String,
    val mistingEnabled: Boolean,
    val mistProgress: Double,
    val mistRemaining: String
)

private fun load(context: Context): PlantData? {
    val prefs = context.getSharedPreferences(context.packageName + PREFS_SUFFIX, Context.MODE_PRIVATE)
    val raw = prefs.getString(DATA_KEY, null) ?: return null
    if (raw.isEmpty()) return null
    return try {
        val o = JSONObject(raw)
        PlantData(
            id = o.optString("id"),
            name = o.optString("name"),
            species = o.optString("species"),
            healthLabel = o.optString("healthLabel"),
            healthColor = o.optString("healthColor"),
            wateringEnabled = o.optBoolean("wateringEnabled"),
            waterProgress = o.optDouble("waterProgress", 0.0),
            waterRemaining = o.optString("waterRemaining"),
            mistingEnabled = o.optBoolean("mistingEnabled"),
            mistProgress = o.optDouble("mistProgress", 0.0),
            mistRemaining = o.optString("mistRemaining")
        )
    } catch (_: Exception) {
        null
    }
}

private fun parseColor(hex: String, fallback: Color = Color(0xFF2D6A4F)): Color {
    val h = hex.trim().removePrefix("#")
    if (h.length != 6) return fallback
    return try {
        Color(("FF$h").toLong(16))
    } catch (_: Exception) {
        fallback
    }
}

@androidx.compose.runtime.Composable
private fun PlantCardContent(context: Context) {
    val data = load(context)
    if (data == null) {
        EmptyState()
        return
    }

    val accent = parseColor(data.healthColor)
    val clickIntent = Intent(Intent.ACTION_VIEW).apply {
        data = android.net.Uri.parse("plant-care-app://plant/${data.id}")
    }

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color.White))
            .padding(16.dp)
            .clickable(actionStartActivity(clickIntent)),
        contentAlignment = Alignment.CenterStart
    ) {
        Column(modifier = GlanceModifier.fillMaxWidth()) {
            Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
                Box(
                    modifier = GlanceModifier
                        .size(44.dp)
                        .background(ColorProvider(accent.copy(alpha = 0.14f))),
                    contentAlignment = Alignment.Center
                ) {
                    Image(
                        provider = ImageProvider(R.drawable.widget_leaf),
                        contentDescription = null,
                        modifier = GlanceModifier.size(22.dp)
                    )
                }

                Spacer(modifier = GlanceModifier.width(12.dp))

                Column(modifier = GlanceModifier.defaultWeight()) {
                    Text(
                        data.name,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF0B1F16)),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        data.species,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF6B8F7A)),
                            fontSize = 13.sp,
                            fontStyle = FontStyle.Italic
                        )
                    )
                    Text(
                        data.healthLabel,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(accent),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.SemiBold
                        )
                    )
                }

                Spacer(modifier = GlanceModifier.width(10.dp))

                Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
                    if (data.wateringEnabled) {
                        Text("💧", style = TextStyle(fontSize = 14.sp))
                        Spacer(modifier = GlanceModifier.height(10.dp))
                    }
                    if (data.mistingEnabled) {
                        Text("🌧", style = TextStyle(fontSize = 14.sp))
                    }
                }
            }

            Spacer(modifier = GlanceModifier.height(12.dp))

            if (data.wateringEnabled) {
                ProgressRow(
                    label = "💧",
                    progress = data.waterProgress,
                    remaining = data.waterRemaining,
                    accent = accent
                )
                Spacer(modifier = GlanceModifier.height(10.dp))
            }
            if (data.mistingEnabled) {
                ProgressRow(
                    label = "🌧",
                    progress = data.mistProgress,
                    remaining = data.mistRemaining,
                    accent = accent
                )
            }
        }
    }
}

@androidx.compose.runtime.Composable
private fun EmptyState() {
    Column(modifier = GlanceModifier.fillMaxSize().padding(16.dp)) {
        Text(
            "Выберите растение",
            style = TextStyle(
                color = ColorProvider(Color(0xFF0B1F16)),
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold
            )
        )
        Spacer(modifier = GlanceModifier.height(6.dp))
        Text(
            "Откройте настройки и выберите растение для виджета",
            maxLines = 2,
            style = TextStyle(
                color = ColorProvider(Color(0xFF6B8F7A)),
                fontSize = 12.sp
            )
        )
    }
}

@androidx.compose.runtime.Composable
private fun ProgressRow(label: String, progress: Double, remaining: String, accent: Color) {
    val p = progress.coerceIn(0.0, 1.0)
    val fill = when {
        p >= 1.0 -> Color.Red
        p >= 0.75 -> Color(0xFFF4A261)
        else -> accent
    }

    Row(
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Text(label, style = TextStyle(fontSize = 14.sp))
        Spacer(modifier = GlanceModifier.width(10.dp))
        Row(
            modifier = GlanceModifier
                .defaultWeight()
                .height(7.dp)
                .background(ColorProvider(Color(0x14000000))),
            verticalAlignment = Alignment.Vertical.CenterVertically
        ) {
            if (p > 0) {
                Box(
                    modifier = GlanceModifier
                        .defaultWeight(p.toFloat())
                        .fillMaxSize()
                        .background(ColorProvider(fill))
                ) {}
            }
            if (p < 1.0) {
                Box(modifier = GlanceModifier.defaultWeight((1.0 - p).toFloat()).fillMaxSize()) {}
            }
        }
        Spacer(modifier = GlanceModifier.width(10.dp))
        Text(
            remaining,
            style = TextStyle(color = ColorProvider(Color(0xFF6B8F7A)), fontSize = 12.sp, fontWeight = FontWeight.SemiBold)
        )
    }
}
