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
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: 'T' },
  { value: -1, label: '–' }, // Delete
  { value: -2, label: 'O' }, // Open
  { value: -3, label: 'X' }, // Mute
];

const SHAPE_OPTIONS = [
  { value: 'circle', label: '●', color: '#D4952A' },
  { value: 'diamond', label: '◆', color: '#4DB8E8' },
];

const CATEGORY_OPTIONS = [
  { label: 'Open Chords', value: 'open' },
  { label: 'Barre Chords', value: 'barre' },
  { label: 'Moveable Chords', value: 'movable' },
];

const TYPE_OPTIONS = [
  { label: '— Basic —', value: '', disabled: true },
  { label: 'Major', value: 'major' },
  { label: 'Minor', value: 'minor' },
  { label: 'Augmented', value: 'augmented' },
  { label: 'Diminished', value: 'diminished' },
  { label: '— 7th Chords —', value: '', disabled: true },
  { label: 'Major 7', value: 'major7' },
  { label: 'Dominant 7', value: 'dominant7' },
  { label: 'Minor 7', value: 'minor7' },
  { label: 'Half-Diminished 7', value: 'halfDim7' },
  { label: 'Diminished 7', value: 'dim7' },
  { label: '— Extensions —', value: '', disabled: true },
  { label: '9th', value: 'ninth' },
  { label: '11th', value: 'eleventh' },
  { label: '13th', value: 'thirteenth' },
];

const DOT_COLORS = [
  '#D4952A', '#4DB8E8', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#14B8A6', '#F59E0B', '#3B82F6', '#FFFFFF',
  '#6B7280'
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
  const [isNewChord, setIsNewChord] = useState(false);
  const [showBulkMenu, setShowBulkMenu] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Visual editor state
  const [baseFret, setBaseFret] = useState(1);
  const [visibleFrets, setVisibleFrets] = useState(5);
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [selectedFinger, setSelectedFinger] = useState(1);
  const [dotColor, setDotColor] = useState('#D4952A');
  const [dotShape, setDotShape] = useState<'circle' | 'diamond'>('circle');
  const [dotShapes, setDotShapes] = useState<('circle' | 'diamond')[]>(['circle', 'circle', 'circle', 'circle', 'circle', 'circle']);
  const [dotColors, setDotColors] = useState<string[]>(['#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A']);
  const [isBarre, setIsBarre] = useState(false);
  const [barreMode, setBarreMode] = useState(false);
  const [barreSelection, setBarreSelection] = useState<number[]>([]);
  
  // Dropdown collapse states
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  
  // Finger selection modal
  const [showFingerModal, setShowFingerModal] = useState(false);
  const [pendingDotPosition, setPendingDotPosition] = useState<{ stringIndex: number; fretIndex: number } | null>(null);
  const [modalSelectedShape, setModalSelectedShape] = useState<'circle' | 'diamond'>('circle');

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

  const handleCreateNewChord = () => {
    const newChord: ChordData = {
      id: `chord-${Date.now()}`,
      name: 'C',
      fullName: 'C Major',
      positions: [-1, -1, -1, -1, -1, -1],
      fingers: [0, 0, 0, 0, 0, 0],
      shape: 'open',
      type: 'major',
      baseFret: 1,
    };
    setEditingChord(newChord);
    setIsNewChord(true);
    setBaseFret(1);
    setVisibleFrets(5);
    setDotColor('#D4952A'); // Default orange for circles
    setDotShape('circle');
    setDotShapes(['circle', 'circle', 'circle', 'circle', 'circle', 'circle']);
    setDotColors(['#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A']);
    setSelectedFinger(1);
    setBarreMode(false);
    setBarreSelection([]);
    setViewMode('editor');
  };

  const handleEditChord = (chord: ChordData) => {
    setEditingChord({ ...chord });
    setIsNewChord(false);
    setBaseFret(chord.baseFret || 1);
    setDotColor('#D4952A'); // Default orange for circles
    setDotShape('circle');
    // Initialize shapes array - default to circles, but preserve any existing data
    setDotShapes(['circle', 'circle', 'circle', 'circle', 'circle', 'circle']);
    setDotColors(['#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A']);
    setSelectedFinger(1);
    setBarreMode(false);
    setBarreSelection([]);
    setViewMode('editor');
  };

  const handleSaveEdit = () => {
    if (!editingChord) return;

    if (isNewChord) {
      setChords([...chords, editingChord]);
      Alert.alert('Success', 'New chord created successfully');
    } else {
      const updatedChords = chords.map(c => 
        c.id === editingChord.id ? editingChord : c
      );
      setChords(updatedChords);
      Alert.alert('Success', 'Chord updated successfully');
    }
    
    setEditingChord(null);
    setIsNewChord(false);
    setViewMode('list');
  };

  const handleDeleteChord = () => {
    if (!editingChord) return;

    Alert.alert(
      'Delete Chord',
      `Are you sure you want to delete "${editingChord.fullName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const updatedChords = chords.filter(c => c.id !== editingChord.id);
            setChords(updatedChords);
            setEditingChord(null);
            setViewMode('list');
            Alert.alert('Success', 'Chord deleted from library');
          }
        }
      ]
    );
  };

  const handleCancelEdit = () => {
    setEditingChord(null);
    setIsNewChord(false);
    setBarreMode(false);
    setBarreSelection([]);
    setViewMode('list');
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

  // Visual editor handlers - NEW WORKFLOW
  const handleFretboardTap = (stringIndex: number, fretIndex: number) => {
    if (!editingChord) return;

    // Step 2: User tapped - show finger selection modal with current shape
    setPendingDotPosition({ stringIndex, fretIndex });
    setModalSelectedShape(dotShape); // Use current shape as default
    // Set default color based on shape when opening modal
    if (dotShape === 'diamond') {
      setDotColor('#4DB8E8'); // Cyan for diamond
    } else {
      setDotColor('#D4952A'); // Orange for circle
    }
    setShowFingerModal(true);
  };

  const handleFingerChoice = (fingerValue: number) => {
    if (!editingChord || !pendingDotPosition) return;

    const { stringIndex, fretIndex } = pendingDotPosition;
    const newPositions = [...editingChord.positions];
    const newFingers = [...editingChord.fingers];
    const newShapes = [...dotShapes];
    const newColors = [...dotColors];

    const actualFret = baseFret + fretIndex - 1;

    // Handle special finger options
    if (fingerValue === -1) {
      // Delete: Remove dot
      newPositions[stringIndex] = -1;
      newFingers[stringIndex] = 0;
    } else if (fingerValue === -2) {
      // Open: Set to 0
      newPositions[stringIndex] = 0;
      newFingers[stringIndex] = 0;
    } else if (fingerValue === -3) {
      // Mute: Set to -1
      newPositions[stringIndex] = -1;
      newFingers[stringIndex] = 0;
    } else {
      // Normal finger placement - save shape and color for THIS dot
      newPositions[stringIndex] = actualFret;
      newFingers[stringIndex] = fingerValue;
      newShapes[stringIndex] = modalSelectedShape;
      newColors[stringIndex] = dotColor;
      // Update the global dotShape to match what was used
      setDotShape(modalSelectedShape);
    }

    setEditingChord({
      ...editingChord,
      positions: newPositions,
      fingers: newFingers,
      baseFret,
    });
    setDotShapes(newShapes);
    setDotColors(newColors);

    // Close modal and reset
    setShowFingerModal(false);
    setPendingDotPosition(null);
  };

  const handleStringMarkerTap = (stringIndex: number, marker: 'mute' | 'open') => {
    if (!editingChord) return;

    const newPositions = [...editingChord.positions];
    const newFingers = [...editingChord.fingers];

    if (marker === 'mute') {
      newPositions[stringIndex] = -1;
      newFingers[stringIndex] = 0;
    } else {
      newPositions[stringIndex] = 0;
      newFingers[stringIndex] = 0;
    }

    setEditingChord({
      ...editingChord,
      positions: newPositions,
      fingers: newFingers,
    });
  };

  const handleShapeSelect = (shape: 'circle' | 'diamond') => {
    // ONLY change the shape mode - DO NOT modify existing chord
    setDotShape(shape);
    // Set default color for shape
    if (shape === 'circle') {
      setDotColor('#D4952A'); // Orange
    } else {
      setDotColor('#4DB8E8'); // Cyan
    }
    // DO NOT modify editingChord here - that's the bug!
  };

  const clearFretboard = () => {
    if (!editingChord) return;
    setEditingChord({
      ...editingChord,
      positions: [-1, -1, -1, -1, -1, -1],
      fingers: [0, 0, 0, 0, 0, 0],
    });
    setDotShapes(['circle', 'circle', 'circle', 'circle', 'circle', 'circle']);
    setDotColors(['#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A', '#D4952A']);
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

  // Render Custom Preview Fretboard - EXACT MATCH to interactive editor
  const renderCustomPreviewFretboard = () => {
    if (!editingChord) return null;

    const STRINGS = 6;
    const STRING_SPACING = 36;
    const FRET_SPACING = 50;
    const PREVIEW_FRETS = 5;

    return (
      <View style={styles.previewFretboardGrid}>
        {/* Fret lines */}
        {Array.from({ length: PREVIEW_FRETS + 1 }).map((_, i) => (
          <View 
            key={`preview-fret-${i}`}
            style={[
              styles.previewFretLine,
              { top: i * FRET_SPACING },
              i === 0 && baseFret === 1 && styles.previewNutLine,
            ]}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }).map((_, i) => (
          <View 
            key={`preview-string-${i}`}
            style={[styles.previewStringLine, { left: i * STRING_SPACING }]}
          />
        ))}

        {/* Dots - USE STORED SHAPE AND COLOR FOR EACH DOT */}
        {editingChord.positions.map((fret, stringIndex) => {
          if (fret <= 0) return null;
          const fretIndex = fret - baseFret + 1;
          if (fretIndex < 1 || fretIndex > PREVIEW_FRETS) return null;

          const x = stringIndex * STRING_SPACING;
          const y = (fretIndex - 0.5) * FRET_SPACING;
          const fingerNum = editingChord.fingers[stringIndex];
          const thisShape = dotShapes[stringIndex]; // Use stored shape
          const thisColor = dotColors[stringIndex]; // Use stored color

          return (
            <View
              key={`preview-dot-${stringIndex}`}
              style={[
                styles.previewFretDot,
                { left: x - 16, top: y - 16 },
              ]}
            >
              {thisShape === 'circle' ? (
                <View style={[styles.previewDotCircle, { backgroundColor: thisColor }]}>
                  {fingerNum > 0 && (
                    <Text style={styles.previewDotNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                  )}
                </View>
              ) : (
                <>
                  <View style={[styles.previewDotDiamond, { backgroundColor: thisColor }]} />
                  {fingerNum > 0 && (
                    <Text style={styles.previewDiamondNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                  )}
                </>
              )}
            </View>
          );
        })}

        {/* Top markers (open/mute) */}
        <View style={[styles.previewTopMarkersRow, { width: 216 }]}>
          {editingChord.positions.map((fret, stringIndex) => (
            <View key={`preview-marker-${stringIndex}`} style={[styles.previewTopMarker, { left: stringIndex * STRING_SPACING - 10 }]}>
              {fret === -1 && <Text style={styles.previewMutedX}>×</Text>}
              {fret === 0 && <Text style={styles.previewOpenO}>○</Text>}
            </View>
          ))}
        </View>
      </View>
    );
  };

  // Render Interactive Fretboard
  const renderInteractiveFretboard = () => {
    if (!editingChord) return null;

    const STRINGS = 6;
    const STRING_SPACING = 36;
    const FRET_SPACING = 50;
    const FRET_WIDTH = STRING_SPACING * (STRINGS - 1);

    return (
      <View style={styles.fretboardEditor}>
        <View style={styles.fretboardHeader}>
          <Text style={styles.fretboardTitle}>FRETBOARD</Text>
          <Pressable onPress={clearFretboard} style={styles.clearFretButton}>
            <MaterialIcons name="refresh" size={16} color={colors.textMuted} />
            <Text style={styles.clearFretButtonText}>Clear</Text>
          </Pressable>
        </View>

        <Text style={styles.fretboardInstructions}>
          Tap any fret position to place a dot, then choose shape and finger from the popup
        </Text>

        {/* String markers positioned over strings */}
        <View style={[styles.stringMarkers, { width: 216, marginLeft: 0, alignSelf: 'center' }]}>
          {STANDARD_TUNING.map((note, i) => (
            <View key={i} style={[styles.stringMarkerColumn, { left: i * STRING_SPACING - 12 }]}>
              <Text style={styles.stringNote}>{note}</Text>
              <Pressable 
                onPress={() => handleStringMarkerTap(i, 'mute')}
                style={styles.markerButton}
              >
                <Text style={[
                  styles.markerText,
                  editingChord.positions[i] === -1 && styles.markerTextActive
                ]}>×</Text>
              </Pressable>
              <Pressable 
                onPress={() => handleStringMarkerTap(i, 'open')}
                style={styles.markerButton}
              >
                <Text style={[
                  styles.markerText,
                  editingChord.positions[i] === 0 && styles.markerTextActive
                ]}>○</Text>
              </Pressable>
            </View>
          ))}
        </View>

        {/* Interactive Fretboard Grid */}
        <View style={styles.fretboardGrid}>
          {/* Fret lines */}
          {Array.from({ length: visibleFrets + 1 }).map((_, i) => (
            <View 
              key={`fret-${i}`}
              style={[
                styles.fretLine,
                { top: i * FRET_SPACING },
                i === 0 && baseFret === 1 && styles.nutLine,
              ]}
            />
          ))}

          {/* String lines */}
          {Array.from({ length: STRINGS }).map((_, i) => (
            <View 
              key={`string-${i}`}
              style={[styles.stringLine, { left: i * STRING_SPACING }]}
            />
          ))}

          {/* Dots - USE STORED SHAPE FOR EACH DOT */}
          {editingChord.positions.map((fret, stringIndex) => {
            if (fret <= 0) return null;
            const fretIndex = fret - baseFret + 1;
            if (fretIndex < 1 || fretIndex > visibleFrets) return null;

            const x = stringIndex * STRING_SPACING;
            const y = (fretIndex - 0.5) * FRET_SPACING;
            const fingerNum = editingChord.fingers[stringIndex];
            const thisShape = dotShapes[stringIndex]; // Use stored shape for THIS dot
            const thisColor = dotColors[stringIndex]; // Use stored color for THIS dot

            return (
              <View
                key={`dot-${stringIndex}`}
                style={[
                  styles.fretDot,
                  { left: x - 16, top: y - 16 },
                ]}
              >
                {thisShape === 'circle' ? (
                  <View style={[styles.dotCircle, { backgroundColor: thisColor }]}>
                    {fingerNum > 0 && (
                      <Text style={styles.dotNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                    )}
                  </View>
                ) : (
                  <>
                    <View style={[styles.dotDiamond, { backgroundColor: thisColor }]} />
                    {fingerNum > 0 && (
                      <Text style={styles.diamondNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                    )}
                  </>
                )}
              </View>
            );
          })}

          {/* Fret clickable areas */}
          {Array.from({ length: visibleFrets }).map((_, fretIndex) => 
            Array.from({ length: STRINGS }).map((_, stringIndex) => (
              <Pressable
                key={`click-${stringIndex}-${fretIndex}`}
                onPress={() => handleFretboardTap(stringIndex, fretIndex + 1)}
                style={[
                  styles.fretClickArea,
                  {
                    left: stringIndex * STRING_SPACING - 16,
                    top: fretIndex * FRET_SPACING + FRET_SPACING / 2 - 16,
                  }
                ]}
              />
            ))
          )}

          {/* Fret numbers */}
          <View style={styles.fretNumbers}>
            {Array.from({ length: visibleFrets }).map((_, i) => (
              <Text key={i} style={[styles.fretNumberText, { top: (i + 0.5) * FRET_SPACING - 10 }]}>
                {baseFret + i}
              </Text>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Render Visual Editor
  const renderVisualEditor = () => {
    if (!editingChord) return null;

    return (
      <ScrollView style={styles.editorContainer} showsVerticalScrollIndicator={false}>
        {/* Fret Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FRET SETTINGS</Text>
          
          <View style={styles.fretSettingsRow}>
            <View style={styles.fretSetting}>
              <Text style={styles.fretSettingLabel}>Base Fret</Text>
              <View style={styles.fretSettingControls}>
                <Pressable 
                  onPress={() => setBaseFret(Math.max(1, baseFret - 1))}
                  style={styles.fretSettingButton}
                >
                  <MaterialIcons name="remove" size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.fretSettingValue}>{baseFret}</Text>
                <Pressable 
                  onPress={() => setBaseFret(baseFret + 1)}
                  style={styles.fretSettingButton}
                >
                  <MaterialIcons name="add" size={16} color={colors.text} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fretSetting}>
              <Text style={styles.fretSettingLabel}>Visible Frets</Text>
              <View style={styles.fretSettingControls}>
                <Pressable 
                  onPress={() => setVisibleFrets(Math.max(3, visibleFrets - 1))}
                  style={styles.fretSettingButton}
                >
                  <MaterialIcons name="remove" size={16} color={colors.text} />
                </Pressable>
                <Text style={styles.fretSettingValue}>{visibleFrets}</Text>
                <Pressable 
                  onPress={() => setVisibleFrets(Math.min(12, visibleFrets + 1))}
                  style={styles.fretSettingButton}
                >
                  <MaterialIcons name="add" size={16} color={colors.text} />
                </Pressable>
              </View>
            </View>
          </View>
        </View>

        {/* Chord Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CHORD INFO</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Chord Name *</Text>
            <TextInput
              style={styles.input}
              value={editingChord.fullName}
              onChangeText={(text) => setEditingChord({ ...editingChord, fullName: text })}
              placeholder="C Major"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Symbol *</Text>
            <TextInput
              style={styles.input}
              value={editingChord.name}
              onChangeText={(text) => setEditingChord({ ...editingChord, name: text })}
              placeholder="C"
              placeholderTextColor={colors.textMuted}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Category</Text>
              <Pressable
                onPress={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownButtonText}>
                  {CATEGORY_OPTIONS.find(o => o.value === editingChord.shape)?.label || 'Select Category'}
                </Text>
                <MaterialIcons 
                  name={isCategoryDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={colors.text} 
                />
              </Pressable>
              {isCategoryDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  {CATEGORY_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        setEditingChord({ ...editingChord, shape: option.value as ChordShape });
                        setIsCategoryDropdownOpen(false);
                      }}
                      style={[
                        styles.dropdownOption,
                        editingChord.shape === option.value && styles.dropdownOptionActive,
                      ]}
                    >
                      <Text style={[
                        styles.dropdownOptionText,
                        editingChord.shape === option.value && styles.dropdownOptionTextActive,
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Type</Text>
              <Pressable
                onPress={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                style={styles.dropdownButton}
              >
                <Text style={styles.dropdownButtonText}>
                  {TYPE_OPTIONS.find(o => o.value === editingChord.type)?.label || 'Select Type'}
                </Text>
                <MaterialIcons 
                  name={isTypeDropdownOpen ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={20} 
                  color={colors.text} 
                />
              </Pressable>
              {isTypeDropdownOpen && (
                <View style={styles.dropdownContainer}>
                  <ScrollView style={styles.dropdownScroll} nestedScrollEnabled>
                    {TYPE_OPTIONS.map((option, index) => (
                      option.disabled ? (
                        <View key={index} style={styles.dropdownSeparator}>
                          <Text style={styles.dropdownSeparatorText}>{option.label}</Text>
                        </View>
                      ) : (
                        <Pressable
                          key={option.value}
                          onPress={() => {
                            setEditingChord({ ...editingChord, type: option.value as ChordType });
                            setIsTypeDropdownOpen(false);
                          }}
                          style={[
                            styles.dropdownOption,
                            editingChord.type === option.value && styles.dropdownOptionActive,
                          ]}
                        >
                          <Text style={[
                            styles.dropdownOptionText,
                            editingChord.type === option.value && styles.dropdownOptionTextActive,
                          ]}>
                            {option.label}
                          </Text>
                        </Pressable>
                      )
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Interactive Fretboard */}
        {renderInteractiveFretboard()}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          <Pressable onPress={handleSaveEdit} style={styles.updateButton}>
            <MaterialIcons name="save" size={20} color="#000" />
            <Text style={styles.updateButtonText}>
              {isNewChord ? 'Create Chord' : 'Update Chord'}
            </Text>
          </Pressable>

          <Pressable onPress={handleCancelEdit} style={styles.cancelActionButton}>
            <MaterialIcons name="close" size={16} color={colors.textMuted} />
            <Text style={styles.cancelActionButtonText}>
              {isNewChord ? 'Cancel — Start New' : 'Cancel'}
            </Text>
          </Pressable>

          {!isNewChord && (
            <Pressable onPress={handleDeleteChord} style={styles.deleteButton}>
              <MaterialIcons name="delete" size={16} color={colors.error} />
              <Text style={styles.deleteButtonText}>Delete from Library</Text>
            </Pressable>
          )}
        </View>

        {/* Live Preview - Custom Rendering */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>LIVE PREVIEW</Text>
          <View style={styles.previewContainer}>
            <View style={styles.previewTextSection}>
              <Text style={styles.previewSymbol}>{editingChord.name}</Text>
              <Text style={styles.previewName}>{editingChord.fullName}</Text>
            </View>
            
            {/* Custom Preview Fretboard - matches interactive editor exactly */}
            <View style={styles.previewFretboardContainer}>
              {renderCustomPreviewFretboard()}
            </View>
          </View>
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
              {viewMode === 'list' 
                ? `${chords.length} chords • ${selectedChords.size} selected`
                : isNewChord ? 'Creating new chord' : 'Editing chord'
              }
            </Text>
          </View>
          {viewMode === 'list' && (
            <Pressable onPress={() => setShowExportMenu(true)} style={styles.exportButton}>
              <MaterialIcons name="download" size={24} color={colors.primary} />
            </Pressable>
          )}
        </View>

        {/* View Toggle */}
        {viewMode === 'list' && (
          <View style={styles.viewToggle}>
            <Pressable onPress={handleCreateNewChord} style={styles.createNewButton}>
              <MaterialIcons name="add" size={20} color="#000" />
              <Text style={styles.createNewButtonText}>Create New Chord</Text>
            </Pressable>
          </View>
        )}

        {/* Content */}
        {viewMode === 'list' ? renderListView() : renderVisualEditor()}

        {/* Finger & Shape Selection Modal */}
        <Modal
          visible={showFingerModal}
          transparent
          animationType="fade"
          onRequestClose={() => {
            setShowFingerModal(false);
            setPendingDotPosition(null);
          }}
        >
          <Pressable 
            style={styles.modalOverlay} 
            onPress={() => {
              setShowFingerModal(false);
              setPendingDotPosition(null);
            }}
          >
            <View style={styles.fingerModalContent}>
              {/* Shape Selection */}
              <View style={styles.modalShapeSection}>
                <Text style={styles.modalSectionLabel}>DOT SHAPE</Text>
                <View style={styles.modalShapeButtons}>
                  {SHAPE_OPTIONS.map((option) => (
                    <Pressable
                      key={option.value}
                      onPress={() => {
                        const shape = option.value as 'circle' | 'diamond';
                        setModalSelectedShape(shape);
                        // Auto-set color when shape changes in modal
                        if (shape === 'diamond') {
                          setDotColor('#4DB8E8'); // Cyan for diamond
                        } else {
                          setDotColor('#D4952A'); // Orange for circle
                        }
                      }}
                      style={[
                        styles.modalShapeButton,
                        modalSelectedShape === option.value && styles.modalShapeButtonActive,
                      ]}
                    >
                      <Text style={[
                        styles.modalShapeButtonText,
                        modalSelectedShape === option.value && styles.modalShapeButtonTextActive,
                        { color: option.color },
                      ]}>
                        {option.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Finger Selection */}
              <Text style={styles.fingerModalTitle}>SELECT FINGER</Text>
              <View style={styles.fingerModalGrid}>
                {FINGER_OPTIONS.map((option) => (
                  <Pressable
                    key={option.value}
                    onPress={() => handleFingerChoice(option.value)}
                    style={styles.fingerModalButton}
                  >
                    <Text style={styles.fingerModalButtonText}>{option.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </Pressable>
        </Modal>

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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  createNewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
  sectionTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  fretSettingsRow: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  fretSetting: {
    flex: 1,
  },
  fretSettingLabel: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  fretSettingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
  },
  fretSettingButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.sm,
  },
  fretSettingValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    minWidth: 30,
    textAlign: 'center',
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dropdownButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  dropdownContainer: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.xs,
    maxHeight: 140,
  },
  dropdownScroll: {
    maxHeight: 140,
  },
  dropdownOption: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '20',
  },
  dropdownOptionActive: {
    backgroundColor: colors.primary + '30',
  },
  dropdownOptionText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
  },
  dropdownOptionTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  dropdownSeparator: {
    paddingVertical: 6,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.card,
  },
  dropdownSeparatorText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  dotAppearanceSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  dotLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  colorPalette: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorButtonActive: {
    borderColor: colors.text,
    borderWidth: 3,
  },
  shapeSelector: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  shapeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  shapeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  shapeCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  shapeDiamond: {
    width: 12,
    height: 12,
    backgroundColor: '#4DB8E8',
    transform: [{ rotate: '45deg' }],
  },
  shapeButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  shapeButtonTextActive: {
    color: colors.primary,
  },
  fretboardEditor: {
    padding: spacing.lg,
    backgroundColor: '#0F0F0F',
  },
  fretboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  fretboardTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
  },
  clearFretButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  clearFretButtonText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  fretboardInstructions: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  stringMarkers: {
    flexDirection: 'row',
    height: 70,
    marginBottom: spacing.md,
    position: 'relative',
  },
  stringMarkerColumn: {
    position: 'absolute',
    alignItems: 'center',
    gap: 4,
    width: 24,
  },
  stringNote: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  markerButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: {
    fontSize: 18,
    color: colors.textMuted,
  },
  markerTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  fretboardGrid: {
    position: 'relative',
    width: 216,
    height: 300,
    marginVertical: spacing.lg,
    alignSelf: 'center',
  },
  fretLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#666',
  },
  nutLine: {
    height: 6,
    backgroundColor: '#FFF',
  },
  stringLine: {
    position: 'absolute',
    height: '100%',
    width: 2,
    backgroundColor: '#888',
  },
  fretDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDiamond: {
    width: 24,
    height: 24,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  dotNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  diamondNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    position: 'absolute',
    width: 32,
    height: 32,
    lineHeight: 32,
  },
  fretClickArea: {
    position: 'absolute',
    width: 32,
    height: 32,
  },
  fretNumbers: {
    position: 'absolute',
    left: -30,
    top: 0,
    height: '100%',
  },
  fretNumberText: {
    position: 'absolute',
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '600',
  },
  actionsSection: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  updateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  cancelActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
  },
  cancelActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.error,
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.error,
  },
  previewContainer: {
    alignItems: 'center',
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  previewTextSection: {
    alignItems: 'center',
  },
  previewSymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  previewName: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  fretboardWrapper: {
    marginVertical: spacing.md,
  },
  // Preview Fretboard Styles - EXACT MATCH to interactive
  previewFretboardContainer: {
    marginTop: spacing.md,
  },
  previewFretboardGrid: {
    position: 'relative',
    width: 216,
    height: 250,
    alignSelf: 'center',
  },
  previewFretLine: {
    position: 'absolute',
    width: '100%',
    height: 2,
    backgroundColor: '#666',
  },
  previewNutLine: {
    height: 6,
    backgroundColor: '#FFF',
  },
  previewStringLine: {
    position: 'absolute',
    height: '100%',
    width: 2,
    backgroundColor: '#888',
  },
  previewFretDot: {
    position: 'absolute',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDotCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewDotDiamond: {
    width: 24,
    height: 24,
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  previewDotNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  previewDiamondNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    position: 'absolute',
    width: 32,
    height: 32,
    lineHeight: 32,
  },
  previewTopMarkersRow: {
    position: 'absolute',
    top: -26,
    height: 20,
  },
  previewTopMarker: {
    position: 'absolute',
    width: 18,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewMutedX: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
  },
  previewOpenO: {
    fontSize: 18,
    color: '#999',
    fontWeight: '400',
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
  // Finger Selection Modal
  fingerModalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    width: '90%',
    maxWidth: 320,
  },
  modalShapeSection: {
    marginBottom: spacing.lg,
  },
  modalSectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalShapeButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  modalShapeButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 80,
    alignItems: 'center',
  },
  modalShapeButtonActive: {
    backgroundColor: colors.primary + '20',
    borderColor: colors.primary,
  },
  modalShapeButtonText: {
    fontSize: 32,
  },
  modalShapeButtonTextActive: {
    fontWeight: '700',
  },
  fingerModalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  fingerModalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'center',
  },
  fingerModalButton: {
    width: 60,
    height: 60,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerModalButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
});
