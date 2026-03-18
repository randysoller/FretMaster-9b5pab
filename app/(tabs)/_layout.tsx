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
      ios: insets.bottom + 64,
      android: insets.bottom + 64,
      default: 64,
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
        <Pressable style={styles.logoButton}>
          <MaterialIcons name="music-note" size={24} color={colors.primary} />
        </Pressable>
        <View style={styles.headerBadge}>
          <MaterialIcons name="auto-awesome" size={12} color={colors.primary} />
          <Text style={styles.headerBadgeText}>
            {profile ? `Welcome back, ${profile.username}` : 'FretMaster'}
          </Text>
        </View>
        <Pressable 
          style={styles.statsButton}
          onPress={() => router.push('/(tabs)/stats' as any)}
        >
          <Text style={styles.statsButtonText}>Stats</Text>
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
            tabBarLabel: 'Metronome', // Full word
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

        {/* Hidden screens - part of tabs but don't show in tab bar */}
        <Tabs.Screen
          name="chord-practice"
          options={{
            href: null,
            title: 'Chord Practice',
          }}
        />
        <Tabs.Screen
          name="progressions"
          options={{
            href: null,
            title: 'Progressions',
          }}
        />
        <Tabs.Screen
          name="progressions-practice"
          options={{
            href: null,
            title: 'Progressions Practice',
          }}
        />
        <Tabs.Screen
          name="chord-library"
          options={{
            href: null,
            title: 'Chord Library',
          }}
        />
        <Tabs.Screen
          name="scale-library"
          options={{
            href: null,
            title: 'Scale Library',
          }}
        />
        <Tabs.Screen
          name="triad-library"
          options={{
            href: null,
            title: 'Triad Library',
          }}
        />
        <Tabs.Screen
          name="chord-detail"
          options={{
            href: null,
            title: 'Chord Detail',
          }}
        />
        <Tabs.Screen
          name="chord-manager"
          options={{
            href: null,
            title: 'Chord Manager',
          }}
        />
        <Tabs.Screen
          name="editor"
          options={{
            href: null,
            title: 'Editor',
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            href: null,
            title: 'Profile',
          }}
        />
        <Tabs.Screen
          name="stats"
          options={{
            href: null,
            title: 'Stats',
          }}
        />
        <Tabs.Screen
          name="calibration"
          options={{
            href: null,
            title: 'Calibration',
          }}
        />
        <Tabs.Screen
          name="scales-practice"
          options={{
            href: null,
            title: 'Scales Practice',
          }}
        />
        <Tabs.Screen
          name="scales"
          options={{
            href: null,
            title: 'Scales',
          }}
        />
        <Tabs.Screen
          name="chords"
          options={{
            href: null,
            title: 'Chords',
          }}
        />
        <Tabs.Screen
          name="lesson-detail"
          options={{
            href: null,
            title: 'Lesson Detail',
          }}
        />
        <Tabs.Screen
          name="testing"
          options={{
            href: null,
            title: 'Testing',
          }}
        />
        <Tabs.Screen
          name="strum-demo"
          options={{
            href: null,
            title: 'Strumming Demo',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  logoButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
