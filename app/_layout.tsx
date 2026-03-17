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

    // CRITICAL: Only check top-level route, ignore nested navigation within (tabs)
    const inTabsGroup = segments[0] === '(tabs)';
    const currentRoute = segments[0] as string;
    
    // Define public routes that don't require authentication
    const publicRoutes = ['sign-in', 'sign-up', 'forgot-password'];
    const isPublicRoute = publicRoutes.includes(currentRoute);

    // If user is in tabs group, never redirect (internal navigation is fine)
    if (inTabsGroup) return;

    // Not authenticated + trying to access protected route → redirect to sign-in
    if (!user && !isPublicRoute) {
      console.log('🔒 Not authenticated, redirecting to sign-in');
      router.replace('/sign-in');
    } 
    // Authenticated + on auth page → redirect to home
    else if (user && isPublicRoute) {
      console.log('✅ Already authenticated, redirecting to home');
      router.replace('/(tabs)');
    }
  }, [user, loading, segments]);

  return (
    <Stack>
      <Stack.Screen name="sign-in" options={{ headerShown: false }} />
      <Stack.Screen name="sign-up" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
