import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface Scale {
  id: string;
  name: string;
  fullName: string;
  intervals: number[];
  pattern: string;
}

const SCALES: Scale[] = [
  { id: 's1', name: 'Major', fullName: 'Major Scale', intervals: [0, 2, 4, 5, 7, 9, 11], pattern: 'W-W-H-W-W-W-H' },
  { id: 's2', name: 'Minor', fullName: 'Natural Minor', intervals: [0, 2, 3, 5, 7, 8, 10], pattern: 'W-H-W-W-H-W-W' },
  { id: 's3', name: 'Pent Maj', fullName: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9], pattern: 'W-W-m3-W-m3' },
  { id: 's4', name: 'Pent Min', fullName: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10], pattern: 'm3-W-W-m3-W' },
  { id: 's5', name: 'Blues', fullName: 'Blues Scale', intervals: [0, 3, 5, 6, 7, 10], pattern: 'm3-W-H-H-m3-W' },
  { id: 's6', name: 'Dorian', fullName: 'Dorian Mode', intervals: [0, 2, 3, 5, 7, 9, 10], pattern: 'W-H-W-W-W-H-W' },
  { id: 's7', name: 'Phrygian', fullName: 'Phrygian Mode', intervals: [0, 1, 3, 5, 7, 8, 10], pattern: 'H-W-W-W-H-W-W' },
  { id: 's8', name: 'Lydian', fullName: 'Lydian Mode', intervals: [0, 2, 4, 6, 7, 9, 11], pattern: 'W-W-W-H-W-W-H' },
  { id: 's9', name: 'Mixolydian', fullName: 'Mixolydian Mode', intervals: [0, 2, 4, 5, 7, 9, 10], pattern: 'W-W-H-W-W-H-W' },
  { id: 's10', name: 'Harm Min', fullName: 'Harmonic Minor', intervals: [0, 2, 3, 5, 7, 8, 11], pattern: 'W-H-W-W-H-A2-H' },
];

export default function ScaleLibraryScreen() {
  const router = useRouter();
  const [selectedScale, setSelectedScale] = useState<Scale | null>(null);

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <View style={styles.backBar}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scale Library</Text>
        <Text style={styles.subtitle}>
          Browse {SCALES.length} essential scales and modes for guitar
        </Text>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{SCALES.length} scales</Text>
      </View>

      {/* Scale List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.scaleList}
        contentContainerStyle={styles.scaleListContent}
      >
        {SCALES.map((scale, index) => (
          <Pressable
            key={scale.id}
            style={styles.card}
            onPress={() => setSelectedScale(scale)}
          >
            <Text style={styles.cardNumber}>{index + 1 < 10 ? `0${index + 1}` : index + 1}</Text>
            
            <View style={styles.cardContent}>
              <View style={styles.scaleDiagram}>
                <MaterialIcons name="show-chart" size={32} color={colors.primary} />
              </View>

              <View style={styles.scaleInfo}>
                <Text style={styles.scaleName}>{scale.name}</Text>
                <Text style={styles.scaleFullName}>{scale.fullName}</Text>
                <Text style={styles.scalePattern}>{scale.pattern}</Text>
              </View>

              <View style={styles.intervalBox}>
                <Text style={styles.intervalLabel}>Intervals</Text>
                <Text style={styles.intervalText}>
                  {scale.intervals.join(' - ')}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
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
    lineHeight: 20,
  },
  resultsHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  resultsCount: {
    color: '#4DB8E8',
    fontSize: 14,
    fontWeight: '700',
  },
  scaleList: {
    flex: 1,
  },
  scaleListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardNumber: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  scaleDiagram: {
    width: 60,
    height: 60,
    backgroundColor: '#0F0F0F',
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scaleInfo: {
    flex: 1,
  },
  scaleName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  scaleFullName: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 4,
  },
  scalePattern: {
    fontSize: 11,
    color: '#888',
    fontFamily: 'monospace',
  },
  intervalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 80,
  },
  intervalLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  intervalText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    fontFamily: 'monospace',
  },
});
