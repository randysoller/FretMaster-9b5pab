// Storage service with cloud sync integration
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cloudSyncService } from './cloudSyncService';

const KEYS = {
  PRACTICE_SESSIONS: 'practice_sessions',
  USER_STATS: 'user_stats',
  ACHIEVEMENTS: 'achievements',
  SAVED_PROGRESSIONS: 'saved_progressions',
  REMINDER_SETTINGS: 'reminder_settings',
};

export class StorageService {
  // Practice Sessions
  async savePracticeSession(session: any): Promise<void> {
    try {
      const sessions = await this.getPracticeSessions();
      sessions.push(session);
      await AsyncStorage.setItem(KEYS.PRACTICE_SESSIONS, JSON.stringify(sessions));
      
      // Sync to cloud
      await cloudSyncService.syncPracticeSession(session);
    } catch (error) {
      console.error('Failed to save practice session:', error);
    }
  }

  async getPracticeSessions(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.PRACTICE_SESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get practice sessions:', error);
      return [];
    }
  }

  // User Stats
  async updateStats(updates: any): Promise<void> {
    try {
      const stats = await this.getStats();
      const updatedStats = { ...stats, ...updates, updatedAt: new Date().toISOString() };
      await AsyncStorage.setItem(KEYS.USER_STATS, JSON.stringify(updatedStats));
      
      // Sync to cloud
      await cloudSyncService.syncStats(updatedStats);
    } catch (error) {
      console.error('Failed to update stats:', error);
    }
  }

  async getStats(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_STATS);
      return data ? JSON.parse(data) : {
        totalPracticeTime: 0,
        chordsMastered: [],
        scalesMastered: [],
        progressionsMastered: [],
        sessionsCompleted: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastPracticeDate: null,
        accuracyHistory: [],
      };
    } catch (error) {
      console.error('Failed to get stats:', error);
      return {};
    }
  }

  // Achievements
  async saveAchievement(achievement: any): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const enrichedAchievement = { ...achievement, unlocked: true, unlockedAt: new Date().toISOString() };
      achievements.push(enrichedAchievement);
      await AsyncStorage.setItem(KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
      
      // Sync to cloud
      await cloudSyncService.syncAchievement(enrichedAchievement);
    } catch (error) {
      console.error('Failed to save achievement:', error);
    }
  }

  async getAchievements(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.ACHIEVEMENTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get achievements:', error);
      return [];
    }
  }

  // Saved Progressions
  async saveProgression(progression: { name: string; chords: string[]; key: string; scale: string }): Promise<void> {
    try {
      const progressions = await this.getSavedProgressions();
      const newProgression = {
        ...progression,
        id: Date.now(),
        savedAt: new Date().toISOString(),
      };
      progressions.push(newProgression);
      await AsyncStorage.setItem(KEYS.SAVED_PROGRESSIONS, JSON.stringify(progressions));
      
      // Sync to cloud
      await cloudSyncService.syncProgression(newProgression);
    } catch (error) {
      console.error('Failed to save progression:', error);
    }
  }

  async getSavedProgressions(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.SAVED_PROGRESSIONS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Failed to get saved progressions:', error);
      return [];
    }
  }

  async deleteProgression(id: number): Promise<void> {
    try {
      const progressions = await this.getSavedProgressions();
      const filtered = progressions.filter(p => p.id !== id);
      await AsyncStorage.setItem(KEYS.SAVED_PROGRESSIONS, JSON.stringify(filtered));
      
      // Sync deletion to cloud
      await cloudSyncService.deleteProgression(id);
    } catch (error) {
      console.error('Failed to delete progression:', error);
    }
  }

  // Reminder Settings
  async saveReminderSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.REMINDER_SETTINGS, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save reminder settings:', error);
    }
  }

  async getReminderSettings(): Promise<any> {
    try {
      const data = await AsyncStorage.getItem(KEYS.REMINDER_SETTINGS);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to get reminder settings:', error);
      return null;
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove(Object.values(KEYS));
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  }
}

export const storageService = new StorageService();
