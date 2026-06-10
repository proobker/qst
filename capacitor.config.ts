import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.qst.mobile",
  appName: "qst",
  webDir: "public",
  server: {
    url: "https://qst-kappa.vercel.app",
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: "#0f172a",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
    },
    StatusBar: {
      backgroundColor: "#0f172a",
      style: "DARK",
    },
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
  },
};

export default config;
