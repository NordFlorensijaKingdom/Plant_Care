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
import androidx.glance.appwidget.cornerRadius
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.defaultWeight
import androidx.glance.layout.fillMaxHeight
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
    val textPrimary = Color(0xFF0B1F16)
    val textSecondary = Color(0xFF6B8F7A)
    val track = Color(0xFFDDEBE1)
    val fill = Color(0xFF0B6B47)
    val chipBg = Color(0xFFF6E6DC)
    val chipText = Color(0xFFE38B3D)

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color(0xFFF3F7F5)))
            .padding(10.dp)
            .clickable(clickAction)
    ) {
        Box(
            modifier = GlanceModifier
                .fillMaxSize()
                .background(ColorProvider(Color.White))
                .cornerRadius(26.dp)
                .padding(18.dp)
        ) {
            Column(modifier = GlanceModifier.fillMaxWidth()) {
                Row(
                    modifier = GlanceModifier.fillMaxWidth(),
                    verticalAlignment = Alignment.Vertical.CenterVertically
                ) {
                    Box(
                        modifier = GlanceModifier
                            .size(64.dp)
                            .background(ColorProvider(Color(0xFFF1F6F3)))
                            .cornerRadius(18.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Image(
                            provider = ImageProvider(R.drawable.widget_leaf),
                            contentDescription = null,
                            modifier = GlanceModifier.size(42.dp)
                        )
                    }

                    Spacer(modifier = GlanceModifier.width(14.dp))

                    Column(modifier = GlanceModifier.defaultWeight(1f)) {
                        Text(
                            plant.name,
                            maxLines = 1,
                            style = TextStyle(
                                color = ColorProvider(textPrimary),
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(4.dp))
                        Text(
                            plant.species,
                            maxLines = 1,
                            style = TextStyle(
                                color = ColorProvider(textSecondary),
                                fontSize = 16.sp,
                                fontStyle = FontStyle.Italic
                            )
                        )
                        Spacer(modifier = GlanceModifier.height(10.dp))
                        Box(
                            modifier = GlanceModifier
                                .background(ColorProvider(chipBg))
                                .cornerRadius(999.dp)
                                .padding(start = 14.dp, top = 8.dp, end = 14.dp, bottom = 8.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                "⚠ ${plant.healthLabel}",
                                maxLines = 1,
                                style = TextStyle(
                                    color = ColorProvider(chipText),
                                    fontSize = 14.sp,
                                    fontWeight = FontWeight.Medium
                                )
                            )
                        }
                    }

                    Spacer(modifier = GlanceModifier.width(14.dp))

                    Column(horizontalAlignment = Alignment.Horizontal.CenterHorizontally) {
                        ActionIcon("💧", fill)
                        Spacer(modifier = GlanceModifier.height(12.dp))
                        ActionIcon("🌧", fill)
                    }
                }

                Spacer(modifier = GlanceModifier.height(18.dp))

                if (plant.wateringEnabled) {
                    ProgressRow(
                        label = "💧",
                        progress = plant.waterProgress,
                        remaining = plant.waterRemaining,
                        accent = fill,
                        track = track,
                        textSecondary = textSecondary
                    )
                    Spacer(modifier = GlanceModifier.height(14.dp))
                }

                if (plant.mistingEnabled) {
                    ProgressRow(
                        label = "🌧",
                        progress = plant.mistProgress,
                        remaining = plant.mistRemaining,
                        accent = fill,
                        track = track,
                        textSecondary = textSecondary
                    )
                }
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
    ProgressRow(label, progress, remaining, accent, Color(0xFFDDEBE1), Color(0xFF6B8F7A))
}

@androidx.compose.runtime.Composable
private fun ActionIcon(icon: String, color: Color) {
    Box(
        modifier = GlanceModifier
            .size(56.dp)
            .background(ColorProvider(Color(0xFFF1F6F3)))
            .cornerRadius(18.dp),
        contentAlignment = Alignment.Center
    ) {
        Text(
            icon,
            maxLines = 1,
            style = TextStyle(
                color = ColorProvider(color),
                fontSize = 20.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}

@androidx.compose.runtime.Composable
private fun ProgressRow(
    label: String,
    progress: Double,
    remaining: String,
    accent: Color,
    track: Color,
    textSecondary: Color
) {
    val p = progress.coerceIn(0.0, 1.0).toFloat()
    val filled = if (p <= 0f) 0.001f else p
    val empty = if (p >= 1f) 0.001f else 1f - p

    Row(
        modifier = GlanceModifier.fillMaxWidth(),
        verticalAlignment = Alignment.Vertical.CenterVertically
    ) {
        Text(
            label,
            maxLines = 1,
            style = TextStyle(color = ColorProvider(accent), fontSize = 18.sp, fontWeight = FontWeight.Medium)
        )

        Spacer(modifier = GlanceModifier.width(12.dp))

        Row(
            modifier = GlanceModifier
                .defaultWeight(1f)
                .height(10.dp)
                .cornerRadius(999.dp)
        ) {
            Box(
                modifier = GlanceModifier
                    .defaultWeight(filled)
                    .fillMaxHeight()
                    .background(ColorProvider(accent))
            )
            Box(
                modifier = GlanceModifier
                    .defaultWeight(empty)
                    .fillMaxHeight()
                    .background(ColorProvider(track))
            )
        }

        Spacer(modifier = GlanceModifier.width(12.dp))

        Text(
            remaining,
            maxLines = 1,
            style = TextStyle(
                color = ColorProvider(textSecondary),
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold
            )
        )
    }
}
