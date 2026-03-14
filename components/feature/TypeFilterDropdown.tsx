import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';
import { ChordType, ALL_CHORD_TYPES, CHORD_DATA } from '@/constants/musicData';
import { useChordLibrary } from '@/contexts/ChordLibraryContext';

const TYPE_GROUPS = {
  'Basic': ['major', 'minor', 'diminished', 'augmented'] as ChordType[],
  'Seventh': ['dominant7', 'major7', 'minor7', 'diminished7', 'augmented7', 'minorMajor7'] as ChordType[],
  'Extended': ['dominant9', 'major9', 'minor9', 'dominant11', 'dominant13'] as ChordType[],
  'Suspended': ['sus2', 'sus4', '7sus4'] as ChordType[],
  'Added': ['add9', '6', 'minor6', 'major6add9'] as ChordType[],
};

interface TypeFilterDropdownProps {
  onClose?: () => void;
}

export function TypeFilterDropdown({ onClose }: TypeFilterDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { filterTypes, filterCategories, toggleType, setFilterTypes, clearTypes } = useChordLibrary();

  // Calculate counts for each type based on current category filter
  const typeCounts = useMemo(() => {
    const counts: Record<ChordType, number> = {} as any;
    
    ALL_CHORD_TYPES.forEach(type => {
      counts[type] = CHORD_DATA.filter(chord => {
        const matchesType = chord.type === type;
        const matchesCategory = filterCategories.length === 0 || filterCategories.includes(chord.shape);
        return matchesType && matchesCategory;
      }).length;
    });
    
    return counts;
  }, [filterCategories]);

  const handleToggle = (type: ChordType) => {
    toggleType(type);
  };

  const handleSelectAll = () => {
    const allTypes = Object.values(TYPE_GROUPS).flat();
    setFilterTypes(allTypes);
  };

  const handleClear = () => {
    clearTypes();
  };

  const selectedCount = filterTypes.length;
  const totalTypes = ALL_CHORD_TYPES.length;

  return (
    <>
      <Pressable
        style={[styles.trigger, selectedCount > 0 && styles.triggerActive]}
        onPress={() => setIsOpen(true)}
      >
        <MaterialIcons 
          name="filter-list" 
          size={18} 
          color={selectedCount > 0 ? colors.primary : colors.textMuted} 
        />
        <Text style={[styles.triggerText, selectedCount > 0 && styles.triggerTextActive]}>
          Type {selectedCount > 0 && `(${selectedCount})`}
        </Text>
        <MaterialIcons 
          name={isOpen ? "expand-less" : "expand-more"} 
          size={18} 
          color={selectedCount > 0 ? colors.primary : colors.textMuted} 
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
              <Text style={styles.headerTitle}>Chord Types</Text>
              <View style={styles.headerActions}>
                <Pressable onPress={handleSelectAll} style={styles.headerButton}>
                  <Text style={styles.headerButtonText}>All</Text>
                </Pressable>
                <Pressable onPress={handleClear} style={styles.headerButton}>
                  <Text style={styles.headerButtonText}>Clear</Text>
                </Pressable>
              </View>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              style={styles.scrollView}
            >
              {Object.entries(TYPE_GROUPS).map(([groupName, types]) => (
                <View key={groupName} style={styles.group}>
                  <Text style={styles.groupLabel}>{groupName}</Text>
                  
                  {types.map(type => {
                    const count = typeCounts[type] || 0;
                    const isSelected = filterTypes.includes(type);
                    const isDisabled = count === 0;

                    return (
                      <Pressable
                        key={type}
                        style={[
                          styles.option,
                          isSelected && styles.optionSelected,
                          isDisabled && styles.optionDisabled
                        ]}
                        onPress={() => !isDisabled && handleToggle(type)}
                        disabled={isDisabled}
                      >
                        <View style={styles.optionLeft}>
                          <View style={[
                            styles.checkbox,
                            isSelected && styles.checkboxSelected,
                            isDisabled && styles.checkboxDisabled
                          ]}>
                            {isSelected && (
                              <MaterialIcons name="check" size={14} color={colors.background} />
                            )}
                          </View>
                          <Text style={[
                            styles.optionText,
                            isSelected && styles.optionTextSelected,
                            isDisabled && styles.optionTextDisabled
                          ]}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </Text>
                        </View>
                        <Text style={[
                          styles.optionCount,
                          isDisabled && styles.optionCountDisabled
                        ]}>
                          {count}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>
                {selectedCount === 0 ? 'All types' : `${selectedCount} of ${totalTypes} selected`}
              </Text>
              <Pressable
                style={styles.doneButton}
                onPress={() => {
                  setIsOpen(false);
                  onClose?.();
                }}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
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
    maxWidth: 360,
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
  headerActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  headerButton: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  headerButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.primary,
  },
  scrollView: {
    maxHeight: 400,
  },
  group: {
    paddingVertical: spacing.sm,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: 'transparent',
  },
  optionSelected: {
    backgroundColor: colors.bgOverlay,
  },
  optionDisabled: {
    opacity: 0.4,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  checkboxDisabled: {
    borderColor: colors.borderSubtle,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSubtle,
  },
  optionTextSelected: {
    color: colors.text,
  },
  optionTextDisabled: {
    color: colors.textMuted,
  },
  optionCount: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
  },
  optionCountDisabled: {
    color: colors.textMuted,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  doneButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.background,
  },
});
