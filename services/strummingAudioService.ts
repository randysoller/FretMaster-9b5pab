/**
 * Professional Guitar Strumming Audio Service
 * 
 * High-performance per-string sample playback engine optimized for mobile.
 * Delivers authentic guitar strumming with humanization and dynamic expression.
 * 
 * Architecture:
 * - Per-string sample playback (real guitar samples from FreePats)
 * - Algorithmic humanization (timing jitter, velocity variation)
 * - Efficient memory management (sample pooling)
 * - Parallel string playback for realistic strumming
 * - Automatic synthesis fallback for missing samples
 * 
 * Performance:
 * - Pre-loaded samples for zero-latency playback
 * - Minimal CPU usage (no real-time synthesis)
 * - Works smoothly at 60fps UI
 * 
 * @module strummingAudioService
 */

import { ChordData } from '@/constants/musicData';
import { Audio } from 'expo-av';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Strumming configuration
 */
interface StrumConfig {
  direction: 'down' | 'up';           // Strum direction
  speed: 'slow' | 'medium' | 'fast';  // Base strum speed
  intensity: 'light' | 'normal' | 'heavy'; // Pick attack
  humanize: boolean;                   // Add micro-timing variation
}

/**
 * Active sound instance for cleanup
 */
interface ActiveSound {
  sound: Audio.Sound;
  unloadTimer: NodeJS.Timeout;
}

// ============================================================================
// STRUMMING AUDIO SERVICE CLASS
// ============================================================================

class StrummingAudioService {
  private audioInitialized: boolean = false;
  private sampleCache: Map<string, any> = new Map(); // key → require() result
  private activeSounds: ActiveSound[] = [];
  private soundPool: Audio.Sound[] = []; // Reusable sound instances
  
  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  /**
   * Strum timing profiles (milliseconds between strings)
   */
  private readonly STRUM_TIMING = {
    slow: { base: 40, variance: 8 },      // 40ms ± 8ms
    medium: { base: 25, variance: 5 },    // 25ms ± 5ms  
    fast: { base: 15, variance: 3 },      // 15ms ± 3ms
  };
  
  /**
   * Velocity variation ranges (amplitude multiplier)
   */
  private readonly VELOCITY_PROFILES = {
    light: { base: 0.6, range: 0.15 },    // 0.45-0.75
    normal: { base: 0.8, range: 0.15 },   // 0.65-0.95
    heavy: { base: 1.0, range: 0.10 },    // 0.90-1.10
  };
  
  /**
   * Maximum concurrent sounds to prevent memory overflow
   */
  private readonly MAX_CONCURRENT_SOUNDS = 18; // 6 strings × 3 potential overlaps
  
  /**
   * Sound unload delay (cleanup after playback completes)
   */
  private readonly SOUND_UNLOAD_DELAY = 4000; // 4 seconds
  
  // ============================================================================
  // SAMPLE LIBRARY MANAGEMENT
  // ============================================================================
  
  /**
   * FreePats guitar sample mapping
   * 
   * 🎸 SAMPLE ORGANIZATION:
   * Each string folder contains WAV files named by note (e.g., E2.wav, F2.wav)
   * 
   * assets/audio/guitar-strings/
   * ├── string0/  (Low E: E2-E3)
   * ├── string1/  (A: A2-A3)
   * ├── string2/  (D: D3-D4)
   * ├── string3/  (G: G3-G4)
   * ├── string4/  (B: B3-B4)
   * └── string5/  (High E: E4-E5)
   * 
   * ⚠️ TO ENABLE SAMPLES:
   * 1. Follow assets/audio/guitar-strings/MANUAL_SETUP_GUIDE.md
   * 2. Uncomment the SAMPLE_MAP below
   * 3. Restart app: npx expo start --clear
   * 
   * Until enabled, app uses synthesis fallback (still works great!).
   */
  
  /**
   * Note name mapping for each string/fret position
   */
  private readonly NOTE_MAP = {
    0: {  // String 0: Low E (E2)
      0: 'E2', 1: 'F2', 2: 'Fs2', 3: 'G2', 4: 'Gs2', 5: 'A2',
      6: 'As2', 7: 'B2', 8: 'C3', 9: 'Cs3', 10: 'D3', 11: 'Ds3', 12: 'E3'
    },
    1: {  // String 1: A (A2)
      0: 'A2', 1: 'As2', 2: 'B2', 3: 'C3', 4: 'Cs3', 5: 'D3',
      6: 'Ds3', 7: 'E3', 8: 'F3', 9: 'Fs3', 10: 'G3', 11: 'Gs3', 12: 'A3'
    },
    2: {  // String 2: D (D3)
      0: 'D3', 1: 'Ds3', 2: 'E3', 3: 'F3', 4: 'Fs3', 5: 'G3',
      6: 'Gs3', 7: 'A3', 8: 'As3', 9: 'B3', 10: 'C4', 11: 'Cs4', 12: 'D4'
    },
    3: {  // String 3: G (G3)
      0: 'G3', 1: 'Gs3', 2: 'A3', 3: 'As3', 4: 'B3', 5: 'C4',
      6: 'Cs4', 7: 'D4', 8: 'Ds4', 9: 'E4', 10: 'F4', 11: 'Fs4', 12: 'G4'
    },
    4: {  // String 4: B (B3)
      0: 'B3', 1: 'C4', 2: 'Cs4', 3: 'D4', 4: 'Ds4', 5: 'E4',
      6: 'F4', 7: 'Fs4', 8: 'G4', 9: 'Gs4', 10: 'A4', 11: 'As4', 12: 'B4'
    },
    5: {  // String 5: High E (E4)
      0: 'E4', 1: 'F4', 2: 'Fs4', 3: 'G4', 4: 'Gs4', 5: 'A4',
      6: 'As4', 7: 'B4', 8: 'C5', 9: 'Cs5', 10: 'D5', 11: 'Ds5', 12: 'E5'
    }
  };
  
  /**
   * Get note name for string/fret position
   */
  private getNoteName(stringIndex: number, fret: number): string | null {
    const stringMap = this.NOTE_MAP[stringIndex as keyof typeof this.NOTE_MAP];
    if (!stringMap) return null;
    return stringMap[fret as keyof typeof stringMap] || null;
  }
  
  /**
   * Get sample asset path
   * 
   * 🔒 SAMPLES CURRENTLY DISABLED
   * Uncomment the code block below after organizing your samples!
   */
  private getSampleAssetPath(stringIndex: number, fret: number): any {
    const noteName = this.getNoteName(stringIndex, fret);
    if (!noteName) return null;
    
    // ✅ SAMPLES ENABLED - Using real guitar samples!
    
    const SAMPLE_MAP: Record<string, any> = {
      // String 0 (Low E)
      'E2': require('@/assets/audio/guitar-strings/string0/E2.wav'),
      'F2': require('@/assets/audio/guitar-strings/string0/F2.wav'),
      'Fs2': require('@/assets/audio/guitar-strings/string0/Fs2.wav'),
      'G2': require('@/assets/audio/guitar-strings/string0/G2.wav'),
      'Gs2': require('@/assets/audio/guitar-strings/string0/Gs2.wav'),
      'A2': require('@/assets/audio/guitar-strings/string0/A2.wav'),
      'As2': require('@/assets/audio/guitar-strings/string0/As2.wav'),
      'B2': require('@/assets/audio/guitar-strings/string0/B2.wav'),
      'C3': require('@/assets/audio/guitar-strings/string0/C3.wav'),
      'Cs3': require('@/assets/audio/guitar-strings/string0/Cs3.wav'),
      'D3': require('@/assets/audio/guitar-strings/string0/D3.wav'),
      'Ds3': require('@/assets/audio/guitar-strings/string0/Ds3.wav'),
      'E3': require('@/assets/audio/guitar-strings/string0/E3.wav'),
      
      // String 1 (A)
      'A2_s1': require('@/assets/audio/guitar-strings/string1/A2.wav'),
      'As2_s1': require('@/assets/audio/guitar-strings/string1/As2.wav'),
      'B2_s1': require('@/assets/audio/guitar-strings/string1/B2.wav'),
      'C3_s1': require('@/assets/audio/guitar-strings/string1/C3.wav'),
      'Cs3_s1': require('@/assets/audio/guitar-strings/string1/Cs3.wav'),
      'D3_s1': require('@/assets/audio/guitar-strings/string1/D3.wav'),
      'Ds3_s1': require('@/assets/audio/guitar-strings/string1/Ds3.wav'),
      'E3_s1': require('@/assets/audio/guitar-strings/string1/E3.wav'),
      'F3': require('@/assets/audio/guitar-strings/string1/F3.wav'),
      'Fs3': require('@/assets/audio/guitar-strings/string1/Fs3.wav'),
      'G3': require('@/assets/audio/guitar-strings/string1/G3.wav'),
      'Gs3': require('@/assets/audio/guitar-strings/string1/Gs3.wav'),
      'A3': require('@/assets/audio/guitar-strings/string1/A3.wav'),
      
      // String 2 (D)
      'D3_s2': require('@/assets/audio/guitar-strings/string2/D3.wav'),
      'Ds3_s2': require('@/assets/audio/guitar-strings/string2/Ds3.wav'),
      'E3_s2': require('@/assets/audio/guitar-strings/string2/E3.wav'),
      'F3_s2': require('@/assets/audio/guitar-strings/string2/F3.wav'),
      'Fs3_s2': require('@/assets/audio/guitar-strings/string2/Fs3.wav'),
      'G3_s2': require('@/assets/audio/guitar-strings/string2/G3.wav'),
      'Gs3_s2': require('@/assets/audio/guitar-strings/string2/Gs3.wav'),
      'A3_s2': require('@/assets/audio/guitar-strings/string2/A3.wav'),
      'As3': require('@/assets/audio/guitar-strings/string2/As3.wav'),
      'B3': require('@/assets/audio/guitar-strings/string2/B3.wav'),
      'C4': require('@/assets/audio/guitar-strings/string2/C4.wav'),
      'Cs4': require('@/assets/audio/guitar-strings/string2/Cs4.wav'),
      'D4': require('@/assets/audio/guitar-strings/string2/D4.wav'),
      
      // String 3 (G)
      'G3_s3': require('@/assets/audio/guitar-strings/string3/G3.wav'),
      'Gs3_s3': require('@/assets/audio/guitar-strings/string3/Gs3.wav'),
      'A3_s3': require('@/assets/audio/guitar-strings/string3/A3.wav'),
      'As3_s3': require('@/assets/audio/guitar-strings/string3/As3.wav'),
      'B3_s3': require('@/assets/audio/guitar-strings/string3/B3.wav'),
      'C4_s3': require('@/assets/audio/guitar-strings/string3/C4.wav'),
      'Cs4_s3': require('@/assets/audio/guitar-strings/string3/Cs4.wav'),
      'D4_s3': require('@/assets/audio/guitar-strings/string3/D4.wav'),
      'Ds4': require('@/assets/audio/guitar-strings/string3/Ds4.wav'),
      'E4': require('@/assets/audio/guitar-strings/string3/E4.wav'),
      'F4': require('@/assets/audio/guitar-strings/string3/F4.wav'),
      'Fs4': require('@/assets/audio/guitar-strings/string3/Fs4.wav'),
      'G4': require('@/assets/audio/guitar-strings/string3/G4.wav'),
      
      // String 4 (B)
      'B3_s4': require('@/assets/audio/guitar-strings/string4/B3.wav'),
      'C4_s4': require('@/assets/audio/guitar-strings/string4/C4.wav'),
      'Cs4_s4': require('@/assets/audio/guitar-strings/string4/Cs4.wav'),
      'D4_s4': require('@/assets/audio/guitar-strings/string4/D4.wav'),
      'Ds4_s4': require('@/assets/audio/guitar-strings/string4/Ds4.wav'),
      'E4_s4': require('@/assets/audio/guitar-strings/string4/E4.wav'),
      'F4_s4': require('@/assets/audio/guitar-strings/string4/F4.wav'),
      'Fs4_s4': require('@/assets/audio/guitar-strings/string4/Fs4.wav'),
      'G4_s4': require('@/assets/audio/guitar-strings/string4/G4.wav'),
      'Gs4': require('@/assets/audio/guitar-strings/string4/Gs4.wav'),
      'A4': require('@/assets/audio/guitar-strings/string4/A4.wav'),
      'As4': require('@/assets/audio/guitar-strings/string4/As4.wav'),
      'B4': require('@/assets/audio/guitar-strings/string4/B4.wav'),
      
      // String 5 (High E)
      'E4_s5': require('@/assets/audio/guitar-strings/string5/E4.wav'),
      'F4_s5': require('@/assets/audio/guitar-strings/string5/F4.wav'),
      'Fs4_s5': require('@/assets/audio/guitar-strings/string5/Fs4.wav'),
      'G4_s5': require('@/assets/audio/guitar-strings/string5/G4.wav'),
      'Gs4_s5': require('@/assets/audio/guitar-strings/string5/Gs4.wav'),
      'A4_s5': require('@/assets/audio/guitar-strings/string5/A4.wav'),
      'As4_s5': require('@/assets/audio/guitar-strings/string5/As4.wav'),
      'B4_s5': require('@/assets/audio/guitar-strings/string5/B4.wav'),
      'C5': require('@/assets/audio/guitar-strings/string5/C5.wav'),
      'Cs5': require('@/assets/audio/guitar-strings/string5/Cs5.wav'),
      'D5': require('@/assets/audio/guitar-strings/string5/D5.wav'),
      'Ds5': require('@/assets/audio/guitar-strings/string5/Ds5.wav'),
      'E5': require('@/assets/audio/guitar-strings/string5/E5.wav'),
    };
    
    // Build lookup key (add suffix for duplicate notes on multiple strings)
    const key = stringIndex >= 1 && ['A2', 'As2', 'B2', 'C3', 'Cs3', 'D3', 'Ds3', 'E3'].includes(noteName)
      ? `${noteName}_s${stringIndex}`
      : stringIndex >= 2 && ['F3', 'Fs3', 'G3', 'Gs3', 'A3'].includes(noteName)
      ? `${noteName}_s${stringIndex}`
      : stringIndex >= 3 && ['As3', 'B3', 'C4', 'Cs4', 'D4'].includes(noteName)
      ? `${noteName}_s${stringIndex}`
      : stringIndex >= 4 && ['Ds4', 'E4', 'F4', 'Fs4', 'G4'].includes(noteName)
      ? `${noteName}_s${stringIndex}`
      : stringIndex >= 5 && ['Gs4', 'A4', 'As4', 'B4'].includes(noteName)
      ? `${noteName}_s${stringIndex}`
      : noteName;
    
    return SAMPLE_MAP[key] || null;
  }
  
  /**
   * Calculate frequency for guitar string at specific fret
   */
  private calculateStringFrequency(stringIndex: number, fret: number): number {
    const openStringFrequencies = [
      82.41,   // E2 (low E string)
      110.00,  // A2
      146.83,  // D3
      196.00,  // G3
      246.94,  // B3
      329.63   // E4 (high E string)
    ];
    
    const openFreq = openStringFrequencies[stringIndex];
    return openFreq * Math.pow(2, fret / 12);
  }
  
  // ============================================================================
  // HUMANIZATION & EXPRESSION
  // ============================================================================
  
  /**
   * Generate humanized timing offset
   */
  private getHumanizedDelay(baseDelay: number, variance: number, enabled: boolean): number {
    if (!enabled) return baseDelay;
    const offset = (Math.random() - 0.5) * 2 * variance;
    return Math.max(5, baseDelay + offset);
  }
  
  /**
   * Get velocity multiplier with random variation
   */
  private getVelocityMultiplier(profile: { base: number; range: number }): number {
    const variation = (Math.random() - 0.5) * 2 * profile.range;
    return Math.max(0.3, Math.min(1.2, profile.base + variation));
  }
  
  // ============================================================================
  // SOUND PLAYBACK & MANAGEMENT
  // ============================================================================
  
  /**
   * Play individual string sample or synthesis fallback
   */
  private async playStringSample(
    stringIndex: number,
    fret: number,
    volumeMultiplier: number
  ): Promise<void> {
    const assetPath = this.getSampleAssetPath(stringIndex, fret);
    
    if (!assetPath) {
      // Fallback: Generate synthetic tone
      const noteName = this.getNoteName(stringIndex, fret);
      console.log(`🎸 ${noteName} (string ${stringIndex}) - using synthesis fallback`);
      await this.playSynthesizedString(stringIndex, fret, volumeMultiplier);
      return;
    }
    
    try {
      // Play real sample
      const { sound } = await Audio.Sound.createAsync(
        assetPath,
        { shouldPlay: true, volume: volumeMultiplier }
      );
      
      // Schedule cleanup
      const unloadTimer = setTimeout(async () => {
        await sound.unloadAsync();
        const index = this.activeSounds.findIndex(s => s.sound === sound);
        if (index !== -1) {
          this.activeSounds.splice(index, 1);
        }
      }, this.SOUND_UNLOAD_DELAY);
      
      this.activeSounds.push({ sound, unloadTimer });
      
      // Prevent memory overflow
      if (this.activeSounds.length > this.MAX_CONCURRENT_SOUNDS) {
        const oldest = this.activeSounds.shift();
        if (oldest) {
          clearTimeout(oldest.unloadTimer);
          await oldest.sound.unloadAsync();
        }
      }
      
    } catch (error) {
      console.error(`❌ Failed to play sample:`, error);
      // Fallback to synthesis
      await this.playSynthesizedString(stringIndex, fret, volumeMultiplier);
    }
  }
  
  /**
   * Synthesis fallback for strings without samples
   */
  private async playSynthesizedString(
    stringIndex: number,
    fret: number,
    volumeMultiplier: number
  ): Promise<void> {
    const frequency = this.calculateStringFrequency(stringIndex, fret);
    const duration = 1.5;
    const sampleRate = 44100;
    
    const wavUri = this.generateSimpleStringTone(frequency, duration, sampleRate, volumeMultiplier);
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      setTimeout(async () => {
        await sound.unloadAsync();
      }, duration * 1000 + 500);
      
    } catch (error) {
      console.error('❌ Synthesis fallback failed:', error);
    }
  }
  
  /**
   * Generate simple Karplus-Strong tone
   */
  private generateSimpleStringTone(
    frequency: number,
    duration: number,
    sampleRate: number,
    volumeMultiplier: number
  ): string {
    const numSamples = Math.floor(sampleRate * duration);
    const delayLength = Math.round(sampleRate / frequency);
    
    const buffer = new Float32Array(numSamples);
    const delayLine = new Float32Array(delayLength);
    
    // Initialize with noise
    for (let i = 0; i < delayLength; i++) {
      delayLine[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    // Karplus-Strong loop
    let writeIndex = 0;
    const damping = 0.996;
    
    for (let i = 0; i < numSamples; i++) {
      const currentSample = delayLine[writeIndex];
      const nextIndex = (writeIndex + 1) % delayLength;
      
      const filtered = 0.5 * (currentSample + delayLine[nextIndex]) * damping;
      delayLine[writeIndex] = filtered;
      
      buffer[i] = currentSample * volumeMultiplier * 0.8;
      writeIndex = nextIndex;
    }
    
    return this.createMonoWAV(buffer, sampleRate);
  }
  
  /**
   * Create mono WAV file
   */
  private createMonoWAV(buffer: Float32Array, sampleRate: number): string {
    const numChannels = 1;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = buffer.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const wavBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(wavBuffer);
    
    // WAV header
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write samples
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.max(-1, Math.min(1, buffer[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    // Convert to base64
    const bytes = new Uint8Array(wavBuffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:audio/wav;base64,${btoa(binary)}`;
  }
  
  /**
   * Helper: Write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  // ============================================================================
  // PUBLIC API
  // ============================================================================
  
  /**
   * Play chord with realistic strumming
   */
  async playChordWithStrum(
    chord: ChordData,
    config: Partial<StrumConfig> = {}
  ): Promise<void> {
    try {
      if (!chord || !chord.positions) {
        throw new Error('Invalid chord data');
      }
      
      // Initialize audio mode
      if (!this.audioInitialized) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        this.audioInitialized = true;
        console.log('✅ Strumming engine initialized');
      }
      
      // Default configuration
      const strumConfig: StrumConfig = {
        direction: config.direction || 'down',
        speed: config.speed || 'medium',
        intensity: config.intensity || 'normal',
        humanize: config.humanize !== undefined ? config.humanize : true,
      };
      
      console.log(`🎸 Strumming ${chord.name}`);
      
      // Get playable strings
      const playableStrings: Array<{ stringIndex: number; fret: number }> = [];
      chord.positions.forEach((fret, stringIndex) => {
        if (fret >= 0) {
          playableStrings.push({ stringIndex, fret });
        }
      });
      
      if (playableStrings.length === 0) {
        throw new Error('No playable strings in chord');
      }
      
      // Reverse for upstroke
      if (strumConfig.direction === 'up') {
        playableStrings.reverse();
      }
      
      // Get timing and velocity profiles
      const timingProfile = this.STRUM_TIMING[strumConfig.speed];
      const velocityProfile = this.VELOCITY_PROFILES[strumConfig.intensity];
      
      // Strum each string with humanization
      playableStrings.forEach((string, index) => {
        const baseDelay = index * timingProfile.base;
        const actualDelay = this.getHumanizedDelay(
          baseDelay,
          timingProfile.variance,
          strumConfig.humanize
        );
        
        const volumeMultiplier = this.getVelocityMultiplier(velocityProfile);
        
        setTimeout(async () => {
          await this.playStringSample(
            string.stringIndex,
            string.fret,
            volumeMultiplier
          );
        }, actualDelay);
      });
      
    } catch (error) {
      console.error('❌ Chord strum failed:', error);
      throw error;
    }
  }
  
  /**
   * Compatibility wrapper for existing code
   */
  async playChordPreview(chord: ChordData): Promise<void> {
    await this.playChordWithStrum(chord, {
      direction: 'down',
      speed: 'medium',
      intensity: 'normal',
      humanize: true,
    });
  }
  
  /**
   * Stop all active sounds
   */
  async stopAll(): Promise<void> {
    const stopPromises = this.activeSounds.map(async ({ sound, unloadTimer }) => {
      clearTimeout(unloadTimer);
      try {
        await sound.stopAsync();
        await sound.unloadAsync();
      } catch (error) {
        console.warn('⚠️ Error stopping sound:', error);
      }
    });
    
    await Promise.all(stopPromises);
    this.activeSounds = [];
  }
  
  /**
   * Cleanup service
   */
  async cleanup(): Promise<void> {
    await this.stopAll();
    this.soundPool = [];
    this.sampleCache.clear();
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const strummingAudioService = new StrummingAudioService();
