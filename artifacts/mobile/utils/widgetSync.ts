import { Platform } from "react-native";

import { PLANT_WIDGET_DATA_KEY } from "@/constants/widget";
import type { PlantWidgetPayload } from "@/utils/plantWidget";

export function syncPlantWidget(payload: PlantWidgetPayload | null) {
  const json = payload ? JSON.stringify(payload) : "";

  if (Platform.OS !== "android") return;

  try {
    const { WidgetStorage } = require("android-glance-widget-expo") as typeof import("android-glance-widget-expo");
    WidgetStorage.set(PLANT_WIDGET_DATA_KEY, json);
    WidgetStorage.updateWidget("PlantCardReceiver");
  } catch {}
}
