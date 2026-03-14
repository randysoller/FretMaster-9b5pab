import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordCard } from '@/components/feature/ChordCard';
import { ChordDetailModal } from '@/components/feature/ChordDetailModal';
import { CHORDS, ChordData, ChordShape, ChordType } from '@/constants/musicData';
import { audioService } from '@/services/audioService';
import { colors, spacing, borderRadius, opacity } from '@/constants/theme';

const FILTER_TYPES = [
  { label: 'All', value: 'all', icon: null },
  { label: 'Open', value: 'open', icon: 'check' as const },
  { label: 'Barre', value: 'barre', icon: 'horizontal-rule' as const },
  { label: 'Movable', value: 'movable', icon: 'open-with' as const },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedChords, setSelectedChords] = useState<Set<string>>(new Set());
  const [selectedChord, setSelectedChord] = useState<ChordData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter chords
  const filteredChords = CHORDS.filter(chord => {
    if (searchQuery && !chord.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (selectedFilter === 'all') return true;
    return chord.shape === selectedFilter;
  });

  const toggleChordSelection = (chordName: string) => {
    const newSelection = new Set(selectedChords);
    if (newSelection.has(chordName)) {
      newSelection.delete(chordName);
    } else {
      newSelection.add(chordName);
    }
    setSelectedChords(newSelection);
  };

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
        <Text style={styles.title}>Chord Library</Text>
        <Text style={styles.subtitle}>
          Browse all {CHORDS.length} chord diagrams - tap the checkbox to select chords for a practice preset
        </Text>
      </View>

      {/* Preset Selector */}
      <Pressable style={styles.presetSelector}>
        <MaterialIcons name="folder-open" size={18} color="#888" />
        <Text style={styles.presetText}>EASY START - Presets</Text>
        <MaterialIcons name="keyboard-arrow-down" size={20} color="#888" />
      </Pressable>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chords..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={18} color="#666" />
            </Pressable>
          )}
        </View>
        <Pressable style={styles.filterButton}>
          <MaterialIcons name="tune" size={20} color="#888" />
        </Pressable>
      </View>

      {/* Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {FILTER_TYPES.map(filter => (
          <Pressable
            key={filter.value}
            onPress={() => setSelectedFilter(filter.value)}
            style={[
              styles.filterChip,
              selectedFilter === filter.value && styles.filterChipActive,
            ]}
          >
            {filter.icon && (
              <MaterialIcons 
                name={filter.icon} 
                size={14} 
                color={selectedFilter === filter.value ? '#000' : '#888'} 
              />
            )}
            <Text style={[
              styles.filterChipText,
              selectedFilter === filter.value && styles.filterChipTextActive,
            ]}>
              {filter.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Results Count & Legend */}
      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>{filteredChords.length} chords</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={styles.legendDotOrange} />
            <Text style={styles.legendText}>Finger Position</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.legendDotBlue} />
            <Text style={styles.legendText}>Root Note</Text>
          </View>
        </View>
      </View>

      {/* Chord List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.chordList}
        contentContainerStyle={styles.chordListContent}
      >
        {filteredChords.map((chord, index) => (
          <ChordCard
            key={chord.name}
            chord={chord}
            cardNumber={index + 1}
            isSelected={selectedChords.has(chord.name)}
            onPress={() => handleChordPress(chord)}
            onCheckboxPress={() => toggleChordSelection(chord.name)}
          />
        ))}
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
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
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
    color: colors.textSubtle,
    lineHeight: 20,
  },
  presetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetText: {
    flex: 1,
    fontSize: 14,
    color: colors.textSubtle,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filtersContainer: {
    marginTop: 12,
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: `rgba(212, 149, 42, ${opacity.activeBackground})`,
    borderColor: `rgba(212, 149, 42, ${opacity.activeBorder})`,
  },
  filterChipText: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.md,
  },
  resultsCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    gap: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotOrange: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  legendDotBlue: {
    width: 12,
    height: 12,
    backgroundColor: colors.rootNoteBlue,
    transform: [{ rotate: '45deg' }],
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  chordList: {
    flex: 1,
  },
  chordListContent: {
    paddingHorizontal: spacing.base,
    paddingBottom: 20,
  },
});
