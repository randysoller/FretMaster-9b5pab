import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Platform, Modal, TextInput } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DraggableFlatList, { RenderItemParams, ScaleDecorator } from 'react-native-draggable-flatlist';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Screen } from '@/components';
import { colors, spacing, typography, borderRadius } from '@/constants/theme';
import { storageService } from '@/services/storageService';

const COMMON_PROGRESSIONS = [
  { numeral: 'I - IV - V - I', chords: 'C - F - G - C' },
  { numeral: 'I - V - vi - IV', chords: 'C - G - Am - F' },
  { numeral: 'I - IV - vi - V', chords: 'C - F - Am - G' },
  { numeral: 'ii - V - I', chords: 'Dm - G - C' },
  { numeral: 'I - vi - IV - V', chords: 'C - Am - F - G' },
  { numeral: 'vi - IV - I - V', chords: 'Am - F - C - G' },
];

const CHORDS_IN_KEY = ['C', 'Dm', 'Em', 'F', 'G', 'Am', 'Bdim'];

interface SavedProgression {
  id: number;
  name: string;
  chords: string[];
  key: string;
  scale: string;
  savedAt: string;
}

export default function ProgressionsScreen() {
  const router = useRouter();
  const [selectedKey, setSelectedKey] = useState('C Major');
  const [selectedScale, setSelectedScale] = useState('Major Scale');
  const [selectedProgression, setSelectedProgression] = useState<string>('C - F - G - C');
  const [customChords, setCustomChords] = useState<string[]>([]);
  const [savedProgressions, setSavedProgressions] = useState<SavedProgression[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [progressionName, setProgressionName] = useState('');
  const [activeTab, setActiveTab] = useState<'common' | 'style' | 'custom' | 'saved'>('common');

  useEffect(() => {
    loadSavedProgressions();
  }, []);

  const loadSavedProgressions = async () => {
    const progressions = await storageService.getSavedProgressions();
    setSavedProgressions(progressions);
  };

  const handleSaveProgression = async () => {
    if (!progressionName.trim()) {
      if (Platform.OS === 'web') {
        alert('Please enter a name for the progression');
      } else {
        Alert.alert('Name Required', 'Please enter a name for the progression');
      }
      return;
    }

    const chords = customChords.length > 0 ? customChords : selectedProgression.split(' - ');
    await storageService.saveProgression({
      name: progressionName,
      chords,
      key: selectedKey,
      scale: selectedScale,
    });

    setProgressionName('');
    setShowSaveModal(false);
    loadSavedProgressions();

    if (Platform.OS === 'web') {
      alert('Progression saved successfully!');
    } else {
      Alert.alert('Success', 'Progression saved successfully!');
    }
  };

  const handleDeleteProgression = async (id: number) => {
    await storageService.deleteProgression(id);
    loadSavedProgressions();
  };

  const handleLoadProgression = (prog: SavedProgression) => {
    setCustomChords(prog.chords);
    setSelectedKey(prog.key);
    setSelectedScale(prog.scale);
    setSelectedProgression(prog.chords.join(' - '));
  };

  const handleStartPractice = () => {
    const progression = customChords.length > 0 ? customChords.join(' - ') : selectedProgression;
    router.push({
      pathname: '/progressions-practice',
      params: { progression },
    });
  };

  const renderDraggableChord = ({ item, drag, isActive }: RenderItemParams<string>) => {
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[styles.draggableChord, isActive && styles.draggableChordActive]}
        >
          <MaterialIcons name="drag-indicator" size={20} color={colors.textMuted} />
          <Text style={styles.draggableChordText}>{item}</Text>
          <Pressable
            onPress={() => setCustomChords(customChords.filter(c => c !== item))}
            style={styles.removeChordButton}
          >
            <MaterialIcons name="close" size={18} color={colors.error} />
          </Pressable>
        </Pressable>
      </ScaleDecorator>
    );
  };

  return (
    <>
      <Stack.Screen 
        options={{
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitle: '',
        }} 
      />
      <Screen edges={['bottom']}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name="graphic-eq" size={24} color={colors.secondary} />
            <Text style={styles.badge}>Chord Progressions</Text>
          </View>

          <Text style={styles.title}>
            Practice <Text style={styles.titleAccent}>Progressions</Text>
          </Text>

          <Text style={styles.description}>
            Choose a key, scale, and chord progression. Practice smooth transitions between chords.
          </Text>

          {/* Select Key */}
          <View style={styles.selector}>
            <View style={styles.selectorHeader}>
              <MaterialIcons name="music-note" size={16} color={colors.primary} />
              <Text style={styles.selectorLabel}>SELECT KEY</Text>
            </View>
            <Pressable style={styles.selectorButton}>
              <Text style={styles.selectorValue}>{selectedKey}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Select Scale */}
          <View style={styles.selector}>
            <View style={styles.selectorHeader}>
              <MaterialIcons name="show-chart" size={16} color={colors.info} />
              <Text style={styles.selectorLabel}>SELECT SCALE</Text>
            </View>
            <Pressable style={styles.selectorButton}>
              <Text style={styles.selectorValue}>{selectedScale}</Text>
              <MaterialIcons name="arrow-drop-down" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Chords in Key */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>CHORDS IN C MAJOR</Text>
            <View style={styles.chordGrid}>
              {CHORDS_IN_KEY.map((chord) => (
                <Pressable
                  key={chord}
                  style={styles.chordButton}
                  onPress={() => {
                    if (customChords.includes(chord)) {
                      setCustomChords(customChords.filter(c => c !== chord));
                    } else {
                      setCustomChords([...customChords, chord]);
                    }
                  }}
                >
                  <Text style={styles.chordButtonText}>{chord}</Text>
                  {customChords.includes(chord) && (
                    <View style={styles.chordButtonDot} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>

          {/* Choose Progression Tabs */}
          <View style={styles.tabs}>
            <Pressable 
              style={[styles.tab, activeTab === 'common' && styles.tabActive]}
              onPress={() => setActiveTab('common')}
            >
              <Text style={[styles.tabText, activeTab === 'common' && styles.tabTextActive]}>Common</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'style' && styles.tabActive]}
              onPress={() => setActiveTab('style')}
            >
              <Text style={[styles.tabText, activeTab === 'style' && styles.tabTextActive]}>By Style</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'custom' && styles.tabActive]}
              onPress={() => setActiveTab('custom')}
            >
              <Text style={[styles.tabText, activeTab === 'custom' && styles.tabTextActive]}>Custom</Text>
            </Pressable>
            <Pressable 
              style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
              onPress={() => setActiveTab('saved')}
            >
              <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>Saved</Text>
            </Pressable>
          </View>

          {/* Common Progressions */}
          {activeTab === 'common' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>CHOOSE PROGRESSION</Text>
              {COMMON_PROGRESSIONS.map((prog, index) => (
                <Pressable 
                  key={index} 
                  style={[
                    styles.progressionCard,
                    selectedProgression === prog.chords && customChords.length === 0 && styles.progressionCardActive,
                  ]}
                  onPress={() => {
                    setSelectedProgression(prog.chords);
                    setCustomChords([]);
                  }}
                >
                  <Text style={styles.progressionNumeral}>{prog.numeral}</Text>
                  <Text style={styles.progressionChords}>{prog.chords}</Text>
                  {selectedProgression === prog.chords && customChords.length === 0 && (
                    <MaterialIcons name="check-circle" size={20} color={colors.success} style={styles.selectedIcon} />
                  )}
                </Pressable>
              ))}
            </View>
          )}

          {/* Custom Builder */}
          {activeTab === 'custom' && (
            <GestureHandlerRootView style={styles.section}>
              <Text style={styles.sectionTitle}>BUILD YOUR PROGRESSION</Text>
              <Text style={styles.sectionHint}>Tap chords above to add, then drag to reorder</Text>
              
              {customChords.length > 0 ? (
                <View style={styles.draggableContainer}>
                  <DraggableFlatList
                    data={customChords}
                    onDragEnd={({ data }) => setCustomChords(data)}
                    keyExtractor={(item, index) => `${item}-${index}`}
                    renderItem={renderDraggableChord}
                    scrollEnabled={false}
                  />
                </View>
              ) : (
                <View style={styles.emptyBuilder}>
                  <MaterialIcons name="music-note" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyBuilderText}>Tap chords above to start building</Text>
                </View>
              )}
              
              {customChords.length > 0 && (
                <Pressable 
                  style={styles.clearButton}
                  onPress={() => setCustomChords([])}
                >
                  <MaterialIcons name="clear" size={18} color={colors.error} />
                  <Text style={styles.clearButtonText}>Clear All</Text>
                </Pressable>
              )}
            </GestureHandlerRootView>
          )}

          {/* Saved Progressions */}
          {activeTab === 'saved' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>MY SAVED PROGRESSIONS</Text>
              {savedProgressions.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="bookmark-border" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No saved progressions yet</Text>
                  <Text style={styles.emptySubtext}>Build a progression and save it for later</Text>
                </View>
              ) : (
                savedProgressions.map((prog) => (
                  <Pressable
                    key={prog.id}
                    style={styles.savedProgressionCard}
                    onPress={() => handleLoadProgression(prog)}
                  >
                    <View style={styles.savedProgressionHeader}>
                      <MaterialIcons name="bookmark" size={20} color={colors.primary} />
                      <Text style={styles.savedProgressionName}>{prog.name}</Text>
                      <Pressable
                        onPress={() => handleDeleteProgression(prog.id)}
                        style={styles.deleteButton}
                      >
                        <MaterialIcons name="delete" size={18} color={colors.error} />
                      </Pressable>
                    </View>
                    <Text style={styles.savedProgressionChords}>{prog.chords.join(' - ')}</Text>
                    <Text style={styles.savedProgressionMeta}>{prog.key} • {prog.scale}</Text>
                  </Pressable>
                ))
              )}
            </View>
          )}



          {/* Save Button */}
          {(customChords.length > 0 || activeTab !== 'saved') && (
            <View style={styles.saveSection}>
              <Pressable 
                style={styles.saveCurrentButton}
                onPress={() => setShowSaveModal(true)}
              >
                <MaterialIcons name="bookmark-border" size={20} color={colors.primary} />
                <Text style={styles.saveCurrentText}>Save Current Progression</Text>
              </Pressable>
            </View>
          )}

          {/* Save Modal */}
          <Modal
            visible={showSaveModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowSaveModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Save Progression</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="Enter progression name..."
                  placeholderTextColor={colors.textMuted}
                  value={progressionName}
                  onChangeText={setProgressionName}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <Pressable
                    style={styles.modalCancelButton}
                    onPress={() => {
                      setShowSaveModal(false);
                      setProgressionName('');
                    }}
                  >
                    <Text style={styles.modalCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    style={styles.modalSaveButton}
                    onPress={handleSaveProgression}
                  >
                    <Text style={styles.modalSaveText}>Save</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          </Modal>

          {/* Ready to Practice */}
          <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <MaterialIcons name="play-arrow" size={20} color={colors.primary} />
              <Text style={styles.summaryTitle}>READY TO PRACTICE</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Key</Text>
              <Text style={styles.summaryValue}>C</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Scale</Text>
              <Text style={styles.summaryValue}>Major Scale</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Progression</Text>
              <Text style={styles.summaryValue} numberOfLines={2}>
                {customChords.length > 0 ? customChords.join(' - ') : selectedProgression}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Chords</Text>
              <Text style={styles.summaryValue}>
                {customChords.length > 0 ? customChords.length : selectedProgression.split(' - ').length}
              </Text>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={handleStartPractice}>
            <MaterialIcons name="play-arrow" size={24} color="#000" />
            <Text style={styles.startButtonText}>START PROGRESSION</Text>
          </Pressable>
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
    paddingTop: spacing.md,
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
    marginBottom: spacing.md,
  },
  titleAccent: {
    color: colors.secondary,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  selector: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  selectorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  selectorLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  selectorValue: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  chordGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chordButton: {
    position: 'relative',
    minWidth: 70,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chordButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  chordButtonDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.info,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: {
    backgroundColor: colors.primary,
  },
  tabText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#000',
  },
  progressionCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  progressionNumeral: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  progressionChords: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  progressionCardActive: {
    borderColor: colors.success,
    backgroundColor: 'rgba(0, 200, 83, 0.1)',
  },
  selectedIcon: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
  },
  buildSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  buildLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: spacing.md,
  },
  customChords: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  customChordChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
  },
  customChordText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  customProgression: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionHint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  draggableContainer: {
    minHeight: 200,
    marginBottom: spacing.md,
  },
  draggableChord: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  draggableChordActive: {
    backgroundColor: colors.card,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  draggableChordText: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  removeChordButton: {
    padding: spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  clearButtonText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyBuilder: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyBuilderText: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl * 2,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
    marginTop: spacing.md,
  },
  emptySubtext: {
    color: colors.textSecondary,
    fontSize: 13,
    marginTop: spacing.xs,
  },
  savedProgressionCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savedProgressionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  savedProgressionName: {
    flex: 1,
    color: colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  deleteButton: {
    padding: spacing.xs,
  },
  savedProgressionChords: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  savedProgressionMeta: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  saveSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  saveCurrentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  saveCurrentText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.lg,
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalCancelButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  modalSaveButton: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  myProgressions: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  myProgressionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  myProgressionsTitle: {
    flex: 1,
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
  },
  saveButtonText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  summaryTitle: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  summaryLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  summaryValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
  },
  startButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
