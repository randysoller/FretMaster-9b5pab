/**
 * Practice Statistics Service
 * 
 * Tracks and manages user practice statistics including:
 * - Most practiced chords
 * - Practice time per chord
 * - Preset completion rates
 * - Practice streaks and goals
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'fretmaster-practice-stats';

export interface ChordPracticeStats {
  chordId: string;
  chordName: string;
  practiceCount: number;
  totalTimeSeconds: number;
  lastPracticedAt: string; // ISO date string
  accuracyScores: number[]; // Last 10 accuracy scores
  averageAccuracy: number;
}

export interface PresetPracticeStats {
  presetId: string;
  presetName: string;
  totalSessions: number;
  completedSessions: number;
  totalTimeSeconds: number;
  lastPracticedAt: string;
  completionRate: number; // 0-100
}

export interface PracticeSession {
  id: string;
  chordId?: string;
  presetId?: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  chordsCompleted: number;
  accuracyScore?: number;
  notes?: string;
}

export interface PracticeStatsData {
  chordStats: { [chordId: string]: ChordPracticeStats };
  presetStats: { [presetId: string]: PresetPracticeStats };
  sessions: PracticeSession[];
  totalPracticeTimeSeconds: number;
  currentStreak: number;
  longestStreak: number;
  lastPracticeDate: string | null;
  practiceDaysCount: number;
}

const DEFAULT_STATS: PracticeStatsData = {
  chordStats: {},
  presetStats: {},
  sessions: [],
  totalPracticeTimeSeconds: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastPracticeDate: null,
  practiceDaysCount: 0,
};

/**
 * Load practice statistics from AsyncStorage
 */
export async function loadPracticeStats(): Promise<PracticeStatsData> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return DEFAULT_STATS;
    }

    const data = JSON.parse(stored);
    
    // Validate structure
    if (!data.chordStats || !data.presetStats || !Array.isArray(data.sessions)) {
      console.warn('⚠️ Invalid stats structure, using defaults');
      return DEFAULT_STATS;
    }

    console.log('✅ Loaded practice stats:', {
      chords: Object.keys(data.chordStats).length,
      presets: Object.keys(data.presetStats).length,
      sessions: data.sessions.length,
    });

    return data;
  } catch (error) {
    console.error('❌ Failed to load practice stats:', error);
    return DEFAULT_STATS;
  }
}

/**
 * Save practice statistics to AsyncStorage
 */
export async function savePracticeStats(stats: PracticeStatsData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    console.log('✅ Saved practice stats');
  } catch (error) {
    console.error('❌ Failed to save practice stats:', error);
    throw error;
  }
}

/**
 * Record a chord practice session
 */
export async function recordChordPractice(
  chordId: string,
  chordName: string,
  durationSeconds: number,
  accuracyScore?: number
): Promise<void> {
  const stats = await loadPracticeStats();
  
  const now = new Date().toISOString();
  
  // Update or create chord stats
  if (!stats.chordStats[chordId]) {
    stats.chordStats[chordId] = {
      chordId,
      chordName,
      practiceCount: 0,
      totalTimeSeconds: 0,
      lastPracticedAt: now,
      accuracyScores: [],
      averageAccuracy: 0,
    };
  }

  const chordStat = stats.chordStats[chordId];
  chordStat.practiceCount += 1;
  chordStat.totalTimeSeconds += durationSeconds;
  chordStat.lastPracticedAt = now;

  if (accuracyScore !== undefined) {
    chordStat.accuracyScores.push(accuracyScore);
    // Keep only last 10 scores
    if (chordStat.accuracyScores.length > 10) {
      chordStat.accuracyScores = chordStat.accuracyScores.slice(-10);
    }
    // Calculate average
    chordStat.averageAccuracy =
      chordStat.accuracyScores.reduce((sum, score) => sum + score, 0) /
      chordStat.accuracyScores.length;
  }

  // Add session
  const session: PracticeSession = {
    id: `session-${Date.now()}`,
    chordId,
    startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
    endTime: now,
    durationSeconds,
    chordsCompleted: 1,
    accuracyScore,
  };
  stats.sessions.push(session);

  // Keep only last 100 sessions
  if (stats.sessions.length > 100) {
    stats.sessions = stats.sessions.slice(-100);
  }

  // Update totals
  stats.totalPracticeTimeSeconds += durationSeconds;
  updateStreaks(stats, now);

  await savePracticeStats(stats);
}

/**
 * Record a preset practice session
 */
export async function recordPresetPractice(
  presetId: string,
  presetName: string,
  durationSeconds: number,
  chordsCompleted: number,
  totalChords: number,
  isCompleted: boolean
): Promise<void> {
  const stats = await loadPracticeStats();
  
  const now = new Date().toISOString();

  // Update or create preset stats
  if (!stats.presetStats[presetId]) {
    stats.presetStats[presetId] = {
      presetId,
      presetName,
      totalSessions: 0,
      completedSessions: 0,
      totalTimeSeconds: 0,
      lastPracticedAt: now,
      completionRate: 0,
    };
  }

  const presetStat = stats.presetStats[presetId];
  presetStat.totalSessions += 1;
  if (isCompleted) {
    presetStat.completedSessions += 1;
  }
  presetStat.totalTimeSeconds += durationSeconds;
  presetStat.lastPracticedAt = now;
  presetStat.completionRate =
    (presetStat.completedSessions / presetStat.totalSessions) * 100;

  // Add session
  const session: PracticeSession = {
    id: `session-${Date.now()}`,
    presetId,
    startTime: new Date(Date.now() - durationSeconds * 1000).toISOString(),
    endTime: now,
    durationSeconds,
    chordsCompleted,
  };
  stats.sessions.push(session);

  // Keep only last 100 sessions
  if (stats.sessions.length > 100) {
    stats.sessions = stats.sessions.slice(-100);
  }

  // Update totals
  stats.totalPracticeTimeSeconds += durationSeconds;
  updateStreaks(stats, now);

  await savePracticeStats(stats);
}

/**
 * Get top practiced chords (sorted by practice count)
 */
export async function getTopPracticedChords(limit: number = 10): Promise<ChordPracticeStats[]> {
  const stats = await loadPracticeStats();
  return Object.values(stats.chordStats)
    .sort((a, b) => b.practiceCount - a.practiceCount)
    .slice(0, limit);
}

/**
 * Get most time-consuming chords (sorted by total time)
 */
export async function getMostTimeSpentChords(limit: number = 10): Promise<ChordPracticeStats[]> {
  const stats = await loadPracticeStats();
  return Object.values(stats.chordStats)
    .sort((a, b) => b.totalTimeSeconds - a.totalTimeSeconds)
    .slice(0, limit);
}

/**
 * Get recent practice sessions
 */
export async function getRecentSessions(limit: number = 10): Promise<PracticeSession[]> {
  const stats = await loadPracticeStats();
  return stats.sessions
    .sort((a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime())
    .slice(0, limit);
}

/**
 * Get practice stats for a specific chord
 */
export async function getChordStats(chordId: string): Promise<ChordPracticeStats | null> {
  const stats = await loadPracticeStats();
  return stats.chordStats[chordId] || null;
}

/**
 * Get practice stats for a specific preset
 */
export async function getPresetStats(presetId: string): Promise<PresetPracticeStats | null> {
  const stats = await loadPracticeStats();
  return stats.presetStats[presetId] || null;
}

/**
 * Get overall practice summary
 */
export async function getPracticeSummary() {
  const stats = await loadPracticeStats();
  
  const totalChordsPracticed = Object.keys(stats.chordStats).length;
  const totalPresetsPracticed = Object.keys(stats.presetStats).length;
  const totalSessions = stats.sessions.length;
  
  // Calculate average session duration
  const avgSessionDuration = totalSessions > 0
    ? stats.totalPracticeTimeSeconds / totalSessions
    : 0;

  // Recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentSessions = stats.sessions.filter(
    s => new Date(s.endTime) > sevenDaysAgo
  );

  return {
    totalPracticeTimeSeconds: stats.totalPracticeTimeSeconds,
    totalPracticeTimeFormatted: formatDuration(stats.totalPracticeTimeSeconds),
    totalChordsPracticed,
    totalPresetsPracticed,
    totalSessions,
    avgSessionDuration,
    avgSessionDurationFormatted: formatDuration(avgSessionDuration),
    currentStreak: stats.currentStreak,
    longestStreak: stats.longestStreak,
    practiceDaysCount: stats.practiceDaysCount,
    recentSessionsCount: recentSessions.length,
    lastPracticeDate: stats.lastPracticeDate,
  };
}

/**
 * Update practice streaks
 */
function updateStreaks(stats: PracticeStatsData, currentDate: string): void {
  const today = new Date(currentDate).toISOString().split('T')[0];
  const lastDate = stats.lastPracticeDate
    ? new Date(stats.lastPracticeDate).toISOString().split('T')[0]
    : null;

  if (!lastDate) {
    // First practice ever
    stats.currentStreak = 1;
    stats.longestStreak = 1;
    stats.practiceDaysCount = 1;
  } else if (lastDate === today) {
    // Already practiced today, no streak update
    return;
  } else {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastDate === yesterdayStr) {
      // Consecutive day
      stats.currentStreak += 1;
      if (stats.currentStreak > stats.longestStreak) {
        stats.longestStreak = stats.currentStreak;
      }
    } else {
      // Streak broken
      stats.currentStreak = 1;
    }
    stats.practiceDaysCount += 1;
  }

  stats.lastPracticeDate = currentDate;
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

/**
 * Clear all practice statistics (with confirmation)
 */
export async function clearAllStats(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  console.log('✅ Cleared all practice stats');
}
