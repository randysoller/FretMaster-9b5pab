/**
 * Strumming Controls Component
 * 
 * Professional UI for controlling guitar strumming parameters.
 * Provides tactile controls for direction, speed, and intensity.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface StrumControlsProps {
  onDirectionChange: (direction: 'down' | 'up') => void;
  onSpeedChange: (speed: 'slow' | 'medium' | 'fast') => void;
  onIntensityChange: (intensity: 'light' | 'normal' | 'heavy') => void;
  direction?: 'down' | 'up';
  speed?: 'slow' | 'medium' | 'fast';
  intensity?: 'light' | 'normal' | 'heavy';
}

export function StrumControls({
  onDirectionChange,
  onSpeedChange,
  onIntensityChange,
  direction = 'down',
  speed = 'medium',
  intensity = 'normal',
}: StrumControlsProps) {
  return (
    <View style={styles.container}>
      {/* Direction Control */}
      <View style={styles.controlGroup}>
        <Text style={styles.label}>Strum Direction</Text>
        <View style={styles.buttonRow}>
          <Pressable
            style={[
              styles.directionButton,
              direction === 'down' && styles.activeButton,
            ]}
            onPress={() => onDirectionChange('down')}
          >
            <MaterialIcons
              name="arrow-downward"
              size={24}
              color={direction === 'down' ? colors.background : colors.textSecondary}
            />
            <Text
              style={[
                styles.buttonText,
                direction === 'down' && styles.activeButtonText,
              ]}
            >
              Down
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.directionButton,
              direction === 'up' && styles.activeButton,
            ]}
            onPress={() => onDirectionChange('up')}
          >
            <MaterialIcons
              name="arrow-upward"
              size={24}
              color={direction === 'up' ? colors.background : colors.textSecondary}
            />
            <Text
              style={[
                styles.buttonText,
                direction === 'up' && styles.activeButtonText,
              ]}
            >
              Up
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Speed Control */}
      <View style={styles.controlGroup}>
        <Text style={styles.label}>Strum Speed</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentLeft,
              speed === 'slow' && styles.activeSegment,
            ]}
            onPress={() => onSpeedChange('slow')}
          >
            <Text
              style={[
                styles.segmentText,
                speed === 'slow' && styles.activeSegmentText,
              ]}
            >
              Slow
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentMiddle,
              speed === 'medium' && styles.activeSegment,
            ]}
            onPress={() => onSpeedChange('medium')}
          >
            <Text
              style={[
                styles.segmentText,
                speed === 'medium' && styles.activeSegmentText,
              ]}
            >
              Medium
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentRight,
              speed === 'fast' && styles.activeSegment,
            ]}
            onPress={() => onSpeedChange('fast')}
          >
            <Text
              style={[
                styles.segmentText,
                speed === 'fast' && styles.activeSegmentText,
              ]}
            >
              Fast
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Intensity Control */}
      <View style={styles.controlGroup}>
        <Text style={styles.label}>Pick Intensity</Text>
        <View style={styles.segmentedControl}>
          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentLeft,
              intensity === 'light' && styles.activeSegment,
            ]}
            onPress={() => onIntensityChange('light')}
          >
            <Text
              style={[
                styles.segmentText,
                intensity === 'light' && styles.activeSegmentText,
              ]}
            >
              Light
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentMiddle,
              intensity === 'normal' && styles.activeSegment,
            ]}
            onPress={() => onIntensityChange('normal')}
          >
            <Text
              style={[
                styles.segmentText,
                intensity === 'normal' && styles.activeSegmentText,
              ]}
            >
              Normal
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentButton,
              styles.segmentRight,
              intensity === 'heavy' && styles.activeSegment,
            ]}
            onPress={() => onIntensityChange('heavy')}
          >
            <Text
              style={[
                styles.segmentText,
                intensity === 'heavy' && styles.activeSegmentText,
              ]}
            >
              Heavy
            </Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  controlGroup: {
    gap: spacing.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  directionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeButtonText: {
    color: colors.background,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentButton: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLeft: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  segmentMiddle: {
    borderRightWidth: 1,
    borderRightColor: colors.border,
  },
  segmentRight: {
    // No border
  },
  activeSegment: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeSegmentText: {
    color: colors.background,
  },
});
