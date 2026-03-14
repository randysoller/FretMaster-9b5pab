import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { pitchDetectionService } from '@/services/pitchDetectionService';
import { audioService } from '@/services/audioService';
import { calibrationService } from '@/services/calibrationService';

const TEST_FREQUENCIES = [
  { note: 'E2', frequency: 82.41, string: 'Low E (6th string)' },
  { note: 'A2', frequency: 110.00, string: 'A (5th string)' },
  { note: 'D3', frequency: 146.83, string: 'D (4th string)' },
  { note: 'G3', frequency: 196.00, string: 'G (3rd string)' },
  { note: 'B3', frequency: 246.94, string: 'B (2nd string)' },
  { note: 'E4', frequency: 329.63, string: 'High E (1st string)' },
  { note: 'A4', frequency: 440.00, string: 'A4 reference' },
];

interface CalibrationResult {
  note: string;
  success: boolean;
  accuracy: number;
  deviation: number;
}

export default function CalibrationScreen() {
  const router = useRouter();
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [currentTest, setCurrentTest] = useState<number | null>(null);
  const [results, setResults] = useState<CalibrationResult[]>([]);
  const [overallScore, setOverallScore] = useState<number | null>(null);

  const startCalibration = async () => {
    setIsCalibrating(true);
    setResults([]);
    setOverallScore(null);
    
    // Request microphone access
    const hasAccess = await pitchDetectionService.requestMicrophoneAccess();
    if (!hasAccess) {
      alert('Microphone access is required for calibration');
      setIsCalibrating(false);
      return;
    }

    // Start detection
    pitchDetectionService.startDetection(() => {}, 0.5);
    
    // Run tests for each frequency
    const testResults: CalibrationResult[] = [];
    
    for (let i = 0; i < TEST_FREQUENCIES.length; i++) {
      const test = TEST_FREQUENCIES[i];
      setCurrentTest(i);
      
      // Play reference tone
      audioService.playTunerTone(test.frequency, 3000);
      
      // Wait a moment for tone to stabilize
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Collect detection data
      const result = await pitchDetectionService.calibrateWithKnownFrequency(test.frequency, 2500);
      
      testResults.push({
        note: test.note,
        success: result.success,
        accuracy: result.accuracy,
        deviation: result.deviation,
      });
      
      setResults([...testResults]);
      
      // Pause between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Calculate overall score
    const avgAccuracy = testResults.reduce((sum, r) => sum + r.accuracy, 0) / testResults.length;
    setOverallScore(avgAccuracy);
    
    // Save calibration profile
    const saved = await pitchDetectionService.saveCalibrationProfile('acoustic-guitar', avgAccuracy);
    if (saved) {
      console.log('Calibration profile saved successfully');
    }
    
    // Stop detection
    pitchDetectionService.stopDetection();
    audioService.stopAll();
    setIsCalibrating(false);
    setCurrentTest(null);
  };

  const resetCalibration = () => {
    pitchDetectionService.resetSettings();
    setResults([]);
    setOverallScore(null);
    alert('Calibration settings reset to defaults');
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Calibration',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="build" size={32} color={colors.primary} />
            <Text style={styles.title}>Detection Calibration</Text>
            <Text style={styles.subtitle}>
              Test and optimize pitch detection accuracy for your setup
            </Text>
          </View>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How it works:</Text>
            <Text style={styles.instructionText}>
              • We'll play reference tones for each guitar string
            </Text>
            <Text style={styles.instructionText}>
              • The tuner will detect what it hears
            </Text>
            <Text style={styles.instructionText}>
              • Results show detection accuracy for your device
            </Text>
            <Text style={styles.instructionText}>
              • Settings will auto-adjust for optimal performance
            </Text>
          </View>

          {/* Overall Score */}
          {overallScore !== null && (
            <View style={styles.scoreCard}>
              <View style={styles.scoreHeader}>
                <MaterialIcons 
                  name={overallScore >= 95 ? 'check-circle' : overallScore >= 85 ? 'warning' : 'error'} 
                  size={48} 
                  color={overallScore >= 95 ? colors.success : overallScore >= 85 ? colors.warning : colors.error} 
                />
                <Text style={styles.scoreValue}>{Math.round(overallScore)}%</Text>
              </View>
              <Text style={styles.scoreLabel}>Overall Accuracy</Text>
              <Text style={styles.scoreDescription}>
                {overallScore >= 95 ? 'Excellent! Your setup is working perfectly.' :
                 overallScore >= 85 ? 'Good. Minor improvements possible with better mic.' :
                 'Fair. Consider using an external microphone or reducing background noise.'}
              </Text>
            </View>
          )}

          {/* Test Results */}
          {results.length > 0 && (
            <View style={styles.resultsSection}>
              <Text style={styles.sectionTitle}>TEST RESULTS</Text>
              {results.map((result, index) => {
                const test = TEST_FREQUENCIES[index];
                return (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultNote}>{result.note}</Text>
                        <Text style={styles.resultString}>{test.string}</Text>
                      </View>
                      <View style={styles.resultStatus}>
                        <MaterialIcons 
                          name={result.success ? 'check-circle' : 'error'} 
                          size={24} 
                          color={result.success ? colors.success : colors.warning} 
                        />
                        <Text style={[
                          styles.resultAccuracy,
                          result.success && styles.resultAccuracySuccess,
                        ]}>
                          {Math.round(result.accuracy)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultDetailText}>
                        Deviation: {result.deviation.toFixed(2)} Hz
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Current Test Progress */}
          {isCalibrating && currentTest !== null && (
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <MaterialIcons name="hearing" size={24} color={colors.primary} />
                <Text style={styles.progressTitle}>
                  Testing {TEST_FREQUENCIES[currentTest].note}...
                </Text>
              </View>
              <Text style={styles.progressSubtitle}>
                {TEST_FREQUENCIES[currentTest].string}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentTest + 1) / TEST_FREQUENCIES.length) * 100}%` }
                  ]} 
                />
              </View>
              <Text style={styles.progressText}>
                Test {currentTest + 1} of {TEST_FREQUENCIES.length}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable 
              style={[styles.calibrateButton, isCalibrating && styles.calibrateButtonDisabled]}
              onPress={startCalibration}
              disabled={isCalibrating}
            >
              <MaterialIcons 
                name={isCalibrating ? 'hourglass-empty' : 'play-arrow'} 
                size={24} 
                color={isCalibrating ? colors.textMuted : '#000'} 
              />
              <Text style={[styles.calibrateButtonText, isCalibrating && styles.calibrateButtonTextDisabled]}>
                {isCalibrating ? 'Calibrating...' : 'Start Calibration'}
              </Text>
            </Pressable>

            <Pressable 
              style={styles.resetButton}
              onPress={resetCalibration}
              disabled={isCalibrating}
            >
              <MaterialIcons name="restore" size={20} color={colors.text} />
              <Text style={styles.resetButtonText}>Reset to Defaults</Text>
            </Pressable>
          </View>

          {/* Tips */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>For best results:</Text>
            <Text style={styles.tipText}>✓ Use headphones to hear reference tones clearly</Text>
            <Text style={styles.tipText}>✓ Minimize background noise</Text>
            <Text style={styles.tipText}>✓ Keep device close to sound source</Text>
            <Text style={styles.tipText}>✓ Ensure microphone is not blocked</Text>
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
    padding: spacing.lg,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  instructionsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
  },
  instructionText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 20,
  },
  scoreCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.success,
    alignItems: 'center',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  scoreLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  scoreDescription: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 20,
  },
  resultsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.textSecondary,
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  resultInfo: {
    flex: 1,
  },
  resultNote: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resultString: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resultAccuracy: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.warning,
  },
  resultAccuracySuccess: {
    color: colors.success,
  },
  resultDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  progressCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  progressSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  calibrateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  calibrateButtonDisabled: {
    backgroundColor: colors.surface,
  },
  calibrateButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  calibrateButtonTextDisabled: {
    color: colors.textMuted,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  tipsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  tipText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
});
