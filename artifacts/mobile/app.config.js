const appJson = require("./app.json");

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
  const expo = appJson.expo ?? appJson;

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

