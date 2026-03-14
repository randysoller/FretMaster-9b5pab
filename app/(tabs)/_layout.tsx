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
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.select({
      ios: insets.bottom + 60,
      android: insets.bottom + 60,
      default: 60,
    }),
    paddingTop: 8,
    paddingBottom: Platform.select({
      ios: insets.bottom + 8,
      android: insets.bottom + 8,
      default: 8,
    }),
    paddingHorizontal: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
          <MaterialIcons name="bar-chart" size={24} color={colors.primary} />
        </Pressable>
      </View>

      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: true,
          tabBarHideOnKeyboard: false,
          tabBarLabelStyle: {
            fontSize: 15,
            fontWeight: '600',
            marginTop: 4,
            marginBottom: 4,
          },
          tabBarItemStyle: {
            paddingVertical: 4,
          },
          tabBarIconStyle: {
            marginBottom: 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Practice',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="home" size={size} color={color} />
            ),
            tabBarLabel: 'Practice',
          }}
        />
        <Tabs.Screen
          name="metronome"
          options={{
            title: 'Metronome',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="av-timer" size={size} color={color} />
            ),
            tabBarLabel: 'Metronome',
          }}
        />
        <Tabs.Screen
          name="tuner"
          options={{
            title: 'Tuner',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="vibration" size={size} color={color} />
            ),
            tabBarLabel: 'Tuner',
          }}
        />
        <Tabs.Screen
          name="lessons"
          options={{
            title: 'Lessons',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="school" size={size} color={color} />
            ),
            tabBarLabel: 'Lessons',
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            title: 'Libraries',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="library-books" size={size} color={color} />
            ),
            tabBarLabel: 'Libraries',
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
    fontSize: 16,
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
