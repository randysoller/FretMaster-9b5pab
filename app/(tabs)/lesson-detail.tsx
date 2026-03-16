import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

export default function LessonDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [isCompleted, setIsCompleted] = useState(false);

  const lesson = {
    id: params.id || '1',
    title: params.title || 'Getting Started with Guitar',
    description: 'Learn the basics of holding a guitar, proper finger positioning, and your first chord.',
    duration: '12:30',
    difficulty: 'Beginner',
    sections: [
      { title: 'Introduction', duration: '1:30' },
      { title: 'Proper Posture', duration: '3:00' },
      { title: 'Finger Positioning', duration: '4:00' },
      { title: 'Your First Chord - C Major', duration: '4:00' },
    ],
    skills: ['Posture', 'C Major Chord', 'Finger Position'],
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: '',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Video Placeholder */}
          <View style={styles.videoPlaceholder}>
            <MaterialIcons name="play-circle-outline" size={64} color={colors.textMuted} />
            <Text style={styles.videoText}>Video Player</Text>
            <Text style={styles.videoDuration}>{lesson.duration}</Text>
          </View>

          {/* Lesson Info */}
          <View style={styles.infoSection}>
            <View style={styles.badges}>
              <View style={[styles.badge, styles.badgeDifficulty]}>
                <Text style={styles.badgeText}>{lesson.difficulty.toUpperCase()}</Text>
              </View>
              <View style={styles.badge}>
                <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                <Text style={styles.badgeText}>{lesson.duration}</Text>
              </View>
            </View>

            <Text style={styles.title}>{lesson.title}</Text>
            <Text style={styles.description}>{lesson.description}</Text>

            {/* Skills Learned */}
            <View style={styles.skillsSection}>
              <Text style={styles.sectionTitle}>SKILLS YOU'LL LEARN</Text>
              <View style={styles.skills}>
                {lesson.skills.map((skill, index) => (
                  <View key={index} style={styles.skillChip}>
                    <MaterialIcons name="check" size={14} color={colors.success} />
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Lesson Sections */}
            <View style={styles.sectionsSection}>
              <Text style={styles.sectionTitle}>LESSON SECTIONS</Text>
              {lesson.sections.map((section, index) => (
                <Pressable key={index} style={styles.sectionItem}>
                  <View style={styles.sectionNumber}>
                    <Text style={styles.sectionNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.sectionInfo}>
                    <Text style={styles.sectionItemTitle}>{section.title}</Text>
                    <Text style={styles.sectionDuration}>{section.duration}</Text>
                  </View>
                  <MaterialIcons name="play-arrow" size={20} color={colors.primary} />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable 
              style={[styles.completeButton, isCompleted && styles.completeButtonCompleted]}
              onPress={() => setIsCompleted(!isCompleted)}
            >
              <MaterialIcons 
                name={isCompleted ? 'check-circle' : 'radio-button-unchecked'} 
                size={20} 
                color={isCompleted ? colors.success : colors.text} 
              />
              <Text style={[styles.completeButtonText, isCompleted && styles.completeButtonTextCompleted]}>
                {isCompleted ? 'Completed' : 'Mark as Complete'}
              </Text>
            </Pressable>

            <Pressable style={styles.practiceButton}>
              <MaterialIcons name="music-note" size={20} color="#000" />
              <Text style={styles.practiceButtonText}>Practice This Chord</Text>
            </Pressable>
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
  videoPlaceholder: {
    height: 240,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
  },
  videoDuration: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  infoSection: {
    padding: spacing.lg,
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  badgeDifficulty: {
    backgroundColor: colors.primary,
  },
  badgeText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  skillsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  skills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  skillChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.success,
  },
  skillText: {
    color: colors.text,
    fontSize: 13,
  },
  sectionsSection: {
    marginBottom: spacing.lg,
  },
  sectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionNumberText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionInfo: {
    flex: 1,
  },
  sectionItemTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  sectionDuration: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  actions: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  completeButtonCompleted: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
    borderColor: colors.success,
  },
  completeButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  completeButtonTextCompleted: {
    color: colors.success,
  },
  practiceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  practiceButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
});
