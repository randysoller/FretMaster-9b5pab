import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { Fretboard } from '@/components/feature/Fretboard';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { ChordData, ChordShape, ChordType, ALL_CHORD_TYPES, CHORD_TYPE_LABELS, CATEGORY_LABELS, STANDARD_TUNING, CHORDS } from '@/constants/musicData';
import { supabase } from '@/services/supabaseClient';

type ViewMode = 'list' | 'editor';

const FINGER_OPTIONS = [
  { value: 0, label: '–' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: 'T' },
];

export default function ChordManagerScreen() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  // State
  const [chords, setChords] = useState<ChordData[]>([...CHORDS]);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterShape, setFilterShape] = useState<ChordShape | 'all'>('all');
  const [filterType, setFilterType] = useState<ChordType | 'all'>('all');
  const [selectedChords, setSelectedChords] = useState<Set<string>>(new Set());
  const [editingChord, setEditingChord] = useState<ChordData | null>(null);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Visual editor state
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [selectedFinger, setSelectedFinger] = useState(1);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Chord manager is only available to administrators.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  // Filter chords
  const filteredChords = chords.filter(chord => {
    const matchesSearch = chord.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         chord.fullName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesShape = filterShape === 'all' || chord.shape === filterShape;
    const matchesType = filterType === 'all' || chord.type === filterType;
    return matchesSearch && matchesShape && matchesType;
  });

  // Handlers
  const handleSelectChord = (chordId: string) => {
    const newSelected = new Set(selectedChords);
    if (newSelected.has(chordId)) {
      newSelected.delete(chordId);
    } else {
      newSelected.add(chordId);
    }
    setSelectedChords(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedChords.size === filteredChords.length) {
      setSelectedChords(new Set());
    } else {
      setSelectedChords(new Set(filteredChords.map(c => c.id!)));
    }
  };

  const handleEditChord = (chord: ChordData) => {
    setEditingChord({ ...chord });
    setViewMode('editor');
  };

  const handleSaveEdit = () => {
    if (!editingChord) return;

    const updatedChords = chords.map(c => 
      c.id === editingChord.id ? editingChord : c
    );
    setChords(updatedChords);
    setEditingChord(null);
    setViewMode('list');
    Alert.alert('Success', 'Chord updated successfully');
  };

  const handleDeleteSelected = () => {
    Alert.alert(
      'Delete Chords',
      `Are you sure you want to delete ${selectedChords.size} chord(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedChords = chords.filter(c => !selectedChords.has(c.id!));
            setChords(updatedChords);
            setSelectedChords(new Set());
            Alert.alert('Success', `${selectedChords.size} chord(s) deleted`);
          }
        }
      ]
    );
  };

  const handleBulkUpdateShape = (shape: ChordShape) => {
    const updatedChords = chords.map(c => 
      selectedChords.has(c.id!) ? { ...c, shape } : c
    );
    setChords(updatedChords);
    setSelectedChords(new Set());
    setShowBulkMenu(false);
    Alert.alert('Success', `Updated ${selectedChords.size} chord(s)`);
  };

  const handleBulkUpdateType = (type: ChordType) => {
    const updatedChords = chords.map(c => 
      selectedChords.has(c.id!) ? { ...c, type } : c
    );
    setChords(updatedChords);
    setSelectedChords(new Set());
    setShowBulkMenu(false);
    Alert.alert('Success', `Updated ${selectedChords.size} chord(s)`);
  };

  const handleExportToFile = () => {
    const exportCode = generateMusicDataCode(chords);
    Alert.alert(
      'Export Code Generated',
      'Copy the code below and replace the contents of constants/musicData.ts',
      [
        { text: 'Copy to Clipboard', onPress: () => {
          // In a real app, you'd use Clipboard.setString(exportCode)
          Alert.alert('Note', 'Code copied to clipboard (simulated)');
        }},
        { text: 'Close' }
      ]
    );
  };

  const handleExportToDatabase = async () => {
    try {
      const selectedChordObjects = chords.filter(c => selectedChords.has(c.id!));
      
      const { error } = await supabase
        .from('custom_chords')
        .insert(selectedChordObjects.map(c => ({
          name: c.name,
          full_name: c.fullName,
          positions: c.positions,
          fingers: c.fingers,
          shape: c.shape,
          type: c.type,
          base_fret: c.baseFret,
          is_custom: true,
        })));

      if (error) throw error;

      Alert.alert('Success', `${selectedChords.size} chord(s) saved to database`);
      setSelectedChords(new Set());
      setShowExportMenu(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to save to database');
      console.error('Export error:', error);
    }
  };

  // Visual editor handlers
  const handleStringPress = (stringIndex: number) => {
    if (!editingChord) return;
    setSelectedString(stringIndex);
  };

  const handleFretPress = (fret: number) => {
    if (!editingChord || selectedString === null) return;

    const newPositions = [...editingChord.positions];
    const newFingers = [...editingChord.fingers];

    newPositions[selectedString] = fret;
    newFingers[selectedString] = fret === -1 || fret === 0 ? 0 : selectedFinger;

    setEditingChord({
      ...editingChord,
      positions: newPositions,
      fingers: newFingers,
    });
  };

  const clearFretboard = () => {
    if (!editingChord) return;
    setEditingChord({
      ...editingChord,
      positions: [-1, -1, -1, -1, -1, -1],
      fingers: [0, 0, 0, 0, 0, 0],
    });
    setSelectedString(null);
  };

  // Render List View
  const renderListView = () => (
    <View style={styles.listContainer}>
      {/* Search and Filter */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search chords..."
            placeholderTextColor={colors.textMuted}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          <Pressable
            onPress={() => setFilterShape('all')}
            style={[styles.filterChip, filterShape === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterShape === 'all' && styles.filterChipTextActive]}>
              All Shapes
            </Text>
          </Pressable>
          {(['open', 'barre', 'movable'] as ChordShape[]).map(shape => (
            <Pressable
              key={shape}
              onPress={() => setFilterShape(shape)}
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
            onPress={() => setFilterType('all')}
            style={[styles.filterChip, filterType === 'all' && styles.filterChipActive]}
          >
            <Text style={[styles.filterChipText, filterType === 'all' && styles.filterChipTextActive]}>
              All Types
            </Text>
          </Pressable>
          {(['major', 'minor', 'dominant7', 'suspended'] as ChordType[]).map(type => (
            <Pressable
              key={type}
              onPress={() => setFilterType(type)}
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
            <Pressable onPress={() => setShowBulkMenu(true)} style={styles.selectionButton}>
              <MaterialIcons name="edit" size={18} color={colors.primary} />
              <Text style={styles.selectionButtonText}>Bulk Edit</Text>
            </Pressable>
            <Pressable onPress={handleDeleteSelected} style={styles.selectionButton}>
              <MaterialIcons name="delete" size={18} color={colors.error} />
              <Text style={[styles.selectionButtonText, { color: colors.error }]}>Delete</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedChords(new Set())} style={styles.selectionButton}>
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
          <Pressable onPress={handleSelectAll} style={styles.selectAllButton}>
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
            <Pressable onPress={() => handleSelectChord(chord.id!)} style={styles.checkbox}>
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

            <Pressable onPress={() => handleEditChord(chord)} style={styles.editButton}>
              <MaterialIcons name="edit" size={20} color={colors.primary} />
            </Pressable>
          </View>
        )}
      />
    </View>
  );

  // Render Visual Editor
  const renderVisualEditor = () => {
    if (!editingChord) return null;

    return (
      <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={false}>
        {/* Chord Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHORD INFO</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chord Name</Text>
            <TextInput
              style={styles.input}
              value={editingChord.fullName}
              onChangeText={(text) => setEditingChord({ ...editingChord, fullName: text })}
              placeholder="e.g., C Major"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Symbol</Text>
            <TextInput
              style={styles.input}
              value={editingChord.name}
              onChangeText={(text) => setEditingChord({ ...editingChord, name: text })}
              placeholder="e.g., C, Am7"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.pickerWrapper}>
                {(['open', 'barre', 'movable'] as ChordShape[]).map((shape) => (
                  <Pressable
                    key={shape}
                    onPress={() => setEditingChord({ ...editingChord, shape })}
                    style={[
                      styles.pickerButton,
                      editingChord.shape === shape && styles.pickerButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      editingChord.shape === shape && styles.pickerButtonTextActive,
                    ]}>
                      {CATEGORY_LABELS[shape]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Type</Text>
              <View style={styles.pickerWrapper}>
                {(['major', 'minor', 'dominant7'] as ChordType[]).map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setEditingChord({ ...editingChord, type })}
                    style={[
                      styles.pickerButton,
                      editingChord.type === type && styles.pickerButtonActive,
                    ]}
                  >
                    <Text style={[
                      styles.pickerButtonText,
                      editingChord.type === type && styles.pickerButtonTextActive,
                    ]}>
                      {CHORD_TYPE_LABELS[type]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Fretboard Editor */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>FRETBOARD EDITOR</Text>
            <Pressable onPress={clearFretboard} style={styles.clearButton}>
              <MaterialIcons name="delete-outline" size={16} color={colors.error} />
              <Text style={styles.clearButtonText}>Clear</Text>
            </Pressable>
          </View>

          <Text style={styles.instructions}>
            1. Tap a string below to select it{'\n'}
            2. Choose a finger number{'\n'}
            3. Tap a fret position to place the finger
          </Text>

          {/* String Selector */}
          <View style={styles.stringSelector}>
            {STANDARD_TUNING.map((note, i) => (
              <Pressable
                key={i}
                onPress={() => handleStringPress(i)}
                style={[
                  styles.stringButton,
                  selectedString === i && styles.stringButtonActive,
                ]}
              >
                <Text style={[
                  styles.stringNote,
                  selectedString === i && styles.stringNoteActive,
                ]}>
                  {note}
                </Text>
                <Text style={[
                  styles.stringNumber,
                  selectedString === i && styles.stringNumberActive,
                ]}>
                  {6 - i}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Finger Selector */}
          <View style={styles.fingerSelector}>
            <Text style={styles.fingerSelectorLabel}>Finger:</Text>
            {FINGER_OPTIONS.map((option) => (
              <Pressable
                key={option.value}
                onPress={() => setSelectedFinger(option.value)}
                style={[
                  styles.fingerButton,
                  selectedFinger === option.value && styles.fingerButtonActive,
                ]}
              >
                <Text style={[
                  styles.fingerButtonText,
                  selectedFinger === option.value && styles.fingerButtonTextActive,
                ]}>
                  {option.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Fret Position Selector */}
          <View style={styles.fretSelector}>
            <Pressable
              onPress={() => handleFretPress(-1)}
              style={styles.fretButton}
            >
              <MaterialIcons name="close" size={20} color={colors.error} />
              <Text style={styles.fretButtonLabel}>Mute</Text>
            </Pressable>
            <Pressable
              onPress={() => handleFretPress(0)}
              style={styles.fretButton}
            >
              <MaterialIcons name="radio-button-unchecked" size={20} color={colors.success} />
              <Text style={styles.fretButtonLabel}>Open</Text>
            </Pressable>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((fret) => (
              <Pressable
                key={fret}
                onPress={() => handleFretPress(fret)}
                style={styles.fretButton}
              >
                <Text style={styles.fretButtonText}>{fret}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Live Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIVE PREVIEW</Text>
          <View style={styles.previewContainer}>
            <Text style={styles.previewSymbol}>{editingChord.name}</Text>
            <View style={styles.fretboardWrapper}>
              <Fretboard chord={editingChord} size="lg" />
            </View>
            <Text style={styles.previewName}>{editingChord.fullName}</Text>
          </View>
        </View>

        {/* Save Button */}
        <View style={styles.saveSection}>
          <Pressable onPress={handleSaveEdit} style={styles.saveButtonLarge}>
            <MaterialIcons name="save" size={24} color="#000" />
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </Pressable>
          <Pressable onPress={() => {
            setEditingChord(null);
            setViewMode('list');
          }} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Chord Manager</Text>
            <Text style={styles.headerSubtitle}>
              {chords.length} chords • {selectedChords.size} selected
            </Text>
          </View>
          <Pressable onPress={() => setShowExportMenu(true)} style={styles.exportButton}>
            <MaterialIcons name="download" size={24} color={colors.primary} />
          </Pressable>
        </View>

        {/* View Toggle */}
        {viewMode === 'list' && (
          <View style={styles.viewToggle}>
            <View style={styles.viewToggleButtons}>
              <View style={[styles.viewToggleButton, styles.viewToggleButtonActive]}>
                <MaterialIcons name="list" size={20} color={colors.primary} />
                <Text style={[styles.viewToggleText, styles.viewToggleTextActive]}>List View</Text>
              </View>
            </View>
          </View>
        )}

        {/* Content */}
        {viewMode === 'list' ? renderListView() : renderVisualEditor()}

        {/* Bulk Edit Menu */}
        <Modal
          visible={showBulkMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowBulkMenu(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowBulkMenu(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Bulk Edit {selectedChords.size} Chords</Text>
              
              <Text style={styles.modalSectionTitle}>Update Category</Text>
              {(['open', 'barre', 'movable'] as ChordShape[]).map(shape => (
                <Pressable
                  key={shape}
                  onPress={() => handleBulkUpdateShape(shape)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>{CATEGORY_LABELS[shape]}</Text>
                </Pressable>
              ))}

              <Text style={styles.modalSectionTitle}>Update Type</Text>
              {(['major', 'minor', 'dominant7', 'suspended'] as ChordType[]).map(type => (
                <Pressable
                  key={type}
                  onPress={() => handleBulkUpdateType(type)}
                  style={styles.modalButton}
                >
                  <Text style={styles.modalButtonText}>{CHORD_TYPE_LABELS[type]}</Text>
                </Pressable>
              ))}

              <Pressable onPress={() => setShowBulkMenu(false)} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        {/* Export Menu */}
        <Modal
          visible={showExportMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowExportMenu(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowExportMenu(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Export Chords</Text>
              
              <Pressable onPress={handleExportToFile} style={styles.modalButton}>
                <MaterialIcons name="code" size={20} color={colors.text} />
                <Text style={styles.modalButtonText}>Generate musicData.ts Code</Text>
              </Pressable>

              <Pressable onPress={handleExportToDatabase} style={styles.modalButton}>
                <MaterialIcons name="cloud-upload" size={20} color={colors.text} />
                <Text style={styles.modalButtonText}>
                  Save {selectedChords.size > 0 ? `${selectedChords.size} Selected` : 'All'} to Database
                </Text>
              </Pressable>

              <Pressable onPress={() => setShowExportMenu(false)} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Screen>
  );
}

// Helper function to generate TypeScript code
function generateMusicDataCode(chords: ChordData[]): string {
  const chordCode = chords.map(chord => {
    const positions = JSON.stringify(chord.positions);
    const fingers = JSON.stringify(chord.fingers);
    const barres = chord.barres ? `, barres: ${JSON.stringify(chord.barres)}` : '';
    const rootString = chord.rootString ? `, rootString: ${chord.rootString}` : '';
    
    return `  { name: '${chord.name}', fullName: '${chord.fullName}', positions: ${positions}, fingers: ${fingers}, shape: '${chord.shape}', type: '${chord.type}', baseFret: ${chord.baseFret || 1}${barres}${rootString} }`;
  }).join(',\n');

  return `export const CHORDS: ChordData[] = [\n${chordCode}\n];`;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    ...typography.h3,
    fontSize: 18,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  exportButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggle: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  viewToggleButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  viewToggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.surface,
  },
  viewToggleButtonActive: {
    backgroundColor: colors.primary + '20',
  },
  viewToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  viewToggleTextActive: {
    color: colors.primary,
  },
  listContainer: {
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
  editorContainer: {
    flex: 1,
  },
  section: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pickerWrapper: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  pickerButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  pickerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  pickerButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  pickerButtonTextActive: {
    color: '#000',
  },
  instructions: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  stringSelector: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  stringButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stringButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stringNote: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  stringNoteActive: {
    color: '#000',
  },
  stringNumber: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  stringNumberActive: {
    color: '#000',
  },
  fingerSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fingerSelectorLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  fingerButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  fingerButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  fingerButtonTextActive: {
    color: '#000',
  },
  fretSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  fretButton: {
    width: 60,
    height: 50,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fretButtonLabel: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 2,
  },
  fretButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  previewContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  previewSymbol: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  fretboardWrapper: {
    marginVertical: spacing.md,
  },
  previewName: {
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  saveSection: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  saveButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    letterSpacing: 1,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
