import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordData } from '@/constants/musicData';

interface ChordCardProps {
  chord: ChordData;
  cardNumber: number;
  isSelected?: boolean;
  onPress?: () => void;
  onCheckboxPress?: () => void;
}

const ROOT_NOTE_COLOR = '#3B82F6'; // Blue
const OTHER_NOTE_COLOR = '#FF8C42'; // Orange

export function ChordCard({ chord, cardNumber, isSelected = false, onPress, onCheckboxPress }: ChordCardProps) {
  // Calculate fret range
  const activeFrets = chord.positions.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 3 ? minFret : 1;
  const isBarreChord = startFret > 1;

  // Extract root note
  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';
  
  // Determine category label
  const chordCategory = chord.category === 'major' ? 'OPEN CHORDS' : 
                        chord.category === 'minor' ? 'MINOR CHORDS' :
                        chord.category === 'seventh' ? 'SEVENTH CHORDS' :
                        'EXTENDED CHORDS';

  // Note calculation helpers
  const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];
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

  // Render fretboard diagram
  const renderFretboard = () => {
    const STRINGS = 6;
    const FRETS = 4;
    const DIAGRAM_WIDTH = 70;
    const DIAGRAM_HEIGHT = 85;
    const STRING_SPACING = DIAGRAM_WIDTH / (STRINGS - 1);
    const FRET_SPACING = DIAGRAM_HEIGHT / FRETS;

    return (
      <View style={styles.fretboardContainer}>
        {/* Fret indicator */}
        {isBarreChord && (
          <Text style={styles.fretLabel}>{startFret}fr</Text>
        )}

        <View style={[styles.fretboard, { width: DIAGRAM_WIDTH, height: DIAGRAM_HEIGHT }]}>
          {/* Top markers (× and ○) */}
          <View style={[styles.topMarkersRow, { width: DIAGRAM_WIDTH }]}>
            {chord.positions.map((fret, stringIndex) => (
              <View 
                key={`marker-${stringIndex}`}
                style={[styles.topMarker, { left: stringIndex * STRING_SPACING - 6 }]}
              >
                {fret === -1 && <Text style={styles.mutedX}>×</Text>}
                {fret === 0 && <Text style={styles.openO}>○</Text>}
              </View>
            ))}
          </View>

          {/* Fretboard grid */}
          <View style={styles.gridArea}>
            {/* Strings (vertical lines) */}
            {Array.from({ length: STRINGS }).map((_, i) => (
              <View 
                key={`string-${i}`}
                style={[styles.string, { left: i * STRING_SPACING }]}
              />
            ))}

            {/* Frets (horizontal lines) */}
            {Array.from({ length: FRETS + 1 }).map((_, i) => (
              <View 
                key={`fret-${i}`}
                style={[
                  styles.fret,
                  { top: i * FRET_SPACING },
                  i === 0 && !isBarreChord && styles.nutLine
                ]}
              />
            ))}

            {/* Finger dots/diamonds */}
            {chord.positions.map((fret, stringIndex) => {
              if (fret <= 0) return null;
              
              const displayFret = fret - startFret + 1;
              if (displayFret < 1 || displayFret > FRETS) return null;

              const noteAtPosition = getNoteAtPosition(stringIndex, fret);
              const isRootNote = normalizeNote(noteAtPosition) === normalizedRootNote;
              const fingerNumber = chord.fingers?.[stringIndex] || 1;

              const xPos = stringIndex * STRING_SPACING;
              const yPos = (displayFret - 0.5) * FRET_SPACING;

              return (
                <View
                  key={`dot-${stringIndex}`}
                  style={[styles.dotContainer, { left: xPos, top: yPos }]}
                >
                  {isRootNote ? (
                    <View style={[styles.diamondDot, { backgroundColor: ROOT_NOTE_COLOR }]}>
                      <Text style={styles.diamondNumber}>{fingerNumber}</Text>
                    </View>
                  ) : (
                    <View style={[styles.circleDot, { backgroundColor: OTHER_NOTE_COLOR }]}>
                      <Text style={styles.circleNumber}>{fingerNumber}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </View>
    );
  };

  // Render string notation box
  const renderStringNotation = () => {
    const stringLabels = ['e', 'B', 'G', 'D', 'A', 'E'];
    
    return (
      <View style={styles.notationBox}>
        {stringLabels.map((label, i) => {
          const fret = chord.positions[5 - i];
          return (
            <View key={i} style={styles.notationRow}>
              <Text style={styles.notationLabel}>{label}</Text>
              <Text style={styles.notationDash}>—</Text>
              <Text style={styles.notationValue}>{fret === -1 ? '×' : fret}</Text>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={styles.card}>
      {/* Card number badge */}
      <View style={styles.cardBadge}>
        <Text style={styles.cardBadgeText}>{String(cardNumber).padStart(2, '0')}</Text>
      </View>

      <View style={styles.cardContent}>
        {/* Checkbox */}
        <Pressable onPress={onCheckboxPress} style={styles.checkboxWrapper}>
          <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
            {isSelected && <MaterialIcons name="check" size={14} color="#000" />}
          </View>
        </Pressable>

        {/* Fretboard diagram */}
        <Pressable onPress={onPress} style={styles.diagramSection}>
          {renderFretboard()}
        </Pressable>

        {/* Chord info */}
        <Pressable onPress={onPress} style={styles.infoSection}>
          <Text style={styles.chordLetter}>{rootNote}</Text>
          <View style={styles.chordLabels}>
            <Text style={styles.categoryText}>{chordCategory}</Text>
            <Text style={styles.chordNameText}>{chord.name}</Text>
          </View>
        </Pressable>

        {/* String notation */}
        <View style={styles.notationSection}>
          {renderStringNotation()}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#0A0A0A',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#2A2A2A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBadgeText: {
    fontSize: 10,
    color: '#888',
    fontWeight: '700',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  // Checkbox
  checkboxWrapper: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#FF8C42',
    borderColor: '#FF8C42',
  },

  // Fretboard
  diagramSection: {
    width: 95,
  },
  fretboardContainer: {
    position: 'relative',
    paddingLeft: 14,
  },
  fretLabel: {
    position: 'absolute',
    left: 0,
    top: 28,
    fontSize: 10,
    color: '#888',
    fontWeight: '600',
  },
  fretboard: {
    position: 'relative',
  },
  topMarkersRow: {
    position: 'absolute',
    top: -18,
    left: 0,
    height: 16,
  },
  topMarker: {
    position: 'absolute',
    width: 12,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedX: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  openO: {
    fontSize: 13,
    color: '#CCC',
    fontWeight: '400',
  },
  gridArea: {
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  string: {
    position: 'absolute',
    width: 1.5,
    height: '100%',
    backgroundColor: '#555',
  },
  fret: {
    position: 'absolute',
    height: 1,
    width: '100%',
    backgroundColor: '#555',
  },
  nutLine: {
    height: 3,
    backgroundColor: '#777',
  },
  dotContainer: {
    position: 'absolute',
    width: 20,
    height: 20,
    marginLeft: -10,
    marginTop: -10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  circleNumber: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
  },
  diamondNumber: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },

  // Chord info
  infoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  chordLetter: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    width: 38,
  },
  chordLabels: {
    flex: 1,
  },
  categoryText: {
    fontSize: 9,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  chordNameText: {
    fontSize: 14,
    color: '#CCC',
    fontWeight: '400',
  },

  // String notation
  notationSection: {
    alignItems: 'flex-end',
  },
  notationBox: {
    backgroundColor: '#FFF',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minWidth: 65,
  },
  notationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 1,
  },
  notationLabel: {
    color: '#000',
    fontSize: 11,
    fontWeight: '700',
    width: 12,
  },
  notationDash: {
    color: '#666',
    fontSize: 10,
    marginHorizontal: 4,
  },
  notationValue: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
});
