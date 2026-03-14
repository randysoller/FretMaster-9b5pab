// Mobile-optimized audio detection service
// Uses native recording + Edge Function with ML APIs for production accuracy

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import { audioCapture } from './audioCapture';
import { supabase } from './supabaseClient';

export interface MobilePitchResult {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
  method: 'local' | 'api';
}

export interface MobileChordResult {
  detectedNotes: string[];
  targetNotes: string[];
  accuracy: number;
  confidence: number;
  isCorrect: boolean;
  method: 'local' | 'api';
  stringFeedback?: any[];
}

interface DeviceSettings {
  noise_gate: number;
  smoothing: number;
  confidence_threshold: number;
  use_ml: boolean;
  based_on_detections: number;
  avg_success_rate: number | null;
}

class MobileAudioDetectionService {
  private isListening = false;
  private currentCallback: ((result: MobilePitchResult | null) => void) | null = null;
  private deviceSettings: DeviceSettings | null = null;
  private deviceFingerprint: string | null = null;

  /**
   * Initialize device-specific settings
   */
  private async initializeDeviceSettings(): Promise<void> {
    if (this.deviceSettings) return; // Already initialized

    try {
      // Generate device fingerprint
      this.deviceFingerprint = `${Device.modelName || 'unknown'}-${Platform.OS}`;
      
      console.log('Loading device-specific settings for:', this.deviceFingerprint);

      // Get device-specific recommendations from backend
      const { data, error } = await supabase.rpc('get_device_recommendations', {
        p_device_fingerprint: this.deviceFingerprint,
      });

      if (error) {
        console.error('Error loading device settings:', error);
        this.useDefaultSettings();
        return;
      }

      this.deviceSettings = data;
      console.log('Device settings loaded:', this.deviceSettings);
      
      if (this.deviceSettings?.based_on_detections === 0) {
        console.log('No historical data for this device - using defaults');
      } else {
        console.log(`Settings based on ${this.deviceSettings?.based_on_detections} previous detections`);
      }
    } catch (error) {
      console.error('Failed to initialize device settings:', error);
      this.useDefaultSettings();
    }
  }

  /**
   * Use default settings when device-specific settings unavailable
   */
  private useDefaultSettings(): void {
    this.deviceSettings = {
      noise_gate: -40,
      smoothing: 0.6,
      confidence_threshold: 0.7,
      use_ml: false,
      based_on_detections: 0,
      avg_success_rate: null,
    };
  }

  /**
   * Start continuous pitch detection
   * For mobile, we use a hybrid approach:
   * - Local metering for UI feedback
   * - Periodic API calls for accurate detection
   */
  async startPitchDetection(
    callback: (result: MobilePitchResult | null) => void,
    useAPI: boolean = false
  ): Promise<boolean> {
    const hasPermission = await audioCapture.requestPermission();
    if (!hasPermission) {
      console.error('Microphone permission denied');
      return false;
    }

    this.isListening = true;
    this.currentCallback = callback;

    if (useAPI) {
      // Use periodic API-based detection
      this.startAPIBasedDetection();
    } else {
      // Use local metering-based detection (faster but less accurate)
      const started = await audioCapture.startCapture((buffer, sampleRate) => {
        // Simple local detection using amplitude
        const result = this.localPitchEstimate(buffer, sampleRate);
        callback(result);
      });

      return started;
    }

    return true;
  }

  /**
   * Local pitch estimation (fast but approximate)
   */
  private localPitchEstimate(buffer: Float32Array, sampleRate: number): MobilePitchResult | null {
    // Calculate RMS for signal strength
    let sum = 0;
    for (let i = 0; i < buffer.length; i++) {
      sum += buffer[i] * buffer[i];
    }
    const rms = Math.sqrt(sum / buffer.length);

    // Noise gate
    if (rms < 0.01) return null;

    // Simple zero-crossing rate for rough pitch estimate
    let crossings = 0;
    for (let i = 1; i < buffer.length; i++) {
      if ((buffer[i - 1] >= 0 && buffer[i] < 0) || (buffer[i - 1] < 0 && buffer[i] >= 0)) {
        crossings++;
      }
    }

    const frequency = (crossings / 2) * (sampleRate / buffer.length);

    if (frequency < 80 || frequency > 1200) return null;

    const { note, cents } = this.frequencyToNote(frequency);

    return {
      frequency,
      note,
      cents,
      confidence: Math.min(rms * 10, 1),
      method: 'local',
    };
  }

  /**
   * API-based detection (accurate, periodic)
   */
  private async startAPIBasedDetection(): Promise<void> {
    const detectLoop = async () => {
      if (!this.isListening) return;

      try {
        // Record 1-second chunk
        const audioChunk = await audioCapture.recordChunk(1000);
        
        if (audioChunk && audioChunk.base64) {
          // Send to Edge Function for ML processing
          const result = await this.detectPitchViaAPI(audioChunk.base64);
          
          if (this.currentCallback) {
            this.currentCallback(result);
          }
        }
      } catch (error) {
        console.error('API detection error:', error);
      }

      // Continue loop
      if (this.isListening) {
        setTimeout(detectLoop, 1000);
      }
    };

    detectLoop();
  }

  /**
   * Detect pitch using Edge Function + ML API
   */
  private async detectPitchViaAPI(audioBase64: string): Promise<MobilePitchResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('detect-pitch', {
        body: { audioData: audioBase64 },
      });

      if (error) {
        console.error('Pitch detection API error:', error);
        return null;
      }

      return {
        frequency: data.frequency,
        note: data.note,
        cents: data.cents || 0,
        confidence: data.confidence || 0.8,
        method: 'api',
      };
    } catch (error) {
      console.error('Failed to call pitch detection API:', error);
      return null;
    }
  }

  /**
   * Detect chord using API with device-specific settings
   */
  async detectChord(
    targetChord: { name: string; positions: number[]; notes: string[] },
    duration: number = 2000
  ): Promise<MobileChordResult> {
    // Initialize device settings on first use
    await this.initializeDeviceSettings();
    try {
      // Record audio chunk
      const audioChunk = await audioCapture.recordChunk(duration);
      
      if (!audioChunk || !audioChunk.base64) {
        throw new Error('Failed to record audio');
      }

      // Use device-specific settings or defaults
      const useML = this.deviceSettings?.use_ml || false;
      const confidenceThreshold = this.deviceSettings?.confidence_threshold || 0.7;

      console.log('Chord detection with device settings:', {
        use_ml: useML,
        confidence_threshold: confidenceThreshold,
        based_on: this.deviceSettings?.based_on_detections || 0,
      });

      // Send to Edge Function for processing with device settings
      const { data, error } = await supabase.functions.invoke('detect-chord-mobile', {
        body: {
          audioData: audioChunk.base64,
          targetChord,
          deviceSettings: this.deviceSettings, // Send device-specific settings
        },
      });

      if (error) {
        console.error('Chord detection API error:', error);
        throw error;
      }

      const result: MobileChordResult = {
        detectedNotes: data.detectedNotes || [],
        targetNotes: targetChord.notes,
        accuracy: data.accuracy || 0,
        confidence: data.confidence || 0,
        isCorrect: data.isCorrect || false,
        method: 'api',
        stringFeedback: data.stringFeedback,
      };

      // Log detection with device info for learning
      await this.logDetection(targetChord.name, result);

      return result;
    } catch (error) {
      console.error('Chord detection failed:', error);
      
      // Fallback to mock result
      return {
        detectedNotes: [],
        targetNotes: targetChord.notes,
        accuracy: 0,
        confidence: 0,
        isCorrect: false,
        method: 'local',
      };
    }
  }

  /**
   * Log detection to database with device information
   */
  private async logDetection(
    targetChord: string,
    result: MobileChordResult
  ): Promise<void> {
    try {
      const deviceInfo = {
        os: Platform.OS,
        version: Platform.Version,
        model: Device.modelName,
        osVersion: Device.osVersion,
        deviceFingerprint: this.deviceFingerprint,
        settingsApplied: this.deviceSettings,
      };

      const { error } = await supabase.rpc('log_chord_detection', {
        p_target_chord: targetChord,
        p_detected_notes: result.detectedNotes,
        p_accuracy: result.accuracy,
        p_confidence: result.confidence,
        p_method: result.method,
        p_audio_fingerprint: null, // Mobile doesn't have fingerprint yet
      });

      if (error) {
        console.error('Error logging mobile detection:', error);
      }
    } catch (error) {
      console.error('Failed to log mobile detection:', error);
    }
  }

  /**
   * Stop detection
   */
  async stopDetection(): Promise<void> {
    this.isListening = false;
    this.currentCallback = null;
    await audioCapture.stopCapture();
  }

  /**
   * Utility: Convert frequency to note
   */
  private frequencyToNote(frequency: number): { note: string; cents: number } {
    const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const a4Freq = 440;
    
    const noteNum = 12 * (Math.log(frequency / a4Freq) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
    
    const noteName = NOTE_STRINGS[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    
    return {
      note: `${noteName}${octave}`,
      cents,
    };
  }
}

export const mobileAudioDetectionService = new MobileAudioDetectionService();
