package com.user.plantcare.widgets

import android.content.ComponentName
import android.content.Context
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
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
import com.user.plantcare.MainActivity
import com.user.plantcare.R
import org.json.JSONObject

private const val PREFS_SUFFIX = ".glance_widget"
private const val DATA_KEY = "plantWidgetData"

class PlantCard : GlanceAppWidget() {
    override suspend fun provideGlance(context: Context, id: GlanceId) {
        provideContent {
            PlantCardContent(context)
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
    val plant = load(context)
    if (plant == null) {
        EmptyState()
        return
    }

    val accent = parseColor(plant.healthColor)
    val clickAction = actionStartActivity(ComponentName(context, MainActivity::class.java))

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color.White))
            .padding(16.dp)
            .clickable(clickAction),
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

                Column(modifier = GlanceModifier.fillMaxWidth()) {
                    Text(
                        plant.name,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF0B1F16)),
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold
                        )
                    )
                    Text(
                        plant.species,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(Color(0xFF6B8F7A)),
                            fontSize = 13.sp,
                            fontStyle = FontStyle.Italic
                        )
                    )
                    Text(
                        plant.healthLabel,
                        maxLines = 1,
                        style = TextStyle(
                            color = ColorProvider(accent),
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Medium
                        )
                    )
                }

            }

            Spacer(modifier = GlanceModifier.height(12.dp))

            if (plant.wateringEnabled) {
                ProgressRow(
                    label = "💧",
                    progress = plant.waterProgress,
                    remaining = plant.waterRemaining,
                    accent = accent
                )
                Spacer(modifier = GlanceModifier.height(10.dp))
            }
            if (plant.mistingEnabled) {
                ProgressRow(
                    label = "🌧",
                    progress = plant.mistProgress,
                    remaining = plant.mistRemaining,
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
        Text(
            label,
            style = TextStyle(color = ColorProvider(fill), fontSize = 14.sp, fontWeight = FontWeight.Medium)
        )
        Spacer(modifier = GlanceModifier.width(8.dp))
        Text(
            "${(p * 100).toInt()}%",
            style = TextStyle(color = ColorProvider(Color(0xFF6B8F7A)), fontSize = 12.sp)
        )
        Spacer(modifier = GlanceModifier.width(8.dp))
        Text(
            remaining,
            style = TextStyle(color = ColorProvider(Color(0xFF6B8F7A)), fontSize = 12.sp, fontWeight = FontWeight.Medium)
        )
    }
}
