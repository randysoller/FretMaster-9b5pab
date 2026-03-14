import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordCard } from '@/components/feature/ChordCard';
import { ChordDetailModal } from '@/components/feature/ChordDetailModal';
import { TypeFilterDropdown } from '@/components/feature/TypeFilterDropdown';
import { PresetDropdown } from '@/components/feature/PresetDropdown';
import { CHORD_DATA, ChordData, ChordShape, BarreRoot } from '@/constants/musicData';
import { useChordLibrary } from '@/contexts/ChordLibraryContext';
import { audioService } from '@/services/audioService';
import { colors, spacing, borderRadius, opacity } from '@/constants/theme';

const CATEGORY_FILTERS: { label: string; value: ChordShape | 'all'; icon: any }[] = [
  { label: 'All', value: 'all', icon: null },
  { label: 'Open', value: 'open', icon: 'check' },
  { label: 'Barre', value: 'barre', icon: 'horizontal-rule' },
  { label: 'Movable', value: 'movable', icon: 'open-with' },
];

const BARRE_ROOT_FILTERS: { label: string; value: BarreRoot }[] = [
  { label: '6th', value: '6th' },
  { label: '5th', value: '5th' },
  { label: '4th', value: '4th' },
];

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const [selectedChord, setSelectedChord] = useState<ChordData | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  
  const {
    filterCategories,
    filterTypes,
    filterBarreRoots,
    searchQuery,
    selectedChordIds,
    toggleCategory,
    toggleBarreRoot,
    setSearchQuery,
    toggleChordSelection,
    clearSelectedChords,
    clearAll,
  } = useChordLibrary();

  // Filter chords with three-tier logic
  const filteredChords = useMemo(() => {
    return CHORD_DATA.filter(chord => {
      // Search query
      if (searchQuery && !chord.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      
      // Category filter (shape)
      if (filterCategories.length > 0 && !filterCategories.includes(chord.shape)) {
        return false;
      }
      
      // Type filter
      if (filterTypes.length > 0 && !filterTypes.includes(chord.type)) {
        return false;
      }
      
      // Barre root filter (only applies if barre/movable selected)
      const hasBM = filterCategories.includes('barre') || filterCategories.includes('movable');
      if (hasBM && filterBarreRoots.length > 0) {
        if (!chord.rootString || !filterBarreRoots.includes(chord.rootString)) {
          return false;
        }
      }
      
      return true;
    });
  }, [searchQuery, filterCategories, filterTypes, filterBarreRoots]);
  
  // Show barre root filter if barre/movable is selected
  const showBarreRootFilter = filterCategories.includes('barre') || filterCategories.includes('movable');
  
  // Check if any filters are active
  const hasActiveFilters = filterCategories.length > 0 || filterTypes.length > 0 || filterBarreRoots.length > 0 || searchQuery.length > 0;

  const handleCategoryToggle = (value: ChordShape | 'all') => {
    if (value === 'all') {
      clearAll();
    } else {
      toggleCategory(value);
    }
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
          Browse all {CHORD_DATA.length} chord diagrams - tap the checkbox to select chords for a practice preset
        </Text>
      </View>

      {/* Preset Selector */}
      <View style={styles.presetRow}>
        <PresetDropdown />
      </View>

      {/* Search & Type Filter */}
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
        <TypeFilterDropdown />
      </View>

      {/* Category Filter Chips */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {CATEGORY_FILTERS.map(filter => {
          const isActive = filter.value === 'all' 
            ? filterCategories.length === 0
            : filterCategories.includes(filter.value as ChordShape);
          
          return (
            <Pressable
              key={filter.value}
              onPress={() => handleCategoryToggle(filter.value)}
              style={[
                styles.filterChip,
                isActive && styles.filterChipActive,
              ]}
            >
              {filter.icon && (
                <MaterialIcons 
                  name={filter.icon} 
                  size={14} 
                  color={isActive ? colors.primary : '#888'} 
                />
              )}
              <Text style={[
                styles.filterChipText,
                isActive && styles.filterChipTextActive,
              ]}>
                {filter.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      
      {/* Barre Root Filter (only shown when barre/movable selected) */}
      {showBarreRootFilter && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.barreRootContainer}
          contentContainerStyle={styles.filtersContent}
        >
          <Text style={styles.barreRootLabel}>Root String:</Text>
          {BARRE_ROOT_FILTERS.map(filter => {
            const isActive = filterBarreRoots.includes(filter.value);
            
            return (
              <Pressable
                key={filter.value}
                onPress={() => toggleBarreRoot(filter.value)}
                style={[
                  styles.filterChip,
                  styles.barreRootChip,
                  isActive && styles.filterChipActive,
                ]}
              >
                <Text style={[
                  styles.filterChipText,
                  isActive && styles.filterChipTextActive,
                ]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Results Count & Actions */}
      <View style={styles.resultsHeader}>
        <View style={styles.resultsLeft}>
          <Text style={styles.resultsCount}>{filteredChords.length} chords</Text>
          {hasActiveFilters && (
            <Pressable onPress={clearAll} style={styles.clearButton}>
              <MaterialIcons name="close" size={14} color={colors.textMuted} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          )}
        </View>
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

      {/* Selected Actions Bar */}
      {selectedChordIds.length > 0 && (
        <View style={styles.selectionBar}>
          <View style={styles.selectionLeft}>
            <MaterialIcons name="check-circle" size={20} color={colors.primary} />
            <Text style={styles.selectionCount}>{selectedChordIds.length} selected</Text>
          </View>
          <View style={styles.selectionActions}>
            <Pressable onPress={clearSelectedChords} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Chord List */}
      <ScrollView 
        showsVerticalScrollIndicator={false} 
        style={styles.chordList}
        contentContainerStyle={styles.chordListContent}
      >
        {filteredChords.map((chord, index) => (
          <ChordCard
            key={chord.id}
            chord={chord}
            cardNumber={index + 1}
            isSelected={selectedChordIds.includes(chord.id)}
            onPress={() => handleChordPress(chord)}
            onCheckboxPress={() => toggleChordSelection(chord.id)}
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
  presetRow: {
    marginHorizontal: spacing.base,
    marginTop: spacing.base,
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
  barreRootContainer: {
    marginTop: spacing.sm,
    maxHeight: 50,
  },
  barreRootLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    alignSelf: 'center',
    marginRight: spacing.sm,
  },
  barreRootChip: {
    minWidth: 50,
    justifyContent: 'center',
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
  resultsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  resultsCount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.bgOverlay,
    borderRadius: borderRadius.sm,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
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
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.bgOverlay,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSubtle,
  },
});
