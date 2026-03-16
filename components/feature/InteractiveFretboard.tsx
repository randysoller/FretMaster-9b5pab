import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface InteractiveFretboardProps {
  chord: ChordData;
  baseFret: number;
  visibleFrets: number;
  dotShapes: ('circle' | 'diamond')[];
  dotColors: string[];
  onFretboardTap: (stringIndex: number, fretIndex: number) => void;
  onStringLabelTap?: (stringIndex: number) => void;
  onClear?: () => void;
  showControls?: boolean;
  title?: string;
  instructions?: string;
}

const STRINGS = 6;
const STRING_SPACING = 40;
const FRET_SPACING = 50;
const FRET_WIDTH = STRING_SPACING * (STRINGS - 1);
const STRING_WIDTHS = [3.0, 2.4, 2.0, 1.6, 1.2, 0.8];

// Root note detection helpers
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

const isRootNote = (stringIndex: number, fret: number, chordName: string): boolean => {
  const rootNote = chordName.match(/^[A-G][#b]?/)?.[0] || 'C';
  const normalizedRootNote = normalizeNote(rootNote);
  const noteAtPosition = getNoteAtPosition(stringIndex, fret);
  return normalizeNote(noteAtPosition) === normalizedRootNote;
};

// Barre detection
const detectBarres = (positions: number[], fingers: number[]) => {
  const barres: Array<{ fret: number; fromString: number; toString: number; finger: number }> = [];
  const fretMap: { [key: string]: number[] } = {};

  positions.forEach((fret, stringIndex) => {
    if (fret > 0 && fingers[stringIndex] > 0) {
      const key = `${fret}-${fingers[stringIndex]}`;
      if (!fretMap[key]) fretMap[key] = [];
      fretMap[key].push(stringIndex);
    }
  });

  Object.entries(fretMap).forEach(([key, strings]) => {
    if (strings.length >= 2) {
      const [fret, finger] = key.split('-').map(Number);
      const fromString = Math.min(...strings);
      const toString = Math.max(...strings);
      barres.push({ fret, fromString, toString, finger });
    }
  });

  return barres;
};

export function InteractiveFretboard({
  chord,
  baseFret,
  visibleFrets,
  dotShapes,
  dotColors,
  onFretboardTap,
  onStringLabelTap,
  onClear,
  showControls = true,
  title = 'FRETBOARD',
  instructions = 'Tap string labels (E-A-D-G-B-E) or any fret position, then choose shape and finger from the popup. Barres appear automatically when 2+ dots share the same fret and finger.',
}: InteractiveFretboardProps) {
  const detectedBarres = detectBarres(chord.positions, chord.fingers);
  const barreRenderedStrings = new Set<number>();
  detectedBarres.forEach(barre => {
    for (let si = barre.fromString; si <= barre.toString; si++) {
      if (chord.positions[si] === barre.fret) {
        barreRenderedStrings.add(si);
      }
    }
  });

  return (
    <View style={styles.container}>
      {showControls && (
        <>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            {onClear && (
              <Pressable onPress={onClear} style={styles.clearButton}>
                <MaterialIcons name="refresh" size={16} color={colors.textMuted} />
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.instructions}>{instructions}</Text>
        </>
      )}

      {/* String labels */}
      {onStringLabelTap && (
        <View style={styles.stringLabels}>
          {STANDARD_TUNING.map((note, i) => (
            <Pressable 
              key={i} 
              style={[styles.stringLabelColumn, { left: i * STRING_SPACING - 12 }]}
              onPress={() => onStringLabelTap(i)}
            >
              <Text style={styles.stringNote}>{note}</Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Fretboard Grid */}
      <View style={styles.fretboardGrid}>
        {/* Fret lines */}
        {Array.from({ length: visibleFrets + 1 }).map((_, i) => (
          <View 
            key={`fret-${i}`}
            style={[
              styles.fretLine,
              { top: i * FRET_SPACING, width: FRET_WIDTH },
              i === 0 && baseFret === 1 && styles.nutLine,
            ]}
          />
        ))}

        {/* String lines */}
        {Array.from({ length: STRINGS }).map((_, i) => (
          <View 
            key={`string-${i}`}
            style={[styles.stringLine, { left: i * STRING_SPACING, width: STRING_WIDTHS[i] }]}
          />
        ))}

        {/* Mute (X) markers */}
        {chord.positions.map((fret, stringIndex) => {
          if (fret !== -1) return null;
          const x = stringIndex * STRING_SPACING;
          const y = -22;
          const size = 12;
          return (
            <View key={`mute-${stringIndex}`} style={{ position: 'absolute', left: x - size, top: y - size, width: size * 2, height: size * 2 }}>
              <View style={{ position: 'absolute', width: size * 2, height: 3, backgroundColor: '#999', transform: [{ rotate: '45deg' }], top: size - 1.5 }} />
              <View style={{ position: 'absolute', width: size * 2, height: 3, backgroundColor: '#999', transform: [{ rotate: '-45deg' }], top: size - 1.5 }} />
            </View>
          );
        })}

        {/* Barres */}
        {detectedBarres.map((barre, idx) => {
          const fretIndex = barre.fret - baseFret + 1;
          if (fretIndex < 1 || fretIndex > visibleFrets) return null;

          const y = (fretIndex - 0.5) * FRET_SPACING;
          const fromX = barre.fromString * STRING_SPACING;
          const toX = barre.toString * STRING_SPACING;
          const barreWidth = toX - fromX;

          return (
            <React.Fragment key={`barre-${idx}`}>
              <View
                style={{
                  position: 'absolute',
                  left: fromX - 7,
                  top: y - 7,
                  width: barreWidth + 14,
                  height: 14,
                  backgroundColor: '#D4952A',
                  borderRadius: 7,
                }}
              />
              {Array.from({ length: barre.toString - barre.fromString + 1 }).map((_, offset) => {
                const si = barre.fromString + offset;
                if (chord.positions[si] !== barre.fret) return null;

                const dotX = si * STRING_SPACING;
                const fingerNum = chord.fingers[si];
                const isRoot = isRootNote(si, barre.fret, chord.name);
                const thisShape = isRoot ? 'diamond' : dotShapes[si];
                const thisColor = isRoot ? '#4DB8E8' : dotColors[si];

                return (
                  <View
                    key={`barre-dot-${si}`}
                    style={{
                      position: 'absolute',
                      left: dotX - 16,
                      top: y - 16,
                      width: 32,
                      height: 32,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
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
            </React.Fragment>
          );
        })}

        {/* Individual dots (non-barre) */}
        {chord.positions.map((fret, stringIndex) => {
          if (fret < 0) return null;
          const fretIndex = fret === 0 ? 0.5 : fret - baseFret + 1;
          if (fret > 0 && (fretIndex < 1 || fretIndex > visibleFrets)) return null;
          if (barreRenderedStrings.has(stringIndex)) return null;

          const x = stringIndex * STRING_SPACING;
          const y = fret === 0 ? -20 : (fretIndex - 0.5) * FRET_SPACING;
          const fingerNum = chord.fingers[stringIndex];
          const thisShape = dotShapes[stringIndex];
          const thisColor = dotColors[stringIndex];
          const isOpenString = fret === 0;

          return (
            <View
              key={`dot-${stringIndex}`}
              style={[styles.fretDot, { left: x - 16, top: y - 16 }]}
            >
              {thisShape === 'circle' ? (
                <View style={[
                  styles.dotCircle, 
                  isOpenString 
                    ? { backgroundColor: 'transparent', borderWidth: 3, borderColor: thisColor } 
                    : { backgroundColor: thisColor }
                ]}>
                  {fingerNum > 0 && (
                    <Text style={styles.dotNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                  )}
                </View>
              ) : (
                <>
                  <View style={[
                    styles.dotDiamond, 
                    isOpenString 
                      ? { backgroundColor: 'transparent', borderWidth: 3, borderColor: thisColor } 
                      : { backgroundColor: thisColor }
                  ]} />
                  {fingerNum > 0 && (
                    <Text style={styles.diamondNumber}>{fingerNum === 5 ? 'T' : fingerNum}</Text>
                  )}
                </>
              )}
            </View>
          );
        })}

        {/* Clickable areas */}
        {Array.from({ length: visibleFrets }).map((_, fretIndex) => 
          Array.from({ length: STRINGS }).map((_, stringIndex) => (
            <Pressable
              key={`click-${stringIndex}-${fretIndex}`}
              onPress={() => onFretboardTap(stringIndex, fretIndex + 1)}
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
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    backgroundColor: '#0F0F0F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    letterSpacing: 1,
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
    fontSize: 11,
    fontWeight: '600',
    color: colors.textMuted,
  },
  instructions: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: spacing.md,
    lineHeight: 16,
  },
  stringLabels: {
    flexDirection: 'row',
    height: 30,
    marginBottom: spacing.sm,
    position: 'relative',
    width: 300,
    marginLeft: 0,
    alignSelf: 'center',
  },
  stringLabelColumn: {
    position: 'absolute',
    alignItems: 'center',
    width: 24,
  },
  stringNote: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  fretboardGrid: {
    position: 'relative',
    width: 300,
    height: 300,
    marginVertical: spacing.lg,
    alignSelf: 'center',
  },
  fretLine: {
    position: 'absolute',
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
});
