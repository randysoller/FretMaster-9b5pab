// Practice reminder and notification service
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { storageService } from './storageService';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

interface ReminderSettings {
  enabled: boolean;
  time: string; // HH:MM format
  days: number[]; // 0-6 (Sunday-Saturday)
}

class NotificationService {
  async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  }

  async scheduleDailyReminder(settings: ReminderSettings): Promise<void> {
    if (!settings.enabled) {
      await this.cancelAllReminders();
      return;
    }

    // Cancel existing reminders
    await this.cancelAllReminders();

    // Parse time
    const [hour, minute] = settings.time.split(':').map(Number);

    // Schedule for each selected day
    for (const dayOfWeek of settings.days) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎸 Time to Practice!',
          body: 'Keep your streak going! Practice a few chords to improve your skills.',
          data: { type: 'practice_reminder' },
        },
        trigger: {
          hour,
          minute,
          weekday: dayOfWeek + 1, // Expo uses 1-7 for Sunday-Saturday
          repeats: true,
        },
      });
    }
  }

  async sendStreakNotification(streakDays: number): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🔥 ${streakDays}-Day Streak!`,
        body: `Amazing! You've practiced for ${streakDays} days in a row. Keep it up!`,
        data: { type: 'streak_milestone', streakDays },
      },
      trigger: null, // Send immediately
    });
  }

  async sendAchievementNotification(title: string, description: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `🏆 Achievement Unlocked!`,
        body: `${title}: ${description}`,
        data: { type: 'achievement_unlocked', achievement: title },
      },
      trigger: null,
    });
  }

  async sendPracticeEncouragement(): Promise<void> {
    const encouragements = [
      'A few minutes today can make a big difference!',
      'Your guitar is waiting for you 🎸',
      'Practice makes progress. Start a quick session!',
      'Even 5 minutes of practice counts!',
      'Master one more chord today!',
    ];

    const message = encouragements[Math.floor(Math.random() * encouragements.length)];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Practice Reminder',
        body: message,
        data: { type: 'encouragement' },
      },
      trigger: null,
    });
  }

  async cancelAllReminders(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getReminderSettings(): Promise<ReminderSettings> {
    const settings = await storageService.getReminderSettings();
    return settings || {
      enabled: false,
      time: '18:00', // 6 PM default
      days: [1, 2, 3, 4, 5], // Monday-Friday
    };
  }

  async saveReminderSettings(settings: ReminderSettings): Promise<void> {
    await storageService.saveReminderSettings(settings);
    await this.scheduleDailyReminder(settings);
  }

  // Check and update streak
  async checkStreak(): Promise<number> {
    const stats = await storageService.getStats();
    const today = new Date().toISOString().split('T')[0];
    const lastPracticeDate = stats.lastPracticeDate;

    if (!lastPracticeDate) {
      return 0;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (lastPracticeDate === today) {
      // Already practiced today
      return stats.currentStreak || 0;
    } else if (lastPracticeDate === yesterdayStr) {
      // Streak continues
      const newStreak = (stats.currentStreak || 0) + 1;
      const longestStreak = Math.max(newStreak, stats.longestStreak || 0);

      await storageService.updateStats({
        currentStreak: newStreak,
        longestStreak,
        lastPracticeDate: today,
      });

      // Send milestone notifications
      if (newStreak === 7 || newStreak === 30 || newStreak % 50 === 0) {
        await this.sendStreakNotification(newStreak);
      }

      return newStreak;
    } else {
      // Streak broken
      await storageService.updateStats({
        currentStreak: 1,
        lastPracticeDate: today,
      });
      return 1;
    }
  }

  async updatePracticeStreak(): Promise<number> {
    return await this.checkStreak();
  }
}

export const notificationService = new NotificationService();
