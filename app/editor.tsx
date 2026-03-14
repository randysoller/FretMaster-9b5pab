import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { Fretboard } from '@/components/feature/Fretboard';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { useAuth } from '@/hooks/useAuth';
import { ChordData, ChordShape, ChordType, ALL_CHORD_TYPES, CHORD_TYPE_LABELS, CATEGORY_LABELS, STANDARD_TUNING } from '@/constants/musicData';
import { supabase } from '@/services/supabaseClient';

const FINGER_OPTIONS = [
  { value: 0, label: '–' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: 'T' },
];

export default function ChordEditorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { isAdmin } = useAuth();

  // Initial chord state
  const [chordName, setChordName] = useState('');
  const [chordSymbol, setChordSymbol] = useState('');
  const [chordShape, setChordShape] = useState<ChordShape>('open');
  const [chordType, setChordType] = useState<ChordType>('major');
  const [baseFret, setBaseFret] = useState(1);
  
  // Position and finger arrays for 6 strings (E A D G B e)
  const [positions, setPositions] = useState<number[]>([-1, -1, -1, -1, -1, -1]);
  const [fingers, setFingers] = useState<number[]>([0, 0, 0, 0, 0, 0]);
  
  const [selectedString, setSelectedString] = useState<number | null>(null);
  const [selectedFinger, setSelectedFinger] = useState(1);

  // Redirect non-admins
  useEffect(() => {
    if (!isAdmin) {
      Alert.alert(
        'Access Denied',
        'Chord editor is only available to administrators.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const handleStringPress = (stringIndex: number) => {
    setSelectedString(stringIndex);
  };

  const handleFretPress = (fret: number) => {
    if (selectedString === null) return;

    const newPositions = [...positions];
    const newFingers = [...fingers];

    newPositions[selectedString] = fret;
    newFingers[selectedString] = fret === -1 || fret === 0 ? 0 : selectedFinger;

    setPositions(newPositions);
    setFingers(newFingers);
  };

  const clearFretboard = () => {
    setPositions([-1, -1, -1, -1, -1, -1]);
    setFingers([0, 0, 0, 0, 0, 0]);
    setSelectedString(null);
  };

  const handleSave = async () => {
    if (!chordName.trim() || !chordSymbol.trim()) {
      Alert.alert('Missing Information', 'Please enter chord name and symbol.');
      return;
    }

    const activeFrets = positions.filter(p => p > 0);
    if (activeFrets.length === 0) {
      Alert.alert('No Chord Data', 'Please place at least one finger position on the fretboard.');
      return;
    }

    try {
      const chordData = {
        name: chordSymbol,
        full_name: chordName,
        positions,
        fingers,
        shape: chordShape,
        type: chordType,
        base_fret: baseFret,
        is_custom: true,
      };

      const { error } = await supabase
        .from('custom_chords')
        .insert([chordData]);

      if (error) {
        Alert.alert('Save Failed', error.message);
        return;
      }

      Alert.alert(
        'Chord Saved',
        `${chordSymbol} has been saved to your custom chord library.`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save chord. Please try again.');
      console.error('Save chord error:', error);
    }
  };

  // Preview chord object
  const previewChord: ChordData = {
    name: chordSymbol || 'Preview',
    fullName: chordName || 'Chord Preview',
    positions,
    fingers,
    shape: chordShape,
    type: chordType,
    baseFret,
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
            <Text style={styles.headerTitle}>Chord Editor</Text>
            <Text style={styles.headerSubtitle}>
              {chordSymbol || 'New Chord'}
            </Text>
          </View>
          <Pressable onPress={handleSave} style={styles.saveButton}>
            <MaterialIcons name="save" size={24} color={colors.primary} />
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Chord Info */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHORD INFO</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Chord Name *</Text>
              <TextInput
                style={styles.input}
                value={chordName}
                onChangeText={setChordName}
                placeholder="e.g., C Major"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Symbol *</Text>
              <TextInput
                style={styles.input}
                value={chordSymbol}
                onChangeText={setChordSymbol}
                placeholder="e.g., C, Am7, Bb+"
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
                      onPress={() => setChordShape(shape)}
                      style={[
                        styles.pickerButton,
                        chordShape === shape && styles.pickerButtonActive,
                      ]}
                    >
                      <Text style={[
                        styles.pickerButtonText,
                        chordShape === shape && styles.pickerButtonTextActive,
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
                      onPress={() => setChordType(type)}
                      style={[
                        styles.pickerButton,
                        chordType === type && styles.pickerButtonActive,
                      ]}
                    >
                      <Text style={[
                        styles.pickerButtonText,
                        chordType === type && styles.pickerButtonTextActive,
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

            {/* Current Positions Display */}
            <View style={styles.positionsDisplay}>
              <Text style={styles.positionsLabel}>Current Positions:</Text>
              <View style={styles.positionsRow}>
                {positions.map((pos, i) => (
                  <View key={i} style={styles.positionItem}>
                    <Text style={styles.positionString}>{STANDARD_TUNING[i]}</Text>
                    <Text style={styles.positionValue}>
                      {pos === -1 ? 'X' : pos === 0 ? 'O' : pos}
                    </Text>
                    <Text style={styles.positionFinger}>
                      {fingers[i] > 0 ? `F${fingers[i]}` : ''}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Live Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>LIVE PREVIEW</Text>
            <View style={styles.previewContainer}>
              {chordSymbol && (
                <Text style={styles.previewSymbol}>{chordSymbol}</Text>
              )}
              <View style={styles.fretboardWrapper}>
                <Fretboard chord={previewChord} size="lg" />
              </View>
              {chordName && (
                <Text style={styles.previewName}>{chordName}</Text>
              )}
            </View>
          </View>

          {/* Save Button */}
          <View style={styles.saveSection}>
            <Pressable onPress={handleSave} style={styles.saveButtonLarge}>
              <MaterialIcons name="save" size={24} color="#000" />
              <Text style={styles.saveButtonText}>Save to Library</Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </Screen>
  );
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
  saveButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
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
  positionsDisplay: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  positionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  positionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  positionItem: {
    alignItems: 'center',
  },
  positionString: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  positionValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginVertical: 2,
  },
  positionFinger: {
    fontSize: 10,
    color: colors.primary,
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
});
