// Practice session tracking and analytics service
import { storageService } from './storageService';

export interface PracticeSession {
  id: string;
  type: 'chords' | 'progressions' | 'scales' | 'ear-training';
  startTime: string;
  endTime?: string;
  duration: number; // seconds
  attempts: number;
  correctAttempts: number;
  accuracy: number; // percentage
  details: any; // type-specific data
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

const ACHIEVEMENTS: Achievement[] = [
  { id: 'first_session', title: 'First Steps', description: 'Complete your first practice session', icon: 'star', unlocked: false },
  { id: 'chord_master_10', title: 'Chord Explorer', description: 'Master 10 different chords', icon: 'music-note', unlocked: false },
  { id: 'chord_master_25', title: 'Chord Virtuoso', description: 'Master 25 different chords', icon: 'stars', unlocked: false },
  { id: 'perfect_session', title: 'Perfection', description: 'Complete a session with 100% accuracy', icon: 'check-circle', unlocked: false },
  { id: 'practice_streak_7', title: 'Weekly Warrior', description: 'Practice 7 days in a row', icon: 'local-fire-department', unlocked: false },
  { id: 'practice_time_60', title: 'Hour of Power', description: 'Accumulate 60 minutes of practice time', icon: 'timer', unlocked: false },
  { id: 'progression_master', title: 'Progression Pro', description: 'Master 5 chord progressions', icon: 'trending-up', unlocked: false },
  { id: 'scale_master', title: 'Scale Sage', description: 'Master all major and minor scales', icon: 'show-chart', unlocked: false },
];

class PracticeTrackingService {
  private currentSession: PracticeSession | null = null;

  startSession(type: PracticeSession['type'], details?: any): string {
    const sessionId = `session_${Date.now()}`;
    this.currentSession = {
      id: sessionId,
      type,
      startTime: new Date().toISOString(),
      duration: 0,
      attempts: 0,
      correctAttempts: 0,
      accuracy: 0,
      details: details || {},
    };
    return sessionId;
  }

  recordAttempt(correct: boolean): void {
    if (!this.currentSession) return;
    
    this.currentSession.attempts++;
    if (correct) {
      this.currentSession.correctAttempts++;
    }
    this.currentSession.accuracy = (this.currentSession.correctAttempts / this.currentSession.attempts) * 100;
  }

  updateSessionDetails(details: any): void {
    if (!this.currentSession) return;
    this.currentSession.details = { ...this.currentSession.details, ...details };
  }

  async endSession(): Promise<PracticeSession | null> {
    if (!this.currentSession) return null;

    const endTime = new Date();
    const startTime = new Date(this.currentSession.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    this.currentSession.endTime = endTime.toISOString();
    this.currentSession.duration = duration;

    // Save session
    await storageService.savePracticeSession(this.currentSession);

    // Update stats
    const stats = await storageService.getStats();
    await storageService.updateStats({
      totalPracticeTime: (stats.totalPracticeTime || 0) + duration,
      sessionsCompleted: (stats.sessionsCompleted || 0) + 1,
      accuracyHistory: [
        ...(stats.accuracyHistory || []),
        {
          date: new Date().toISOString(),
          accuracy: this.currentSession.accuracy,
          type: this.currentSession.type,
        },
      ],
    });

    // Check achievements
    await this.checkAchievements();

    const completedSession = this.currentSession;
    this.currentSession = null;
    return completedSession;
  }

  async checkAchievements(): Promise<Achievement[]> {
    const stats = await storageService.getStats();
    const sessions = await storageService.getPracticeSessions();
    const unlockedAchievements: Achievement[] = [];

    for (const achievement of ACHIEVEMENTS) {
      const alreadyUnlocked = (await storageService.getAchievements()).some(a => a.id === achievement.id);
      if (alreadyUnlocked) continue;

      let shouldUnlock = false;

      switch (achievement.id) {
        case 'first_session':
          shouldUnlock = sessions.length >= 1;
          break;
        case 'chord_master_10':
          shouldUnlock = (stats.chordsMastered || []).length >= 10;
          break;
        case 'chord_master_25':
          shouldUnlock = (stats.chordsMastered || []).length >= 25;
          break;
        case 'perfect_session':
          shouldUnlock = sessions.some(s => s.accuracy === 100 && s.attempts >= 5);
          break;
        case 'practice_time_60':
          shouldUnlock = (stats.totalPracticeTime || 0) >= 3600;
          break;
        case 'progression_master':
          shouldUnlock = (stats.progressionsMastered || []).length >= 5;
          break;
        case 'scale_master':
          shouldUnlock = (stats.scalesMastered || []).length >= 14; // 7 major + 7 minor
          break;
      }

      if (shouldUnlock) {
        await storageService.saveAchievement(achievement);
        unlockedAchievements.push(achievement);
      }
    }

    return unlockedAchievements;
  }

  async markChordMastered(chordName: string): Promise<void> {
    const stats = await storageService.getStats();
    const chordsMastered = stats.chordsMastered || [];
    
    if (!chordsMastered.includes(chordName)) {
      chordsMastered.push(chordName);
      await storageService.updateStats({ chordsMastered });
    }
  }

  async markProgressionMastered(progression: string): Promise<void> {
    const stats = await storageService.getStats();
    const progressionsMastered = stats.progressionsMastered || [];
    
    if (!progressionsMastered.includes(progression)) {
      progressionsMastered.push(progression);
      await storageService.updateStats({ progressionsMastered });
    }
  }

  async markScaleMastered(scaleName: string): Promise<void> {
    const stats = await storageService.getStats();
    const scalesMastered = stats.scalesMastered || [];
    
    if (!scalesMastered.includes(scaleName)) {
      scalesMastered.push(scaleName);
      await storageService.updateStats({ scalesMastered });
    }
  }

  async getWeeklyStats(): Promise<any> {
    const sessions = await storageService.getPracticeSessions();
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const weeklySessions = sessions.filter(s => new Date(s.startTime) >= weekAgo);

    const dailyStats = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekAgo.getTime() + i * 24 * 60 * 60 * 1000);
      const daySessions = weeklySessions.filter(s => {
        const sessionDate = new Date(s.startTime);
        return sessionDate.toDateString() === date.toDateString();
      });

      return {
        date: date.toISOString(),
        sessions: daySessions.length,
        duration: daySessions.reduce((sum, s) => sum + s.duration, 0),
        accuracy: daySessions.length > 0
          ? daySessions.reduce((sum, s) => sum + s.accuracy, 0) / daySessions.length
          : 0,
      };
    });

    return dailyStats;
  }

  getCurrentSession(): PracticeSession | null {
    return this.currentSession;
  }
}

export const practiceTrackingService = new PracticeTrackingService();
export { ACHIEVEMENTS };
