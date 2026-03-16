import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Fretboard } from './Fretboard';
import { ChordData, ChordShape, ChordType, CATEGORY_LABELS, CHORD_TYPE_LABELS } from '@/constants/musicData';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';

interface ChordManagerListProps {
  chords: ChordData[];
  selectedChords: Set<string>;
  searchQuery: string;
  filterShape: ChordShape | 'all';
  filterType: ChordType | 'all';
  onSearchChange: (query: string) => void;
  onFilterShapeChange: (shape: ChordShape | 'all') => void;
  onFilterTypeChange: (type: ChordType | 'all') => void;
  onSelectChord: (id: string) => void;
  onSelectAll: () => void;
  onEditChord: (chord: ChordData) => void;
  onDeleteSelected: () => void;
  onBulkEdit: () => void;
  onSaveToPreset: () => void;
}

export function ChordManagerList({
  chords,
  selectedChords,
  searchQuery,
  filterShape,
  filterType,
  onSearchChange,
  onFilterShapeChange,
  onFilterTypeChange,
  onSelectChord,
  onSelectAll,
  onEditChord,
  onDeleteSelected,
  onBulkEdit,
  onSaveToPreset,
}: ChordManagerListProps) {
  // Filter chords
  const filteredChords = chords.filter(chord => {
    const matchesSearch = chord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chord.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShape = filterShape === 'all' || chord.shape === filterShape;
    const matchesType = filterType === 'all' || chord.type === filterType;
    return matchesSearch && matchesShape && matchesType;
  });

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={onSearchChange}
            placeholder="Search chords..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => onSearchChange('')}>
              <MaterialIcons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            onPress={() => onFilterShapeChange('all')}
            style={[styles.filterChip, filterShape === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterShape === 'all' && styles.filterChipTextActive]}>
              All Shapes
            </Text>
          </Pressable>
          {(['open', 'barre', 'movable'] as ChordShape[]).map(shape => (
            <Pressable
              key={shape}
              onPress={() => onFilterShapeChange(shape)}
              style={[styles.filterChip, filterShape === shape && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterShape === shape && styles.filterChipTextActive]}>
                {CATEGORY_LABELS[shape]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            onPress={() => onFilterTypeChange('all')}
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              All Types
            </Text>
          </Pressable>
          {(['major', 'minor', 'dominant7', 'suspended'] as ChordType[]).map(type => (
            <Pressable
              key={type}
              onPress={() => onFilterTypeChange(type)}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
            >
              <Text style={[styles.filterChipText, filterType === type && styles.filterChipTextActive]}>
                {CHORD_TYPE_LABELS[type]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Selection Bar */}
      {selectedChords.size > 0 && (
        <View style={styles.selectionBar}>
          <Text style={styles.selectionText}>{selectedChords.size} selected</Text>
          <View style={styles.selectionActions}>
            <Pressable onPress={onSaveToPreset} style={styles.selectionButton}>
              <MaterialIcons name="bookmark" size={18} color={colors.primary} />
              <Text style={styles.selectionButtonText}>Save to Preset</Text>
            </Pressable>
            <Pressable onPress={onBulkEdit} style={styles.selectionButton}>
              <MaterialIcons name="edit" size={18} color={colors.primary} />
              <Text style={styles.selectionButtonText}>Bulk Edit</Text>
            </Pressable>
            <Pressable onPress={onDeleteSelected} style={styles.selectionButton}>
              <MaterialIcons name="delete" size={18} color={colors.error} />
              <Text style={[styles.selectionButtonText, { color: colors.error }]}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => onSelectChord('')} style={styles.selectionButton}>
              <Text style={styles.selectionButtonText}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Chord List */}
      <FlatList
        data={filteredChords}
        keyExtractor={(item) => item.id!}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <Pressable onPress={onSelectAll} style={styles.selectAllButton}>
            <MaterialIcons 
              name={selectedChords.size === filteredChords.length ? "check-box" : "check-box-outline-blank"} 
              size={20} 
              color={colors.primary} 
            />
            <Text style={styles.selectAllText}>
              {selectedChords.size === filteredChords.length ? 'Deselect All' : 'Select All'}
            </Text>
            <Text style={styles.countText}>({filteredChords.length} chords)</Text>
          </Pressable>
        }
        renderItem={({ item: chord }) => (
          <View style={styles.chordRow}>
            <Pressable onPress={() => onSelectChord(chord.id!)} style={styles.checkbox}>
              <MaterialIcons 
                name={selectedChords.has(chord.id!) ? "check-box" : "check-box-outline-blank"} 
                size={24} 
                color={selectedChords.has(chord.id!) ? colors.primary : colors.textMuted} 
              />
            </Pressable>

            <View style={styles.chordPreview}>
              <Fretboard chord={chord} size="sm" />
            </View>

            <View style={styles.chordInfo}>
              <Text style={styles.chordName}>{chord.name}</Text>
              <Text style={styles.chordFullName}>{chord.fullName}</Text>
              <View style={styles.chordTags}>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{CATEGORY_LABELS[chord.shape]}</Text>
                </View>
                <View style={styles.tag}>
                  <Text style={styles.tagText}>{CHORD_TYPE_LABELS[chord.type]}</Text>
                </View>
              </View>
            </View>

            <Pressable onPress={() => onEditChord(chord)} style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchSection: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: 'transparent',
    marginRight: spacing.xs,
  },
  filterChipActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.primary,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary + '20',
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  selectionActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  selectionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  listContent: {
    padding: spacing.lg,
  },
  selectAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
  },
  selectAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  countText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  checkbox: {
    padding: 4,
  },
  chordPreview: {
    width: 60,
  },
  chordInfo: {
    flex: 1,
    gap: 2,
    marginLeft: 80,
  },
  chordName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  chordFullName: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  chordTags: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: 4,
  },
  tag: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    backgroundColor: colors.surface,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
  },
  editButton: {
    padding: spacing.sm,
  },
});
