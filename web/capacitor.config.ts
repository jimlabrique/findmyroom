import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "be.findmyroom.app",
  appName: "FindMyRoom",
  webDir: "out",
  server: {
    url: "https://www.findmyroom.be",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    App: {
      launchUrl: "findmyroom://auth/callback",
    },
  },
};

export default config;
