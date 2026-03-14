// Cloud sync service for syncing local data with Supabase
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabaseClient';

interface SyncStatus {
  lastSync: string | null;
  pendingSync: boolean;
  userId: string | null;
}

class CloudSyncService {
  private syncStatus: SyncStatus = {
    lastSync: null,
    pendingSync: false,
    userId: null,
  };

  // Initialize sync for a user
  async initializeSync(userId: string): Promise<void> {
    this.syncStatus.userId = userId;
    await this.syncAllData();
  }

  // Check if user is authenticated and online
  async canSyncToCloud(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    return user !== null;
  }

  // Get current user ID
  async getUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  // Migrate all local data to cloud
  async migrateLocalToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      const userId = await this.getUserId();
      if (!userId) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get all local data
      const practiceSessions = await this.getLocalData('practice_sessions') || [];
      const savedProgressions = await this.getLocalData('saved_progressions') || [];
      const achievements = await this.getLocalData('achievements') || [];
      const stats = await this.getLocalData('user_stats') || {};
      const preferences = await this.getLocalData('user_preferences') || {};

      // Migrate practice sessions
      if (practiceSessions.length > 0) {
        for (const session of practiceSessions) {
          await this.savePracticeSession(session, userId);
        }
      }

      // Migrate saved progressions
      if (savedProgressions.length > 0) {
        for (const progression of savedProgressions) {
          await this.saveProgression(progression, userId);
        }
      }

      // Migrate achievements
      if (achievements.length > 0) {
        for (const achievement of achievements) {
          await this.saveAchievement(achievement, userId);
        }
      }

      // Migrate stats
      if (Object.keys(stats).length > 0) {
        await this.saveStats(stats, userId);
      }

      // Migrate preferences
      if (Object.keys(preferences).length > 0) {
        await this.savePreferences(preferences, userId);
      }

      this.syncStatus.lastSync = new Date().toISOString();
      return { success: true };
    } catch (error: any) {
      console.error('Migration error:', error);
      return { success: false, error: error.message };
    }
  }

  // Sync all data (both directions)
  async syncAllData(): Promise<void> {
    const userId = await this.getUserId();
    if (!userId) return;

    try {
      // Pull cloud data
      await this.pullCloudData(userId);
      
      // Push any pending local data
      await this.migrateLocalToCloud();
      
      this.syncStatus.lastSync = new Date().toISOString();
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  // Pull data from cloud
  async pullCloudData(userId: string): Promise<void> {
    try {
      // Fetch user stats
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (stats) {
        await this.saveLocalData('user_stats', {
          totalPracticeTime: stats.total_practice_time,
          chordsMastered: stats.chords_mastered,
          scalesMastered: stats.scales_mastered,
          progressionsMastered: stats.progressions_mastered,
          sessionsCompleted: stats.sessions_completed,
          accuracyHistory: [],
        });
      }

      // Fetch achievements
      const { data: achievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      if (achievements) {
        await this.saveLocalData('achievements', achievements.map(a => ({
          id: a.achievement_id,
          unlockedAt: a.unlocked_at,
        })));
      }

      // Fetch saved progressions
      const { data: progressions } = await supabase
        .from('user_saved_progressions')
        .select('*')
        .eq('user_id', userId);

      if (progressions) {
        await this.saveLocalData('saved_progressions', progressions.map(p => ({
          id: p.id,
          name: p.name,
          chords: p.chords,
          key: p.key,
          scale: p.scale,
          savedAt: p.created_at,
        })));
      }

      // Fetch preferences
      const { data: prefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefs) {
        await this.saveLocalData('user_preferences', {
          metronomSound: prefs.metronome_sound,
          metronomeTempo: prefs.metronome_tempo,
          tunerCalibration: prefs.tuner_calibration,
          theme: prefs.theme,
          notificationsEnabled: prefs.notifications_enabled,
        });
      }
    } catch (error) {
      console.error('Pull cloud data error:', error);
    }
  }

  // Save practice session to cloud
  async savePracticeSession(session: any, userId?: string): Promise<boolean> {
    try {
      const user_id = userId || await this.getUserId();
      if (!user_id) return false;

      const { error } = await supabase
        .from('practice_sessions')
        .insert({
          user_id,
          mode: session.type,
          duration: session.duration,
          accuracy: session.accuracy,
          chords_practiced: session.details?.chords || [],
          metadata: session.details,
          created_at: session.startTime,
          is_completed: true,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Save practice session error:', error);
      return false;
    }
  }

  // Save achievement to cloud
  async saveAchievement(achievement: any, userId?: string): Promise<boolean> {
    try {
      const user_id = userId || await this.getUserId();
      if (!user_id) return false;

      const { error } = await supabase
        .from('user_achievements')
        .upsert({
          user_id,
          achievement_id: achievement.id,
          progress: 100,
          unlocked_at: achievement.unlockedAt || new Date().toISOString(),
        }, {
          onConflict: 'user_id,achievement_id',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Save achievement error:', error);
      return false;
    }
  }

  // Save progression to cloud
  async saveProgression(progression: any, userId?: string): Promise<boolean> {
    try {
      const user_id = userId || await this.getUserId();
      if (!user_id) return false;

      const { error } = await supabase
        .from('user_saved_progressions')
        .insert({
          user_id,
          name: progression.name,
          chords: progression.chords,
          key: progression.key,
          scale: progression.scale,
          is_favorite: progression.isFavorite || false,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Save progression error:', error);
      return false;
    }
  }

  // Delete progression from cloud
  async deleteProgression(progressionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_saved_progressions')
        .delete()
        .eq('id', progressionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Delete progression error:', error);
      return false;
    }
  }

  // Save stats to cloud
  async saveStats(stats: any, userId?: string): Promise<boolean> {
    try {
      const user_id = userId || await this.getUserId();
      if (!user_id) return false;

      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id,
          total_practice_time: stats.totalPracticeTime || 0,
          chords_mastered: stats.chordsMastered || [],
          scales_mastered: stats.scalesMastered || [],
          progressions_mastered: stats.progressionsMastered || [],
          sessions_completed: stats.sessionsCompleted || 0,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Save stats error:', error);
      return false;
    }
  }

  // Save preferences to cloud
  async savePreferences(prefs: any, userId?: string): Promise<boolean> {
    try {
      const user_id = userId || await this.getUserId();
      if (!user_id) return false;

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id,
          metronome_sound: prefs.metronomSound || 'Click',
          metronome_tempo: prefs.metronomeTempo || 120,
          tuner_calibration: prefs.tunerCalibration || 440,
          theme: prefs.theme || 'dark',
          notifications_enabled: prefs.notificationsEnabled !== false,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Save preferences error:', error);
      return false;
    }
  }

  // Get saved progressions from cloud
  async getCloudProgressions(): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_saved_progressions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(p => ({
        id: p.id,
        name: p.name,
        chords: p.chords,
        key: p.key,
        scale: p.scale,
        savedAt: p.created_at,
        isFavorite: p.is_favorite,
        practiceCount: p.practice_count,
      }));
    } catch (error) {
      console.error('Get cloud progressions error:', error);
      return [];
    }
  }

  // Get practice sessions from cloud
  async getCloudSessions(limit: number = 50): Promise<any[]> {
    try {
      const userId = await this.getUserId();
      if (!userId) return [];

      const { data, error } = await supabase
        .from('practice_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      
      return (data || []).map(s => ({
        id: s.id,
        type: s.mode,
        startTime: s.created_at,
        duration: s.duration,
        accuracy: s.accuracy,
        attempts: 0,
        correctAttempts: 0,
        details: s.metadata,
      }));
    } catch (error) {
      console.error('Get cloud sessions error:', error);
      return [];
    }
  }

  // Local storage helpers
  private async getLocalData(key: string): Promise<any> {
    try {
      const value = await AsyncStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Get local data error:', error);
      return null;
    }
  }

  private async saveLocalData(key: string, value: any): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Save local data error:', error);
    }
  }

  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }
}

export const cloudSyncService = new CloudSyncService();
