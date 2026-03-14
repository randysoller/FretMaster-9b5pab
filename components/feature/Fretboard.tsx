import React from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '@/constants/theme';
import { STANDARD_TUNING, NUM_FRETS, FRET_MARKERS } from '@/constants/musicData';

interface FretboardProps {
  activePositions?: { string: number; fret: number }[];
  highlightedPositions?: { string: number; fret: number; isRoot?: boolean }[];
  onFretPress?: (string: number, fret: number) => void;
  showPositions?: boolean;
  numFrets?: number;
}

export function Fretboard({ 
  activePositions = [],
  highlightedPositions = [],
  onFretPress,
  showPositions = true,
  numFrets = NUM_FRETS,
}: FretboardProps) {
  
  const isActive = (stringIndex: number, fret: number) => {
    return activePositions.some(p => p.string === stringIndex && p.fret === fret);
  };
  
  const getHighlight = (stringIndex: number, fret: number) => {
    return highlightedPositions.find(p => p.string === stringIndex && p.fret === fret);
  };
  
  const handlePress = (stringIndex: number, fret: number) => {
    if (onFretPress) {
      onFretPress(stringIndex, fret);
    }
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
    >
      <View style={styles.fretboard}>
        {/* Fret markers */}
        <View style={styles.markerRow}>
          <View style={[styles.markerCell, styles.nutCell]} />
          {Array.from({ length: numFrets }).map((_, i) => (
            <View key={i} style={styles.markerCell}>
              {FRET_MARKERS.includes(i + 1) && (
                <View style={styles.fretMarker} />
              )}
            </View>
          ))}
        </View>

        {/* Strings */}
        {STANDARD_TUNING.map((note, stringIndex) => (
          <View key={stringIndex} style={styles.stringRow}>
            {/* Nut / Open string label */}
            <View style={styles.nutCell}>
              <Text style={styles.nutLabel}>{note}</Text>
            </View>
            
            {/* Frets */}
            {Array.from({ length: numFrets }).map((_, fret) => {
              const fretNum = fret + 1;
              const active = isActive(stringIndex, fretNum);
              const highlight = getHighlight(stringIndex, fretNum);
              
              return (
                <Pressable
                  key={fret}
                  onPress={() => handlePress(stringIndex, fretNum)}
                  style={({ pressed }) => [
                    styles.fret,
                    pressed && styles.fretPressed,
                  ]}
                >
                  <View style={styles.stringLine} />
                  
                  {(active || highlight) && (
                    <View style={[
                      styles.note,
                      active && styles.noteActive,
                      highlight && styles.noteHighlighted,
                      highlight?.isRoot && styles.noteRoot,
                    ]} />
                  )}
                  
                  {fret < numFrets - 1 && <View style={styles.fretLine} />}
                </Pressable>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const FRET_WIDTH = 60;
const STRING_HEIGHT = 40;

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.fretboard,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
  },
  fretboard: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  markerRow: {
    flexDirection: 'row',
    height: 20,
    marginBottom: spacing.sm,
  },
  markerCell: {
    width: FRET_WIDTH,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutCell: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutLabel: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  fretMarker: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.dot,
  },
  stringRow: {
    flexDirection: 'row',
    height: STRING_HEIGHT,
  },
  fret: {
    width: FRET_WIDTH,
    height: STRING_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fretPressed: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  stringLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.string,
  },
  fretLine: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.fret,
  },
  note: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
    zIndex: 1,
  },
  noteActive: {
    backgroundColor: colors.primary,
  },
  noteHighlighted: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  noteRoot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    borderWidth: 3,
  },
});
