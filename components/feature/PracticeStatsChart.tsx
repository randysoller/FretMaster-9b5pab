import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, spacing, borderRadius } from '@/constants/theme';

interface PracticeStatsChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  type?: 'bar' | 'progress';
  maxValue?: number;
  unit?: string;
  showPercentage?: boolean;
}

const CHART_HEIGHT = 200;
const BAR_WIDTH = 40;

export function PracticeStatsChart({
  data,
  type = 'bar',
  maxValue,
  unit = '',
  showPercentage = false,
}: PracticeStatsChartProps) {
  const { width: screenWidth } = Dimensions.get('window');
  const chartWidth = Math.min(screenWidth - spacing.lg * 2, 400);

  // Calculate max value if not provided
  const calculatedMax = maxValue || Math.max(...data.map(d => d.value), 1);

  if (type === 'progress') {
    return (
      <View style={styles.progressContainer}>
        {data.map((item, index) => {
          const percentage = (item.value / calculatedMax) * 100;
          return (
            <View key={index} style={styles.progressItem}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressLabel}>{item.label}</Text>
                <Text style={styles.progressValue}>
                  {showPercentage ? `${Math.round(percentage)}%` : `${item.value}${unit}`}
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(percentage, 100)}%`,
                      backgroundColor: item.color || colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          );
        })}
      </View>
    );
  }

  // Bar chart
  return (
    <View style={[styles.barChartContainer, { width: chartWidth }]}>
      <View style={styles.barChart}>
        {data.map((item, index) => {
          const barHeight = (item.value / calculatedMax) * CHART_HEIGHT;
          return (
            <View key={index} style={styles.barColumn}>
              <View style={styles.barValueContainer}>
                <Text style={styles.barValue}>
                  {item.value}{unit}
                </Text>
              </View>
              <View style={styles.barWrapper}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(barHeight, 4),
                      backgroundColor: item.color || colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={2}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Progress chart styles
  progressContainer: {
    gap: spacing.md,
  },
  progressItem: {
    gap: spacing.xs,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
  },
  progressValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },

  // Bar chart styles
  barChartContainer: {
    alignSelf: 'center',
  },
  barChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: CHART_HEIGHT + 60,
    paddingBottom: 40,
  },
  barColumn: {
    alignItems: 'center',
    width: BAR_WIDTH + 10,
  },
  barValueContainer: {
    marginBottom: 4,
    minHeight: 20,
  },
  barValue: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
  },
  barWrapper: {
    height: CHART_HEIGHT,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: BAR_WIDTH,
    borderTopLeftRadius: borderRadius.sm,
    borderTopRightRadius: borderRadius.sm,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.xs,
    maxWidth: BAR_WIDTH + 10,
  },
});
