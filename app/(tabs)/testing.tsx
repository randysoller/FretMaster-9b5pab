// Audio testing and benchmarking screen
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { audioTestingService, BenchmarkResult, TestResult } from '@/services/audioTestingService';

export default function TestingScreen() {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkResult | null>(null);

  const runBenchmark = async () => {
    setIsRunning(true);
    setBenchmarkResult(null);

    try {
      const result = await audioTestingService.runBenchmark({
        useNoise: true,
        noiseLevel: 0.05,
        duration: 1000,
      });
      
      setBenchmarkResult(result);
      console.log(audioTestingService.generateReport(result));
    } catch (error) {
      console.error('Benchmark failed:', error);
      alert('Benchmark failed. Check console for details.');
    } finally {
      setIsRunning(false);
    }
  };

  const getResultColor = (accuracy: number) => {
    if (accuracy >= 95) return colors.success;
    if (accuracy >= 85) return colors.warning;
    return colors.error;
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Detection Testing',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="science" size={32} color={colors.primary} />
            <Text style={styles.title}>Benchmark Testing</Text>
            <Text style={styles.subtitle}>
              Test pitch detection accuracy across all guitar frequencies
            </Text>
          </View>

          {/* Run Benchmark Button */}
          <Pressable
            style={[styles.runButton, isRunning && styles.runButtonDisabled]}
            onPress={runBenchmark}
            disabled={isRunning}
          >
            <MaterialIcons 
              name={isRunning ? 'hourglass-empty' : 'play-arrow'} 
              size={24} 
              color={isRunning ? colors.textMuted : '#000'} 
            />
            <Text style={[styles.runButtonText, isRunning && styles.runButtonTextDisabled]}>
              {isRunning ? 'Running Tests...' : 'Run Benchmark'}
            </Text>
          </Pressable>

          {/* Results Summary */}
          {benchmarkResult && (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Summary</Text>
                
                <View style={styles.summaryGrid}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{benchmarkResult.totalTests}</Text>
                    <Text style={styles.summaryLabel}>Total Tests</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: colors.success }]}>
                      {benchmarkResult.passed}
                    </Text>
                    <Text style={styles.summaryLabel}>Passed</Text>
                  </View>
                  
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryValue, { color: colors.error }]}>
                      {benchmarkResult.failed}
                    </Text>
                    <Text style={styles.summaryLabel}>Failed</Text>
                  </View>
                </View>

                <View style={styles.accuracyRow}>
                  <View style={styles.accuracyItem}>
                    <Text style={styles.accuracyLabel}>Average Accuracy</Text>
                    <Text style={[
                      styles.accuracyValue, 
                      { color: getResultColor(benchmarkResult.averageAccuracy) }
                    ]}>
                      {benchmarkResult.averageAccuracy.toFixed(1)}%
                    </Text>
                  </View>
                  
                  <View style={styles.accuracyItem}>
                    <Text style={styles.accuracyLabel}>Avg Deviation</Text>
                    <Text style={styles.accuracyValue}>
                      {benchmarkResult.averageDeviation.toFixed(2)} Hz
                    </Text>
                  </View>
                </View>
              </View>

              {/* Individual Results */}
              <View style={styles.resultsSection}>
                <Text style={styles.sectionTitle}>TEST RESULTS</Text>
                
                {benchmarkResult.results.map((result: TestResult, index: number) => (
                  <View key={index} style={styles.resultCard}>
                    <View style={styles.resultHeader}>
                      <View style={styles.resultInfo}>
                        <Text style={styles.resultNote}>{result.targetNote}</Text>
                        <Text style={styles.resultFrequency}>
                          {result.targetFrequency.toFixed(2)} Hz
                        </Text>
                      </View>
                      
                      <View style={styles.resultStatus}>
                        <MaterialIcons 
                          name={result.passed ? 'check-circle' : 'cancel'} 
                          size={24} 
                          color={result.passed ? colors.success : colors.error} 
                        />
                        <Text style={[
                          styles.resultAccuracy,
                          { color: getResultColor(result.accuracy) }
                        ]}>
                          {result.accuracy.toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                    
                    <View style={styles.resultDetails}>
                      <Text style={styles.resultDetailText}>
                        Detected: {result.detectedFrequency.toFixed(2)} Hz ({result.detectedNote})
                      </Text>
                      <Text style={styles.resultDetailText}>
                        Deviation: {result.deviation.toFixed(2)} Hz
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Info Card */}
          {!benchmarkResult && (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>What this tests:</Text>
              <Text style={styles.infoText}>
                • Detection accuracy for all 6 guitar strings
              </Text>
              <Text style={styles.infoText}>
                • Reference A4 (440 Hz) frequency
              </Text>
              <Text style={styles.infoText}>
                • Performance with realistic background noise
              </Text>
              <Text style={styles.infoText}>
                • Algorithm precision and consistency
              </Text>
            </View>
          )}
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
  runButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  runButtonDisabled: {
    backgroundColor: colors.surface,
  },
  runButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  runButtonTextDisabled: {
    color: colors.textMuted,
  },
  summaryCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  summaryValue: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  accuracyRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  accuracyItem: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  accuracyLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  accuracyValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  resultsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
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
  resultFrequency: {
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
  },
  resultDetails: {
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  resultDetailText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    lineHeight: 18,
  },
});
