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

    val clickAction = actionStartActivity(ComponentName(context, MainActivity::class.java))
    val textPrimary = Color(0xFF0B1F16)
    val textSecondary = Color(0xFF6B8F7A)
    val fill = Color(0xFF0B6B47)
    val chipBg = Color(0xFFF6E6DC)
    val chipText = Color(0xFFE38B3D)

    Box(
        modifier = GlanceModifier
            .fillMaxSize()
            .background(ColorProvider(Color(0xFF1A2E25)))
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

                    Column(modifier = GlanceModifier.defaultWeight()) {
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
                                .padding(horizontal = 14.dp, vertical = 8.dp),
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
                        if (plant.wateringEnabled) {
                            TimerBadge("💧", plant.waterRemaining, fill)
                        }
                        if (plant.wateringEnabled && plant.mistingEnabled) {
                            Spacer(modifier = GlanceModifier.height(10.dp))
                        }
                        if (plant.mistingEnabled) {
                            TimerBadge("🌧", plant.mistRemaining, fill)
                        }
                    }
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
private fun TimerBadge(icon: String, remaining: String, color: Color) {
    val value = remaining.ifBlank { "—" }
    Box(
        modifier = GlanceModifier
            .background(ColorProvider(Color(0xFFF1F6F3)))
            .cornerRadius(18.dp)
            .padding(horizontal = 12.dp, vertical = 10.dp),
        contentAlignment = Alignment.Center
    ) {
        Row(verticalAlignment = Alignment.Vertical.CenterVertically) {
            Text(
                icon,
                maxLines = 1,
                style = TextStyle(
                    color = ColorProvider(color),
                    fontSize = 18.sp,
                    fontWeight = FontWeight.Bold
                )
            )
            Spacer(modifier = GlanceModifier.width(6.dp))
            Text(
                value,
                maxLines = 1,
                style = TextStyle(
                    color = ColorProvider(Color(0xFF0B1F16)),
                    fontSize = 14.sp,
                    fontWeight = FontWeight.Medium
                )
            )
        }
    }
}
