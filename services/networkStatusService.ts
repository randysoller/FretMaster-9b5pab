/**
 * Network Status Service
 * 
 * Detects network connectivity and Supabase availability.
 * Provides offline mode detection and visual feedback.
 */

import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabaseClient';

export type NetworkStatus = 'online' | 'offline' | 'checking';

class NetworkStatusService {
  private listeners: Set<(status: NetworkStatus) => void> = new Set();
  private currentStatus: NetworkStatus = 'checking';
  private checkInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initialize();
  }

  private initialize() {
    // Listen for network state changes
    NetInfo.addEventListener(state => {
      const wasOnline = this.currentStatus === 'online';
      const isOnline = state.isConnected && state.isInternetReachable;

      if (isOnline && !wasOnline) {
        this.checkSupabaseConnection();
      } else if (!isOnline) {
        this.updateStatus('offline');
      }
    });

    // Initial check
    this.checkSupabaseConnection();

    // Periodic check (every 30 seconds)
    this.checkInterval = setInterval(() => {
      this.checkSupabaseConnection();
    }, 30000);
  }

  private async checkSupabaseConnection() {
    try {
      // Try a lightweight query to check Supabase connection
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .maybeSingle();

      if (error && error.message.includes('Failed to fetch')) {
        this.updateStatus('offline');
      } else {
        this.updateStatus('online');
      }
    } catch (err) {
      console.log('Network check failed:', err);
      this.updateStatus('offline');
    }
  }

  private updateStatus(status: NetworkStatus) {
    if (this.currentStatus !== status) {
      this.currentStatus = status;
      this.notifyListeners();
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.currentStatus));
  }

  /**
   * Subscribe to network status changes
   */
  subscribe(listener: (status: NetworkStatus) => void): () => void {
    this.listeners.add(listener);
    // Immediately notify with current status
    listener(this.currentStatus);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current network status
   */
  getStatus(): NetworkStatus {
    return this.currentStatus;
  }

  /**
   * Manually trigger connection check
   */
  async recheckConnection(): Promise<void> {
    await this.checkSupabaseConnection();
  }

  /**
   * Cleanup on app close
   */
  destroy() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    this.listeners.clear();
  }
}

// Singleton instance
export const networkStatusService = new NetworkStatusService();
