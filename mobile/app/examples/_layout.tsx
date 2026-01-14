import { Stack } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';

export default function ExamplesLayout() {
  const { colors, isLazorkit } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: isLazorkit ? '#7857FF' : '#1e1b4b',
        },
        headerTintColor: '#ffffff',
        headerTitleStyle: {
          fontWeight: '600',
          color: '#ffffff',
          fontSize: 16,
        },
        headerTitleAlign: 'center', // Center align for Android consistency
        headerShadowVisible: false, // Clean look without shadow
        contentStyle: {
          backgroundColor: colors.gradient.start,
        },
      }}
    />
  );
}
