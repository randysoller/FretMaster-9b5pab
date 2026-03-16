import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import React, { useEffect } from 'react';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider } from '@/contexts/AuthContext';
import { ChordLibraryProvider } from '@/contexts/ChordLibraryContext';
import { PresetProvider } from '@/contexts/PresetContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { useAuth } from '@/hooks/useAuth';

function RootLayoutNav() {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // Define public routes that don't require authentication
    const publicRoutes = ['sign-in', 'sign-up', 'forgot-password'];
    const currentRoute = segments[0];
    const isPublicRoute = publicRoutes.includes(currentRoute as string);

    if (!user && !isPublicRoute) {
      // Redirect to sign-in if not authenticated and trying to access protected routes
      router.replace('/sign-in');
    } else if (user && isPublicRoute) {
      // Redirect to tabs if authenticated and on public auth pages
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="chord-practice" options={{ headerShown: false }} />
      <Stack.Screen name="progressions" options={{ headerShown: false }} />
      <Stack.Screen name="progressions-practice" options={{ headerShown: false }} />
      <Stack.Screen name="chord-library" options={{ headerShown: false }} />
      <Stack.Screen name="scale-library" options={{ headerShown: false }} />
      <Stack.Screen name="triad-library" options={{ headerShown: false }} />
      <Stack.Screen name="chord-detail" options={{ headerShown: false }} />
      <Stack.Screen name="chord-manager" options={{ headerShown: false }} />
      <Stack.Screen name="editor" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="stats" options={{ headerShown: false }} />
      <Stack.Screen name="calibration" options={{ headerShown: false }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <PresetProvider>
          <ChordLibraryProvider>
            <ToastProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <RootLayoutNav />
                <StatusBar style="auto" />
              </ThemeProvider>
            </ToastProvider>
          </ChordLibraryProvider>
        </PresetProvider>
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
