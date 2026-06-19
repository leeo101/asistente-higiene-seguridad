import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.asistentehs.app',
  appName: 'Asistente HS',
  webDir: 'dist',
  ios: {
    allowsLinkPreview: false,
    allowsBackForwardNavigationGestures: true
  }
};

export default config;
