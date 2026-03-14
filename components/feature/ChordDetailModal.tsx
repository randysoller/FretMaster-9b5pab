import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, runOnJS } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, typography, borderRadius, opacity } from '@/constants/theme';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { audioService } from '@/services/audioService';
import { useAuth } from '@/hooks/useAuth';

const ROOT_NOTE_COLOR = colors.rootNoteBlue; // Root note blue for diamonds
const OTHER_NOTE_COLOR = colors.primary; // Primary color for finger positions
const FRETBOARD_BG = colors.fretboard;
const BUTTON_GOLD = colors.primary;

interface ChordDetailModalProps {
  visible: boolean;
  chord: ChordData | null;
  allChords?: ChordData[];
  currentIndex?: number;
  onClose: () => void;
  onNavigate?: (direction: 'prev' | 'next') => void;
  onPlay?: () => void;
  onEdit?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = 50;

export function ChordDetailModal({ 
  visible, 
  chord, 
  allChords = [],
  currentIndex = 0,
  onClose, 
  onNavigate,
  onPlay, 
  onEdit 
}: ChordDetailModalProps) {
  const { isAdmin } = useAuth();
  const translateX = useSharedValue(0);
  
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allChords.length - 1;
  const prevChord = hasPrev ? allChords[currentIndex - 1] : null;
  const nextChord = hasNext ? allChords[currentIndex + 1] : null;
  
  const handleSwipe = (direction: 'prev' | 'next') => {
    if (onNavigate) {
      onNavigate(direction);
      translateX.value = 0;
    }
  };
  
  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10]) // Activate on 10px horizontal movement
    .failOffsetY([-20, 20]) // Fail if vertical movement exceeds 20px
    .onUpdate((e) => {
      // Only allow swipe if there's a chord in that direction
      if ((e.translationX > 0 && !hasPrev) || (e.translationX < 0 && !hasNext)) {
        translateX.value = e.translationX * 0.2; // Damped movement
      } else {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      // Lower velocity threshold for easier swiping (or no velocity check at all)
      const hasEnoughDistance = Math.abs(e.translationX) > SWIPE_THRESHOLD;
      const hasEnoughVelocity = Math.abs(e.velocityX) > 200; // Lowered from 500
      
      if (hasEnoughDistance || hasEnoughVelocity) {
        if (e.translationX > 0 && hasPrev) {
          runOnJS(handleSwipe)('prev');
        } else if (e.translationX < 0 && hasNext) {
          runOnJS(handleSwipe)('next');
        } else {
          translateX.value = withSpring(0);
        }
      } else {
        translateX.value = withSpring(0);
      }
    });
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
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

        {/* String notation box - 6th string at bottom */}
        <View style={styles.stringNotationBox}>
          {['E', 'A', 'D', 'G', 'B', 'e'].map((note, index) => {
            const fret = chord.positions[index];
            
            return (
              <View key={index} style={styles.notationRow}>
                <Text style={styles.notationString}>{note}</Text>
                <Text style={styles.notationSeparator}>—</Text>
                <Text style={styles.notationFret}>{fret === -1 ? '×' : fret}</Text>
                <Text style={styles.notationSeparator}>—</Text>
              </View>
            );
          }).reverse()}
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
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modal, animatedStyle]}>
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
                style={[styles.playButton, !isAdmin && styles.playButtonFull]}
                onPress={() => {
                  audioService.playChordPreview(chord.name);
                  onPlay?.();
                }}
              >
                <MaterialIcons name="volume-up" size={18} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </Pressable>

              {isAdmin && (
                <Pressable 
                  style={styles.editButton}
                  onPress={onEdit}
                >
                  <MaterialIcons name="edit" size={18} color="#888" />
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
              )}
            </View>

            {/* Progress indicator */}
            <View style={styles.progress}>
              <Text style={styles.progressText}>11/124</Text>
            </View>

            {/* Finger Positions */}
            {renderFingerPositions()}
          </ScrollView>
          
          {/* Bleeding Edge Preview Cards */}
          {hasPrev && prevChord && (
            <Pressable 
              style={[styles.bleedingEdgeCard, styles.bleedingEdgeCardLeft]}
              onPress={() => handleSwipe('prev')}
            >
              <View style={styles.bleedingEdgeContent}>
                <Text style={styles.bleedingEdgeChordName} numberOfLines={1}>{prevChord.name}</Text>
              </View>
            </Pressable>
          )}
          {hasNext && nextChord && (
            <Pressable 
              style={[styles.bleedingEdgeCard, styles.bleedingEdgeCardRight]}
              onPress={() => handleSwipe('next')}
            >
              <View style={styles.bleedingEdgeContent}>
                <Text style={styles.bleedingEdgeChordName} numberOfLines={1}>{nextChord.name}</Text>
              </View>
            </Pressable>
          )}
          
          {/* Progress indicator */}
          {allChords.length > 0 && (
            <View style={styles.progressDots}>
              {allChords.slice(Math.max(0, currentIndex - 2), Math.min(allChords.length, currentIndex + 3)).map((_, idx) => {
                const actualIdx = Math.max(0, currentIndex - 2) + idx;
                return (
                  <View 
                    key={actualIdx}
                    style={[
                      styles.progressDot,
                      actualIdx === currentIndex && styles.progressDotActive
                    ]} 
                  />
                );
              })}
            </View>
          )}
        </Animated.View>
        </GestureDetector>
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
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgOverlay,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
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
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  category: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  closeButton: {
    padding: spacing.xs,
  },
  chordName: {
    fontSize: 16,
    fontWeight: '400',
    color: colors.textSubtle,
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
    color: colors.textMuted,
    fontWeight: '700',
  },
  openO: {
    fontSize: 16,
    color: colors.textSubtle,
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
    color: colors.background,
    fontSize: 18,
    fontWeight: '700',
  },
  fingerNumberInDiamond: {
    color: '#1A1D24',
    fontSize: 18,
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
    color: colors.textSubtle,
    fontWeight: '600',
  },
  stringNotationBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    minWidth: 105,
    marginLeft: 34,
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
    marginHorizontal: 4,
  },
  notationFret: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    minWidth: 16,
    textAlign: 'center',
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
  },
  playButtonFull: {
    flex: undefined,
    width: '100%',
  },
  playButtonText: {
    color: colors.background,
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
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  editButtonText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  progress: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressText: {
    color: colors.textMuted,
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
    color: colors.textMuted,
    letterSpacing: 1,
    textTransform: 'uppercase',
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
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '400',
  },
  fingerStringMuted: {
    color: colors.textMuted,
  },
  fingerFret: {
    color: colors.textSubtle,
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  fingerFretOpen: {
    color: colors.success,
  },
  fingerName: {
    color: colors.textMuted,
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  bleedingEdgeCard: {
    position: 'absolute',
    top: '12.5%',
    width: 4,
    height: '75%',
    backgroundColor: colors.bgElevated,
    borderWidth: 1.5,
    borderColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bleedingEdgeCardLeft: {
    left: 0,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 4,
    borderLeftWidth: 0,
  },
  bleedingEdgeCardRight: {
    right: 0,
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 4,
    borderRightWidth: 0,
  },
  bleedingEdgeContent: {
    transform: [{ rotate: '-90deg' }],
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bleedingEdgeChordName: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  progressDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.borderSubtle,
  },
  progressDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
