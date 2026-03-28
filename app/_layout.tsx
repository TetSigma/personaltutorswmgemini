import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen
          name="new-course"
          options={{
            headerShown: true,
            title: 'New course',
            headerBackButtonDisplayMode: 'minimal',
            headerBackTitle: '',
          }}
        />
        <Stack.Screen
          name="quiz"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="quiz-results"
          options={{
            headerShown: true,
            title: 'Results',
            headerBackVisible: false,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
