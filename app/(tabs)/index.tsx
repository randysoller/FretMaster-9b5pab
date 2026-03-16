import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/services/supabaseClient';

interface PracticeModeCard {
  id: string;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  route: string;
  accentColor: string;
}

const PRACTICE_MODES: PracticeModeCard[] = [
  {
    id: 'chords',
    title: 'Chords',
    description: 'Master individual chords with flashcard-style practice, audio playback, and timer challenges. Track your progress and build muscle memory.',
    icon: 'album',
    route: '/(tabs)/chord-practice',
    accentColor: colors.accent,
  },
  {
    id: 'progressions',
    title: 'Chord Progressions',
    description: 'Practice chord transitions in any key. Choose from common progressions, chord progressions by style of music, or build your own.',
    icon: 'graphic-eq',
    route: '/(tabs)/progressions',
    accentColor: colors.secondary,
  },
];

interface UserStats {
  total_practice_time: number;
  sessions_completed: number;
  current_streak: number;
  chords_mastered: string[];
  scales_mastered: string[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Fetch user stats on mount
  useEffect(() => {
    if (user) {
      fetchUserStats();
    } else {
      setLoadingStats(false);
    }
  }, [user]);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching stats:', error);
        setLoadingStats(false);
        return;
      }

      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/sign-in');
    }
  }, [authLoading, user]);

  if (authLoading || !user) {
    return (
      <Screen edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen edges={['top']}>
      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            What Do You Want to{'\n'}
            <Text style={styles.titleAccent}>Play Today?</Text>
          </Text>
        </View>

        {/* Quick Stats Card */}
        {stats && !loadingStats && (
          <View style={styles.statsCard}>
            <View style={styles.statItem}>
              <MaterialIcons name="timer" size={20} color={colors.primary} />
              <View>
                <Text style={styles.statValue}>{Math.floor((stats.total_practice_time || 0) / 60)}h</Text>
                <Text style={styles.statLabel}>Practice Time</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="local-fire-department" size={20} color={colors.warning} />
              <View>
                <Text style={styles.statValue}>{stats.current_streak || 0}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
            </View>
            <View style={styles.statItem}>
              <MaterialIcons name="star" size={20} color={colors.success} />
              <View>
                <Text style={styles.statValue}>{(stats.chords_mastered?.length || 0)}</Text>
                <Text style={styles.statLabel}>Chords Mastered</Text>
              </View>
            </View>
          </View>
        )}

        {/* Practice Modes */}
        <View style={styles.modesContainer}>
          {PRACTICE_MODES.map((mode) => (
            <Pressable
              key={mode.id}
              onPress={() => router.push(mode.route as any)}
              style={({ pressed }) => [
                styles.modeCard,
                { borderLeftColor: mode.accentColor },
                pressed && styles.modeCardPressed,
              ]}
            >
              <View style={[styles.iconContainer, { backgroundColor: mode.accentColor }]}>
                <MaterialIcons name={mode.icon} size={32} color="#000" />
              </View>
              
              <View style={styles.modeContent}>
                <Text style={styles.modeTitle}>{mode.title}</Text>
                <Text style={styles.modeDescription}>{mode.description}</Text>
                <Pressable 
                  style={styles.startButton}
                  onPress={() => router.push(mode.route as any)}
                >
                  <Text style={styles.startButtonText}>Start</Text>
                  <MaterialIcons name="chevron-right" size={16} color={mode.accentColor} />
                </Pressable>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  titleContainer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    lineHeight: 36,
  },
  titleAccent: {
    color: colors.primary,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 10,
    color: colors.textMuted,
  },
  modesContainer: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  modeCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderLeftWidth: 4,
  },
  modeCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeContent: {
    flex: 1,
  },
  modeTitle: {
    ...typography.h3,
    fontSize: 20,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  modeDescription: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
  },
  startButtonText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
});
