import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChordCard } from '@/components/feature/ChordCard';
import { ChordDetailModal } from '@/components/feature/ChordDetailModal';
import { CHORDS, ChordData, ChordShape, ChordType } from '@/constants/musicData';
import { audioService } from '@/services/audioService';

type ShapeFilter = 'all' | ChordShape;
type TypeFilter = 'all' | ChordType;

const SHAPE_FILTERS: { label: string; value: ShapeFilter }[] = [
  { label: 'All Chords', value: 'all' },
  { label: 'Open Chords', value: 'open' },
  { label: 'Barre Chords', value: 'barre' },
  { label: 'Movable Chords', value: 'movable' },
];

const TYPE_FILTERS: { label: string; value: TypeFilter }[] = [
  { label: 'All Types', value: 'all' },
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
  { label: 'Augmented', value: 'augmented' },
  { label: 'Diminished', value: 'diminished' },
  { label: 'Suspended', value: 'suspended' },
  { label: 'Major 7th', value: 'major7' },
  { label: 'Dominant 7th', value: 'dominant7' },
  { label: 'Minor 7th', value: 'minor7' },
  { label: '9th Chords', value: 'ninth' },
  { label: '11th Chords', value: 'eleventh' },
  { label: '13th Chords', value: 'thirteenth' },
  { label: 'Slash Chords', value: 'slash' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedShape, setSelectedShape] = useState<ShapeFilter>('all');
  const [selectedType, setSelectedType] = useState<TypeFilter>('all');
  const [selectedChord, setSelectedChord] = useState<ChordData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter chords based on selected categories
  const filteredChords = CHORDS.filter(chord => {
    const shapeMatch = selectedShape === 'all' || chord.shape === selectedShape;
    const typeMatch = selectedType === 'all' || chord.type === selectedType;
    return shapeMatch && typeMatch;
  });

  const handleChordPress = (chord: ChordData) => {
    setSelectedChord(chord);
    setShowDetailModal(true);
  };

  const handlePlayChord = () => {
    if (selectedChord) {
      audioService.playChordPreview(selectedChord.name);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Chord Study</Text>
        <Text style={styles.subtitle}>
          Select chord categories to study
        </Text>
      </View>

      {/* Shape Filter (Level 1) */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>CHORD SHAPE</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {SHAPE_FILTERS.map(filter => (
            <Pressable
              key={filter.value}
              onPress={() => setSelectedShape(filter.value)}
              style={[
                styles.filterChip,
                selectedShape === filter.value && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                selectedShape === filter.value && styles.filterChipTextActive,
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Type Filter (Level 2) */}
      <View style={styles.filterSection}>
        <Text style={styles.filterLabel}>CHORD TYPE</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChips}
        >
          {TYPE_FILTERS.map(filter => (
            <Pressable
              key={filter.value}
              onPress={() => setSelectedType(filter.value)}
              style={[
                styles.filterChip,
                selectedType === filter.value && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                selectedType === filter.value && styles.filterChipTextActive,
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Results Count */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {filteredChords.length} chord{filteredChords.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Chord List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.chordList}
        contentContainerStyle={styles.chordListContent}
      >
        {filteredChords.length > 0 ? (
          filteredChords.map((chord, index) => (
            <ChordCard
              key={chord.name + index}
              chord={chord}
              cardNumber={index + 1}
              onPress={() => handleChordPress(chord)}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              No chords match the selected filters
            </Text>
            <Text style={styles.emptyStateSubtext}>
              Try selecting different categories
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Chord Detail Modal */}
      <ChordDetailModal
        visible={showDetailModal}
        chord={selectedChord}
        onClose={() => setShowDetailModal(false)}
        onPlay={handlePlayChord}
        onEdit={() => {}}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    lineHeight: 20,
  },
  filterSection: {
    marginTop: 20,
  },
  filterLabel: {
    paddingHorizontal: 20,
    fontSize: 11,
    fontWeight: '700',
    color: '#666',
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  filterChips: {
    paddingHorizontal: 20,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  filterChipActive: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },
  filterChipText: {
    color: '#CCC',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#000',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  resultsCount: {
    color: '#FF8C42',
    fontSize: 14,
    fontWeight: '700',
  },
  chordList: {
    flex: 1,
  },
  chordListContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#666',
    fontSize: 14,
  },
});
