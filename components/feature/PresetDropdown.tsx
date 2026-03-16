import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView, TextInput, Alert, FlatList } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { usePresets, ChordPreset } from '@/contexts/PresetContext';
import { useChordLibrary } from '@/contexts/ChordLibraryContext';

interface PresetDropdownProps {
  onClose?: () => void;
}

export function PresetDropdown({ onClose }: PresetDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  
  const { presets, addPreset, removePreset, renamePreset, reorderPreset } = usePresets();
  const { selectedChordIds, activeLibraryPresetId, setActiveLibraryPreset, setSelectedChordIds, clearSelectedChords } = useChordLibrary();

  const handleCreatePreset = async () => {
    if (!newPresetName.trim()) {
      Alert.alert('Error', 'Please enter a preset name');
      return;
    }

    if (selectedChordIds.length === 0) {
      Alert.alert('Error', 'Please select at least one chord');
      return;
    }

    await addPreset(newPresetName.trim(), selectedChordIds);
    setNewPresetName('');
    clearSelectedChords();
    Alert.alert('Success', `Preset "${newPresetName}" created!`);
  };

  const handleLoadPreset = (preset: ChordPreset) => {
    setActiveLibraryPreset(preset.id);
    setSelectedChordIds(preset.chordIds);
    setIsOpen(false);
    onClose?.();
  };

  const handleDeletePreset = (id: string, name: string) => {
    // Wrap in setTimeout to ensure event completes and alert shows properly
    setTimeout(() => {
      Alert.alert(
        'Delete Preset',
        `Are you sure you want to delete "${name}"?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: () => {
              console.log('Deleting preset:', id, name);
              removePreset(id);
              if (activeLibraryPresetId === id) {
                setActiveLibraryPreset(null);
                clearSelectedChords();
              }
            },
          },
        ],
        { cancelable: true }
      );
    }, 100);
  };

  const handleStartEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const handleSaveEdit = () => {
    if (editingId && editingName.trim()) {
      renamePreset(editingId, editingName.trim());
      setEditingId(null);
      setEditingName('');
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditingName('');
  };

  const handleMoveUp = (index: number) => {
    if (index > 0) {
      reorderPreset(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < presets.length - 1) {
      reorderPreset(index, index + 1);
    }
  };

  const renderPresetItem = ({ item, index }: { item: ChordPreset; index: number }) => {
    const isEditing = editingId === item.id;
    const isActive_preset = activeLibraryPresetId === item.id;

    return (
      <View
        style={[
          styles.presetItem,
          isActive_preset && styles.presetItemActive,
        ]}
      >
        {/* Reorder Buttons */}
        <View style={styles.reorderButtons}>
          <Pressable
            onPress={() => handleMoveUp(index)}
            disabled={index === 0}
            style={[styles.reorderButton, index === 0 && styles.reorderButtonDisabled]}
          >
            <MaterialIcons 
              name="keyboard-arrow-up" 
              size={18} 
              color={index === 0 ? colors.borderSubtle : colors.textMuted} 
            />
          </Pressable>
          <Pressable
            onPress={() => handleMoveDown(index)}
            disabled={index === presets.length - 1}
            style={[styles.reorderButton, index === presets.length - 1 && styles.reorderButtonDisabled]}
          >
            <MaterialIcons 
              name="keyboard-arrow-down" 
              size={18} 
              color={index === presets.length - 1 ? colors.borderSubtle : colors.textMuted} 
            />
          </Pressable>
        </View>

        {isEditing ? (
          <View style={styles.editContainer}>
            <TextInput
              style={styles.editInput}
              value={editingName}
              onChangeText={setEditingName}
              autoFocus
              onSubmitEditing={handleSaveEdit}
            />
            <Pressable onPress={handleSaveEdit} style={styles.editButton}>
              <MaterialIcons name="check" size={18} color={colors.success} />
            </Pressable>
            <Pressable onPress={handleCancelEdit} style={styles.editButton}>
              <MaterialIcons name="close" size={18} color={colors.error} />
            </Pressable>
          </View>
        ) : (
          <>
            <Pressable
              onPress={() => handleLoadPreset(item)}
              style={styles.presetContent}
            >
              <View style={styles.presetInfo}>
                <Text style={[styles.presetName, isActive_preset && styles.presetNameActive]}>
                  {item.name}
                </Text>
                <Text style={styles.presetCount}>
                  {item.chordIds.length} chord{item.chordIds.length !== 1 ? 's' : ''}
                </Text>
              </View>
              {isActive_preset && (
                <MaterialIcons name="check-circle" size={20} color={colors.primary} />
              )}
            </Pressable>

            <View style={styles.presetActions}>
              <Pressable
                onPress={() => {
                  handleStartEdit(item.id, item.name);
                }}
                onPressIn={(e) => {
                  if (e && e.stopPropagation) e.stopPropagation();
                }}
                style={styles.actionButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="edit" size={18} color={colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={() => {
                  handleDeletePreset(item.id, item.name);
                }}
                onPressIn={(e) => {
                  if (e && e.stopPropagation) e.stopPropagation();
                }}
                style={[styles.actionButton, { zIndex: 999 }]}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="delete" size={18} color={colors.error} />
              </Pressable>
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, activeLibraryPresetId && styles.triggerActive]}
        onPress={() => setIsOpen(true)}
      >
        <MaterialIcons
          name="collections-bookmark"
          size={18}
          color={activeLibraryPresetId ? colors.primary : colors.textMuted}
        />
        <Text style={[styles.triggerText, activeLibraryPresetId && styles.triggerTextActive]}>
          {activeLibraryPresetId 
            ? presets.find(p => p.id === activeLibraryPresetId)?.name || 'Preset'
            : 'Presets'
          }
        </Text>
        <MaterialIcons
          name={isOpen ? "expand-less" : "expand-more"}
          size={18}
          color={activeLibraryPresetId ? colors.primary : colors.textMuted}
        />
      </Pressable>

      <Modal
        visible={isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setIsOpen(false);
          onClose?.();
        }}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => {
            setIsOpen(false);
            onClose?.();
          }}
        >
          <Pressable style={styles.dropdown} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Chord Presets</Text>
              <Pressable
                onPress={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
                style={styles.closeButton}
              >
                <MaterialIcons name="close" size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            {/* Create New Preset */}
            {selectedChordIds.length > 0 && (
              <View style={styles.createSection}>
                <Text style={styles.sectionLabel}>Create from {selectedChordIds.length} selected</Text>
                <View style={styles.createRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Preset name..."
                    placeholderTextColor={colors.textMuted}
                    value={newPresetName}
                    onChangeText={setNewPresetName}
                    onSubmitEditing={handleCreatePreset}
                  />
                  <Pressable
                    style={styles.createButton}
                    onPress={handleCreatePreset}
                  >
                    <MaterialIcons name="add" size={20} color={colors.background} />
                  </Pressable>
                </View>
              </View>
            )}

            {/* Presets List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
              {presets.length === 0 ? (
                <View style={styles.emptyState}>
                  <MaterialIcons name="collections-bookmark" size={48} color={colors.textMuted} />
                  <Text style={styles.emptyText}>No presets yet</Text>
                  <Text style={styles.emptySubtext}>
                    Select chords and create your first preset
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={presets}
                  renderItem={renderPresetItem}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  triggerActive: {
    backgroundColor: colors.bgOverlay,
    borderColor: colors.primary,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textMuted,
    flex: 1,
  },
  triggerTextActive: {
    color: colors.primary,
  },
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  dropdown: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    backgroundColor: colors.bgElevated,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  closeButton: {
    padding: spacing.xs,
  },
  createSection: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bgOverlay,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  createRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 14,
  },
  createButton: {
    width: 40,
    height: 40,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContainer: {
    flex: 1,
    maxHeight: 400,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    backgroundColor: colors.bgElevated,
  },

  presetItemActive: {
    backgroundColor: colors.bgOverlay,
  },
  reorderButtons: {
    flexDirection: 'column',
    marginRight: spacing.sm,
  },
  reorderButton: {
    padding: 2,
  },
  reorderButtonDisabled: {
    opacity: 0.3,
  },
  presetContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSubtle,
    marginBottom: 2,
  },
  presetNameActive: {
    color: colors.primary,
  },
  presetCount: {
    fontSize: 12,
    color: colors.textMuted,
  },
  presetActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
  editContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  editInput: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.bgSurface,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: 14,
  },
  editButton: {
    padding: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl * 2,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  emptySubtext: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
