import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.pestflowpro.app',
  appName: 'PestFlow Pro',
  webDir: 'dist',
  server: {
    // For development — comment out for production builds
    // url: 'http://localhost:5173',
    // cleartext: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0a0f1e',
      showSpinner: true,
      spinnerColor: '#10b981',
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0f1e',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
  ios: {
    scheme: 'PestFlowPro',
    contentInset: 'automatic',
  },
  android: {
    backgroundColor: '#0a0f1e',
    allowMixedContent: true,
  },
}

export default config
