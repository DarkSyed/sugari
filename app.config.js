export default {
  expo: {
    name: "Sugari",
    slug: "sugari",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    assetBundlePatterns: [
      "**/*"
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.sugari.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      package: "com.sugari.app"
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      [
        "expo-secure-store",
        {
          "faceIDPermission": "Allow Sugari to access your Face ID for secure authentication."
        }
      ],
      "expo-sqlite"
    ],
    extra: {
      eas: {
        projectId: "your-project-id"
      }
    },
    scheme: "sugari",
    owner: "sugari",
    newArchEnabled: true
  }
}; 