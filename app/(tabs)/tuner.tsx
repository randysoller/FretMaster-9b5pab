import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { pitchDetectionService, PitchDetectionResult } from '@/services/pitchDetectionService';
import { mobileAudioDetectionService, MobilePitchResult } from '@/services/mobileAudioDetectionService';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

const TUNING_PRESETS = [
  { name: 'Standard', strings: ['E', 'A', 'D', 'G', 'B', 'E'] },
  { name: 'Drop D', strings: ['D', 'A', 'D', 'G', 'B', 'E'] },
  { name: 'Half Step Down', strings: ['E♭', 'A♭', 'D♭', 'G♭', 'B♭', 'E♭'] },
  { name: 'Open G', strings: ['D', 'G', 'D', 'G', 'B', 'D'] },
];

export default function TunerScreen() {
  const router = useRouter();
  const [isListening, setIsListening] = useState(false);
  const [selectedTuning, setSelectedTuning] = useState(TUNING_PRESETS[0]);
  const [tuningDropdownOpen, setTuningDropdownOpen] = useState(false);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | MobilePitchResult | null>(null);
  const [inputLevel, setInputLevel] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const unsubscribe = pitchDetectionService.onInputLevel((level) => {
      setInputLevel(level);
    });
    
    return () => {
      if (isListening) {
        pitchDetectionService.stopDetection();
      }
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (detectedPitch) {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [detectedPitch]);

  const startListening = async () => {
    if (Platform.OS === 'web') {
      const hasAccess = await pitchDetectionService.requestMicrophoneAccess();
      
      if (hasAccess) {
        setIsListening(true);
        pitchDetectionService.startDetection((result, buffer, freqData) => {
          setDetectedPitch(result);
        }, 0.5);
      } else {
        setPermissionDenied(true);
      }
    } else {
      const started = await mobileAudioDetectionService.startPitchDetection(
        (result) => {
          setDetectedPitch(result);
          if (result && result.confidence) {
            setInputLevel(result.confidence);
          }
        },
        false
      );
      
      if (started) {
        setIsListening(true);
      } else {
        setPermissionDenied(true);
      }
    }
  };

  const stopListening = async () => {
    setIsListening(false);
    
    if (Platform.OS === 'web') {
      pitchDetectionService.stopDetection();
    } else {
      await mobileAudioDetectionService.stopDetection();
    }
    
    setDetectedPitch(null);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const inTune = detectedPitch && Math.abs(detectedPitch.cents) < 5;
  const flat = detectedPitch && detectedPitch.cents < -5;
  const sharp = detectedPitch && detectedPitch.cents > 5;

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="tune" size={20} color={colors.textSecondary} />
          <Text style={styles.headerTitle}>GUITAR TUNER</Text>
          <Pressable onPress={() => router.push('/calibration' as any)}>
            <MaterialIcons name="settings" size={20} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Tuning Selector */}
        <Pressable 
          style={styles.tuningSelector}
          onPress={() => setTuningDropdownOpen(!tuningDropdownOpen)}
        >
          <Text style={styles.tuningLabel}>{selectedTuning.name}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </Pressable>

        {/* Tuning Display */}
        <Pressable onPress={toggleListening} style={styles.tuningDisplay}>
          {!detectedPitch || !isListening ? (
            <View style={styles.waitingState}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <MaterialIcons 
                  name={isListening ? 'mic' : 'mic-off'} 
                  size={56} 
                  color={isListening ? colors.primary : colors.textMuted} 
                />
              </Animated.View>
              <Text style={styles.waitingText}>
                {isListening ? 'Listening...' : 'Tap to Start'}
              </Text>
            </View>
          ) : (
            <Animated.View style={[styles.noteDisplay, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.noteLabel}>{detectedPitch.note}</Text>
              <Text style={[
                styles.centsLabel,
                inTune && styles.centsInTune,
                flat && styles.centsFlat,
                sharp && styles.centsSharp,
              ]}>
                {detectedPitch.cents > 0 ? '+' : ''}{detectedPitch.cents} cents
              </Text>
            </Animated.View>
          )}
        </Pressable>

        {/* Visual Tuner Arc */}
        <View style={styles.visualTuner}>
          <View style={styles.arcContainer}>
            <View style={styles.arc}>
              {/* Flat region */}
              <View style={[styles.arcSegment, styles.arcFlat]} />
              {/* In-tune region */}
              <View style={[styles.arcSegment, styles.arcInTune]} />
              {/* Sharp region */}
              <View style={[styles.arcSegment, styles.arcSharp]} />
            </View>
            
            {/* Needle */}
            {detectedPitch && (
              <View 
                style={[
                  styles.needle,
                  { 
                    transform: [
                      { translateX: (detectedPitch.cents / 50) * 100 },
                    ] 
                  }
                ]}
              >
                <View style={[
                  styles.needleDot,
                  inTune && styles.needleDotInTune,
                  flat && styles.needleDotFlat,
                  sharp && styles.needleDotSharp,
                ]} />
              </View>
            )}
          </View>
          
          <View style={styles.arcLabels}>
            <Text style={styles.arcLabel}>Flat</Text>
            <Text style={styles.arcLabel}>Sharp</Text>
          </View>
        </View>

        {/* Strings */}
        <View style={styles.stringsSection}>
          <Text style={styles.sectionLabel}>STRINGS</Text>
          <View style={styles.strings}>
            {selectedTuning.strings.map((note, index) => (
              <View key={index} style={styles.stringButton}>
                <Text style={styles.stringNote}>{note}</Text>
                <Text style={styles.stringNumber}>{6 - index}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Input Level */}
        {isListening && (
          <View style={styles.inputLevelSection}>
            <View style={styles.inputLevelHeader}>
              <MaterialIcons name="graphic-eq" size={14} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>INPUT LEVEL</Text>
              <Text style={styles.inputLevelValue}>{Math.round(inputLevel * 100)}%</Text>
            </View>
            <View style={styles.inputLevelMeter}>
              <View 
                style={[
                  styles.inputLevelFill, 
                  { width: `${Math.min(inputLevel * 100, 100)}%` },
                  inputLevel > 0.8 && styles.inputLevelFillHigh,
                  inputLevel < 0.2 && styles.inputLevelFillLow,
                ]} 
              />
            </View>
          </View>
        )}

        {permissionDenied && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={20} color={colors.error} />
            <Text style={styles.errorText}>Microphone access denied. Please enable in settings.</Text>
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: spacing.lg,
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
  tuningSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tuningLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  tuningDisplay: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 180,
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: colors.border,
  },
  waitingState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  waitingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  noteDisplay: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  noteLabel: {
    fontSize: 72,
    fontWeight: '800',
    color: colors.text,
  },
  centsLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  centsInTune: {
    color: colors.success,
  },
  centsFlat: {
    color: colors.error,
  },
  centsSharp: {
    color: colors.warning,
  },
  visualTuner: {
    marginBottom: spacing.xl,
  },
  arcContainer: {
    position: 'relative',
    height: 60,
    marginBottom: spacing.sm,
  },
  arc: {
    flexDirection: 'row',
    height: 40,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  arcSegment: {
    flex: 1,
    height: '100%',
  },
  arcFlat: {
    backgroundColor: colors.error + '40',
  },
  arcInTune: {
    backgroundColor: colors.success + '40',
  },
  arcSharp: {
    backgroundColor: colors.warning + '40',
  },
  needle: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: 2,
    height: 60,
    marginLeft: -1,
    marginTop: -30,
  },
  needleDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.textMuted,
    alignSelf: 'center',
    marginTop: 12,
  },
  needleDotInTune: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  needleDotFlat: {
    backgroundColor: colors.error,
  },
  needleDotSharp: {
    backgroundColor: colors.warning,
  },
  arcLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
  arcLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  stringsSection: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: spacing.md,
    fontWeight: '700',
  },
  strings: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  stringButton: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  stringNote: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  stringNumber: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  inputLevelSection: {
    marginBottom: spacing.lg,
  },
  inputLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  inputLevelValue: {
    marginLeft: 'auto',
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  inputLevelMeter: {
    height: 6,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  inputLevelFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: borderRadius.full,
  },
  inputLevelFillLow: {
    backgroundColor: colors.warning,
  },
  inputLevelFillHigh: {
    backgroundColor: colors.error,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.error + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 13,
  },
});
