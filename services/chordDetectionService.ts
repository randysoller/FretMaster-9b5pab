// Service for enhanced chord detection with backend ML integration
import { supabase } from './supabaseClient';
import { pitchDetectionService, ChordDetectionResult } from './pitchDetectionService';

interface EnhancedChordDetectionOptions {
  useBackend?: boolean; // Whether to use backend ML enhancement
  confidenceThreshold?: number; // Confidence threshold to trigger backend (default: 0.8)
  logDetection?: boolean; // Whether to log detection to database (default: true)
}

class ChordDetectionService {
  private confidenceThreshold = 0.8;

  /**
   * Detect chord with automatic ML enhancement when confidence is low
   */
  async detectChordEnhanced(
    targetChord: { name: string; positions: number[]; notes: string[] },
    duration: number = 2000,
    options: EnhancedChordDetectionOptions = {}
  ): Promise<ChordDetectionResult> {
    const {
      useBackend = true,
      confidenceThreshold = this.confidenceThreshold,
      logDetection = true,
    } = options;

    // First, try local detection
    const localResult = await pitchDetectionService.detectChord(targetChord, duration);

    // If confidence is high enough, return local result
    if (localResult.confidence >= confidenceThreshold || !useBackend) {
      if (logDetection) {
        await this.logDetection(targetChord.name, localResult);
      }
      return localResult;
    }

    // Otherwise, enhance with backend ML
    console.log('Local confidence too low, enhancing with backend ML...');
    try {
      const enhancedResult = await this.enhanceWithBackend(targetChord, localResult);
      
      if (logDetection) {
        await this.logDetection(targetChord.name, enhancedResult);
      }
      
      return enhancedResult;
    } catch (error) {
      console.error('Backend enhancement failed, using local result:', error);
      
      if (logDetection) {
        await this.logDetection(targetChord.name, localResult);
      }
      
      return localResult;
    }
  }

  /**
   * Check cache before detection to reduce latency and cost
   */
  private async checkCache(audioFingerprint: string): Promise<ChordDetectionResult | null> {
    try {
      const { data, error } = await supabase.rpc('get_cached_detection', {
        p_fingerprint: audioFingerprint,
      });

      if (error || !data) {
        return null;
      }

      console.log('Cache hit! Using cached detection');
      return {
        detectedNotes: data.detected_notes,
        accuracy: data.accuracy || 0,
        confidence: data.confidence || 0,
        isCorrect: (data.accuracy || 0) >= 80,
        stringFeedback: [],
        method: 'cached',
      };
    } catch (error) {
      console.error('Cache lookup failed:', error);
      return null;
    }
  }

  /**
   * Store detection result in cache
   */
  private async storeInCache(
    audioFingerprint: string,
    result: ChordDetectionResult
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('cache_detection', {
        p_fingerprint: audioFingerprint,
        p_detected_notes: result.detectedNotes,
        p_confidence: result.confidence,
        p_accuracy: result.accuracy,
      });

      if (error) {
        console.error('Failed to cache detection:', error);
      }
    } catch (error) {
      console.error('Cache storage failed:', error);
    }
  }

  /**
   * Enhance chord detection using backend Edge Function
   */
  private async enhanceWithBackend(
    targetChord: { name: string; positions: number[]; notes: string[] },
    preliminaryResult: ChordDetectionResult
  ): Promise<ChordDetectionResult> {
    const { data, error } = await supabase.functions.invoke('analyze-chord', {
      body: {
        targetChord,
        preliminaryResult: {
          detectedNotes: preliminaryResult.detectedNotes,
          accuracy: preliminaryResult.accuracy,
          confidence: preliminaryResult.confidence,
        },
        detectedFrequencies: preliminaryResult.stringFeedback
          .map(f => f.detectedFrequency)
          .filter((f): f is number => f !== undefined),
        audioFingerprint: this.generateAudioFingerprint(preliminaryResult),
      },
    });

    if (error) {
      throw error;
    }

    // Merge backend result with local string feedback
    return {
      ...preliminaryResult,
      detectedNotes: data.detectedNotes,
      accuracy: data.accuracy,
      confidence: data.confidence,
      isCorrect: data.accuracy >= 80,
      method: 'ml-enhanced',
    };
  }

  /**
   * Log detection attempt to database
   */
  private async logDetection(
    targetChord: string,
    result: ChordDetectionResult
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_chord_detection', {
        p_target_chord: targetChord,
        p_detected_notes: result.detectedNotes,
        p_accuracy: result.accuracy,
        p_confidence: result.confidence,
        p_method: result.method,
        p_audio_fingerprint: this.generateAudioFingerprint(result),
      });

      if (error) {
        console.error('Error logging detection:', error);
      }
    } catch (error) {
      console.error('Failed to log detection:', error);
    }
  }

  /**
   * Generate audio fingerprint for deduplication
   */
  private generateAudioFingerprint(result: ChordDetectionResult): string {
    const frequencies = result.stringFeedback
      .map(f => f.detectedFrequency || 0)
      .map(f => Math.round(f * 10) / 10)
      .join(',');
    
    return `${frequencies}-${result.detectedNotes.join(',')}`;
  }

  /**
   * Get user's detection statistics
   */
  async getUserStats(): Promise<{
    total_detections: number;
    avg_accuracy: number;
    avg_confidence: number;
    total_correct: number;
    success_rate: number;
    local_detections: number;
    ml_detections: number;
    avg_latency_ms: number;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_user_detection_stats');

      if (error) {
        console.error('Error fetching stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch detection stats:', error);
      return null;
    }
  }

  /**
   * Get active ML model information
   */
  async getActiveModel(): Promise<{
    version: string;
    accuracy: number;
    model_type: string;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('ml_models')
        .select('version, accuracy, model_type')
        .eq('is_active', true)
        .eq('model_type', 'chord-classifier')
        .single();

      if (error) {
        console.log('No active model found');
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch active model:', error);
      return null;
    }
  }

  /**
   * Provide user feedback on detection
   */
  async submitFeedback(
    detectionId: string,
    wasCorrect: boolean,
    userConfirmedChord?: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('chord_detections')
        .update({
          was_correct: wasCorrect,
          user_confirmed_chord: userConfirmedChord,
        })
        .eq('id', detectionId);

      if (error) {
        console.error('Error submitting feedback:', error);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    }
  }

  /**
   * Get personalized detection settings based on user feedback history
   */
  async getPersonalizedSettings(): Promise<{
    confidence_threshold: number;
    success_rate: number;
    avg_confidence: number;
    use_ml_fallback: boolean;
    recommend_calibration: boolean;
  } | null> {
    try {
      const { data, error } = await supabase.rpc('get_personalized_settings');

      if (error) {
        console.error('Error fetching personalized settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch personalized settings:', error);
      return null;
    }
  }

  /**
   * Get user's feedback statistics
   */
  async getFeedbackStats(): Promise<{
    total_feedbacks: number;
    correct_count: number;
    incorrect_count: number;
    avg_correct_accuracy: number;
    avg_incorrect_accuracy: number;
    avg_correct_confidence: number;
    avg_incorrect_confidence: number;
  } | null> {
    try {
      const { data, error } = await supabase
        .from('detection_feedback_stats')
        .select('*')
        .single();

      if (error) {
        console.error('Error fetching feedback stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to fetch feedback stats:', error);
      return null;
    }
  }

  /**
   * Smart detection with confidence-based routing
   * Automatically uses personalized thresholds and routing logic
   * NOW WITH CACHING for improved performance
   */
  async detectChordSmart(
    targetChord: { name: string; positions: number[]; notes: string[] },
    duration: number = 2000
  ): Promise<ChordDetectionResult & { detectionId?: string }> {
    // Get personalized settings
    const settings = await this.getPersonalizedSettings();
    
    // Use personalized threshold or default
    const confidenceThreshold = settings?.confidence_threshold || 0.8;
    const useMLFallback = settings?.use_ml_fallback ?? true;

    // First, try local detection
    const localResult = await pitchDetectionService.detectChord(targetChord, duration);
    const audioFingerprint = this.generateAudioFingerprint(localResult);

    // Check cache before expensive ML processing
    const cachedResult = await this.checkCache(audioFingerprint);
    if (cachedResult && cachedResult.confidence >= confidenceThreshold) {
      console.log('Using cached result');
      const detectionId = await this.logDetectionWithId(targetChord.name, cachedResult);
      return { ...cachedResult, detectionId };
    }

    console.log('Local detection confidence:', localResult.confidence, 'Threshold:', confidenceThreshold);

    // If confidence is high enough, return local result
    if (localResult.confidence >= confidenceThreshold || !useMLFallback) {
      // Cache high-confidence detections for future use
      await this.storeInCache(audioFingerprint, localResult);
      
      // Log detection without ML enhancement
      const detectionId = await this.logDetectionWithId(
        targetChord.name,
        localResult
      );

      return {
        ...localResult,
        detectionId,
      };
    }

    // Otherwise, enhance with backend ML
    console.log('Confidence too low, using ML enhancement...');
    try {
      const enhancedResult = await this.enhanceWithBackend(targetChord, localResult);
      
      // Cache ML-enhanced results
      await this.storeInCache(audioFingerprint, enhancedResult);
      
      const detectionId = await this.logDetectionWithId(
        targetChord.name,
        enhancedResult
      );

      return {
        ...enhancedResult,
        detectionId,
      };
    } catch (error) {
      console.error('ML enhancement failed, using local result:', error);
      
      const detectionId = await this.logDetectionWithId(
        targetChord.name,
        localResult
      );

      return {
        ...localResult,
        detectionId,
      };
    }
  }

  /**
   * Get system health metrics (for admin/debugging)
   */
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    recent_accuracy: number;
    recent_satisfaction: number;
    recent_detections: number;
    cache_hit_rate: number;
    active_users_24h: number;
  } | null> {
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
   * Log detection and return the detection ID for feedback
   */
  private async logDetectionWithId(
    targetChord: string,
    result: ChordDetectionResult
  ): Promise<string | undefined> {
    try {
      const { data, error } = await supabase.rpc('log_chord_detection', {
        p_target_chord: targetChord,
        p_detected_notes: result.detectedNotes,
        p_accuracy: result.accuracy,
        p_confidence: result.confidence,
        p_method: result.method,
        p_audio_fingerprint: this.generateAudioFingerprint(result),
      });

      if (error) {
        console.error('Error logging detection:', error);
        return undefined;
      }

      return data;
    } catch (error) {
      console.error('Failed to log detection:', error);
      return undefined;
    }
  }
}

export const chordDetectionService = new ChordDetectionService();
