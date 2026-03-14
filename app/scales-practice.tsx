import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Fretboard } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { NOTES } from '@/constants/musicData';

const SCALE_PATTERNS: { [key: string]: number[] } = {
  'Major (Ionian)': [0, 2, 4, 5, 7, 9, 11],
  'Minor (Aeolian)': [0, 2, 3, 5, 7, 8, 10],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10],
  'Locrian': [0, 1, 3, 5, 6, 8, 10],
  'Pentatonic Major': [0, 2, 4, 7, 9],
  'Pentatonic Minor': [0, 3, 5, 7, 10],
  'Blues': [0, 3, 5, 6, 7, 10],
};

const DEGREE_NAMES = ['1', '2', '3', '4', '5', '6', '7'];

export default function ScalesPracticeScreen() {
  const params = useLocalSearchParams();
  const key = params.key as string || 'C';
  const scale = params.scale as string || 'Major (Ionian)';
  const position = params.position as string || 'Position 1';

  const [showDegrees, setShowDegrees] = useState(true);
  const [highlightRoot, setHighlightRoot] = useState(true);

  const getScaleNotes = () => {
    const rootIndex = NOTES.indexOf(key);
    const intervals = SCALE_PATTERNS[scale] || SCALE_PATTERNS['Major (Ionian)'];
    
    return intervals.map(interval => {
      const noteIndex = (rootIndex + interval) % 12;
      return NOTES[noteIndex];
    });
  };

  const getScalePositions = () => {
    const scaleNotes = getScaleNotes();
    const positions: { string: number; fret: number; degree?: number; isRoot?: boolean }[] = [];

    // Simplified position generation for Position 1 (0-4 frets)
    const startFret = parseInt(position.split(' ')[1]) - 1;
    const fretRange = [startFret * 3, startFret * 3 + 5];

    const stringTuning = ['E', 'A', 'D', 'G', 'B', 'E'];

    stringTuning.forEach((openNote, stringIndex) => {
      const openNoteIndex = NOTES.indexOf(openNote);
      
      for (let fret = fretRange[0]; fret <= fretRange[1]; fret++) {
        const noteIndex = (openNoteIndex + fret) % 12;
        const note = NOTES[noteIndex];
        
        if (scaleNotes.includes(note)) {
          const degree = scaleNotes.indexOf(note);
          positions.push({
            string: stringIndex,
            fret,
            degree,
            isRoot: note === key,
          });
        }
      }
    });

    return positions;
  };

  const scaleNotes = getScaleNotes();
  const scalePositions = getScalePositions();

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Scale Practice',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="show-chart" size={24} color={colors.info} />
            <Text style={styles.badge}>{scale}</Text>
          </View>

          <Text style={styles.title}>{key} {scale}</Text>

          {/* Scale Notes */}
          <View style={styles.notesSection}>
            <Text style={styles.sectionLabel}>SCALE NOTES</Text>
            <View style={styles.noteChips}>
              {scaleNotes.map((note, index) => (
                <View key={index} style={[
                  styles.noteChip,
                  index === 0 && styles.noteChipRoot,
                ]}>
                  <Text style={[
                    styles.noteChipText,
                    index === 0 && styles.noteChipTextRoot,
                  ]}>{note}</Text>
                  {showDegrees && (
                    <Text style={[
                      styles.noteChipDegree,
                      index === 0 && styles.noteChipDegreeRoot,
                    ]}>{DEGREE_NAMES[index]}</Text>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Display Options */}
          <View style={styles.optionsSection}>
            <Pressable 
              style={[styles.option, showDegrees && styles.optionActive]}
              onPress={() => setShowDegrees(!showDegrees)}
            >
              <MaterialIcons 
                name={showDegrees ? 'check-box' : 'check-box-outline-blank'} 
                size={20} 
                color={showDegrees ? colors.success : colors.textMuted} 
              />
              <Text style={styles.optionText}>Show Degrees</Text>
            </Pressable>

            <Pressable 
              style={[styles.option, highlightRoot && styles.optionActive]}
              onPress={() => setHighlightRoot(!highlightRoot)}
            >
              <MaterialIcons 
                name={highlightRoot ? 'check-box' : 'check-box-outline-blank'} 
                size={20} 
                color={highlightRoot ? colors.success : colors.textMuted} 
              />
              <Text style={styles.optionText}>Highlight Root</Text>
            </Pressable>
          </View>

          {/* Fretboard Visualization */}
          <View style={styles.fretboardSection}>
            <Text style={styles.sectionLabel}>{position.toUpperCase()}</Text>
            <Fretboard
              highlightedPositions={scalePositions}
              numFrets={12}
            />
          </View>

          {/* Scale Info */}
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pattern:</Text>
              <Text style={styles.infoValue}>W-W-H-W-W-W-H</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Notes:</Text>
              <Text style={styles.infoValue}>{scaleNotes.length}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position:</Text>
              <Text style={styles.infoValue}>{position}</Text>
            </View>
          </View>

          {/* Practice Challenges */}
          <View style={styles.challengesSection}>
            <Text style={styles.sectionTitle}>PRACTICE CHALLENGES</Text>
            
            <Pressable style={styles.challengeCard}>
              <View style={styles.challengeIcon}>
                <MaterialIcons name="search" size={24} color={colors.primary} />
              </View>
              <View style={styles.challengeContent}>
                <Text style={styles.challengeTitle}>Find the Root</Text>
                <Text style={styles.challengeDescription}>
                  Locate all root notes in this position
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.challengeCard}>
              <View style={styles.challengeIcon}>
                <MaterialIcons name="format-list-numbered" size={24} color={colors.info} />
              </View>
              <View style={styles.challengeContent}>
                <Text style={styles.challengeTitle}>Identify Degrees</Text>
                <Text style={styles.challengeDescription}>
                  Name the scale degree for each position
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={colors.textMuted} />
            </Pressable>

            <Pressable style={styles.challengeCard}>
              <View style={styles.challengeIcon}>
                <MaterialIcons name="straighten" size={24} color={colors.success} />
              </View>
              <View style={styles.challengeContent}>
                <Text style={styles.challengeTitle}>Interval Training</Text>
                <Text style={styles.challengeDescription}>
                  Practice intervals within the scale
                </Text>
              </View>
              <MaterialIcons name="arrow-forward" size={20} color={colors.textMuted} />
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  badge: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  notesSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  noteChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  noteChip: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
  },
  noteChipRoot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  noteChipText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  noteChipTextRoot: {
    color: '#000',
  },
  noteChipDegree: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  noteChipDegreeRoot: {
    color: 'rgba(0,0,0,0.6)',
  },
  optionsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  optionActive: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  fretboardSection: {
    marginBottom: spacing.xl,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  infoValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  challengesSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  challengeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  challengeContent: {
    flex: 1,
  },
  challengeTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  challengeDescription: {
    color: colors.textSecondary,
    fontSize: 13,
  },
});
