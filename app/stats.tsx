import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { storageService } from '@/services/storageService';
import { practiceTrackingService, ACHIEVEMENTS } from '@/services/practiceTrackingService';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.lg * 2;
const CHART_HEIGHT = 200;

export default function StatsScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<any>({});
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    const userStats = await storageService.getStats();
    const weekly = await practiceTrackingService.getWeeklyStats();
    const allSessions = await storageService.getPracticeSessions();
    const unlockedAchievements = await storageService.getAchievements();

    setStats(userStats);
    setWeeklyData(weekly);
    setSessions(allSessions.slice(-10).reverse()); // Last 10 sessions
    setAchievements(unlockedAchievements);
    setCurrentStreak(userStats.currentStreak || 0);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderWeeklyChart = () => {
    if (weeklyData.length === 0) return null;

    const maxDuration = Math.max(...weeklyData.map(d => d.duration), 1);
    const barWidth = CHART_WIDTH / weeklyData.length - spacing.xs * 2;

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>WEEKLY PRACTICE TIME</Text>
        <View style={styles.chart}>
          <View style={styles.chartBars}>
            {weeklyData.map((day, index) => {
              const barHeight = (day.duration / maxDuration) * (CHART_HEIGHT - 40);
              const date = new Date(day.date);
              const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });

              return (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View style={[styles.bar, { height: Math.max(barHeight, 2) }]}>
                      {day.duration > 0 && (
                        <Text style={styles.barLabel}>{Math.round(day.duration / 60)}m</Text>
                      )}
                    </View>
                  </View>
                  <Text style={styles.barDay}>{dayName[0]}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  const renderAccuracyTrend = () => {
    if (!stats.accuracyHistory || stats.accuracyHistory.length === 0) return null;

    const recentAccuracy = stats.accuracyHistory.slice(-7);
    const avgAccuracy = recentAccuracy.reduce((sum: number, item: any) => sum + item.accuracy, 0) / recentAccuracy.length;

    return (
      <View style={styles.trendCard}>
        <View style={styles.trendHeader}>
          <MaterialIcons name="trending-up" size={24} color={colors.success} />
          <Text style={styles.trendTitle}>Accuracy Trend</Text>
        </View>
        <Text style={styles.trendValue}>{Math.round(avgAccuracy)}%</Text>
        <Text style={styles.trendSubtext}>Average accuracy over last 7 sessions</Text>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Practice Stats',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Overview Stats */}
          <View style={styles.overviewSection}>
            <Text style={styles.sectionTitle}>OVERVIEW</Text>
            
            {/* Streak Card */}
            {currentStreak > 0 && (
              <View style={styles.streakCard}>
                <MaterialIcons name="local-fire-department" size={32} color={colors.warning} />
                <View style={styles.streakInfo}>
                  <Text style={styles.streakValue}>{currentStreak} Day Streak!</Text>
                  <Text style={styles.streakLabel}>Keep practicing to maintain your streak</Text>
                </View>
              </View>
            )}
            
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <MaterialIcons name="timer" size={32} color={colors.primary} />
                <Text style={styles.statValue}>
                  {formatTime(stats.totalPracticeTime || 0)}
                </Text>
                <Text style={styles.statLabel}>Total Practice</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="music-note" size={32} color={colors.accent} />
                <Text style={styles.statValue}>
                  {(stats.chordsMastered || []).length}
                </Text>
                <Text style={styles.statLabel}>Chords Mastered</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="show-chart" size={32} color={colors.info} />
                <Text style={styles.statValue}>
                  {(stats.scalesMastered || []).length}
                </Text>
                <Text style={styles.statLabel}>Scales Mastered</Text>
              </View>

              <View style={styles.statCard}>
                <MaterialIcons name="trending-up" size={32} color={colors.secondary} />
                <Text style={styles.statValue}>
                  {(stats.progressionsMastered || []).length}
                </Text>
                <Text style={styles.statLabel}>Progressions</Text>
              </View>
            </View>
          </View>

          {/* Weekly Chart */}
          {renderWeeklyChart()}

          {/* Accuracy Trend */}
          {renderAccuracyTrend()}

          {/* Achievements */}
          <View style={styles.achievementsSection}>
            <Text style={styles.sectionTitle}>ACHIEVEMENTS</Text>
            <View style={styles.achievementsGrid}>
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = achievements.some(a => a.id === achievement.id);
                return (
                  <View 
                    key={achievement.id} 
                    style={[styles.achievementCard, !unlocked && styles.achievementCardLocked]}
                  >
                    <MaterialIcons 
                      name={achievement.icon as any} 
                      size={32} 
                      color={unlocked ? colors.primary : colors.textMuted} 
                    />
                    <Text style={[styles.achievementTitle, !unlocked && styles.achievementTitleLocked]}>
                      {achievement.title}
                    </Text>
                    <Text style={styles.achievementDescription}>
                      {achievement.description}
                    </Text>
                    {unlocked && (
                      <View style={styles.achievementBadge}>
                        <MaterialIcons name="check" size={12} color="#000" />
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Recent Sessions */}
          <View style={styles.sessionsSection}>
            <Text style={styles.sectionTitle}>RECENT SESSIONS</Text>
            {sessions.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inbox" size={48} color={colors.textMuted} />
                <Text style={styles.emptyText}>No practice sessions yet</Text>
                <Text style={styles.emptySubtext}>Start practicing to see your progress here</Text>
              </View>
            ) : (
              sessions.map((session, index) => (
                <View key={session.id} style={styles.sessionCard}>
                  <View style={styles.sessionHeader}>
                    <MaterialIcons 
                      name={
                        session.type === 'chords' ? 'music-note' :
                        session.type === 'progressions' ? 'trending-up' :
                        session.type === 'scales' ? 'show-chart' : 'headphones'
                      } 
                      size={20} 
                      color={colors.primary} 
                    />
                    <Text style={styles.sessionType}>
                      {session.type.charAt(0).toUpperCase() + session.type.slice(1)}
                    </Text>
                    <Text style={styles.sessionDate}>{formatDate(session.startTime)}</Text>
                  </View>
                  
                  <View style={styles.sessionStats}>
                    <View style={styles.sessionStat}>
                      <MaterialIcons name="timer" size={16} color={colors.textSecondary} />
                      <Text style={styles.sessionStatText}>{formatTime(session.duration)}</Text>
                    </View>
                    
                    <View style={styles.sessionStat}>
                      <MaterialIcons name="check-circle" size={16} color={colors.success} />
                      <Text style={styles.sessionStatText}>{Math.round(session.accuracy)}%</Text>
                    </View>
                    
                    <View style={styles.sessionStat}>
                      <MaterialIcons name="sync" size={16} color={colors.info} />
                      <Text style={styles.sessionStatText}>
                        {session.correctAttempts}/{session.attempts}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overviewSection: {
    padding: spacing.lg,
  },
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 165, 0, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.warning,
    marginBottom: spacing.lg,
  },
  streakInfo: {
    flex: 1,
  },
  streakValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 2,
  },
  streakLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
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
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.sm,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    textAlign: 'center',
  },
  chartContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chartTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  chart: {
    height: CHART_HEIGHT,
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: spacing.xs,
  },
  barContainer: {
    flex: 1,
    alignItems: 'center',
  },
  barWrapper: {
    flex: 1,
    width: '100%',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: '80%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 4,
  },
  barLabel: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  barDay: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
  },
  trendCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  trendTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  trendValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.success,
    marginBottom: spacing.xs,
  },
  trendSubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
  },
  achievementsSection: {
    padding: spacing.lg,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  achievementCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.primary,
    position: 'relative',
  },
  achievementCardLocked: {
    borderColor: colors.border,
    opacity: 0.6,
  },
  achievementTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  achievementTitleLocked: {
    color: colors.textMuted,
  },
  achievementDescription: {
    color: colors.textSecondary,
    fontSize: 11,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  achievementBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionsSection: {
    padding: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: spacing.xs,
  },
  sessionCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  sessionType: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  sessionStats: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  sessionStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sessionStatText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
