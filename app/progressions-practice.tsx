import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { audioService } from '@/services/audioService';
import { practiceTrackingService } from '@/services/practiceTrackingService';

export default function ProgressionsPracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const progression = params.progression as string || 'C - F - G - C';
  const chords = progression.split(' - ');
  
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [countdown, setCountdown] = useState(4);
  const [tempo, setTempo] = useState(60); // BPM
  const [showCountdown, setShowCountdown] = useState(false);
  const [transitionAccuracy, setTransitionAccuracy] = useState<number[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const id = practiceTrackingService.startSession('progressions', {
      progression,
      tempo,
    });
    setSessionId(id);

    return () => {
      audioService.stopMetronome();
      if (sessionId) {
        practiceTrackingService.endSession();
      }
    };
  }, []);

  const startProgression = () => {
    setShowCountdown(true);
    setCountdown(4);

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setShowCountdown(false);
          playProgression();
          return 4;
        }
        audioService.playMetronomeClick(prev === 4 ? 'strong' : 'weak', 0.75, 'Click');
        return prev - 1;
      });
    }, (60 / tempo) * 1000);
  };

  const playProgression = () => {
    setIsPlaying(true);
    setCurrentChordIndex(0);

    const beatsPerChord = 4;
    const interval = (60 / tempo) * 1000;

    let beat = 0;
    let chordIndex = 0;

    audioService.startMetronome(tempo, beatsPerChord, 'Click', 1, (beatInfo) => {
      if (beat % beatsPerChord === 0) {
        // Change chord
        if (chordIndex < chords.length) {
          setCurrentChordIndex(chordIndex);
          audioService.playChordPreview(chords[chordIndex]);
          
          // Transition animation
          Animated.parallel([
            Animated.sequence([
              Animated.timing(fadeAnim, {
                toValue: 0.3,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.2,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.spring(scaleAnim, {
                toValue: 1,
                friction: 3,
                useNativeDriver: true,
              }),
            ]),
          ]).start();

          chordIndex++;
          
          if (chordIndex >= chords.length) {
            // Loop or stop
            chordIndex = 0;
          }
        }
      }
      beat++;
    });
  };

  const stopProgression = () => {
    setIsPlaying(false);
    audioService.stopMetronome();
    setCurrentChordIndex(0);
  };

  const handleTempoChange = (newTempo: number) => {
    setTempo(newTempo);
    if (isPlaying) {
      stopProgression();
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Practice Progression',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Progression Info */}
          <View style={styles.header}>
            <MaterialIcons name="trending-up" size={24} color={colors.secondary} />
            <Text style={styles.badge}>Chord Progression</Text>
          </View>

          <Text style={styles.title}>{progression}</Text>

          {/* Tempo Control */}
          <View style={styles.tempoSection}>
            <View style={styles.tempoHeader}>
              <MaterialIcons name="speed" size={20} color={colors.primary} />
              <Text style={styles.tempoLabel}>TEMPO</Text>
              <Text style={styles.tempoValue}>{tempo} BPM</Text>
            </View>
            <View style={styles.tempoControls}>
              <Pressable 
                onPress={() => handleTempoChange(Math.max(40, tempo - 5))}
                style={styles.tempoButton}
              >
                <MaterialIcons name="remove" size={20} color={colors.text} />
              </Pressable>
              
              <View style={styles.tempoPresets}>
                {[60, 80, 100, 120].map(t => (
                  <Pressable
                    key={t}
                    onPress={() => handleTempoChange(t)}
                    style={[
                      styles.tempoPreset,
                      tempo === t && styles.tempoPresetActive,
                    ]}
                  >
                    <Text style={[
                      styles.tempoPresetText,
                      tempo === t && styles.tempoPresetTextActive,
                    ]}>{t}</Text>
                  </Pressable>
                ))}
              </View>
              
              <Pressable 
                onPress={() => handleTempoChange(Math.min(200, tempo + 5))}
                style={styles.tempoButton}
              >
                <MaterialIcons name="add" size={20} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Countdown Overlay */}
          {showCountdown && (
            <View style={styles.countdownOverlay}>
              <Text style={styles.countdownText}>{countdown}</Text>
            </View>
          )}

          {/* Current Chord Display */}
          <Animated.View 
            style={[
              styles.chordDisplay,
              {
                opacity: fadeAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Text style={styles.currentChordLabel}>
              {isPlaying ? 'Now Playing' : 'Starting Chord'}
            </Text>
            <Text style={styles.currentChord}>
              {chords[currentChordIndex]}
            </Text>
            {isPlaying && currentChordIndex < chords.length - 1 && (
              <View style={styles.nextChord}>
                <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
                <Text style={styles.nextChordText}>Next: {chords[currentChordIndex + 1]}</Text>
              </View>
            )}
          </Animated.View>

          {/* Chord Sequence */}
          <View style={styles.sequence}>
            {chords.map((chord, index) => (
              <View key={index} style={styles.sequenceItem}>
                <View style={[
                  styles.sequenceChord,
                  index === currentChordIndex && isPlaying && styles.sequenceChordActive,
                  index < currentChordIndex && isPlaying && styles.sequenceChordPassed,
                ]}>
                  <Text style={[
                    styles.sequenceChordText,
                    index === currentChordIndex && isPlaying && styles.sequenceChordTextActive,
                  ]}>{chord}</Text>
                  {index === currentChordIndex && isPlaying && (
                    <View style={styles.playingIndicator}>
                      <MaterialIcons name="play-arrow" size={12} color="#000" />
                    </View>
                  )}
                </View>
                {index < chords.length - 1 && (
                  <MaterialIcons name="arrow-forward" size={16} color={colors.textMuted} />
                )}
              </View>
            ))}
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.statCard}>
              <MaterialIcons name="timer" size={24} color={colors.info} />
              <Text style={styles.statValue}>{chords.length}</Text>
              <Text style={styles.statLabel}>Chords</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="loop" size={24} color={colors.warning} />
              <Text style={styles.statValue}>∞</Text>
              <Text style={styles.statLabel}>Loop</Text>
            </View>
            <View style={styles.statCard}>
              <MaterialIcons name="music-note" size={24} color={colors.success} />
              <Text style={styles.statValue}>{tempo}</Text>
              <Text style={styles.statLabel}>BPM</Text>
            </View>
          </View>

          {/* Controls */}
          <View style={styles.controls}>
            {!isPlaying ? (
              <Pressable style={styles.startButton} onPress={startProgression}>
                <MaterialIcons name="play-arrow" size={28} color="#000" />
                <Text style={styles.startButtonText}>START PROGRESSION</Text>
              </Pressable>
            ) : (
              <Pressable style={styles.stopButton} onPress={stopProgression}>
                <MaterialIcons name="stop" size={28} color={colors.text} />
                <Text style={styles.stopButtonText}>STOP</Text>
              </Pressable>
            )}
          </View>
        </ScrollView>
      </Screen>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.sm,
  },
  badge: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  tempoSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tempoLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tempoValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  tempoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tempoButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tempoPresets: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  tempoPreset: {
    flex: 1,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
  },
  tempoPresetActive: {
    backgroundColor: colors.primary,
  },
  tempoPresetText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  tempoPresetTextActive: {
    color: '#000',
  },
  countdownOverlay: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  countdownText: {
    fontSize: 120,
    fontWeight: '700',
    color: colors.primary,
  },
  chordDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    marginBottom: spacing.xl,
  },
  currentChordLabel: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  currentChord: {
    fontSize: 72,
    fontWeight: '700',
    color: colors.primary,
  },
  nextChord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  nextChordText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  sequence: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sequenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sequenceChord: {
    position: 'relative',
    minWidth: 60,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  sequenceChordActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sequenceChordPassed: {
    backgroundColor: colors.surface,
    borderColor: colors.success,
    opacity: 0.6,
  },
  sequenceChordText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  sequenceChordTextActive: {
    color: '#000',
  },
  playingIndicator: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginVertical: spacing.xs,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  controls: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  stopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.error,
  },
  stopButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
});
