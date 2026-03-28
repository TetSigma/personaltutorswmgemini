import type { ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext) => ({
  ...config,
  name: 'personaltutor',
  slug: 'personaltutor',
  version: '1.0.0',
  newArchEnabled: true,
  orientation: 'portrait' as const,
  icon: './assets/icon.png',
  userInterfaceStyle: 'light' as const,
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain' as const,
    backgroundColor: '#ffffff',
  },
  ios: {
    supportsTablet: true,
    deploymentTarget: '17.0',
    bundleIdentifier: 'com.anonymous.personaltutor',
    infoPlist: {
      NSPhotoLibraryUsageDescription:
        'Allow Personal Tutor to access your photos to create personalised language courses.',
    },
  },
  android: {
    minSdkVersion: 33,
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-media-library',
      {
        photosPermission:
          'Allow Personal Tutor to access your photos to create personalised language courses.',
        isAccessMediaLocationEnabled: true,
      },
    ],
    [
      '@react-native-google-signin/google-signin',
      {
        iosUrlScheme: process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME,
      },
    ],
  ],
});
