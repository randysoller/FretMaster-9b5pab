import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface Triad {
  id: string;
  name: string;
  fullName: string;
  type: string;
  intervals: string;
  notes: string[];
}

const TRIADS: Triad[] = [
  { id: 't1', name: 'C', fullName: 'C Major Triad', type: 'Major', intervals: '1-3-5', notes: ['C', 'E', 'G'] },
  { id: 't2', name: 'Cm', fullName: 'C Minor Triad', type: 'Minor', intervals: '1-♭3-5', notes: ['C', 'E♭', 'G'] },
  { id: 't3', name: 'Cdim', fullName: 'C Diminished Triad', type: 'Diminished', intervals: '1-♭3-♭5', notes: ['C', 'E♭', 'G♭'] },
  { id: 't4', name: 'Caug', fullName: 'C Augmented Triad', type: 'Augmented', intervals: '1-3-♯5', notes: ['C', 'E', 'G♯'] },
  { id: 't5', name: 'D', fullName: 'D Major Triad', type: 'Major', intervals: '1-3-5', notes: ['D', 'F♯', 'A'] },
  { id: 't6', name: 'Dm', fullName: 'D Minor Triad', type: 'Minor', intervals: '1-♭3-5', notes: ['D', 'F', 'A'] },
  { id: 't7', name: 'E', fullName: 'E Major Triad', type: 'Major', intervals: '1-3-5', notes: ['E', 'G♯', 'B'] },
  { id: 't8', name: 'Em', fullName: 'E Minor Triad', type: 'Minor', intervals: '1-♭3-5', notes: ['E', 'G', 'B'] },
  { id: 't9', name: 'F', fullName: 'F Major Triad', type: 'Major', intervals: '1-3-5', notes: ['F', 'A', 'C'] },
  { id: 't10', name: 'Fm', fullName: 'F Minor Triad', type: 'Minor', intervals: '1-♭3-5', notes: ['F', 'A♭', 'C'] },
];

export default function TriadLibraryScreen() {
  const router = useRouter();
  const [selectedTriad, setSelectedTriad] = useState<Triad | null>(null);

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Major': return '#4DB8E8';
      case 'Minor': return '#8B5CF6';
      case 'Diminished': return '#EF4444';
      case 'Augmented': return '#F59E0B';
      default: return colors.primary;
    }
  };

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
        <Text style={styles.title}>Triad Library</Text>
        <Text style={styles.subtitle}>
          Browse {TRIADS.length} essential three-note chord structures
        </Text>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{TRIADS.length} triads</Text>
      </View>

      {/* Triad List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.triadList}
        contentContainerStyle={styles.triadListContent}
      >
        {TRIADS.map((triad, index) => (
          <Pressable
            key={triad.id}
            style={styles.card}
            onPress={() => setSelectedTriad(triad)}
          >
            <Text style={styles.cardNumber}>{index + 1 < 10 ? `0${index + 1}` : index + 1}</Text>
            
            <View style={styles.cardContent}>
              <View style={[styles.triadIcon, { backgroundColor: getTypeColor(triad.type) + '20' }]}>
                <MaterialIcons name="change-history" size={32} color={getTypeColor(triad.type)} />
              </View>

              <View style={styles.triadInfo}>
                <Text style={styles.triadName}>{triad.name}</Text>
                <Text style={styles.triadFullName}>{triad.fullName}</Text>
                <View style={styles.typeTag}>
                  <Text style={[styles.typeText, { color: getTypeColor(triad.type) }]}>
                    {triad.type}
                  </Text>
                </View>
              </View>

              <View style={styles.notesBox}>
                <Text style={styles.notesLabel}>Notes</Text>
                {triad.notes.map((note, i) => (
                  <Text key={i} style={styles.noteText}>{note}</Text>
                ))}
                <Text style={styles.intervalsText}>{triad.intervals}</Text>
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
    color: '#8B5CF6',
    fontSize: 14,
    fontWeight: '700',
  },
  triadList: {
    flex: 1,
  },
  triadListContent: {
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
  triadIcon: {
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triadInfo: {
    flex: 1,
  },
  triadName: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  triadFullName: {
    fontSize: 13,
    color: '#AAA',
    marginBottom: 6,
  },
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  typeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  notesBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  notesLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#666',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  noteText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    marginBottom: 2,
  },
  intervalsText: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
    fontFamily: 'monospace',
  },
});
