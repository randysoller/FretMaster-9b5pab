import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ChordData } from '@/constants/musicData';

interface ChordCardProps {
  chord: ChordData;
  cardNumber: number;
  onPress?: () => void;
}

const ROOT_NOTE_COLOR = '#3B82F6'; // Blue
const OTHER_NOTE_COLOR = '#FF8C42'; // Orange

export function ChordCard({ chord, cardNumber, onPress }: ChordCardProps) {
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

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.cardContent}>
        {/* Fretboard diagram */}
        <View style={styles.diagramSection}>
          {renderFretboard()}
        </View>

        {/* Chord info */}
        <View style={styles.infoSection}>
          <Text style={styles.chordName}>{chord.name}</Text>
          <Text style={styles.chordFullName}>{chord.fullName}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },

  // Fretboard
  diagramSection: {
    width: 110,
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
    width: 24,
    height: 24,
    marginLeft: -12,
    marginTop: -12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 22,
    height: 22,
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
    fontSize: 36,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  chordFullName: {
    fontSize: 16,
    color: '#888',
    fontWeight: '500',
  },
});
