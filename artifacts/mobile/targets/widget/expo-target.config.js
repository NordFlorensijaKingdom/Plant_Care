module.exports = (config) => ({
  type: "widget",
  entitlements: {
    "com.apple.security.application-groups":
      config.ios.entitlements["com.apple.security.application-groups"],
  },
  colors: {
    accent: "#2D6A4F",
  },
});

