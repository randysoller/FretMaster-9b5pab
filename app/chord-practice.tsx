import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { ChordData, CHORDS } from '@/constants/musicData';
import { audioService } from '@/services/audioService';
import { pitchDetectionService, PitchDetectionResult, ChordDetectionResult } from '@/services/pitchDetectionService';
import { chordDetectionService } from '@/services/chordDetectionService';
import { mobileAudioDetectionService } from '@/services/mobileAudioDetectionService';
import { Platform } from 'react-native';

export default function ChordPracticeScreen() {
  const router = useRouter();
  const [currentChord, setCurrentChord] = useState<ChordData>(CHORDS[0]);
  const [isListening, setIsListening] = useState(false);
  const [micSensitivity, setMicSensitivity] = useState(60);
  const [detectedPitch, setDetectedPitch] = useState<PitchDetectionResult | null>(null);
  const [chordDetection, setChordDetection] = useState<ChordDetectionResult | null>(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [chordDiagram, setChordDiagram] = useState(true);
  const [beatSyncEnabled, setBeatSyncEnabled] = useState(false);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [currentDetectionId, setCurrentDetectionId] = useState<string | undefined>();
  const [showFeedbackPrompt, setShowFeedbackPrompt] = useState(false);
  const [personalizedSettings, setPersonalizedSettings] = useState<any>(null);

  useEffect(() => {
    // Load personalized settings
    loadPersonalizedSettings();

    // Clean up on unmount
    return () => {
      if (isListening) {
        pitchDetectionService.stopDetection();
      }
      audioService.stopAll();
    };
  }, []);

  const loadPersonalizedSettings = async () => {
    const settings = await chordDetectionService.getPersonalizedSettings();
    if (settings) {
      setPersonalizedSettings(settings);
      console.log('Loaded personalized settings:', settings);
    }
  };

  const startListening = async () => {
    const hasAccess = await pitchDetectionService.requestMicrophoneAccess();
    
    if (hasAccess) {
      setIsListening(true);
      pitchDetectionService.startDetection((result) => {
        setDetectedPitch(result);
      }, micSensitivity / 100);
    } else {
      alert('Microphone access is required for chord detection');
    }
  };

  const detectChord = async () => {
    setIsDetecting(true);
    setChordDetection(null);
    setShowFeedbackPrompt(false);
    
    let result;
    
    if (Platform.OS === 'web') {
      // Web: Use smart detection with personalized settings
      result = await chordDetectionService.detectChordSmart(
        {
          name: currentChord.name,
          positions: currentChord.positions,
          notes: currentChord.notes || [],
        },
        2000
      );
    } else {
      // Mobile: Use API-based detection
      result = await mobileAudioDetectionService.detectChord(
        {
          name: currentChord.name,
          positions: currentChord.positions,
          notes: currentChord.notes || [],
        },
        2000
      );
    }
    
    setChordDetection(result);
    setCurrentDetectionId(result.detectionId);
    setIsDetecting(false);
    
    // Show feedback prompt after detection
    setShowFeedbackPrompt(true);
    
    if (result.isCorrect) {
      setScore(score + 1);
      audioService.playSuccess();
    } else {
      audioService.playError();
    }
  };

  const submitFeedback = async (wasCorrect: boolean, correctedChord?: string) => {
    if (!currentDetectionId) return;

    await chordDetectionService.submitFeedback(
      currentDetectionId,
      wasCorrect,
      correctedChord
    );

    setShowFeedbackPrompt(false);

    // Reload personalized settings to reflect feedback
    await loadPersonalizedSettings();

    // Show toast or feedback confirmation
    console.log('Feedback submitted:', wasCorrect ? 'Correct' : 'Incorrect');
  };

  const stopListening = () => {
    setIsListening(false);
    pitchDetectionService.stopDetection();
    setDetectedPitch(null);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handlePlayChord = () => {
    audioService.playChordPreview(currentChord.name);
  };

  const handleNextChord = () => {
    const nextIndex = (CHORDS.indexOf(currentChord) + 1) % CHORDS.length;
    setCurrentChord(CHORDS[nextIndex]);
    setAttempts(attempts + 1);
  };

  const renderFretboardDiagram = () => {
    const minFret = Math.min(...currentChord.positions.filter(p => p > 0));
    const maxFret = Math.max(...currentChord.positions.filter(p => p > 0));
    const startFret = Math.max(1, minFret - 1);
    const numFrets = Math.min(5, maxFret - startFret + 2);

    return (
      <View style={styles.fretboardContainer}>
        <View style={styles.fretboard}>
          {currentChord.positions.map((fret, stringIndex) => (
            <View key={stringIndex} style={styles.string}>
              {Array.from({ length: numFrets }).map((_, fretIndex) => {
                const currentFret = startFret + fretIndex;
                const shouldShowDot = fret > 0 && fret === currentFret;
                const fingerNumber = shouldShowDot ? currentChord.fingers[stringIndex] : 0;

                return (
                  <View key={fretIndex} style={styles.fretCell}>
                    <View style={styles.stringLine} />
                    {shouldShowDot && (
                      <View style={styles.fingerDot}>
                        <Text style={styles.fingerNumber}>{fingerNumber}</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}

          <View style={styles.fretLines}>
            {Array.from({ length: numFrets + 1 }).map((_, i) => (
              <View key={i} style={styles.fretLine} />
            ))}
          </View>

          {startFret === 1 && <View style={styles.nut} />}
        </View>

        {/* Tuning reference */}
        <View style={styles.tuningReference}>
          {['E', 'A', 'D', 'G', 'B', 'E'].map((note, index) => {
            const fret = currentChord.positions[index];
            return (
              <View key={index} style={styles.tuningRow}>
                <Text style={styles.tuningString}>{note}</Text>
                <Text style={styles.tuningSeparator}>-</Text>
                <Text style={styles.tuningFret}>{fret === -1 ? 'x' : fret}</Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: 'Chord Practice',
          headerRight: () => (
            <Pressable onPress={() => router.back()} style={{ marginRight: spacing.md }}>
              <MaterialIcons name="close" size={24} color={colors.text} />
            </Pressable>
          ),
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Controls Bar */}
          <View style={styles.controlsBar}>
            <Pressable 
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <MaterialIcons name="arrow-back" size={20} color={colors.text} />
              <Text style={styles.backText}>Back</Text>
            </Pressable>

            <Pressable 
              style={[styles.listeningButton, isListening && styles.listeningButtonActive]}
              onPress={toggleListening}
            >
              <MaterialIcons 
                name={isListening ? 'mic' : 'mic-off'} 
                size={16} 
                color={isListening ? colors.success : colors.text} 
              />
              <Text style={[
                styles.listeningText,
                isListening && styles.listeningTextActive,
              ]}>
                {isListening ? 'Listening - play the chord' : 'Chord Diagram On'}
              </Text>
              {isListening && (
                <View style={styles.pulseIndicator}>
                  <MaterialIcons name="fiber-manual-record" size={8} color={colors.success} />
                </View>
              )}
            </Pressable>

            <Pressable style={styles.volumeButton}>
              <MaterialIcons name="volume-up" size={20} color={colors.textSecondary} />
            </Pressable>

            <Pressable style={styles.settingsButton}>
              <MaterialIcons name="more-vert" size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Mic Sensitivity */}
          <View style={styles.sensitivitySection}>
            <View style={styles.sensitivityHeader}>
              <MaterialIcons name="mic" size={16} color={colors.primary} />
              <Text style={styles.sectionLabel}>MIC SENSITIVITY</Text>
              <Text style={styles.sensitivityValue}>{micSensitivity}</Text>
              <Pressable style={styles.stopButton}>
                <Text style={styles.stopButtonText}>Sensitive</Text>
              </Pressable>
            </View>
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
          </View>

          {/* Advanced Detection */}
          <View style={styles.advancedSection}>
            <View style={styles.advancedHeader}>
              <MaterialIcons name="tune" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>ADVANCED DETECTION</Text>
              <Pressable style={styles.settingsIconButton}>
                <MaterialIcons name="settings" size={16} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Beat Sync */}
          <View style={styles.beatSyncSection}>
            <View style={styles.beatSyncHeader}>
              <MaterialIcons name="graphic-eq" size={16} color={colors.textSecondary} />
              <Text style={styles.sectionLabel}>BEAT SYNC</Text>
              <Pressable 
                style={styles.startButton}
                onPress={() => setBeatSyncEnabled(!beatSyncEnabled)}
              >
                <MaterialIcons 
                  name={beatSyncEnabled ? 'pause' : 'play-arrow'} 
                  size={16} 
                  color={colors.primary} 
                />
                <Text style={styles.startButtonText}>
                  {beatSyncEnabled ? 'Stop' : 'Start'}
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Chord Display */}
          <View style={styles.chordDisplay}>
            <Text style={styles.chordName}>{currentChord.name}</Text>
            <Text style={styles.chordType}>D Augmented 7th</Text>
          </View>

          {/* Fretboard Diagram */}
          {chordDiagram && renderFretboardDiagram()}

          {/* Personalized Settings Info */}
          {personalizedSettings && (
            <View style={styles.personalizedSettingsCard}>
              <View style={styles.settingsHeader}>
                <MaterialIcons name="auto-awesome" size={16} color={colors.primary} />
                <Text style={styles.settingsTitle}>PERSONALIZED DETECTION</Text>
              </View>
              <View style={styles.settingsMetrics}>
                <View style={styles.settingMetric}>
                  <Text style={styles.settingLabel}>Success Rate</Text>
                  <Text style={styles.settingValue}>
                    {Math.round(personalizedSettings.success_rate * 100)}%
                  </Text>
                </View>
                <View style={styles.settingMetric}>
                  <Text style={styles.settingLabel}>Threshold</Text>
                  <Text style={styles.settingValue}>
                    {Math.round(personalizedSettings.confidence_threshold * 100)}%
                  </Text>
                </View>
                <View style={styles.settingMetric}>
                  <Text style={styles.settingLabel}>ML Fallback</Text>
                  <MaterialIcons 
                    name={personalizedSettings.use_ml_fallback ? 'check-circle' : 'cancel'} 
                    size={20} 
                    color={personalizedSettings.use_ml_fallback ? colors.success : colors.textMuted} 
                  />
                </View>
              </View>
              {personalizedSettings.recommend_calibration && (
                <Pressable 
                  style={styles.calibrationPrompt}
                  onPress={() => router.push('/calibration')}
                >
                  <MaterialIcons name="warning" size={16} color={colors.warning} />
                  <Text style={styles.calibrationPromptText}>
                    Low confidence detected - calibration recommended
                  </Text>
                </Pressable>
              )}
            </View>
          )}

          {/* Chord Recognition Feedback */}
          {chordDetection && (
            <View style={styles.chordFeedbackSection}>
              {/* Detection Method Badge */}
              <View style={styles.methodBadge}>
                <MaterialIcons 
                  name={chordDetection.method === 'ml-enhanced' ? 'cloud' : 'devices'} 
                  size={14} 
                  color={chordDetection.method === 'ml-enhanced' ? colors.info : colors.primary} 
                />
                <Text style={styles.methodBadgeText}>
                  {chordDetection.method === 'ml-enhanced' ? 'ML Enhanced' : 'Local Detection'}
                </Text>
              </View>
              <View style={styles.accuracyHeader}>
                <MaterialIcons 
                  name={chordDetection.isCorrect ? 'check-circle' : 'cancel'} 
                  size={32} 
                  color={chordDetection.isCorrect ? colors.success : colors.error} 
                />
                <Text style={[styles.accuracyText, chordDetection.isCorrect && styles.accuracyTextSuccess]}>
                  {Math.round(chordDetection.accuracy)}% Accuracy
                </Text>
              </View>

              {/* String-by-String Feedback */}
              <View style={styles.stringsFeedback}>
                <Text style={styles.stringsFeedbackTitle}>STRING FEEDBACK</Text>
                {chordDetection.stringFeedback.map((feedback, index) => (
                  feedback.expectedFret >= 0 && (
                    <View key={index} style={styles.stringFeedbackRow}>
                      <Text style={styles.stringNumber}>{['E', 'A', 'D', 'G', 'B', 'E'][feedback.stringNumber]}</Text>
                      <View style={styles.stringFeedbackContent}>
                        <Text style={styles.stringTarget}>Target: {feedback.targetNote}</Text>
                        <Text style={[styles.stringDetected, feedback.isCorrect && styles.stringDetectedCorrect]}>
                          {feedback.detectedNote || 'Not detected'}
                        </Text>
                      </View>
                      <MaterialIcons 
                        name={feedback.isCorrect ? 'check' : 'close'} 
                        size={20} 
                        color={feedback.isCorrect ? colors.success : colors.error} 
                      />
                    </View>
                  )
                ))}
              </View>

              {/* User Feedback Prompt */}
              {showFeedbackPrompt && (
                <View style={styles.feedbackPrompt}>
                  <Text style={styles.feedbackPromptTitle}>Was this detection accurate?</Text>
                  <View style={styles.feedbackButtons}>
                    <Pressable 
                      style={[styles.feedbackButton, styles.feedbackButtonYes]}
                      onPress={() => submitFeedback(true)}
                    >
                      <MaterialIcons name="thumb-up" size={20} color={colors.success} />
                      <Text style={styles.feedbackButtonText}>Yes, correct</Text>
                    </Pressable>
                    <Pressable 
                      style={[styles.feedbackButton, styles.feedbackButtonNo]}
                      onPress={() => submitFeedback(false)}
                    >
                      <MaterialIcons name="thumb-down" size={20} color={colors.error} />
                      <Text style={styles.feedbackButtonText}>No, wrong</Text>
                    </Pressable>
                  </View>
                  <Text style={styles.feedbackPromptNote}>
                    Your feedback helps improve detection accuracy over time
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Detection Feedback */}
          {isListening && detectedPitch && (
            <View style={styles.feedbackSection}>
              <Text style={styles.feedbackText}>
                Detected: {detectedPitch.note} ({detectedPitch.frequency.toFixed(1)} Hz)
              </Text>
              <Text style={styles.feedbackCents}>
                {detectedPitch.cents > 0 ? '+' : ''}{detectedPitch.cents} cents
              </Text>
            </View>
          )}

          {/* Practice Stats */}
          <View style={styles.statsSection}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{score}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{attempts}</Text>
              <Text style={styles.statLabel}>Attempts</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {attempts > 0 ? Math.round((score / attempts) * 100) : 0}%
              </Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <Pressable style={styles.playButton} onPress={handlePlayChord}>
              <MaterialIcons name="play-arrow" size={24} color="#000" />
              <Text style={styles.playButtonText}>Play Chord</Text>
            </Pressable>

            <Pressable 
              style={[styles.detectButton, isDetecting && styles.detectButtonActive]} 
              onPress={detectChord}
              disabled={isDetecting}
            >
              {isDetecting ? (
                <>
                  <MaterialIcons name="hearing" size={24} color={colors.text} />
                  <Text style={styles.detectButtonText}>Listening...</Text>
                </>
              ) : (
                <>
                  <MaterialIcons name="mic" size={24} color={colors.text} />
                  <Text style={styles.detectButtonText}>Detect My Chord</Text>
                </>
              )}
            </Pressable>

            <Pressable style={styles.nextButton} onPress={handleNextChord}>
              <Text style={styles.nextButtonText}>Next Chord</Text>
              <MaterialIcons name="arrow-forward" size={20} color={colors.text} />
            </Pressable>
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
  controlsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  backText: {
    color: colors.text,
    fontSize: 14,
  },
  listeningButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  listeningButtonActive: {
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  listeningText: {
    color: colors.text,
    fontSize: 12,
  },
  listeningTextActive: {
    color: colors.success,
  },
  pulseIndicator: {
    marginLeft: 'auto',
  },
  volumeButton: {
    padding: spacing.xs,
  },
  settingsButton: {
    padding: spacing.xs,
  },
  sensitivitySection: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  sensitivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionLabel: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  sensitivityValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stopButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  stopButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  advancedSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  advancedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingsIconButton: {
    marginLeft: 'auto',
  },
  beatSyncSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  beatSyncHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginLeft: 'auto',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
  },
  startButtonText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  chordDisplay: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  chordName: {
    fontSize: 64,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chordType: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  fretboardContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  fretboard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    position: 'relative',
  },
  string: {
    flexDirection: 'row',
    height: 32,
  },
  fretCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  stringLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.string,
  },
  fingerDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  fingerNumber: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },
  fretLines: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    top: spacing.md,
    bottom: spacing.md,
    flexDirection: 'row',
  },
  fretLine: {
    flex: 1,
    borderLeftWidth: 2,
    borderLeftColor: colors.fret,
  },
  nut: {
    position: 'absolute',
    left: spacing.md,
    top: spacing.md,
    bottom: spacing.md,
    width: 3,
    backgroundColor: colors.text,
  },
  tuningReference: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  tuningRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tuningString: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
    width: 16,
  },
  tuningSeparator: {
    color: colors.textMuted,
    fontSize: 10,
    marginHorizontal: 4,
  },
  tuningFret: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  feedbackSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.md,
  },
  feedbackText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  feedbackCents: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  statsSection: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.primary,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: spacing.xs,
  },
  actions: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  playButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  nextButton: {
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
  nextButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chordFeedbackSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.border,
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  methodBadgeText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  accuracyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  accuracyText: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.error,
  },
  accuracyTextSuccess: {
    color: colors.success,
  },
  stringsFeedback: {
    gap: spacing.sm,
  },
  stringsFeedbackTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  stringFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    gap: spacing.md,
  },
  stringNumber: {
    width: 24,
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  stringFeedbackContent: {
    flex: 1,
  },
  stringTarget: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  stringDetected: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  stringDetectedCorrect: {
    color: colors.success,
  },
  detectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.info,
  },
  detectButtonActive: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
  },
  detectButtonText: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  personalizedSettingsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settingsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  settingsTitle: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  settingsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  settingMetric: {
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
  },
  settingValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  calibrationPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 140, 0, 0.3)',
  },
  calibrationPromptText: {
    flex: 1,
    fontSize: 12,
    color: colors.warning,
  },
  feedbackPrompt: {
    marginTop: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  feedbackPromptTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  feedbackButtons: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
  },
  feedbackButtonYes: {
    borderColor: colors.success,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  feedbackButtonNo: {
    borderColor: colors.error,
    backgroundColor: 'rgba(244, 67, 54, 0.1)',
  },
  feedbackButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  feedbackPromptNote: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
