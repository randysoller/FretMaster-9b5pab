import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen } from '@/components';
import { Fretboard } from '@/components/feature/Fretboard';
import { colors, spacing, borderRadius, typography } from '@/constants/theme';
import { ChordData, CHORD_DATA } from '@/constants/musicData';
import { usePresets } from '@/contexts/PresetContext';
import { audioService } from '@/services/audioService';
import { recordChordPractice, formatDuration } from '@/services/practiceStatsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

type PracticeMode = 'free' | 'timed' | 'quiz';
type PracticeSource = 'all' | 'preset' | 'selection';

const STORAGE_KEY = 'fretmaster-chord-manager-edits';

export default function ChordPracticeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { presets } = usePresets();

  // State
  const [phase, setPhase] = useState<'setup' | 'practice' | 'results'>('setup');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('free');
  const [practiceSource, setPracticeSource] = useState<PracticeSource>('all');
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [chordPool, setChordPool] = useState<ChordData[]>([]);
  const [currentChordIndex, setCurrentChordIndex] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [chordStartTime, setChordStartTime] = useState<number | null>(null);
  const [completedChords, setCompletedChords] = useState<string[]>([]);
  const [showChordName, setShowChordName] = useState(true);
  const [timePerChord, setTimePerChord] = useState(30); // seconds
  const [remainingTime, setRemainingTime] = useState(30);
  const [isPaused, setIsPaused] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [allChords, setAllChords] = useState<ChordData[]>(CHORD_DATA);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load edited chords from AsyncStorage
  useEffect(() => {
    loadChords();
  }, []);

  const loadChords = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const editedChords = JSON.parse(stored);
        if (Array.isArray(editedChords)) {
          const mergedChords = [...CHORD_DATA].map(originalChord => {
            const editedChord = editedChords.find((c: ChordData) => c.id === originalChord.id);
            return editedChord || originalChord;
          });
          const newChords = editedChords.filter((c: ChordData) => 
            !CHORD_DATA.some(original => original.id === c.id)
          );
          setAllChords([...mergedChords, ...newChords]);
        }
      }
    } catch (error) {
      console.error('Failed to load chords:', error);
    }
  };

  // Timer effect for timed mode
  useEffect(() => {
    if (phase === 'practice' && practiceMode === 'timed' && !isPaused && remainingTime > 0) {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            handleNextChord(true);
            return timePerChord;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [phase, practiceMode, isPaused, remainingTime]);

  // Parse initial selection from params
  useEffect(() => {
    if (params.chords && params.source) {
      try {
        const selectedChords = JSON.parse(params.chords as string);
        setChordPool(selectedChords);
        setPracticeSource('selection');
        setPhase('setup');
      } catch (error) {
        console.error('Failed to parse chord selection:', error);
      }
    }
  }, [params]);

  const currentChord = chordPool[currentChordIndex];

  const handleStartPractice = () => {
    if (chordPool.length === 0) {
      Alert.alert('No Chords Selected', 'Please select chords to practice');
      return;
    }

    // Shuffle chords for variety
    const shuffled = [...chordPool].sort(() => Math.random() - 0.5);
    setChordPool(shuffled);
    setCurrentChordIndex(0);
    setSessionStartTime(Date.now());
    setChordStartTime(Date.now());
    setCompletedChords([]);
    setRemainingTime(timePerChord);
    setPhase('practice');
    
    // Auto-play first chord in free mode
    if (practiceMode === 'free') {
      setTimeout(async () => {
        try {
          await audioService.playChordPreview(shuffled[0]);
        } catch (err) {
          console.error('🔴 Auto-play failed:', err);
        }
      }, 500);
    }
  };

  const handleSourceChange = (source: PracticeSource) => {
    setPracticeSource(source);
    
    if (source === 'all') {
      setChordPool(allChords);
    } else if (source === 'preset') {
      setShowPresetModal(true);
    }
    // 'selection' handled by params
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      const presetChords = allChords.filter(c => preset.chordIds.includes(c.id!));
      setChordPool(presetChords);
      setSelectedPresetId(presetId);
      setShowPresetModal(false);
    }
  };

  const handlePlayChord = async () => {
    if (currentChord) {
      try {
        console.log('🎵 Play button pressed for chord:', currentChord.name);
        await audioService.playChordPreview(currentChord);
        console.log('✅ Chord played successfully');
      } catch (err) {
        console.error('🔴 Chord playback failed:', err);
        const errorMsg = err instanceof Error ? err.message : String(err);
        Alert.alert('Audio Error', `Could not play chord audio.\n\nError: ${errorMsg}\n\nPlease try again.`);
      }
    }
  };

  const handleToggleChordName = () => {
    setShowChordName(!showChordName);
  };

  const handleNextChord = async (autoAdvance: boolean = false) => {
    // Record practice stats for current chord
    if (currentChord && chordStartTime) {
      const durationSeconds = Math.floor((Date.now() - chordStartTime) / 1000);
      await recordChordPractice(
        currentChord.id!,
        currentChord.fullName,
        durationSeconds
      );
      setCompletedChords(prev => [...prev, currentChord.id!]);
    }

    // Check if finished
    if (currentChordIndex >= chordPool.length - 1) {
      handleFinishPractice();
      return;
    }

    // Move to next chord
    setCurrentChordIndex(prev => prev + 1);
    setChordStartTime(Date.now());
    setRemainingTime(timePerChord);
    
    // Auto-play next chord in free mode
    if (practiceMode === 'free' && !autoAdvance) {
      setTimeout(async () => {
        try {
          await audioService.playChordPreview(chordPool[currentChordIndex + 1]);
        } catch (err) {
          console.error('🔴 Next chord auto-play failed:', err);
        }
      }, 300);
    }
  };

  const handlePreviousChord = () => {
    if (currentChordIndex > 0) {
      setCurrentChordIndex(prev => prev - 1);
      setChordStartTime(Date.now());
      setRemainingTime(timePerChord);
    }
  };

  const handlePauseResume = () => {
    setIsPaused(!isPaused);
  };

  const handleFinishPractice = () => {
    audioService.playSuccess();
    setPhase('results');
  };

  const handleRestartPractice = () => {
    setPhase('setup');
    setCurrentChordIndex(0);
    setCompletedChords([]);
    setSessionStartTime(null);
    setChordStartTime(null);
  };

  const getTotalSessionTime = () => {
    if (!sessionStartTime) return 0;
    return Math.floor((Date.now() - sessionStartTime) / 1000);
  };

  // Setup Screen
  const renderSetupScreen = () => (
    <ScrollView style={styles.setupContainer} contentContainerStyle={styles.setupContent}>
      <View style={styles.setupHeader}>
        <MaterialIcons name="school" size={48} color={colors.primary} />
        <Text style={styles.setupTitle}>Chord Practice</Text>
        <Text style={styles.setupSubtitle}>
          Master chords with flashcard-style practice, audio playback, and progress tracking
        </Text>
      </View>

      {/* Practice Mode */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>PRACTICE MODE</Text>
        <View style={styles.optionGrid}>
          <Pressable
            onPress={() => setPracticeMode('free')}
            style={[styles.optionCard, practiceMode === 'free' && styles.optionCardActive]}
          >
            <MaterialIcons 
              name="explore" 
              size={32} 
              color={practiceMode === 'free' ? colors.primary : colors.textMuted} 
            />
            <Text style={[styles.optionTitle, practiceMode === 'free' && styles.optionTitleActive]}>
              Free Practice
            </Text>
            <Text style={styles.optionDescription}>
              No timer, practice at your own pace
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setPracticeMode('timed')}
            style={[styles.optionCard, practiceMode === 'timed' && styles.optionCardActive]}
          >
            <MaterialIcons 
              name="timer" 
              size={32} 
              color={practiceMode === 'timed' ? colors.primary : colors.textMuted} 
            />
            <Text style={[styles.optionTitle, practiceMode === 'timed' && styles.optionTitleActive]}>
              Timed Practice
            </Text>
            <Text style={styles.optionDescription}>
              {timePerChord}s per chord challenge
            </Text>
          </Pressable>
        </View>

        {practiceMode === 'timed' && (
          <View style={styles.timerSettings}>
            <Text style={styles.timerLabel}>Time per chord:</Text>
            <View style={styles.timerButtons}>
              {[15, 30, 45, 60].map(seconds => (
                <Pressable
                  key={seconds}
                  onPress={() => setTimePerChord(seconds)}
                  style={[
                    styles.timerButton,
                    timePerChord === seconds && styles.timerButtonActive,
                  ]}
                >
                  <Text style={[
                    styles.timerButtonText,
                    timePerChord === seconds && styles.timerButtonTextActive,
                  ]}>
                    {seconds}s
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* Chord Source */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CHORD SELECTION</Text>
        <View style={styles.sourceButtons}>
          <Pressable
            onPress={() => handleSourceChange('all')}
            style={[styles.sourceButton, practiceSource === 'all' && styles.sourceButtonActive]}
          >
            <MaterialIcons name="library-music" size={20} color={colors.text} />
            <Text style={styles.sourceButtonText}>All Chords ({allChords.length})</Text>
          </Pressable>

          <Pressable
            onPress={() => handleSourceChange('preset')}
            style={[styles.sourceButton, practiceSource === 'preset' && styles.sourceButtonActive]}
          >
            <MaterialIcons name="bookmark" size={20} color={colors.text} />
            <Text style={styles.sourceButtonText}>
              {selectedPresetId 
                ? presets.find(p => p.id === selectedPresetId)?.name || 'From Preset'
                : 'From Preset'}
              {selectedPresetId && ` (${chordPool.length})`}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Start Button */}
      <Pressable
        onPress={handleStartPractice}
        style={[styles.startButton, chordPool.length === 0 && styles.startButtonDisabled]}
        disabled={chordPool.length === 0}
      >
        <MaterialIcons name="play-arrow" size={24} color="#000" />
        <Text style={styles.startButtonText}>
          Start Practice ({chordPool.length} chords)
        </Text>
      </Pressable>
    </ScrollView>
  );

  // Practice Screen
  const renderPracticeScreen = () => {
    if (!currentChord) return null;

    const progress = ((currentChordIndex + 1) / chordPool.length) * 100;

    return (
      <View style={styles.practiceContainer}>
        {/* Header */}
        <View style={styles.practiceHeader}>
          <Pressable onPress={() => router.replace('/chord-library' as any)} style={styles.backButton}>
            <MaterialIcons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <View style={styles.progressInfo}>
            <Text style={styles.progressText}>
              {currentChordIndex + 1} / {chordPool.length}
            </Text>
            {practiceMode === 'timed' && (
              <View style={styles.timerDisplay}>
                <MaterialIcons name="timer" size={16} color={remainingTime <= 5 ? colors.error : colors.primary} />
                <Text style={[
                  styles.timerText,
                  remainingTime <= 5 && styles.timerTextWarning,
                ]}>
                  {remainingTime}s
                </Text>
              </View>
            )}
          </View>
          <Pressable onPress={handlePauseResume} style={styles.pauseButton}>
            <MaterialIcons name={isPaused ? "play-arrow" : "pause"} size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${progress}%` }]} />
        </View>

        {/* Chord Display */}
        <ScrollView 
          style={styles.chordDisplay}
          contentContainerStyle={styles.chordDisplayContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Chord Name */}
          <View style={styles.chordNameSection}>
            {showChordName ? (
              <>
                <Text style={styles.chordSymbol}>{currentChord.name}</Text>
                <Text style={styles.chordFullName}>{currentChord.fullName}</Text>
              </>
            ) : (
              <View style={styles.hiddenName}>
                <MaterialIcons name="visibility-off" size={32} color={colors.textMuted} />
                <Text style={styles.hiddenNameText}>Chord name hidden</Text>
              </View>
            )}
          </View>

          {/* Fretboard */}
          <View style={styles.fretboardDisplay}>
            <Fretboard chord={currentChord} size="lg" />
          </View>

          {/* Chord Tags */}
          <View style={styles.chordTags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{currentChord.shape.toUpperCase()}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{currentChord.type.toUpperCase()}</Text>
            </View>
          </View>
        </ScrollView>

        {/* Controls */}
        <View style={styles.practiceControls}>
          <Pressable onPress={handlePlayChord} style={styles.playButton}>
            <MaterialIcons name="volume-up" size={32} color="#000" />
            <Text style={styles.playButtonText}>Play Audio</Text>
          </Pressable>

          <Pressable onPress={handleToggleChordName} style={styles.toggleButton}>
            <MaterialIcons 
              name={showChordName ? "visibility" : "visibility-off"} 
              size={24} 
              color={colors.text} 
            />
            <Text style={styles.toggleButtonText}>
              {showChordName ? 'Hide' : 'Show'} Name
            </Text>
          </Pressable>

          <View style={styles.navigationButtons}>
            <Pressable
              onPress={handlePreviousChord}
              style={[styles.navButton, currentChordIndex === 0 && styles.navButtonDisabled]}
              disabled={currentChordIndex === 0}
            >
              <MaterialIcons name="chevron-left" size={32} color={colors.text} />
            </Pressable>

            <Pressable onPress={() => handleNextChord(false)} style={styles.nextButton}>
              <Text style={styles.nextButtonText}>
                {currentChordIndex >= chordPool.length - 1 ? 'Finish' : 'Next'}
              </Text>
              <MaterialIcons name="chevron-right" size={24} color="#000" />
            </Pressable>

            <Pressable
              onPress={() => handleNextChord(false)}
              style={styles.navButton}
            >
              <MaterialIcons name="chevron-right" size={32} color={colors.text} />
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  // Results Screen
  const renderResultsScreen = () => {
    const totalTime = getTotalSessionTime();
    const avgTimePerChord = completedChords.length > 0 ? totalTime / completedChords.length : 0;

    return (
      <ScrollView style={styles.resultsContainer} contentContainerStyle={styles.resultsContent}>
        <View style={styles.resultsHeader}>
          <View style={styles.successIcon}>
            <MaterialIcons name="check-circle" size={64} color={colors.success} />
          </View>
          <Text style={styles.resultsTitle}>Practice Complete!</Text>
          <Text style={styles.resultsSubtitle}>Great job practicing {completedChords.length} chords</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <MaterialIcons name="timer" size={32} color={colors.primary} />
            <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="music-note" size={32} color={colors.accent} />
            <Text style={styles.statValue}>{completedChords.length}</Text>
            <Text style={styles.statLabel}>Chords Practiced</Text>
          </View>

          <View style={styles.statCard}>
            <MaterialIcons name="speed" size={32} color={colors.secondary} />
            <Text style={styles.statValue}>{Math.round(avgTimePerChord)}s</Text>
            <Text style={styles.statLabel}>Avg Per Chord</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.resultsActions}>
          <Pressable onPress={handleRestartPractice} style={styles.restartButton}>
            <MaterialIcons name="refresh" size={24} color={colors.primary} />
            <Text style={styles.restartButtonText}>Practice Again</Text>
          </Pressable>

          <Pressable onPress={() => router.push('/stats' as any)} style={styles.statsButton}>
            <MaterialIcons name="bar-chart" size={24} color={colors.text} />
            <Text style={styles.statsButtonText}>View All Stats</Text>
          </Pressable>

          <Pressable onPress={() => router.replace('/chord-library' as any)} style={styles.doneButton}>
            <Text style={styles.doneButtonText}>Done</Text>
          </Pressable>
        </View>
      </ScrollView>
    );
  };

  return (
    <Screen edges={['top']}>
      <View style={styles.container}>
        {phase === 'setup' && renderSetupScreen()}
        {phase === 'practice' && renderPracticeScreen()}
        {phase === 'results' && renderResultsScreen()}

        {/* Preset Selection Modal */}
        <Modal
          visible={showPresetModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowPresetModal(false)}
        >
          <Pressable style={styles.modalOverlay} onPress={() => setShowPresetModal(false)}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Select Preset</Text>
              
              <ScrollView style={styles.presetList}>
                {presets.map(preset => (
                  <Pressable
                    key={preset.id}
                    onPress={() => handlePresetSelect(preset.id)}
                    style={styles.presetItem}
                  >
                    <MaterialIcons name="bookmark" size={20} color={colors.primary} />
                    <View style={styles.presetInfo}>
                      <Text style={styles.presetName}>{preset.name}</Text>
                      <Text style={styles.presetCount}>{preset.chordIds.length} chords</Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
                  </Pressable>
                ))}
              </ScrollView>

              <Pressable onPress={() => setShowPresetModal(false)} style={styles.modalCancelButton}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Setup Screen
  setupContainer: {
    flex: 1,
  },
  setupContent: {
    padding: spacing.lg,
    paddingBottom: 100,
  },
  setupHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  setupTitle: {
    ...typography.h1,
    fontSize: 32,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  setupSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  optionGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  optionTitleActive: {
    color: colors.primary,
  },
  optionDescription: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: 'center',
  },
  timerSettings: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  timerLabel: {
    fontSize: 14,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  timerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  timerButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timerButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  timerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
  timerButtonTextActive: {
    color: colors.primary,
  },
  sourceButtons: {
    gap: spacing.sm,
  },
  sourceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sourceButtonActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  sourceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginTop: spacing.lg,
  },
  startButtonDisabled: {
    opacity: 0.5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },

  // Practice Screen
  practiceContainer: {
    flex: 1,
  },
  practiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressInfo: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  timerDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  timerTextWarning: {
    color: colors.error,
  },
  pauseButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.surface,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  chordDisplay: {
    flex: 1,
  },
  chordDisplayContent: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  chordNameSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    minHeight: 80,
    justifyContent: 'center',
  },
  chordSymbol: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  chordFullName: {
    fontSize: 18,
    color: colors.textSecondary,
  },
  hiddenName: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  hiddenNameText: {
    fontSize: 16,
    color: colors.textMuted,
  },
  fretboardDisplay: {
    marginVertical: spacing.xl,
  },
  chordTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  practiceControls: {
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  playButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  navButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  nextButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000',
  },

  // Results Screen
  resultsContainer: {
    flex: 1,
  },
  resultsContent: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultsHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    marginBottom: spacing.md,
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
  resultsActions: {
    width: '100%',
    gap: spacing.md,
  },
  restartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  restartButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  statsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statsButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  doneButton: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.md,
  },
  presetList: {
    maxHeight: 400,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border + '20',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  presetCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
  },
});
