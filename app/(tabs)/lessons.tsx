import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

const LESSONS = [
  {
    id: 1,
    title: 'Getting Started with Guitar',
    description: 'Learn proper posture and your first chord',
    duration: '12:30',
    difficulty: 'Beginner',
    completed: false,
  },
  {
    id: 2,
    title: 'Basic Open Chords - G, C, D',
    description: 'Master the three most important chords',
    duration: '18:45',
    difficulty: 'Beginner',
    completed: false,
  },
  {
    id: 3,
    title: 'Smooth Chord Transitions',
    description: 'Practice changing between chords cleanly',
    duration: '15:20',
    difficulty: 'Beginner',
    completed: false,
  },
  {
    id: 4,
    title: 'Strumming Patterns 101',
    description: 'Learn essential rhythm patterns',
    duration: '20:10',
    difficulty: 'Intermediate',
    completed: false,
  },
  {
    id: 5,
    title: 'Your First Song',
    description: 'Put it all together with a complete song',
    duration: '25:00',
    difficulty: 'Beginner',
    completed: false,
  },
];

export default function LessonsScreen() {
  const router = useRouter();
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);

  const filteredLessons = selectedDifficulty
    ? LESSONS.filter(l => l.difficulty === selectedDifficulty)
    : LESSONS;

  const completedCount = LESSONS.filter(l => l.completed).length;
  const progressPercent = Math.round((completedCount / LESSONS.length) * 100);

  return (
    <Screen edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <MaterialIcons name="play-circle-outline" size={28} color={colors.text} />
            <Text style={styles.title}>Video Lessons</Text>
          </View>
          <View style={styles.stats}>
            <Text style={styles.statsText}>
              {LESSONS.length} curated tutorials · {completedCount} completed
            </Text>
            <View style={styles.progressBadge}>
              <Text style={styles.progressText}>{progressPercent}%</Text>
              <Text style={styles.progressLabel}>Progress</Text>
            </View>
          </View>
        </View>

        {/* Search & Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialIcons name="search" size={20} color={colors.textMuted} />
            <Text style={styles.searchPlaceholder}>Search lessons</Text>
          </View>
        </View>

        {/* Difficulty Filter */}
        <View style={styles.filtersSection}>
          <Text style={styles.filterTitle}>DIFFICULTY</Text>
          <View style={styles.filters}>
            <Pressable 
              style={[styles.filterChip, !selectedDifficulty && styles.filterChipActive]}
              onPress={() => setSelectedDifficulty(null)}
            >
              <Text style={[styles.filterText, !selectedDifficulty && styles.filterTextActive]}>
                All
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.filterChip, selectedDifficulty === 'Beginner' && styles.filterChipActive]}
              onPress={() => setSelectedDifficulty('Beginner')}
            >
              <Text style={[styles.filterText, selectedDifficulty === 'Beginner' && styles.filterTextActive]}>
                Beginner
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.filterChip, selectedDifficulty === 'Intermediate' && styles.filterChipActive]}
              onPress={() => setSelectedDifficulty('Intermediate')}
            >
              <Text style={[styles.filterText, selectedDifficulty === 'Intermediate' && styles.filterTextActive]}>
                Intermediate
              </Text>
            </Pressable>
            <Pressable 
              style={[styles.filterChip, selectedDifficulty === 'Advanced' && styles.filterChipActive]}
              onPress={() => setSelectedDifficulty('Advanced')}
            >
              <Text style={[styles.filterText, selectedDifficulty === 'Advanced' && styles.filterTextActive]}>
                Advanced
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Lessons List */}
        <View style={styles.lessonsSection}>
          {filteredLessons.map((lesson) => (
            <Pressable 
              key={lesson.id} 
              style={styles.lessonCard}
              onPress={() => router.push({
                pathname: '/lesson-detail',
                params: { id: lesson.id, title: lesson.title },
              })}
            >
              {/* Thumbnail */}
              <View style={styles.lessonThumbnail}>
                <MaterialIcons name="play-circle-filled" size={32} color={colors.primary} />
                <View style={styles.lessonDuration}>
                  <Text style={styles.lessonDurationText}>{lesson.duration}</Text>
                </View>
                {lesson.completed && (
                  <View style={styles.completedBadge}>
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.lessonInfo}>
                <View style={styles.lessonHeader}>
                  <View style={styles.lessonBadge}>
                    <Text style={styles.lessonBadgeText}>{lesson.difficulty.toUpperCase()}</Text>
                  </View>
                </View>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.lessonDescription}>{lesson.description}</Text>
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
  header: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.h2,
    color: colors.text,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statsText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  progressBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  progressText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  progressLabel: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  searchPlaceholder: {
    color: colors.textMuted,
    fontSize: 16,
  },
  filtersSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  filterTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  filters: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  lessonsSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  lessonCard: {
    marginBottom: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  lessonThumbnail: {
    height: 180,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  lessonDuration: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  lessonDurationText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0, 200, 83, 0.9)',
    padding: 4,
    borderRadius: borderRadius.full,
  },
  lessonInfo: {
    padding: spacing.md,
  },
  lessonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  lessonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.sm,
  },
  lessonBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '700',
  },
  lessonTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  lessonDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
});
