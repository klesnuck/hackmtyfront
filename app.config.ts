import type { ExpoConfig } from 'expo/config';

/**
 * Env-driven so the same build artifact can point at different backend hosts
 * (local dev machine vs. the showcase backend) without a native rebuild.
 * See MOBILE_ARCHITECTURE.md §9 and eas.json's build profiles.
 */
const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

const config: ExpoConfig = {
  name: 'La Mesa',
  slug: 'la-mesa',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  scheme: 'lamesa',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'mx.hackmty.lamesa',
  },
  android: {
    package: 'mx.hackmty.lamesa',
    adaptiveIcon: {
      backgroundColor: '#EC0029',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
    bundler: 'metro',
  },
  plugins: [
    'expo-router',
    'expo-asset',
    'expo-audio',
    'expo-font',
    'expo-image',
    'expo-secure-store',
    'expo-splash-screen',
    'expo-status-bar',
    'expo-video',
    '@react-native-community/datetimepicker',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    apiBaseUrl: API_BASE_URL,
  },
};

export default config;
