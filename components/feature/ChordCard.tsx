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
const OTHER_NOTE_COLOR = '#FFB84D'; // Yellow-Orange

export function ChordCard({ chord, cardNumber, isSelected = false, onPress, onCheckboxPress }: ChordCardProps) {
  // Calculate fret range
  const activeFrets = chord.positions.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 3 ? minFret : 1;
  const isBarreChord = startFret > 1;

  // Extract root note
  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';

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
    const DIAGRAM_WIDTH = 80;
    const DIAGRAM_HEIGHT = 100;
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
                style={[styles.topMarker, { left: stringIndex * STRING_SPACING - 8 }]}
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

  // Generate string notation
  const stringNotation = chord.positions.map((fret, index) => {
    const stringName = STANDARD_TUNING[index];
    let notation = '';
    if (fret === -1) {
      notation = '×';
    } else if (fret === 0) {
      notation = '0';
    } else {
      notation = fret.toString();
    }
    return { string: stringName, fret: notation };
  });

  return (
    <View style={styles.card}>
      {/* Card number */}
      <Text style={styles.cardNumber}>{cardNumber < 10 ? `0${cardNumber}` : cardNumber}</Text>
      
      <View style={styles.cardContent}>
        {/* Checkbox */}
        <Pressable 
          onPress={onCheckboxPress}
          style={styles.checkboxContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <MaterialIcons name="check" size={16} color="#FF8C42" />
            )}
          </View>
        </Pressable>

        {/* Fretboard diagram */}
        <Pressable onPress={onPress} style={styles.diagramSection}>
          {renderFretboard()}
        </Pressable>

        {/* Chord info */}
        <Pressable onPress={onPress} style={styles.infoSection}>
          <Text style={styles.chordName}>{chord.name}</Text>
          <Text style={styles.chordCategory}>{chord.shape.toUpperCase()} CHORDS</Text>
          <Text style={styles.chordFullName}>{chord.fullName}</Text>
        </Pressable>

        {/* String notation box */}
        <View style={styles.stringNotationBox}>
          {stringNotation.map((item, index) => (
            <View key={index} style={styles.stringNotationRow}>
              <Text style={styles.stringName}>{item.string}</Text>
              <Text style={styles.stringDash}>—</Text>
              <Text style={styles.fretNumber}>{item.fret}</Text>
            </View>
          ))}
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
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardNumber: {
    position: 'absolute',
    top: 12,
    right: 12,
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  checkboxContainer: {
    padding: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: '#FFA055',
    backgroundColor: '#1A1A1A',
  },

  // Fretboard
  diagramSection: {
    width: 90,
  },
  fretboardContainer: {
    position: 'relative',
    paddingLeft: 20,
  },
  fretLabel: {
    position: 'absolute',
    left: 0,
    top: 35,
    fontSize: 11,
    color: '#888',
    fontWeight: '700',
  },
  fretboard: {
    position: 'relative',
  },
  topMarkersRow: {
    position: 'absolute',
    top: -20,
    left: 0,
    height: 18,
  },
  topMarker: {
    position: 'absolute',
    width: 16,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedX: {
    fontSize: 15,
    color: '#888',
    fontWeight: '700',
  },
  openO: {
    fontSize: 15,
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
    width: 2,
    height: '100%',
    backgroundColor: '#555',
  },
  fret: {
    position: 'absolute',
    height: 1.5,
    width: '100%',
    backgroundColor: '#555',
  },
  nutLine: {
    height: 4,
    backgroundColor: '#777',
  },
  dotContainer: {
    position: 'absolute',
    width: 22,
    height: 22,
    marginLeft: -11,
    marginTop: -11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  circleNumber: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
  },
  diamondNumber: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },

  // Chord info
  infoSection: {
    flex: 1,
    justifyContent: 'center',
  },
  chordName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 2,
  },
  chordCategory: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  chordFullName: {
    fontSize: 14,
    color: '#888',
    fontWeight: '500',
  },
  
  // String notation box
  stringNotationBox: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    minWidth: 70,
  },
  stringNotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stringName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    width: 12,
  },
  stringDash: {
    fontSize: 10,
    color: '#666',
  },
  fretNumber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
  },
});
