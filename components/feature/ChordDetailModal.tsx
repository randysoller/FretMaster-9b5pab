import React, { useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Dimensions } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, Easing } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { audioService } from '@/services/audioService';
import { useAuth } from '@/hooks/useAuth';

// Design colors matching web app screenshot
const ROOT_NOTE_COLOR = '#4DB8E8'; // Cyan for root notes
const FINGER_NUMBER_COLOR = '#D4952A'; // Orange for finger numbers
const FRETBOARD_BG = '#1A1D24';
const BUTTON_GOLD = '#D4952A';
const BORDER_CYAN = '#4DB8E8';
const OPEN_STRING_COLOR = '#00C896'; // Green for open strings

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
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.25; // 25% of screen for easier swipes

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
  const scale = useSharedValue(1);
  const modalOpacity = useSharedValue(1);
  const isNavigatingRef = useRef(false);
  
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < allChords.length - 1;
  const prevChord = hasPrev ? allChords[currentIndex - 1] : null;
  const nextChord = hasNext ? allChords[currentIndex + 1] : null;
  
  // Reset animation values when chord changes
  useEffect(() => {
    if (visible && chord) {
      isNavigatingRef.current = false;
      translateX.value = 0;
      scale.value = 0.95;
      modalOpacity.value = 0;
      scale.value = withSpring(1, { damping: 18, stiffness: 150 });
      modalOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [chord?.id, visible]);
  
  // Navigation handler
  const navigate = useCallback((direction: 'prev' | 'next') => {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    onNavigate?.(direction);
  }, [onNavigate]);
  
  // Pan gesture for swiping
  const panGesture = Gesture.Pan()
    .activeOffsetX([-15, 15])
    .onUpdate((e) => {
      const canSwipeRight = e.translationX > 0 && hasPrev;
      const canSwipeLeft = e.translationX < 0 && hasNext;
      
      if (!canSwipeRight && !canSwipeLeft) {
        translateX.value = e.translationX * 0.15;
        return;
      }
      
      translateX.value = e.translationX;
      const progress = Math.min(Math.abs(e.translationX) / SCREEN_WIDTH, 1);
      scale.value = 1 - (progress * 0.08);
      modalOpacity.value = 1 - (progress * 0.3);
    })
    .onEnd((e) => {
      const distance = Math.abs(e.translationX);
      const velocity = Math.abs(e.velocityX);
      const meetsThreshold = distance > SWIPE_THRESHOLD || velocity > 400;
      
      if (meetsThreshold) {
        if (e.translationX > 0 && hasPrev) {
          const exitX = SCREEN_WIDTH * 1.2;
          translateX.value = withTiming(exitX, { duration: 200, easing: Easing.out(Easing.ease) });
          scale.value = withTiming(0.85, { duration: 200 });
          modalOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) runOnJS(navigate)('prev');
          });
        } else if (e.translationX < 0 && hasNext) {
          const exitX = -SCREEN_WIDTH * 1.2;
          translateX.value = withTiming(exitX, { duration: 200, easing: Easing.out(Easing.ease) });
          scale.value = withTiming(0.85, { duration: 200 });
          modalOpacity.value = withTiming(0, { duration: 200 }, (finished) => {
            if (finished) runOnJS(navigate)('next');
          });
        } else {
          translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
          scale.value = withSpring(1, { damping: 20, stiffness: 150 });
          modalOpacity.value = withTiming(1, { duration: 150 });
        }
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 150 });
        scale.value = withSpring(1, { damping: 20, stiffness: 150 });
        modalOpacity.value = withTiming(1, { duration: 150 });
      }
    });
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    opacity: modalOpacity.value,
  }));
  
  if (!chord) return null;

  // Get chord root note
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
            {/* Strings */}
            {Array.from({ length: STRINGS }).map((_, i) => (
              <View 
                key={`string-${i}`}
                style={[styles.string, { left: i * STRING_SPACING }]}
              />
            ))}

            {/* Frets */}
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

            {/* Finger position dots */}
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
                  <View style={[styles.fingerDot, { backgroundColor: FINGER_NUMBER_COLOR }]}>
                    <Text style={styles.fingerNumber}>{fingerNumber}</Text>
                  </View>
                  {isRootNote && (
                    <View style={styles.rootNoteDiamond}>
                      <View style={styles.rootNoteDiamondInner} />
                    </View>
                  )}
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
          <MaterialIcons name="piano" size={14} color="#D4952A" />
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
                <Text style={[
                  styles.fingerString,
                  !isPlayed && styles.fingerStringMuted,
                  isRootNote && styles.fingerStringRoot
                ]}>
                  {stringData[index].note} {stringData[index].string}
                </Text>
                {isRootNote && <View style={styles.rootDotIndicator} />}
              </View>
              <Text style={[
                styles.fingerFret,
                fret === 0 && styles.fingerFretOpen,
                fret === -1 && styles.fingerFretMuted
              ]}>
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
      animationType="none"
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
                  <Text style={styles.chordName}>{chord.fullName}</Text>
                  <View style={styles.badges}>
                    <Text style={styles.badge}>{chord.shape.toUpperCase()} CHORDS</Text>
                    <Text style={styles.badgeSeparator}>|</Text>
                    <Text style={styles.badge}>{chord.type.toUpperCase()}</Text>
                  </View>
                </View>
              </View>
              <Pressable onPress={onClose} style={styles.closeButton}>
                <MaterialIcons name="close" size={24} color={colors.textMuted} />
              </Pressable>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              scrollEnabled={true}
            >
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

              {/* Progress */}
              <View style={styles.progress}>
                <Text style={styles.progressText}>{currentIndex + 1}/{allChords.length}</Text>
              </View>

              {/* Finger Positions */}
              {renderFingerPositions()}
            </ScrollView>
            
            {/* Navigation arrows */}
            {hasPrev && (
              <Pressable 
                style={[styles.navArrow, styles.navArrowLeft]}
                onPress={() => navigate('prev')}
              >
                <MaterialIcons name="chevron-left" size={32} color={colors.textMuted} />
              </Pressable>
            )}
            {hasNext && (
              <Pressable 
                style={[styles.navArrow, styles.navArrowRight]}
                onPress={() => navigate('next')}
              >
                <MaterialIcons name="chevron-right" size={32} color={colors.textMuted} />
              </Pressable>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: SCREEN_WIDTH - 32,
    maxWidth: 400,
    maxHeight: '85%',
    backgroundColor: '#1A1D24',
    borderRadius: borderRadius.xxl,
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: BORDER_CYAN,
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
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    backgroundColor: '#0F1117',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: BORDER_CYAN,
  },
  chordLetterText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  titleContainer: {
    flex: 1,
  },
  chordName: {
    fontSize: 16,
    fontWeight: '400',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '600',
    color: '#888',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  badgeSeparator: {
    fontSize: 10,
    color: '#444',
    marginHorizontal: 2,
  },
  closeButton: {
    padding: spacing.xs,
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
    color: '#888',
    fontWeight: '700',
  },
  openO: {
    fontSize: 16,
    color: '#AAA',
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
    backgroundColor: '#444',
  },
  fret: {
    position: 'absolute',
    height: 2,
    width: '100%',
    backgroundColor: '#555',
  },
  nutLine: {
    height: 6,
    backgroundColor: '#CCC',
    borderRadius: 1,
  },
  fingerDotContainer: {
    position: 'absolute',
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fingerNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  rootNoteDiamond: {
    position: 'absolute',
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    top: -2,
    left: -2,
  },
  rootNoteDiamondInner: {
    width: 12,
    height: 12,
    backgroundColor: ROOT_NOTE_COLOR,
  },
  fretLabel: {
    position: 'absolute',
    left: -8,
    top: 36,
    fontSize: 11,
    color: '#AAA',
    fontWeight: '600',
  },
  stringNotationBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    justifyContent: 'space-between',
    minWidth: 100,
  },
  notationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
  },
  notationString: {
    color: '#000',
    fontSize: 13,
    fontWeight: '700',
    width: 16,
  },
  notationSeparator: {
    color: '#666',
    fontSize: 12,
    marginHorizontal: 3,
  },
  notationFret: {
    color: '#000',
    fontSize: 13,
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
    width: '100%',
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
    backgroundColor: '#2A2D35',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#3A3D45',
  },
  editButtonText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '600',
  },
  progress: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  progressText: {
    color: '#888',
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
    color: '#888',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  fingerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2D35',
  },
  fingerRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1.5,
  },
  fingerString: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '400',
  },
  fingerStringMuted: {
    color: '#666',
  },
  fingerStringRoot: {
    color: ROOT_NOTE_COLOR,
    fontWeight: '600',
  },
  rootDotIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ROOT_NOTE_COLOR,
  },
  fingerFret: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  fingerFretOpen: {
    color: OPEN_STRING_COLOR,
    fontWeight: '600',
  },
  fingerFretMuted: {
    color: '#666',
  },
  fingerName: {
    color: '#888',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
  },
  navArrow: {
    position: 'absolute',
    top: '50%',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(26, 29, 36, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -20,
  },
  navArrowLeft: {
    left: -20,
  },
  navArrowRight: {
    right: -20,
  },
});
