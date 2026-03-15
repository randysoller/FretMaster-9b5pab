import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { colors, spacing, borderRadius } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;
const SWIPE_VELOCITY = 500;

interface ChordDetailModalProps {
  visible: boolean;
  chord: ChordData | null;
  allChords: ChordData[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  onPlay: () => void;
  onEdit: () => void;
}

export function ChordDetailModal({
  visible,
  chord,
  allChords,
  currentIndex,
  onClose,
  onNavigate,
  onPlay,
  onEdit,
}: ChordDetailModalProps) {
  const translateX = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isNavigatingRef = useRef(false);
  const lastChordIdRef = useRef<string | null>(null);
  const navigationDirectionRef = useRef<'prev' | 'next' | null>(null);

  // Animate entrance when chord changes
  useEffect(() => {
    if (chord?.id && chord.id !== lastChordIdRef.current) {
      lastChordIdRef.current = chord.id;
      
      // Determine entrance direction
      const entranceX = navigationDirectionRef.current === 'next' ? SCREEN_WIDTH : 
                        navigationDirectionRef.current === 'prev' ? -SCREEN_WIDTH : 0;
      
      // Set initial off-screen position
      translateX.value = entranceX;
      scale.value = 0.9;
      opacity.value = 0;
      
      // Animate entrance to center
      translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      scale.value = withSpring(1, { damping: 20, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 200 });
      
      // Reset navigation state
      isNavigatingRef.current = false;
      navigationDirectionRef.current = null;
    }
  }, [chord?.id]);

  // Safety timeout to reset navigation lock
  useEffect(() => {
    if (isNavigatingRef.current) {
      const timeout = setTimeout(() => {
        isNavigatingRef.current = false;
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [chord?.id]);

  const navigate = (direction: 'prev' | 'next') => {
    if (isNavigatingRef.current) {
      console.log('Navigation blocked - already navigating');
      return;
    }
    isNavigatingRef.current = true;
    navigationDirectionRef.current = direction;
    onNavigate(direction);
    
    // Safety timeout in case chord doesn't update
    setTimeout(() => {
      if (isNavigatingRef.current) {
        console.log('Navigation timeout - resetting lock');
        isNavigatingRef.current = false;
      }
    }, 500);
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      if (isNavigatingRef.current) return; // Prevent gesture during navigation
      
      translateX.value = event.translationX;
      
      // Animate scale and opacity based on swipe progress
      const progress = Math.abs(event.translationX) / SCREEN_WIDTH;
      scale.value = 1 - progress * 0.15; // Scale down to 0.85
      opacity.value = 1 - progress * 0.5; // Fade to 0.5
    })
    .onEnd((event) => {
      'worklet';
      const shouldNavigateNext = 
        (event.translationX < -SWIPE_THRESHOLD || event.velocityX < -SWIPE_VELOCITY) &&
        currentIndex < allChords.length - 1;
      
      const shouldNavigatePrev = 
        (event.translationX > SWIPE_THRESHOLD || event.velocityX > SWIPE_VELOCITY) &&
        currentIndex > 0;

      if (shouldNavigateNext) {
        // Animate exit to left
        translateX.value = withTiming(-SCREEN_WIDTH, { duration: 250 });
        scale.value = withTiming(0.85, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 });
        
        // Trigger navigation immediately, don't wait for animation
        runOnJS(navigate)('next');
      } else if (shouldNavigatePrev) {
        // Animate exit to right
        translateX.value = withTiming(SCREEN_WIDTH, { duration: 250 });
        scale.value = withTiming(0.85, { duration: 250 });
        opacity.value = withTiming(0, { duration: 250 });
        
        // Trigger navigation immediately, don't wait for animation
        runOnJS(navigate)('prev');
      } else {
        // Snap back to center
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
        scale.value = withSpring(1, { damping: 20, stiffness: 200 });
        opacity.value = withSpring(1, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
  }));

  if (!chord) return null;

  // Note calculation
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const normalizeNote = (note: string) =>
    note.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#')
      .replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
  
  const getNoteAtPosition = (stringIndex: number, fret: number): string => {
    if (fret < 0) return '';
    const openNote = STANDARD_TUNING[stringIndex];
    const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex];
  };

  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';
  const normalizedRootNote = normalizeNote(rootNote);

  // Fretboard rendering
  const activeFrets = chord.positions.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const startFret = minFret > 3 ? minFret : 1;
  const isBarreChord = startFret > 1;

  const STRINGS = 6;
  const FRETS = 5;
  const DIAGRAM_WIDTH = 180;
  const DIAGRAM_HEIGHT = 220;
  const STRING_SPACING = DIAGRAM_WIDTH / (STRINGS - 1);
  const FRET_SPACING = DIAGRAM_HEIGHT / FRETS;

  // String notation
  const stringNotation = chord.positions.map((fret, index) => {
    let stringName = STANDARD_TUNING[index];
    if (index === 5) stringName = 'e';
    let notation = fret === -1 ? '×' : fret === 0 ? '0' : fret.toString();
    return { string: stringName, fret: notation };
  }).reverse();

  // Finger positions list
  const fingerPositions = chord.positions.map((fret, stringIndex) => {
    if (fret < 0) return null;
    const stringName = STANDARD_TUNING[stringIndex];
    const noteAtPosition = getNoteAtPosition(stringIndex, fret);
    const isRootNote = normalizeNote(noteAtPosition) === normalizedRootNote;
    const fingerNumber = chord.fingers?.[stringIndex] || 0;

    let fretLabel = '';
    if (fret === 0) {
      fretLabel = 'Open';
    } else {
      fretLabel = `Fret ${fret}`;
    }

    const finger = fingerNumber === 0 ? '—' : fingerNumber === 5 ? 'Thumb' : fingerNumber;

    return {
      string: `${stringName} (${6 - stringIndex}th)`,
      note: noteAtPosition,
      fret: fretLabel,
      finger,
      isRootNote,
      isOpen: fret === 0,
      isMuted: fret === -1,
    };
  }).filter(Boolean).reverse();

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <Pressable
            style={[styles.navArrow, styles.navArrowLeft]}
            onPress={() => navigate('prev')}
          >
            <MaterialIcons name="chevron-left" size={32} color={colors.text} />
          </Pressable>
        )}

        {currentIndex < allChords.length - 1 && (
          <Pressable
            style={[styles.navArrow, styles.navArrowRight]}
            onPress={() => navigate('next')}
          >
            <MaterialIcons name="chevron-right" size={32} color={colors.text} />
          </Pressable>
        )}

        {/* Modal Card */}
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.modal, animatedStyle]}>
            {/* Close Button */}
            <Pressable style={styles.closeButton} onPress={onClose}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </Pressable>

            {/* Header */}
            <View style={styles.header}>
              <View style={styles.chordLetterBadge}>
                <Text style={styles.chordLetter}>{rootNote}</Text>
              </View>
              <View style={styles.badges}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chord.shape.toUpperCase()} CHORDS</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{chord.type.toUpperCase()}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.chordName}>{chord.fullName}</Text>

            {/* Fretboard and String Notation */}
            <View style={styles.diagramRow}>
              <View style={styles.fretboardContainer}>
                {isBarreChord && <Text style={styles.fretLabel}>{startFret}fr</Text>}
                <View style={[styles.fretboard, { width: DIAGRAM_WIDTH, height: DIAGRAM_HEIGHT }]}>
                  {/* Top markers */}
                  <View style={[styles.topMarkersRow, { width: DIAGRAM_WIDTH }]}>
                    {chord.positions.map((fret, stringIndex) => (
                      <View key={`marker-${stringIndex}`} style={[styles.topMarker, { left: stringIndex * STRING_SPACING - 10 }]}>
                        {fret === -1 && <Text style={styles.mutedX}>×</Text>}
                        {fret === 0 && <Text style={styles.openO}>○</Text>}
                      </View>
                    ))}
                  </View>

                  {/* Grid */}
                  <View style={styles.gridArea}>
                    {Array.from({ length: STRINGS }).map((_, i) => (
                      <View key={`string-${i}`} style={[styles.string, { left: i * STRING_SPACING }]} />
                    ))}
                    {Array.from({ length: FRETS + 1 }).map((_, i) => (
                      <View key={`fret-${i}`} style={[styles.fret, { top: i * FRET_SPACING }, i === 0 && !isBarreChord && styles.nutLine]} />
                    ))}

                    {/* Finger dots */}
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
                        <View key={`dot-${stringIndex}`} style={[styles.dotContainer, { left: xPos, top: yPos }]}>
                          {isRootNote ? (
                            <View style={styles.diamondDot}>
                              <Text style={styles.diamondNumber}>{fingerNumber}</Text>
                            </View>
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

              {/* String Notation Box */}
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

            {/* Buttons */}
            <View style={styles.buttons}>
              <Pressable style={styles.playButton} onPress={onPlay}>
                <MaterialIcons name="play-arrow" size={20} color="#000" />
                <Text style={styles.playButtonText}>Play</Text>
              </Pressable>
              <Pressable style={styles.editButton} onPress={onEdit}>
                <MaterialIcons name="edit" size={18} color="#888" />
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
            </View>

            {/* Progress */}
            <Text style={styles.progress}>
              {currentIndex + 1}/{allChords.length}
            </Text>

            {/* Finger Positions */}
            <View style={styles.fingerPositionsSection}>
              <View style={styles.fingerPositionsHeader}>
                <MaterialIcons name="music-note" size={16} color={colors.primary} />
                <Text style={styles.fingerPositionsTitle}>FINGER POSITIONS</Text>
              </View>
              
              {fingerPositions.map((pos: any, index) => (
                <View key={index} style={styles.fingerPositionRow}>
                  <Text style={[
                    styles.fingerPositionString,
                    pos.isRootNote && styles.fingerPositionStringRoot,
                  ]}>
                    {pos.string} {pos.isRootNote && '◆'}
                  </Text>
                  <Text style={[
                    styles.fingerPositionFret,
                    pos.isOpen && styles.fingerPositionFretOpen,
                  ]}>
                    {pos.fret}
                  </Text>
                  <Text style={styles.fingerPositionFinger}>{pos.finger}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  navArrow: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  navArrowLeft: {
    left: spacing.lg,
  },
  navArrowRight: {
    right: spacing.lg,
  },
  modal: {
    width: '90%',
    maxWidth: 420,
    backgroundColor: '#1A1D24',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: '#4DB8E8',
    padding: spacing.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  chordLetterBadge: {
    width: 48,
    height: 48,
    backgroundColor: '#4DB8E8',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chordLetter: {
    fontSize: 24,
    fontWeight: '800',
    color: '#000',
  },
  badges: {
    flexDirection: 'row',
    gap: spacing.xs,
    flex: 1,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#888',
  },
  chordName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
    marginLeft: -16, // Move left by 2 letter widths
  },
  diagramRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  fretboardContainer: {
    position: 'relative',
    flex: 1,
  },
  fretLabel: {
    position: 'absolute',
    left: -20,
    top: 50,
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  fretboard: {
    position: 'relative',
  },
  topMarkersRow: {
    position: 'absolute',
    top: -22,
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
    fontSize: 16,
    color: '#666',
    fontWeight: '700',
  },
  openO: {
    fontSize: 16,
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
    backgroundColor: '#666',
  },
  fret: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: '#666',
  },
  nutLine: {
    height: 6,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
  dotContainer: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 24,
    height: 24,
    backgroundColor: '#4DB8E8',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '45deg' }],
  },
  circleNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  diamondNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    transform: [{ rotate: '-45deg' }],
  },
  stringNotationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minWidth: 85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stringNotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  stringName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#000',
    width: 14,
  },
  stringDash: {
    fontSize: 11,
    color: '#888',
    marginHorizontal: 3,
  },
  fretNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    minWidth: 18,
    textAlign: 'center',
  },
  buttons: {
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
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  playButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    backgroundColor: '#2A2A2A',
    borderRadius: borderRadius.md,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
  },
  progress: {
    textAlign: 'center',
    fontSize: 12,
    color: '#888',
    marginBottom: spacing.md,
  },
  fingerPositionsSection: {
    backgroundColor: '#0F0F0F',
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  fingerPositionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  fingerPositionsTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  fingerPositionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  fingerPositionString: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  fingerPositionStringRoot: {
    color: '#4DB8E8',
    fontWeight: '700',
  },
  fingerPositionFret: {
    fontSize: 13,
    color: colors.text,
    width: 80,
  },
  fingerPositionFretOpen: {
    color: '#10B981',
    fontWeight: '600',
  },
  fingerPositionFinger: {
    fontSize: 13,
    color: '#888',
    width: 60,
    textAlign: 'right',
  },
});
