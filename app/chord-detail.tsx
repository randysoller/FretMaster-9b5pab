import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Pressable, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { audioService } from '@/services/audioService';
import { Fretboard } from '@/components/feature/Fretboard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function ChordDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Parse chords from params
  const allChords: ChordData[] = params.chords ? JSON.parse(params.chords as string) : [];
  const initialIndex = params.initialIndex ? parseInt(params.initialIndex as string, 10) : 0;

  useEffect(() => {
    // Scroll to initial chord on mount
    if (flatListRef.current && allChords.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({ index: initialIndex, animated: false });
      }, 100);
    }
  }, []);

  const renderChordDetail = ({ item: chord }: { item: ChordData }) => {
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
    const DIAGRAM_WIDTH = 220;
    const DIAGRAM_HEIGHT = 260;
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
      <View style={[styles.page, { paddingTop: insets.top + 60 }]}>
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
            <Fretboard chord={chord} size="lg" />
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

        {/* Play Button - Centered */}
        <View style={styles.buttons}>
          <Pressable 
            style={[styles.playButton, isPlaying && styles.playButtonDisabled]} 
            disabled={isPlaying}
            onPress={async () => {
              if (isPlaying) return;
              
              setIsPlaying(true);
              try {
                console.log('🎸 Play button pressed for chord:', chord.name);
                await audioService.playChordPreview(chord);
                console.log('✅ Chord played successfully');
              } catch (err) {
                console.error('🔴 Chord playback failed:', err);
                const errorMsg = err instanceof Error ? err.message : String(err);
                Alert.alert('Audio Error', `Could not play chord audio.\n\nError: ${errorMsg}\n\nPlease try again.`);
              } finally {
                // Reset after audio duration (3.2s)
                setTimeout(() => setIsPlaying(false), 3300);
              }
            }}>
            <MaterialIcons name={isPlaying ? "hourglass-empty" : "play-arrow"} size={20} color="#000" />
            <Text style={styles.playButtonText}>{isPlaying ? 'Playing...' : 'Play'}</Text>
          </Pressable>
        </View>

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
      </View>
    );
  };

  const getItemLayout = (_: any, index: number) => ({
    length: SCREEN_WIDTH,
    offset: SCREEN_WIDTH * index,
    index,
  });

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <Pressable 
        style={[styles.closeButton, { top: insets.top + 10 }]} 
        onPress={() => router.back()}
      >
        <MaterialIcons name="close" size={28} color={colors.text} />
      </Pressable>

      {/* Horizontal FlatList */}
      <FlatList
        ref={flatListRef}
        data={allChords}
        renderItem={renderChordDetail}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex}
        getItemLayout={getItemLayout}
        onScrollToIndexFailed={(info) => {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          }, 100);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  closeButton: {
    position: 'absolute',
    left: spacing.lg,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  page: {
    width: SCREEN_WIDTH,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  chordLetterBadge: {
    width: 56,
    height: 56,
    backgroundColor: '#4DB8E8',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chordLetter: {
    fontSize: 28,
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
    paddingVertical: 6,
    backgroundColor: '#2A2A2A',
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#888',
  },
  chordName: {
    fontSize: 22,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  diagramRow: {
    flexDirection: 'row',
    gap: 20, // 4pts more space from diagram
    marginBottom: spacing.lg,
    justifyContent: 'center',
    alignItems: 'center', // Center tab box to diagram
  },
  fretboardContainer: {
    position: 'relative',
  },
  fretLabel: {
    position: 'absolute',
    left: -24,
    top: 60,
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  fretboard: {
    position: 'relative',
  },
  topMarkersRow: {
    position: 'absolute',
    top: -26,
    height: 20,
  },
  topMarker: {
    position: 'absolute',
    width: 18,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mutedX: {
    fontSize: 18,
    color: '#666',
    fontWeight: '700',
  },
  openO: {
    fontSize: 18,
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
    width: 32,
    height: 32,
    marginLeft: -16,
    marginTop: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  diamondDot: {
    width: 28,
    height: 28,
    backgroundColor: '#4DB8E8',
    transform: [{ rotate: '45deg' }],
    position: 'absolute',
  },
  circleNumber: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  diamondNumber: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    position: 'absolute',
    width: 28,
    height: 28,
    lineHeight: 28,
    // NO rotation - stays vertical!
  },
  stringNotationBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8, // Reduced from 12 to shorten box
    paddingHorizontal: 14,
    minWidth: 90,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  stringNotationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2, // Reduced from 4 to minimize spacing
  },
  stringName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
    width: 14,
  },
  stringDash: {
    fontSize: 12,
    color: '#888',
    marginHorizontal: 3,
  },
  fretNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    minWidth: 20,
    textAlign: 'center',
  },
  buttons: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl * 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  playButtonDisabled: {
    opacity: 0.6,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
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
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  fingerPositionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A2A',
  },
  fingerPositionString: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  fingerPositionStringRoot: {
    color: '#4DB8E8',
    fontWeight: '700',
  },
  fingerPositionFret: {
    fontSize: 14,
    color: colors.text,
    width: 90,
  },
  fingerPositionFretOpen: {
    color: '#10B981',
    fontWeight: '600',
  },
  fingerPositionFinger: {
    fontSize: 14,
    color: '#888',
    width: 70,
    textAlign: 'right',
  },
});
