import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChordCard } from '@/components/feature/ChordCard';
import { TypeFilterDropdown } from '@/components/feature/TypeFilterDropdown';
import { PresetDropdown } from '@/components/feature/PresetDropdown';
import { usePresets } from '@/contexts/PresetContext';
import { CHORD_DATA, ChordData, ChordShape, BarreRoot } from '@/constants/musicData';
import { useChordLibrary } from '@/contexts/ChordLibraryContext';
import { colors, spacing, borderRadius } from '@/constants/theme';

const CATEGORY_FILTERS: { label: string; value: ChordShape | 'all' }[] = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Barre', value: 'barre' },
  { label: 'Movable', value: 'movable' },
];

const BARRE_ROOT_FILTERS: { label: string; value: BarreRoot }[] = [
  { label: '6th', value: 6 },
  { label: '5th', value: 5 },
  { label: '4th', value: 4 },
];

const STORAGE_KEY = 'fretmaster-chord-manager-edits';

export default function ChordLibraryScreen() {
  const router = useRouter();
  const { presets, isLoading: presetsLoading } = usePresets();
  const [allChords, setAllChords] = useState<ChordData[]>(CHORD_DATA);
  const [chordsLoading, setChordsLoading] = useState(true);
  const [chordsError, setChordsError] = useState<string | null>(null);

  // Load edited chords from AsyncStorage
  useEffect(() => {
    loadChords();
  }, []);

  const loadChords = async () => {
    setChordsLoading(true);
    setChordsError(null);
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        try {
          const editedChords = JSON.parse(stored);
          
          // Validate chord data structure
          if (Array.isArray(editedChords)) {
            // Merge edited chords with original CHORD_DATA
            const mergedChords = [...CHORD_DATA].map(originalChord => {
              const editedChord = editedChords.find((c: ChordData) => c.id === originalChord.id);
              return editedChord || originalChord;
            });
            
            // Add any new chords that don't exist in CHORD_DATA
            const newChords = editedChords.filter((c: ChordData) => 
              !CHORD_DATA.some(original => original.id === c.id)
            );
            
            setAllChords([...mergedChords, ...newChords]);
            console.log('✅ Loaded', editedChords.length, 'edited chords from AsyncStorage');
          } else {
            console.warn('⚠️ Invalid chord data format, using defaults');
            setAllChords(CHORD_DATA);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse chord edits:', parseError);
          setChordsError('Corrupted chord data. Using defaults.');
          setAllChords(CHORD_DATA);
          
          // Clear corrupted data
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } else {
        setAllChords(CHORD_DATA);
      }
    } catch (storageError) {
      console.error('❌ Failed to load chords:', storageError);
      setChordsError('Failed to load chord edits.');
      setAllChords(CHORD_DATA);
    } finally {
      setChordsLoading(false);
    }
  };
  
  const {
    filterCategories,
    filterTypes,
    filterBarreRoots,
    searchQuery,
    selectedChordIds,
    activeLibraryPresetId,
    setActiveLibraryPreset,
    toggleCategory,
    toggleBarreRoot,
    setSearchQuery,
    toggleChordSelection,
    clearSelectedChords,
    clearAll,
  } = useChordLibrary();

  const filteredChords = useMemo(() => {
    console.log('🔍 Recalculating filteredChords...');
    console.log('  - activeLibraryPresetId:', activeLibraryPresetId);
    console.log('  - Total chords:', allChords.length);
    console.log('  - Available presets:', presets.length);
    
    let result = allChords;

    // If a preset is active, filter by preset chords first
    if (activeLibraryPresetId) {
      const activePreset = presets.find(p => p.id === activeLibraryPresetId);
      console.log('  - Active preset found:', activePreset?.name);
      console.log('  - Active preset chord IDs:', activePreset?.chordIds);
      if (activePreset) {
        result = allChords.filter(chord => activePreset.chordIds.includes(chord.id!));
        console.log('  - Filtered to', result.length, 'chords from preset');
      }
    }

    // Then apply other filters
    return result.filter(chord => {
      if (searchQuery && !chord.fullName.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }
      if (filterCategories.length > 0 && !filterCategories.includes(chord.shape)) {
        return false;
      }
      if (filterTypes.length > 0 && !filterTypes.includes(chord.type)) {
        return false;
      }
      const hasBM = filterCategories.includes('barre') || filterCategories.includes('movable');
      if (hasBM && filterBarreRoots.length > 0) {
        if (!chord.rootString || !filterBarreRoots.includes(chord.rootString)) {
          return false;
        }
      }
      return true;
    });
    
    console.log('  - Final filtered count:', result.length);
    return result;
  }, [searchQuery, filterCategories, filterTypes, filterBarreRoots, activeLibraryPresetId, presets, allChords]);
  
  const showBarreRootFilter = filterCategories.includes('barre') || filterCategories.includes('movable');
  const hasActiveFilters = filterCategories.length > 0 || filterTypes.length > 0 || filterBarreRoots.length > 0 || searchQuery.length > 0;

  const handleCategoryToggle = (value: ChordShape | 'all') => {
    if (value === 'all') {
      clearAll();
    } else {
      toggleCategory(value);
    }
  };

  const handleChordPress = (chord: ChordData) => {
    const chordIndex = filteredChords.findIndex(c => c.id === chord.id);
    router.push({
      pathname: '/chord-detail' as any,
      params: {
        chords: JSON.stringify(filteredChords),
        initialIndex: chordIndex.toString(),
      },
    });
  };

  // Combined loading state
  const isLoading = chordsLoading || presetsLoading;

  // Show loading indicator while data is being loaded
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading chord library...</Text>
      </View>
    );
  }

  // Show error state with retry option
  if (chordsError) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <MaterialIcons name="error-outline" size={48} color={colors.error} />
        <Text style={styles.errorText}>{chordsError}</Text>
        <Pressable onPress={loadChords} style={styles.retryButton}>
          <MaterialIcons name="refresh" size={20} color={colors.primary} />
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

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
        <View style={styles.titleRow}>
          <View style={styles.titleContent}>
            <Text style={styles.title}>Chord Library</Text>
            <Text style={styles.subtitle}>
              Browse all {allChords.length} chord diagrams — tap the checkbox to select chords for a practice preset
            </Text>
          </View>
          <Pressable onPress={() => router.push('/chord-manager' as any)} style={styles.manageButton}>
            <MaterialIcons name="settings" size={24} color={colors.primary} />
            <Text style={styles.manageButtonText}>Manage</Text>
          </Pressable>
        </View>
      </View>

      {/* Preset Selector */}
      <View style={styles.presetSection}>
        <Text style={styles.presetLabel}>Preset Chord Lists:</Text>
        <View style={styles.presetRow}>
          <PresetDropdown />
          {activeLibraryPresetId && (
            <Pressable
              onPress={() => {
                setActiveLibraryPreset(null);
                clearSelectedChords();
              }}
              style={styles.clearPresetButton}
            >
              <MaterialIcons name="close" size={18} color={colors.error} />
              <Text style={styles.clearPresetText}>Clear</Text>
            </Pressable>
          )}
        </View>
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
      
      {/* Barre Root Filter */}
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
                style={[styles.filterChip, isActive && styles.filterChipActive]}
              >
                <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                  {filter.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Results Count & Legend */}
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
          <Pressable onPress={clearSelectedChords} style={styles.selectionButton}>
            <Text style={styles.selectionButtonText}>Clear</Text>
          </Pressable>
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
            isSelected={selectedChordIds.includes(chord.id!)}
            onPress={() => handleChordPress(chord)}
            onCheckboxPress={() => toggleChordSelection(chord.id!)}
          />
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
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleContent: {
    flex: 1,
    paddingRight: spacing.md,
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
  manageButton: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  manageButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  presetSection: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  presetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  presetLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  clearPresetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.error + '20',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearPresetText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.error,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    paddingVertical: 0,
  },
  filtersContainer: {
    marginTop: 12,
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
  },
  filterChipText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#000',
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
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.sm,
  },
  clearButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  legend: {
    flexDirection: 'row',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDotOrange: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  legendDotBlue: {
    width: 10,
    height: 10,
    backgroundColor: '#4DB8E8',
    transform: [{ rotate: '45deg' }],
  },
  legendText: {
    fontSize: 11,
    color: '#888',
  },
  chordList: {
    flex: 1,
  },
  chordListContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  loadingText: {
    fontSize: 16,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  selectionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
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
  selectionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.sm,
  },
  selectionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
