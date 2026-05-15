function detectPlatform() {
  const envPlatform = process.env.EAS_BUILD_PLATFORM || process.env.EXPO_BUILD_PLATFORM;
  if (envPlatform === "ios" || envPlatform === "android") return envPlatform;

  const argv = process.argv;
  const idx = argv.indexOf("--platform");
  if (idx !== -1 && (argv[idx + 1] === "ios" || argv[idx + 1] === "android")) {
    return argv[idx + 1];
  }

  const joined = argv.join(" ");
  const match = joined.match(/--platform=(ios|android)\b/);
  return match ? match[1] : null;
}

module.exports = () => {
  const platform = detectPlatform();
  const expo = {
    name: "Мой сад",
    slug: "plant-care-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.user.plantcare",
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          "Разрешите «Мой сад» доступ к вашим фото для снимков растений.",
        NSCameraUsageDescription:
          "Разрешите «Мой сад» использовать камеру, чтобы фотографировать растения.",
        NSUserNotificationUsageDescription:
          "Разрешите «Мой сад» отправлять напоминания об уходе.",
      },
    },
    android: {
      package: "com.user.plantcare",
      versionCode: 1,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.READ_MEDIA_IMAGES",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "android.permission.VIBRATE",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.SCHEDULE_EXACT_ALARM",
        "android.permission.RECORD_AUDIO",
      ],
    },
    plugins: [
      "expo-router",
      "expo-font",
      [
        "android-glance-widget-expo",
        {
          widgets: [
            {
              widgetClassName: "PlantCard",
              widgetProviderInfo: {
                description: "Карточка растения",
                minWidth: "250dp",
                minHeight: "100dp",
                resizeMode: "horizontal|vertical",
                widgetCategory: "home_screen",
              },
            },
          ],
        },
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Разрешите «Мой сад» доступ к вашим фото.",
          cameraPermission: "Разрешите «Мой сад» использовать камеру для снимков растений.",
        },
      ],
      [
        "expo-notifications",
        {
          icon: "./assets/icon.png",
          color: "#2D6A4F",
          sounds: [],
        },
      ],
    ],
    scheme: "plant-care-app",
    experiments: { typedRoutes: true },
    extra: {
      eas: {
        projectId: "16c679cb-7504-498c-af48-0f9bb099627d",
      },
    },
  };

  const plugins = Array.isArray(expo.plugins) ? expo.plugins : [];
  const filteredPlugins =
    platform === "ios"
      ? plugins.filter(
          (p) =>
            !(
              p === "android-glance-widget-expo" ||
              (Array.isArray(p) && p[0] === "android-glance-widget-expo")
            )
        )
      : plugins;

  return {
    expo: {
      ...expo,
      plugins: filteredPlugins,
    },
  };
};
