import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';

const KEYS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const SCALE_TYPES = [
  { name: 'Major (Ionian)', mode: 'major' },
  { name: 'Minor (Aeolian)', mode: 'minor' },
  { name: 'Dorian', mode: 'dorian' },
  { name: 'Phrygian', mode: 'phrygian' },
  { name: 'Lydian', mode: 'lydian' },
  { name: 'Mixolydian', mode: 'mixolydian' },
  { name: 'Locrian', mode: 'locrian' },
  { name: 'Pentatonic Major', mode: 'pentatonic-major' },
  { name: 'Pentatonic Minor', mode: 'pentatonic-minor' },
  { name: 'Blues', mode: 'blues' },
];

const POSITIONS = ['Position 1', 'Position 2', 'Position 3', 'Position 4', 'Position 5'];

export default function ScalesScreen() {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState('C');
  const [selectedScale, setSelectedScale] = useState('Major (Ionian)');
  const [selectedPosition, setSelectedPosition] = useState('Position 1');

  const handleStartPractice = () => {
    router.push({
      pathname: '/scales-practice',
      params: {
        key: selectedKey,
        scale: selectedScale,
        position: selectedPosition,
      },
    });
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
            <MaterialIcons name="show-chart" size={24} color={colors.info} />
            <Text style={styles.badge}>Scale Trainer</Text>
          </View>

          <Text style={styles.title}>
            Master <Text style={styles.titleAccent}>Scales</Text>
          </Text>

          <Text style={styles.description}>
            Learn scale patterns, positions, and modes. Practice identifying scale degrees and intervals on the fretboard.
          </Text>

          {/* Select Key */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SELECT KEY</Text>
            <View style={styles.keyGrid}>
              {KEYS.map((key) => (
                <Pressable
                  key={key}
                  onPress={() => setSelectedKey(key)}
                  style={[
                    styles.keyButton,
                    selectedKey === key && styles.keyButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.keyButtonText,
                    selectedKey === key && styles.keyButtonTextActive,
                  ]}>{key}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Select Scale Type */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>SCALE / MODE</Text>
            {SCALE_TYPES.map((scale) => (
              <Pressable
                key={scale.name}
                onPress={() => setSelectedScale(scale.name)}
                style={[
                  styles.scaleCard,
                  selectedScale === scale.name && styles.scaleCardActive,
                ]}
              >
                <Text style={[
                  styles.scaleCardText,
                  selectedScale === scale.name && styles.scaleCardTextActive,
                ]}>{scale.name}</Text>
                {selectedScale === scale.name && (
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                )}
              </Pressable>
            ))}
          </View>

          {/* Select Position */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FRETBOARD POSITION</Text>
            <View style={styles.positionGrid}>
              {POSITIONS.map((position) => (
                <Pressable
                  key={position}
                  onPress={() => setSelectedPosition(position)}
                  style={[
                    styles.positionButton,
                    selectedPosition === position && styles.positionButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.positionButtonText,
                    selectedPosition === position && styles.positionButtonTextActive,
                  ]}>{position}</Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Ready to Practice */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="play-arrow" size={20} color={colors.primary} />
              <Text style={styles.summaryTitle}>READY TO PRACTICE</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Key</Text>
              <Text style={styles.summaryValue}>{selectedKey}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Scale</Text>
              <Text style={styles.summaryValue}>{selectedScale}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Position</Text>
              <Text style={styles.summaryValue}>{selectedPosition}</Text>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={handleStartPractice}>
            <MaterialIcons name="play-arrow" size={24} color="#000" />
            <Text style={styles.startButtonText}>START PRACTICE</Text>
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
  },
  titleAccent: {
    color: colors.info,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  section: {
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
  keyGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  keyButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  keyButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  keyButtonText: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  keyButtonTextActive: {
    color: '#000',
  },
  scaleCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  scaleCardActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    borderColor: colors.info,
  },
  scaleCardText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  scaleCardTextActive: {
    color: colors.info,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  positionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  positionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  positionButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  positionButtonTextActive: {
    color: '#000',
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
});
