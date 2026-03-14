import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { audioService } from '@/services/audioService';

const ROOT_NOTE_COLOR = '#FFD700'; // Pure gold for root notes (diamond)
const OTHER_NOTE_COLOR = '#D4AF37'; // Rich gold for other notes (circle)
const FRETBOARD_BG = '#0A0A0A'; // Deep stage black
const BUTTON_GOLD = '#D4AF37'; // Rich gold buttons

interface ChordDetailModalProps {
  visible: boolean;
  chord: ChordData | null;
  onClose: () => void;
  onPlay?: () => void;
  onEdit?: () => void;
}

export function ChordDetailModal({ visible, chord, onClose, onPlay, onEdit }: ChordDetailModalProps) {
  if (!chord) return null;

  // Get chord root note for comparison
  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const normalizeNote = (note: string) => {
    return note.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#')
      .replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
  };
  
  const getNoteAtPosition = (stringIndex: number, fret: number): string => {
    if (fret < 0) return '';
    const openNote = STANDARD_TUNING[stringIndex];
    const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex];
  };
  
  const normalizedRootNote = normalizeNote(rootNote);

  const renderFretboardDiagram = () => {
    const activeFrets = chord.positions.filter(p => p > 0);
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
    const startFret = minFret > 3 ? minFret : 1;
    const numFrets = 4;
    const STRINGS = 6;
    const FRETBOARD_WIDTH = 140;
    const FRETBOARD_HEIGHT = 160;
    const STRING_SPACING = FRETBOARD_WIDTH / (STRINGS - 1);
    const FRET_SPACING = FRETBOARD_HEIGHT / numFrets;

    return (
      <View style={styles.fretboardContainer}>
        <View style={styles.fretboard}>
          {/* Top markers (muted/open) */}
          <View style={[styles.topMarkers, { width: FRETBOARD_WIDTH }]}>
            {chord.positions.map((fret, stringIndex) => (
              <View 
                key={`top-${stringIndex}`}
                style={[styles.markerContainer, { left: stringIndex * STRING_SPACING - 8 }]}
              >
                {fret === -1 && <Text style={styles.mutedX}>×</Text>}
                {fret === 0 && <Text style={styles.openO}>○</Text>}
              </View>
            ))}
          </View>

          {/* Fretboard grid */}
          <View style={[styles.gridContainer, { width: FRETBOARD_WIDTH, height: FRETBOARD_HEIGHT }]}>
            {/* Strings (vertical lines) */}
            {Array.from({ length: STRINGS }).map((_, i) => (
              <View 
                key={`string-${i}`}
                style={[styles.string, { left: i * STRING_SPACING }]}
              />
            ))}

            {/* Frets (horizontal lines) */}
            {Array.from({ length: numFrets + 1 }).map((_, i) => (
              <View 
                key={`fret-${i}`}
                style={[
                  styles.fret,
                  { top: i * FRET_SPACING },
                  i === 0 && startFret === 1 && styles.nutLine
                ]}
              />
            ))}

            {/* Finger position dots/diamonds */}
            {chord.positions.map((fret, stringIndex) => {
              if (fret <= 0) return null;
              
              const displayFret = fret - startFret + 1;
              if (displayFret < 1 || displayFret > numFrets) return null;

              const noteAtPosition = getNoteAtPosition(stringIndex, fret);
              const isRootNote = normalizeNote(noteAtPosition) === normalizedRootNote;
              const fingerNumber = chord.fingers?.[stringIndex] || 1;

              const xPos = stringIndex * STRING_SPACING;
              const yPos = (displayFret - 0.5) * FRET_SPACING;

              return (
                <View
                  key={`dot-${stringIndex}`}
                  style={[
                    styles.fingerDotContainer,
                    { left: xPos, top: yPos }
                  ]}
                >
                  {isRootNote ? (
                    <View style={[styles.rootNoteDiamond, { backgroundColor: ROOT_NOTE_COLOR }]}>
                      <Text style={styles.fingerNumberInDiamond}>{fingerNumber}</Text>
                    </View>
                  ) : (
                    <View style={[styles.fingerDot, { backgroundColor: OTHER_NOTE_COLOR }]}>
                      <Text style={styles.fingerNumber}>{fingerNumber}</Text>
                    </View>
                  )}
                </View>
              );
            })}

            {/* Gray pattern dots at bottom */}
            {chord.positions.map((fret, stringIndex) => {
              if (fret <= 0) return null;
              
              const displayFret = fret - startFret + 1;
              if (displayFret < 1 || displayFret > numFrets) return null;

              const xPos = stringIndex * STRING_SPACING;
              const yPos = numFrets * FRET_SPACING - 20;

              return (
                <View
                  key={`gray-${stringIndex}`}
                  style={[
                    styles.grayDotContainer,
                    { left: xPos, top: yPos }
                  ]}
                >
                  <View style={styles.grayDot} />
                </View>
              );
            })}
          </View>

          {/* Fret position label */}
          {startFret > 1 && (
            <Text style={styles.fretLabel}>{startFret}fr</Text>
          )}
        </View>

        {/* String notation box */}
        <View style={styles.stringNotationBox}>
          {['e', 'B', 'G', 'D', 'A', 'E'].map((note, index) => {
            const fret = chord.positions[5 - index];
            
            return (
              <View key={index} style={styles.notationRow}>
                <Text style={styles.notationString}>{note}</Text>
                <Text style={styles.notationSeparator}>—</Text>
                <Text style={styles.notationFret}>{fret === -1 ? '×' : fret}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  const renderFingerPositions = () => {
    const stringData = [
      { note: 'E', string: '(6th)' },
      { note: 'A', string: '(5th)' },
      { note: 'D', string: '(4th)' },
      { note: 'G', string: '(3rd)' },
      { note: 'B', string: '(2nd)' },
      { note: 'e', string: '(1st)' },
    ];
    
    return (
      <View style={styles.fingerPositions}>
        <View style={styles.fingerHeader}>
          <MaterialIcons name="music-note" size={14} color="#B8860B" style={{ transform: [{ rotate: '-15deg' }] }} />
          <Text style={styles.fingerTitle}>FINGER POSITIONS</Text>
        </View>
        
        {chord.positions.map((fret, index) => {
          const finger = chord.fingers[index];
          let fingerName = '';
          
          if (fret === -1) fingerName = 'Muted';
          else if (fret === 0) fingerName = 'Open';
          else if (finger === 1) fingerName = 'Index';
          else if (finger === 2) fingerName = 'Middle';
          else if (finger === 3) fingerName = 'Ring';
          else if (finger === 4) fingerName = 'Pinky';

          const isPlayed = fret >= 0;
          const noteAtPosition = fret >= 0 ? getNoteAtPosition(index, fret) : '';
          const isRootNote = noteAtPosition && normalizeNote(noteAtPosition) === normalizedRootNote;
          
          return (
            <View key={index} style={styles.fingerRow}>
              <View style={styles.fingerRowLeft}>
                {isRootNote && (
                  <View style={styles.rootIndicator} />
                )}
                <Text style={[styles.fingerString, !isPlayed && styles.fingerStringMuted]}>
                  {stringData[index].note} {stringData[index].string}
                </Text>
              </View>
              <Text style={[styles.fingerFret, fret === 0 && styles.fingerFretOpen]}>
                {fret === -1 ? 'Muted' : fret === 0 ? 'Open' : `Fret ${fret}`}
              </Text>
              <Text style={styles.fingerName}>{fret > 0 ? fingerName : ''}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.chordLetter}>
                <Text style={styles.chordLetterText}>{chord.name[0]}</Text>
              </View>
              <View style={styles.titleContainer}>
                <View style={styles.badges}>
                  <Text style={styles.badge}>{chord.shape.toUpperCase()} CHORDS</Text>
                  <Text style={styles.category}>{chord.type.toUpperCase()}</Text>
                </View>
                <Text style={styles.chordName}>{chord.fullName}</Text>
              </View>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Fretboard Diagram */}
            {renderFretboardDiagram()}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable 
                style={styles.playButton}
                onPress={() => {
                  audioService.playChordPreview(chord.name);
                  onPlay?.();
                }}
              >
                <MaterialIcons name="volume-up" size={18} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </Pressable>

              <Pressable 
                style={styles.editButton}
                onPress={onEdit}
              >
                <MaterialIcons name="edit" size={18} color="#888" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>

            {/* Progress indicator */}
            <View style={styles.progress}>
              <Text style={styles.progressText}>11/124</Text>
            </View>

            {/* Finger Positions */}
            {renderFingerPositions()}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#1A1612', // Warm dark stage surface
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: '#3A3229',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    flex: 1,
  },
  chordLetter: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#211E1A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#3A3229',
  },
  chordLetterText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  titleContainer: {
    flex: 1,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B7355',
    letterSpacing: 0.5,
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: '#8B7355',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: spacing.xs,
  },
  chordName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#E5D5B7',
  },
  fretboardContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  fretboard: {
    backgroundColor: FRETBOARD_BG,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    position: 'relative',
  },
  topMarkers: {
    position: 'absolute',
    top: 4,
    left: spacing.lg,
    height: 20,
  },
  markerContainer: {
    position: 'absolute',
    width: 16,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedX: {
    fontSize: 16,
    color: '#8B7355',
    fontWeight: '600',
  },
  openO: {
    fontSize: 16,
    color: '#E5D5B7',
    fontWeight: '400',
  },
  gridContainer: {
    position: 'relative',
    marginTop: 24,
  },
  string: {
    position: 'absolute',
    width: 2,
    height: '100%',
    backgroundColor: '#E5D5B7',
  },
  fret: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: '#4A423A',
  },
  nutLine: {
    height: 3,
    backgroundColor: '#8B7355',
  },
  fingerDotContainer: {
    position: 'absolute',
    width: 30,
    height: 30,
    marginLeft: -15,
    marginTop: -15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rootNoteDiamond: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  fingerNumber: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  fingerNumberInDiamond: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },
  grayDotContainer: {
    position: 'absolute',
    width: 12,
    height: 12,
    marginLeft: -6,
    marginTop: -6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grayDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#444',
  },
  fretLabel: {
    position: 'absolute',
    left: -8,
    top: 36,
    fontSize: 11,
    color: '#8B7355',
    fontWeight: '600',
  },
  stringNotationBox: {
    backgroundColor: '#FFF',
    borderRadius: borderRadius.sm,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    minWidth: 85,
  },
  notationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  notationString: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
    width: 16,
  },
  notationSeparator: {
    color: '#666',
    fontSize: 13,
    marginHorizontal: 6,
  },
  notationFret: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  playButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: BUTTON_GOLD,
    borderRadius: borderRadius.md,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  playButtonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    backgroundColor: '#211E1A',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#3A3229',
  },
  editButtonText: {
    color: '#8B7355',
    fontSize: 15,
    fontWeight: '600',
  },
  progress: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressText: {
    color: '#8B7355',
    fontSize: 12,
  },
  fingerPositions: {
    marginTop: spacing.md,
  },
  fingerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  fingerTitle: {
    fontSize: 10,
    fontWeight: '600',
    color: '#B8860B',
    letterSpacing: 1,
  },
  fingerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  fingerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1.5,
  },
  rootIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ROOT_NOTE_COLOR,
  },
  fingerString: {
    color: '#E5D5B7',
    fontSize: 14,
    fontWeight: '400',
  },
  fingerStringMuted: {
    color: '#5C4E3A',
  },
  fingerFret: {
    color: '#E5D5B7',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  fingerFretOpen: {
    color: '#6BCF7F',
  },
  fingerName: {
    color: '#8B7355',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
});
