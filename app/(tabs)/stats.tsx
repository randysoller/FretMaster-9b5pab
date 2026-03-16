import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { PracticeStatsChart } from '@/components/feature/PracticeStatsChart';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import {
  loadPracticeStats,
  getPracticeSummary,
  getTopPracticedChords,
  getMostTimeSpentChords,
  getRecentSessions,
  formatDuration,
  clearAllStats,
  ChordPracticeStats,
  PracticeSession,
} from '@/services/practiceStatsService';

export default function StatsScreen() {
  const router = useRouter();
  const { profile } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [topChords, setTopChords] = useState<ChordPracticeStats[]>([]);
  const [timeChords, setTimeChords] = useState<ChordPracticeStats[]>([]);
  const [recentSessions, setRecentSessions] = useState<PracticeSession[]>([]);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [summaryData, topChordsData, timeChordsData, sessionsData] = await Promise.all([
        getPracticeSummary(),
        getTopPracticedChords(5),
        getMostTimeSpentChords(5),
        getRecentSessions(10),
      ]);
      
      setSummary(summaryData);
      setTopChords(topChordsData);
      setTimeChords(timeChordsData);
      setRecentSessions(sessionsData);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClearStats = () => {
    Alert.alert(
      'Clear All Statistics',
      'Are you sure you want to delete all practice statistics? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            await clearAllStats();
            await loadStats();
            Alert.alert('Success', 'All statistics have been cleared');
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <Screen edges={['top']}>
        <View style={[styles.container, styles.centerContent]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading statistics...</Text>
        </View>
      </Screen>
    );
  }

  const stats = [
    { 
      label: 'Total Practice Time', 
      value: summary?.totalPracticeTimeFormatted || '0s', 
      icon: 'timer' as const 
    },
    { 
      label: 'Chords Practiced', 
      value: summary?.totalChordsPracticed.toString() || '0', 
      icon: 'music-note' as const 
    },
    { 
      label: 'Current Streak', 
      value: summary?.currentStreak ? `${summary.currentStreak} day${summary.currentStreak > 1 ? 's' : ''}` : '0 days', 
      icon: 'local-fire-department' as const 
    },
    { 
      label: 'Practice Days', 
      value: summary?.practiceDaysCount.toString() || '0', 
      icon: 'calendar-today' as const 
    },
  ];

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: false,
        }} 
      />
      <Screen edges={['top']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Back Button */}
          <View style={styles.backBar}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialIcons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Practice Statistics</Text>
            <Text style={styles.subtitle}>Track your progress and achievements</Text>
            <Pressable onPress={handleClearStats} style={styles.clearButton}>
              <MaterialIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={styles.clearButtonText}>Clear Stats</Text>
            </Pressable>
          </View>

          {/* Overview Stats Grid */}
          <View style={styles.section}>
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={index} style={styles.statCard}>
                  <MaterialIcons name={stat.icon} size={28} color={colors.primary} />
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Practice Streaks */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Practice Streaks</Text>
            <View style={styles.streaksContainer}>
              <View style={styles.streakCard}>
                <MaterialIcons name="local-fire-department" size={32} color={colors.primary} />
                <Text style={styles.streakValue}>{summary?.currentStreak || 0}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
              </View>
              <View style={styles.streakCard}>
                <MaterialIcons name="emoji-events" size={32} color={colors.success} />
                <Text style={styles.streakValue}>{summary?.longestStreak || 0}</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
              </View>
            </View>
          </View>

          {/* Most Practiced Chords */}
          {topChords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Most Practiced Chords</Text>
              <Text style={styles.sectionSubtitle}>Sorted by practice count</Text>
              <PracticeStatsChart
                data={topChords.map(chord => ({
                  label: chord.chordName,
                  value: chord.practiceCount,
                  color: colors.primary,
                }))}
                type="bar"
                unit="x"
              />
            </View>
          )}

          {/* Time Spent on Chords */}
          {timeChords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Time Investment</Text>
              <Text style={styles.sectionSubtitle}>Total practice time per chord</Text>
              <PracticeStatsChart
                data={timeChords.map(chord => ({
                  label: chord.chordName,
                  value: Math.round(chord.totalTimeSeconds / 60),
                  color: colors.success,
                }))}
                type="bar"
                unit="m"
              />
            </View>
          )}

          {/* Accuracy Progress */}
          {topChords.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Accuracy Progress</Text>
              <Text style={styles.sectionSubtitle}>Average accuracy for top chords</Text>
              <PracticeStatsChart
                data={topChords
                  .filter(chord => chord.averageAccuracy > 0)
                  .slice(0, 5)
                  .map(chord => ({
                    label: chord.chordName,
                    value: chord.averageAccuracy,
                    color: chord.averageAccuracy >= 80 ? colors.success : 
                           chord.averageAccuracy >= 60 ? colors.primary : colors.error,
                  }))}
                type="progress"
                maxValue={100}
                showPercentage
              />
            </View>
          )}

          {/* Recent Sessions */}
          {recentSessions.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Sessions</Text>
              {recentSessions.slice(0, 5).map((session, index) => {
                const date = new Date(session.endTime);
                const timeAgo = getTimeAgo(date);
                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <MaterialIcons name="timer" size={16} color={colors.primary} />
                      <Text style={styles.sessionTime}>{timeAgo}</Text>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionDuration}>
                        {formatDuration(session.durationSeconds)}
                      </Text>
                      {session.chordsCompleted && (
                        <Text style={styles.sessionChords}>
                          {session.chordsCompleted} chord{session.chordsCompleted > 1 ? 's' : ''}
                        </Text>
                      )}
                      {session.accuracyScore !== undefined && (
                        <Text style={styles.sessionAccuracy}>
                          {Math.round(session.accuracyScore)}% accuracy
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Empty State */}
          {topChords.length === 0 && (
            <View style={styles.emptyState}>
              <MaterialIcons name="show-chart" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No Practice Data Yet</Text>
              <Text style={styles.emptyMessage}>
                Start practicing chords to see your statistics and progress charts here.
              </Text>
            </View>
          )}
        </ScrollView>
      </Screen>
    </>
  );
}

// Helper function to format time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  clearButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.error,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  streaksContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  streakCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.primary,
    marginTop: spacing.xs,
  },
  streakLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  sessionCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  sessionTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  sessionDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  sessionDuration: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  sessionChords: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sessionAccuracy: {
    fontSize: 13,
    color: colors.success,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl * 2,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.lg,
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    maxWidth: 280,
  },
});
