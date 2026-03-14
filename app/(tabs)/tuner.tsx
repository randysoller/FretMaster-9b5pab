import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Screen, Button, AudioVisualizer } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { STANDARD_TUNING } from '@/constants/musicData';
import { pitchDetectionService, PitchDetectionResult } from '@/services/pitchDetectionService';
import { mobileAudioDetectionService, MobilePitchResult } from '@/services/mobileAudioDetectionService';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';

const TUNINGS = ['Standard', 'EADGBE', 'Drop D', 'Open G', 'DADGAD'];

export default function TunerScreen() {
  const router = useRouter();
  const [selectedTuning, setSelectedTuning] = useState('Standard');
  const [micSensitivity, setMicSensitivity] = useState(60);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | MobilePitchResult | null>(null);
  const [detectionQuality, setDetectionQuality] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [inputLevel, setInputLevel] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState<Float32Array | null>(null);
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null);

  useEffect(() => {
    // Subscribe to input level updates
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

  const startListening = async () => {
    if (Platform.OS === 'web') {
      // Web: Use Web Audio API
      const hasAccess = await pitchDetectionService.requestMicrophoneAccess();
      
      if (hasAccess) {
        setIsListening(true);
        pitchDetectionService.startDetection((result, buffer, freqData) => {
          setDetectedPitch(result);
          if (result && result.quality) {
            setDetectionQuality(result.quality);
          }
          if (buffer) setAudioBuffer(buffer);
          if (freqData) setFrequencyData(freqData);
        }, micSensitivity / 100);
      } else {
        alert('Microphone access is required for tuning');
      }
    } else {
      // Mobile: Use native audio + API detection
      const started = await mobileAudioDetectionService.startPitchDetection(
        (result) => {
          setDetectedPitch(result);
          // Mobile doesn't have quality metrics in local mode
          if (result && result.confidence) {
            setInputLevel(result.confidence);
          }
        },
        false // Use local detection for real-time feedback (faster)
      );
      
      if (started) {
        setIsListening(true);
      } else {
        alert('Microphone access is required for tuning');
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

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <MaterialIcons name="tune" size={24} color={colors.primary} />
          <Text style={styles.headerTitle}>Guitar Tuner</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>
          Tune Your <Text style={styles.titleAccent}>Guitar</Text>
        </Text>

        {/* Tuning Selector */}
        <View style={styles.tuningSelector}>
          <Text style={styles.tuningLabel}>{selectedTuning}</Text>
          <MaterialIcons name="arrow-drop-down" size={24} color={colors.primary} />
        </View>

        <Text style={styles.instruction}>
          Play a string and the tuner will detect the pitch.
        </Text>

        {/* Tuning Display */}
        <Pressable onPress={toggleListening}>
          <View style={styles.tuningDisplay}>
            {!detectedPitch ? (
              <View style={styles.waitingState}>
                <MaterialIcons 
                  name={isListening ? 'mic' : 'mic-off'} 
                  size={48} 
                  color={isListening ? colors.success : colors.textMuted} 
                />
                <Text style={styles.waitingText}>
                  {isListening ? 'Listening...' : 'Tap to start tuning'}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.noteLabel}>{detectedPitch.note}</Text>
                <View style={styles.tuningMeter}>
                  <Text style={styles.centLabel}>{detectedPitch.cents} cents</Text>
                </View>
              </>
            )}
          </View>
        </Pressable>

        {/* Visual Tuner */}
        <View style={styles.visualTuner}>
          <Text style={styles.visualLabel}>Flat</Text>
          <View style={styles.visualMeter}>
            {Array.from({ length: 41 }).map((_, i) => {
              const position = i - 20;
              const cents = detectedPitch?.cents || 0;
              const isActive = Math.abs(position - cents / 5) < 1;
              let color = colors.surface;
              if (isActive && detectedPitch) {
                if (Math.abs(cents) < 5) color = colors.success;
                else if (cents < 0) color = colors.error;
                else color = colors.warning;
              }
              return (
                <View 
                  key={i} 
                  style={[styles.meterBar, { backgroundColor: color }]} 
                />
              );
            })}
          </View>
          <Text style={styles.visualLabel}>Sharp</Text>
        </View>

        {/* Mic Sensitivity */}
        <View style={styles.sensitivitySection}>
          <View style={styles.sensitivityHeader}>
            <View style={styles.sensitivityLabel}>
              <MaterialIcons name="mic" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>MIC SENSITIVITY</Text>
            </View>
            <Text style={styles.sensitivityValue}>{micSensitivity}%</Text>
          </View>
          
          <View style={styles.sensitivityControls}>
            <Text style={styles.sensitivityMin}>Low</Text>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={100}
              value={micSensitivity}
              onValueChange={setMicSensitivity}
              minimumTrackTintColor={colors.primary}
              maximumTrackTintColor={colors.surface}
              thumbTintColor={colors.primary}
            />
            <Text style={styles.sensitivityMax}>High</Text>
          </View>
        </View>

        {/* Detection Quality */}
        {detectionQuality && (
          <View style={styles.qualitySection}>
            <Text style={styles.sectionLabel}>DETECTION QUALITY</Text>
            <View style={styles.qualityCard}>
              <View style={styles.qualityScore}>
                <Text style={styles.qualityValue}>{Math.round(detectionQuality.overallScore)}</Text>
                <Text style={styles.qualityLabel}>Score</Text>
              </View>
              <View style={styles.qualityMetrics}>
                <View style={styles.qualityMetric}>
                  <Text style={styles.qualityMetricLabel}>S/N Ratio</Text>
                  <Text style={styles.qualityMetricValue}>{detectionQuality.signalToNoise.toFixed(1)} dB</Text>
                </View>
                <View style={styles.qualityMetric}>
                  <Text style={styles.qualityMetricLabel}>Clarity</Text>
                  <Text style={styles.qualityMetricValue}>{Math.round(detectionQuality.harmonicClarity * 100)}%</Text>
                </View>
                <View style={styles.qualityMetric}>
                  <Text style={styles.qualityMetricLabel}>Stability</Text>
                  <Text style={styles.qualityMetricValue}>{Math.round(detectionQuality.temporalStability * 100)}%</Text>
                </View>
              </View>
              {detectionQuality.warnings.length > 0 && (
                <View style={styles.qualityWarnings}>
                  {detectionQuality.warnings.map((warning: string, index: number) => (
                    <Text key={index} style={styles.qualityWarning}>
                      ⚠️ {warning}
                    </Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Input Level Monitor */}
        {isListening && (
          <View style={styles.inputLevelSection}>
            <View style={styles.inputLevelHeader}>
              <MaterialIcons name="graphic-eq" size={16} color={colors.textSecondary} />
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
            {inputLevel < 0.1 && (
              <Text style={styles.inputLevelWarning}>⚠️ Too quiet - play louder</Text>
            )}
            {inputLevel > 0.9 && (
              <Text style={styles.inputLevelWarning}>⚠️ Too loud - may clip</Text>
            )}
          </View>
        )}

        {/* Audio Visualization */}
        {isListening && (audioBuffer || frequencyData) && (
          <View style={styles.visualizationSection}>
            <Text style={styles.sectionLabel}>AUDIO VISUALIZATION</Text>
            <AudioVisualizer
              audioData={audioBuffer}
              frequencyData={frequencyData}
              type="both"
              height={120}
              color={colors.primary}
            />
          </View>
        )}

        {/* Calibration */}
        <View style={styles.calibrationSection}>
          <View style={styles.calibrationHeader}>
            <View style={styles.calibrationLabel}>
              <MaterialIcons name="settings" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>CALIBRATION</Text>
            </View>
            <Pressable 
              style={styles.calibrateButton}
              onPress={() => router.push('/calibration')}
            >
              <MaterialIcons name="settings" size={16} color={colors.primary} />
              <Text style={styles.calibrateText}>Calibrate</Text>
            </Pressable>
          </View>
        </View>

        {/* Strings */}
        <View style={styles.stringsSection}>
          <View style={styles.stringsHeader}>
            <Text style={styles.sectionLabel}>STRINGS</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable
                style={styles.testingButton}
                onPress={() => router.push('/testing')}
              >
                <MaterialIcons name="science" size={16} color={colors.info} />
                <Text style={styles.testingText}>Test</Text>
              </Pressable>
              <Pressable style={styles.autoDetectButton}>
                <MaterialIcons name="auto-fix-high" size={16} color={colors.primary} />
                <Text style={styles.autoDetectText}>Auto-Detect</Text>
              </Pressable>
            </View>
          </View>
          
          <View style={styles.strings}>
            {STANDARD_TUNING.map((note, index) => (
              <Pressable 
                key={index}
                style={styles.stringButton}
              >
                <Text style={styles.stringNote}>{note}</Text>
                <Text style={styles.stringNumber}>{index + 1}</Text>
              </Pressable>
            ))}
          </View>
        </View>
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
    justifyContent: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
  },
  title: {
    ...typography.h1,
    fontSize: 28,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  titleAccent: {
    color: colors.primary,
  },
  tuningSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  tuningLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  instruction: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  tuningDisplay: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
    marginBottom: spacing.lg,
  },
  waitingState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  waitingText: {
    color: colors.textMuted,
    fontSize: 16,
  },
  noteLabel: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
  },
  tuningMeter: {
    marginTop: spacing.md,
  },
  centLabel: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  visualTuner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  visualLabel: {
    color: colors.textMuted,
    fontSize: 12,
  },
  visualMeter: {
    flex: 1,
    flexDirection: 'row',
    height: 40,
    gap: 2,
  },
  meterBar: {
    flex: 1,
    borderRadius: 2,
  },
  sensitivitySection: {
    marginBottom: spacing.lg,
  },
  sensitivityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sensitivityLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
    letterSpacing: 1,
  },
  sensitivityValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  sensitivityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sensitivityMin: {
    color: colors.textMuted,
    fontSize: 12,
  },
  sensitivityMax: {
    color: colors.textMuted,
    fontSize: 12,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  calibrationSection: {
    marginBottom: spacing.xl,
  },
  calibrationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calibrationLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  calibrateText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  stringsSection: {
    marginBottom: spacing.lg,
  },
  stringsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  autoDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  autoDetectText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 20,
    fontWeight: '700',
  },
  stringNumber: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  qualitySection: {
    marginBottom: spacing.lg,
  },
  qualityCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  qualityScore: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  qualityValue: {
    fontSize: 36,
    fontWeight: '700',
    color: colors.primary,
  },
  qualityLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  qualityMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  qualityMetric: {
    alignItems: 'center',
  },
  qualityMetricLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  qualityMetricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  qualityWarnings: {
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  qualityWarning: {
    fontSize: 12,
    color: colors.warning,
    marginBottom: spacing.xs,
    lineHeight: 16,
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
    fontSize: 14,
    fontWeight: '700',
  },
  inputLevelMeter: {
    height: 8,
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
  inputLevelWarning: {
    fontSize: 11,
    color: colors.warning,
    marginTop: spacing.xs,
  },
  visualizationSection: {
    marginBottom: spacing.lg,
  },
  testingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.info,
  },
  testingText: {
    color: colors.info,
    fontSize: 14,
    fontWeight: '600',
  },
});
