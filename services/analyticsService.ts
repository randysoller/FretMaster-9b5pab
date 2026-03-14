// Service for system analytics and quality monitoring
import { supabase } from './supabaseClient';

interface QualityMetrics {
  total_detections: number;
  avg_accuracy: number;
  avg_confidence: number;
  user_satisfaction_rate: number;
  local_method_count: number;
  ml_method_count: number;
}

interface SystemHealth {
  status: 'healthy' | 'degraded' | 'critical';
  recent_accuracy: number;
  recent_satisfaction: number;
  recent_detections: number;
  cache_hit_rate: number;
  active_users_24h: number;
}

interface TrainingDataPoint {
  target_chord: string;
  detected_notes: string[];
  accuracy: number;
  confidence: number;
  was_correct: boolean;
  user_confirmed_chord?: string;
  device_info: any;
  method: string;
}

class AnalyticsService {
  /**
   * Calculate current quality metrics for a time window
   */
  async getQualityMetrics(timeWindow: string = '1 hour'): Promise<QualityMetrics | null> {
    try {
      const { data, error } = await supabase.rpc('calculate_quality_metrics', {
        p_time_window: timeWindow,
      });

      if (error) {
        console.error('Error fetching quality metrics:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch quality metrics:', error);
      return null;
    }
  }

  /**
   * Get overall system health status
   */
  async getSystemHealth(): Promise<SystemHealth | null> {
    try {
      const { data, error } = await supabase.rpc('get_system_health');

      if (error) {
        console.error('Error fetching system health:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch system health:', error);
      return null;
    }
  }

  /**
   * Export training data for ML model improvement
   * (Admin/Developer feature)
   */
  async exportTrainingData(limit: number = 1000): Promise<TrainingDataPoint[] | null> {
    try {
      const { data, error } = await supabase.rpc('export_training_data', {
        p_limit: limit,
      });

      if (error) {
        console.error('Error exporting training data:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to export training data:', error);
      return null;
    }
  }

  /**
   * Get detection quality metrics history
   */
  async getQualityHistory(limit: number = 24): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('detection_quality_metrics')
        .select('*')
        .order('measured_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching quality history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch quality history:', error);
      return null;
    }
  }

  /**
   * Get device performance statistics
   */
  async getDevicePerformanceStats(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('device_performance_stats')
        .select('*')
        .order('avg_accuracy', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error fetching device stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch device stats:', error);
      return null;
    }
  }

  /**
   * Get ML model performance history
   */
  async getModelPerformanceHistory(): Promise<any[] | null> {
    try {
      const { data, error } = await supabase
        .from('model_performance_tests')
        .select(`
          id,
          test_date,
          avg_accuracy,
          precision_score,
          recall_score,
          f1_score,
          promoted_to_production,
          ml_models(version, model_type)
        `)
        .order('test_date', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching model history:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch model history:', error);
      return null;
    }
  }

  /**
   * Cleanup old cache entries (for maintenance)
   */
  async cleanupCache(): Promise<number> {
    try {
      const { data, error } = await supabase.rpc('cleanup_detection_cache');

      if (error) {
        console.error('Error cleaning up cache:', error);
        return 0;
      }

      console.log(`Cleaned up ${data} old cache entries`);
      return data;
    } catch (error) {
      console.error('Failed to cleanup cache:', error);
      return 0;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total_entries: number;
    avg_hit_count: number;
    total_hits: number;
    cache_size_mb: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('chord_detection_cache')
        .select('hit_count, cached_at');

      if (error) {
        console.error('Error fetching cache stats:', error);
        return null;
      }

      const totalEntries = data.length;
      const totalHits = data.reduce((sum, entry) => sum + entry.hit_count, 0);
      const avgHitCount = totalEntries > 0 ? totalHits / totalEntries : 0;

      return {
        total_entries: totalEntries,
        avg_hit_count: Math.round(avgHitCount * 100) / 100,
        total_hits: totalHits,
        cache_size_mb: 0, // Placeholder - would need database size query
      };
    } catch (error) {
      console.error('Failed to fetch cache stats:', error);
      return null;
    }
  }

  /**
   * Monitor for quality degradation alerts
   * Subscribe to real-time quality changes
   */
  subscribeToQualityAlerts(
    onAlert: (metrics: any) => void
  ): { unsubscribe: () => void } {
    const channel = supabase
      .channel('quality-alerts')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'detection_quality_metrics',
          filter: 'avg_accuracy=lt.85',
        },
        (payload) => {
          console.warn('Quality degradation detected:', payload.new);
          onAlert(payload.new);
        }
      )
      .subscribe();

    return {
      unsubscribe: () => {
        channel.unsubscribe();
      },
    };
  }
}

export const analyticsService = new AnalyticsService();
