import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Platform } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { profile } = useAuth();

  const tabBarStyle = {
    height: Platform.select({
      ios: insets.bottom + 56,
      android: insets.bottom + 56,
      default: 56,
    }),
    paddingTop: 0,
    paddingBottom: Platform.select({
      ios: insets.bottom,
      android: insets.bottom,
      default: 0,
    }),
    paddingHorizontal: 0,
    backgroundColor: `rgba(13, 11, 8, 0.92)`, // BG Base at 92% opacity
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Global Toolbar */}
      <View style={[styles.toolbar, { paddingTop: insets.top + spacing.md }]}>
        <MaterialIcons name="music-note" size={24} color={colors.primary} />
        <View style={styles.headerBadge}>
          <MaterialIcons name="auto-awesome" size={12} color={colors.primary} />
          <Text style={styles.headerBadgeText}>
            {profile ? `Welcome back, ${profile.username}` : 'FretMaster'}
          </Text>
        </View>
        <Pressable 
          style={styles.statsButton}
          onPress={() => router.push('/stats' as any)}
        >
          <MaterialIcons name="bar-chart" size={20} color={colors.primary} />
        </Pressable>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: {
            fontSize: 14,
            fontWeight: '600',
            fontFamily: 'Sora',
          },
          tabBarIconStyle: {
            width: 30,
            height: 30,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="music-note" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="metronome"
          options={{
            title: 'Metronome',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="speed" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="tuner"
          options={{
            title: 'Tuner',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="tune" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{
            title: 'Lessons',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="play-circle-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Library',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="library-music" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
    gap: 4,
    flex: 1,
  },
  headerBadgeText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  statsButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
