import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordCard } from '@/components/feature/ChordCard';
import { ChordDetailModal } from '@/components/feature/ChordDetailModal';
import { CHORDS, ChordData, ChordShape, ChordType } from '@/constants/musicData';
import { audioService } from '@/services/audioService';

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
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#888',
    lineHeight: 18,
  },
  presetSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  presetText: {
    flex: 1,
    fontSize: 14,
    color: '#CCC',
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 8,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    paddingVertical: 0,
  },
  filterButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filtersContainer: {
    marginTop: 12,
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  filterChipActive: {
    backgroundColor: '#FFA055',
    borderColor: '#FFA055',
  },
  filterChipText: {
    color: '#CCC',
    fontSize: 13,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#000',
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  resultsCount: {
    color: '#FFA055',
    fontSize: 13,
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
    backgroundColor: '#FFA055',
  },
  legendDotBlue: {
    width: 12,
    height: 12,
    backgroundColor: '#3B82F6',
    transform: [{ rotate: '45deg' }],
  },
  legendText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
  chordList: {
    flex: 1,
  },
  chordListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
});
