import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

const PRESETS = ['All Chords', 'Open Chords', 'Barre Chords', 'Power Chords'];
const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SHAPES = ['All Shapes', 'CAGED', 'Moveable'];
const TYPES = ['All Types', 'Major', 'Minor', 'Seventh', 'Extended'];

export default function ChordsSetupScreen() {
  const router = useRouter();
  const [selectedPreset, setSelectedPreset] = useState('All Chords');
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedShape, setSelectedShape] = useState('All Shapes');
  const [selectedType, setSelectedType] = useState('All Types');

  const availableChords = 124;

  const handleStartPractice = () => {
    router.push('/chord-practice');
  };

  const handleBrowseLibrary = () => {
    router.push('/chord-library');
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
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="music-note" size={24} color={colors.primary} />
            <Text style={styles.badge}>Guitar Chord Trainer</Text>
          </View>

          <Text style={styles.title}>
            Master Every Chord.{'\n'}
            <Text style={styles.titleAccent}>One Fret at a Time.</Text>
          </Text>

          <Text style={styles.description}>
            Challenge yourself with timed chord reveals. Pick a category, set your timer, and test how well you know your fretboard.
          </Text>

          {/* Easy Start - Presets */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="star" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>EASY START - Presets</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chips}>
                {PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setSelectedPreset(preset)}
                    style={[
                      styles.chip,
                      selectedPreset === preset && styles.chipActive,
                    ]}
                  >
                    <Text style={[
                      styles.chipText,
                      selectedPreset === preset && styles.chipTextActive,
                    ]}>{preset}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Chords in a Key */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="music-note" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>Chords in a Key</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.chips}>
              {KEYS.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedKey(key === selectedKey ? null : key)}
                  style={[
                    styles.keyChip,
                    selectedKey === key && styles.chipActive,
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    selectedKey === key && styles.chipTextActive,
                  ]}>{key}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* All Shapes */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="category" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>All Shapes</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.chips}>
              {SHAPES.map((shape) => (
                <Pressable
                  key={shape}
                  onPress={() => setSelectedShape(shape)}
                  style={[
                    styles.chip,
                    selectedShape === shape && styles.chipActive,
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    selectedShape === shape && styles.chipTextActive,
                  ]}>{shape}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Types */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="grid-view" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>Types</Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.chips}>
              {TYPES.map((type) => (
                <Pressable
                  key={type}
                  onPress={() => setSelectedType(type)}
                  style={[
                    styles.chip,
                    selectedType === type && styles.chipActive,
                  ]}
                >
                  <Text style={[
                    styles.chipText,
                    selectedType === type && styles.chipTextActive,
                  ]}>{type}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Available Chords */}
          <View style={styles.countSection}>
            <Text style={styles.countNumber}>{availableChords}</Text>
            <Text style={styles.countLabel}>chords available</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>

          {/* Ready to Practice */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="play-arrow" size={20} color={colors.primary} />
              <Text style={styles.summaryTitle}>READY TO PRACTICE</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Category</Text>
              <Text style={styles.summaryValue}>All Chords</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Type</Text>
              <Text style={styles.summaryValue}>All Types</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Key</Text>
              <Text style={styles.summaryValue}>All</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Available chords</Text>
              <Text style={styles.summaryValue}>{availableChords}</Text>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={handleStartPractice}>
            <MaterialIcons name="play-arrow" size={24} color="#000" />
            <Text style={styles.startButtonText}>START PRACTICE</Text>
          </Pressable>

          <Pressable style={styles.libraryButton} onPress={handleBrowseLibrary}>
            <MaterialIcons name="library-music" size={20} color={colors.text} />
            <Text style={styles.libraryButtonText}>Browse Chord Library</Text>
          </Pressable>
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
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  titleAccent: {
    color: colors.primary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  sectionLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#000',
  },
  keyChip: {
    width: 44,
    height: 44,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  countSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  countNumber: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.primary,
  },
  countLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: spacing.md,
  },
  progressBar: {
    width: 200,
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  libraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  libraryButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
});
