import { Platform } from "react-native";

import { PLANT_WIDGET_DATA_KEY, IOS_WIDGET_APP_GROUP } from "@/constants/widget";
import type { PlantWidgetPayload } from "@/utils/plantWidget";

export function syncPlantWidget(payload: PlantWidgetPayload | null) {
  const json = payload ? JSON.stringify(payload) : "";

  if (Platform.OS === "ios") {
    try {
      const { ExtensionStorage } = require("@bacons/apple-targets") as typeof import("@bacons/apple-targets");
      const storage = new ExtensionStorage(IOS_WIDGET_APP_GROUP);
      storage.set(PLANT_WIDGET_DATA_KEY, json);
      ExtensionStorage.reloadWidget();
    } catch {}
    return;
  }

  if (Platform.OS === "android") {
    try {
      const { WidgetStorage } = require("android-glance-widget-expo") as typeof import("android-glance-widget-expo");
      WidgetStorage.set(PLANT_WIDGET_DATA_KEY, json);
      WidgetStorage.updateWidget("PlantCardReceiver");
    } catch {}
  }
}

