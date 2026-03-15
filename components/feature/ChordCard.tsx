import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { colors, spacing, borderRadius, opacity } from '@/constants/theme';

interface ChordCardProps {
  chord: ChordData;
  cardNumber: number;
  isSelected?: boolean;
  onPress?: () => void;
  onCheckboxPress?: () => void;
}

export function ChordCard({ chord, cardNumber, isSelected = false, onPress, onCheckboxPress }: ChordCardProps) {
  // Calculate fret range
  const activeFrets = chord.positions.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 3 ? minFret : 1;
  const isBarreChord = startFret > 1;

  // Extract root note
  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';

  // Note calculation helpers
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

  // Render fretboard diagram (smaller for card view)
  const renderFretboard = () => {
    const STRINGS = 6;
    const FRETS = 5; // Match detail page
    const DIAGRAM_WIDTH = 66; // Scaled proportionally
    const DIAGRAM_HEIGHT = 88; // Scaled proportionally to match 5 frets
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
                    <>
                      <View style={styles.diamondDot} />
                      <Text style={styles.diamondNumber}>{fingerNumber}</Text>
                    </>
                  ) : (
                    <View style={styles.circleDot}>
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

  // Generate string notation - 6th string at bottom, 1st string at top
  const stringNotation = chord.positions.map((fret, index) => {
    let stringName = STANDARD_TUNING[index];
    // Use lowercase 'e' for 1st string (high E)
    if (index === 5) stringName = 'e';
    
    let notation = '';
    if (fret === -1) {
      notation = '×';
    } else if (fret === 0) {
      notation = '0';
    } else {
      notation = fret.toString();
    }
    return { string: stringName, fret: notation };
  }).reverse(); // Reverse so 6th string is at bottom

  return (
    <Pressable onPress={onPress} style={styles.card}>
      {/* Card number */}
      <Text style={styles.cardNumber}>{cardNumber < 10 ? `0${cardNumber}` : cardNumber}</Text>
      
      <View style={styles.cardContent}>
        {/* Checkbox */}
        <Pressable 
          onPress={(e) => {
            e.stopPropagation();
            onCheckboxPress?.();
          }}
          style={styles.checkboxContainer}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
            {isSelected && (
              <MaterialIcons name="check" size={14} color={colors.primary} />
            )}
          </View>
        </Pressable>

        {/* Fretboard diagram */}
        <View style={styles.diagramSection}>
          {renderFretboard()}
        </View>

        {/* Chord info */}
        <View style={styles.infoSection}>
          <Text style={styles.chordLetter}>{rootNote}</Text>
          <Text style={styles.chordCategory}>{chord.shape.toUpperCase()} CHORDS</Text>
          <Text style={styles.chordFullName}>{chord.fullName}</Text>
        </View>

        {/* String notation box */}
        <View style={styles.stringNotationBox}>
          {stringNotation.map((item, index) => (
            <View key={index} style={styles.stringNotationRow}>
              <Text style={styles.stringName}>{item.string}</Text>
              <Text style={styles.stringDash}>—</Text>
              <Text style={styles.fretNumber}>{item.fret}</Text>
              <Text style={styles.stringDash}>—</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  cardNumber: {
    position: 'absolute',
    top: 8,
    right: 12,
    fontSize: 10,
    color: '#666',
    fontWeight: '600',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20, // 4pts more space between elements
  },
  checkboxContainer: {
    padding: 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: '#444',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(212, 149, 42, 0.2)',
  },

  // Fretboard
  diagramSection: {
    width: 80,
  },
  fretboardContainer: {
    position: 'relative',
    paddingLeft: 16,
    backgroundColor: '#0F0F0F',
    borderRadius: borderRadius.sm,
    padding: spacing.xs,
  },
  fretLabel: {
    position: 'absolute',
    left: -2,
    top: 28,
    fontSize: 8,
    color: '#888',
    fontWeight: '600',
  },
  fretboard: {
    position: 'relative',
  },
  topMarkersRow: {
    position: 'absolute',
    top: -16,
    left: 0,
    height: 14,
  },
  topMarker: {
    position: 'absolute',
    width: 12,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedX: {
    fontSize: 12,
    color: '#666',
    fontWeight: '700',
  },
  openO: {
    fontSize: 12,
    color: '#999',
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
    backgroundColor: colors.string,
  },
  fret: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: colors.fret,
  },
  nutLine: {
    height: 6,
    backgroundColor: colors.text,
    borderRadius: 1,
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
    backgroundColor: colors.primary, // #D4952A orange
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 18,
    height: 18,
    backgroundColor: '#4DB8E8', // Root note blue
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  circleNumber: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  diamondNumber: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    position: 'absolute',
    width: 18,
    height: 18,
    lineHeight: 18,
    // NO rotation - stays vertical!
  },

  // Chord info
  infoSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
    paddingLeft: 32, // 4 letter widths to the right
  },
  chordLetter: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: -4,
    textAlign: 'center',
  },
  chordCategory: {
    fontSize: 9,
    color: '#888',
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  chordFullName: {
    fontSize: 13,
    color: '#AAA',
    fontWeight: '400',
    textAlign: 'center',
  },
  
  // String notation box
  stringNotationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 4, // Reduced from 6 to shorten box
    paddingHorizontal: 10,
    gap: 1, // Reduced from 2 to minimize spacing
    minWidth: 75,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignSelf: 'center', // Center to diagram
  },
  stringNotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 1, // Reduced from 2 to minimize spacing
  },
  stringName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#000',
    width: 12,
  },
  stringDash: {
    fontSize: 10,
    color: '#888',
    marginHorizontal: 2,
  },
  fretNumber: {
    fontSize: 11,
    fontWeight: '600',
    color: '#000',
    minWidth: 14,
    textAlign: 'center',
  },
});
