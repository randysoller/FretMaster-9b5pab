import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { audioService } from '@/services/audioService';

const TIME_SIGNATURES = ['2/4', '3/4', '4/4', '6/8', '12/8'];
const SOUNDS = ['Click', 'Wood Block', 'Hi-Hat', 'Sidestick', 'Voice Count'];
const QUICK_TEMPOS = [60, 80, 100, 120, 140, 160];
const SUBDIVISIONS = [
  { label: 'Quarter', value: 1 },
  { label: 'Eighth', value: 2 },
  { label: 'Sixteenth', value: 4 },
];

export default function MetronomeScreen() {
  const [tempo, setTempo] = useState(100);
  const [timeSignature, setTimeSignature] = useState('4/4');
  const [sound, setSound] = useState('Click');
  const [volume, setVolume] = useState(75);
  const [subdivision, setSubdivision] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [tapTimes, setTapTimes] = useState<number[]>([]);
  
  const beatPulse = useRef(new Animated.Value(1)).current;
  const visualBeats = useRef<Animated.Value[]>(
    Array.from({ length: 8 }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    return () => {
      audioService.stopMetronome();
    };
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      audioService.stopMetronome();
      setIsPlaying(false);
      setCurrentBeat(0);
    } else {
      const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
      audioService.startMetronome(
        tempo,
        beatsPerMeasure,
        sound,
        subdivision,
        (beatInfo) => {
          setCurrentBeat(beatInfo.beat % beatsPerMeasure);
          
          // Pulse animation
          Animated.sequence([
            Animated.timing(beatPulse, {
              toValue: beatInfo.isStrong ? 1.2 : 1.1,
              duration: 50,
              useNativeDriver: true,
            }),
            Animated.timing(beatPulse, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }),
          ]).start();

          // Visual beat indicator
          const beatIndex = beatInfo.beat % beatsPerMeasure;
          if (beatInfo.subdivision === 0) {
            Animated.sequence([
              Animated.timing(visualBeats[beatIndex], {
                toValue: 1,
                duration: 50,
                useNativeDriver: true,
              }),
              Animated.timing(visualBeats[beatIndex], {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
              }),
            ]).start();
          }
        }
      );
      setIsPlaying(true);
    }
  };

  const handleTapTempo = () => {
    const now = Date.now();
    const newTapTimes = [...tapTimes, now].slice(-4);
    setTapTimes(newTapTimes);

    if (newTapTimes.length >= 2) {
      const intervals = [];
      for (let i = 1; i < newTapTimes.length; i++) {
        intervals.push(newTapTimes[i] - newTapTimes[i - 1]);
      }
      const avgInterval = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
      const newTempo = Math.round(60000 / avgInterval);
      if (newTempo >= 40 && newTempo <= 220) {
        setTempo(newTempo);
      }
    }

    // Clear tap times after 2 seconds of inactivity
    setTimeout(() => {
      setTapTimes(prev => prev.filter(t => Date.now() - t < 2000));
    }, 2000);
  };

  const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);

  return (
    <Screen edges={['top']}>
      <ScrollView 
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="speed" size={20} color={colors.textSecondary} />
          <Text style={styles.headerTitle}>METRONOME</Text>
        </View>

        {/* Tempo */}
        <View style={styles.section}>
          <View style={styles.tempoHeader}>
            <Text style={styles.sectionLabel}>TEMPO</Text>
            <Text style={styles.tempoValue}>Moderato <Text style={styles.tempoBPM}>{tempo}</Text> bpm</Text>
          </View>
          
          <View style={styles.tempoControls}>
            <Pressable 
              onPress={() => setTempo(Math.max(40, tempo - 1))}
              style={styles.tempoButton}
            >
              <MaterialIcons name="remove" size={18} color={colors.textSecondary} />
            </Pressable>
            
            <View style={styles.tempoDisplay}>
              <Text style={styles.tempoNumber}>{tempo}</Text>
            </View>
            
            <Pressable 
              onPress={() => setTempo(Math.min(220, tempo + 1))}
              style={styles.tempoButton}
            >
              <MaterialIcons name="add" size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Quick Tempo Buttons */}
          <View style={styles.quickTempos}>
            {QUICK_TEMPOS.map((t) => (
              <Pressable
                key={t}
                onPress={() => setTempo(t)}
                style={[
                  styles.quickTempoButton,
                  tempo === t && styles.quickTempoButtonActive,
                ]}
              >
                <Text style={[
                  styles.quickTempoText,
                  tempo === t && styles.quickTempoTextActive,
                ]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.tapTempoButton} onPress={handleTapTempo}>
            <Text style={styles.tapTempoText}>TAP TEMPO</Text>
          </Pressable>
        </View>

        {/* Time Signature */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TIME SIGNATURE</Text>
          <View style={styles.timeSignatures}>
            {TIME_SIGNATURES.map((sig) => (
              <Pressable
                key={sig}
                onPress={() => setTimeSignature(sig)}
                style={[
                  styles.timeSignatureButton,
                  timeSignature === sig && styles.timeSignatureButtonActive,
                ]}
              >
                <Text style={[
                  styles.timeSignatureText,
                  timeSignature === sig && styles.timeSignatureTextActive,
                ]}>{sig}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Sound */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SOUND</Text>
          <View style={styles.sounds}>
            {SOUNDS.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSound(s)}
                style={[
                  styles.soundButton,
                  sound === s && styles.soundButtonActive,
                ]}
              >
                <Text style={[
                  styles.soundText,
                  sound === s && styles.soundTextActive,
                ]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Subdivision */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>SUBDIVISION</Text>
          <View style={styles.subdivisions}>
            {SUBDIVISIONS.map((sub) => (
              <Pressable
                key={sub.value}
                onPress={() => {
                  setSubdivision(sub.value);
                  if (isPlaying) {
                    audioService.stopMetronome();
                    setIsPlaying(false);
                  }
                }}
                style={[
                  styles.subdivisionButton,
                  subdivision === sub.value && styles.subdivisionButtonActive,
                ]}
              >
                <Text style={[
                  styles.subdivisionText,
                  subdivision === sub.value && styles.subdivisionTextActive,
                ]}>{sub.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Visual Beat Indicator */}
        {isPlaying && (
          <View style={styles.beatIndicator}>
            {Array.from({ length: beatsPerMeasure }).map((_, i) => {
              const scale = visualBeats[i].interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              });
              const opacity = visualBeats[i].interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              });

              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.beatDot,
                    i === 0 && styles.beatDotStrong,
                    { transform: [{ scale }], opacity },
                  ]}
                />
              );
            })}
          </View>
        )}

        {/* Volume */}
        <View style={styles.section}>
          <View style={styles.volumeHeader}>
            <MaterialIcons name="volume-up" size={16} color={colors.textSecondary} />
            <Text style={styles.sectionLabel}>VOLUME</Text>
            <Text style={styles.volumeValue}>{volume}%</Text>
          </View>
          
          <View style={styles.volumeBar}>
            <View 
              style={[
                styles.volumeFill,
                { width: `${volume}%` }
              ]}
            />
            <Pressable 
              style={styles.volumeThumb}
              onPress={() => {}} // Touch interaction placeholder
            />
          </View>
        </View>

        {/* Play Button - Compact Size */}
        <View style={styles.playSection}>
          <Animated.View style={{ transform: [{ scale: beatPulse }] }}>
            <Pressable 
              style={[styles.playButton, isPlaying && styles.playButtonActive]}
              onPress={handlePlayPause}
            >
              <MaterialIcons 
                name={isPlaying ? 'pause' : 'play-arrow'} 
                size={20} 
                color="#000" 
              />
            </Pressable>
          </Animated.View>
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: '700',
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  tempoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tempoValue: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  tempoBPM: {
    color: colors.text,
    fontWeight: '700',
  },
  tempoControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  tempoButton: {
    width: 36,
    height: 36,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tempoDisplay: {
    minWidth: 80,
    alignItems: 'center',
  },
  tempoNumber: {
    fontSize: 48,
    fontWeight: '800',
    color: colors.text,
  },
  quickTempos: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickTempoButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickTempoButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickTempoText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  quickTempoTextActive: {
    color: colors.background,
  },
  tapTempoButton: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tapTempoText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  timeSignatures: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timeSignatureButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  timeSignatureButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeSignatureText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  timeSignatureTextActive: {
    color: colors.background,
  },
  sounds: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  soundButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  soundButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  soundText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  soundTextActive: {
    color: colors.background,
  },
  volumeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  volumeValue: {
    marginLeft: 'auto',
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  volumeBar: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    position: 'relative',
    overflow: 'hidden',
  },
  volumeFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  volumeThumb: {
    position: 'absolute',
    right: 0,
    top: -6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.background,
  },
  playSection: {
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  playButton: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playButtonActive: {
    backgroundColor: colors.error,
    shadowColor: colors.error,
  },
  subdivisions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  subdivisionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subdivisionButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subdivisionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  subdivisionTextActive: {
    color: colors.background,
  },
  beatIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
  },
  beatDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  beatDotStrong: {
    backgroundColor: colors.success,
  },
});
