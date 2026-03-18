/**
 * Professional Guitar Strumming Audio Service
 * 
 * High-performance per-string sample playback engine optimized for mobile.
 * Delivers authentic guitar strumming with humanization and dynamic expression.
 * 
 * Architecture:
 * - Per-string sample playback (not full chord samples)
 * - Velocity-layered samples (soft/medium/hard)
 * - Algorithmic humanization (timing jitter, velocity variation)
 * - Efficient memory management (sample pooling)
 * - Parallel string playback for realistic strumming
 * 
 * Performance:
 * - Pre-loaded samples for zero-latency playback
 * - Minimal CPU usage (no real-time synthesis)
 * - Works smoothly at 60fps UI
 * 
 * @module strummingAudioService
 */

import { ChordData } from '@/constants/musicData';
import { Audio, AVPlaybackStatus } from 'expo-av';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Sample metadata for each playable note
 */
interface StringSample {
  stringIndex: number;      // 0-5 (low E to high e)
  fret: number;            // 0-24
  velocity: 'soft' | 'medium' | 'hard';
  assetPath: any;          // require() path to WAV file
  frequency: number;        // Hz (for reference)
}

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
  private sampleCache: Map<string, string> = new Map(); // key → URI
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
   * Sample library structure:
   * 
   * assets/audio/guitar-strings/
   * ├── string0/  (low E)
   * │   ├── fret0-soft.wav
   * │   ├── fret0-medium.wav
   * │   ├── fret0-hard.wav
   * │   ├── fret1-soft.wav
   * │   └── ... (fret 0-12 minimum)
   * ├── string1/  (A)
   * ├── string2/  (D)
   * ├── string3/  (G)
   * ├── string4/  (B)
   * └── string5/  (high e)
   * 
   * Note: This is the IDEAL structure. For MVP, we can generate these
   * samples from a base set using the provided sample generation helpers.
   */
  
  /**
   * Get sample key for caching
   */
  private getSampleKey(stringIndex: number, fret: number, velocity: 'soft' | 'medium' | 'hard'): string {
    return `s${stringIndex}_f${fret}_${velocity}`;
  }
  
  /**
   * Get sample asset path (returns require() statement)
   * 
   * TODO: Replace with actual sample paths once library is created
   * For now, this is a placeholder showing the expected structure
   */
  private getSampleAssetPath(stringIndex: number, fret: number, velocity: 'soft' | 'medium' | 'hard'): any {
    // Example: require('@/assets/audio/guitar-strings/string0/fret0-medium.wav')
    
    // PLACEHOLDER: Return null for now - samples need to be added
    // In production, this would return actual require() paths
    return null;
    
    // Production implementation would look like:
    /*
    const sampleMap: Record<string, any> = {
      's0_f0_soft': require('@/assets/audio/guitar-strings/string0/fret0-soft.wav'),
      's0_f0_medium': require('@/assets/audio/guitar-strings/string0/fret0-medium.wav'),
      's0_f0_hard': require('@/assets/audio/guitar-strings/string0/fret0-hard.wav'),
      // ... all other combinations
    };
    
    const key = this.getSampleKey(stringIndex, fret, velocity);
    return sampleMap[key] || null;
    */
  }
  
  /**
   * Calculate frequency for guitar string at specific fret
   * (Same as audioService.ts for consistency)
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
  
  /**
   * Load sample into cache
   * 
   * NOTE: This is a simplified version. In production with actual samples,
   * this would use Expo Asset to load and cache the audio files.
   */
  private async loadSample(stringIndex: number, fret: number, velocity: 'soft' | 'medium' | 'hard'): Promise<string | null> {
    const key = this.getSampleKey(stringIndex, fret, velocity);
    
    // Return cached if available
    if (this.sampleCache.has(key)) {
      return this.sampleCache.get(key)!;
    }
    
    // Get asset path
    const assetPath = this.getSampleAssetPath(stringIndex, fret, velocity);
    if (!assetPath) {
      console.warn(`⚠️ No sample for ${key} - sample library not yet implemented`);
      return null;
    }
    
    try {
      // Load asset using Expo Asset (production implementation)
      // const asset = Asset.fromModule(assetPath);
      // await asset.downloadAsync();
      // const uri = asset.localUri;
      
      // PLACEHOLDER: Return null until samples are added
      return null;
      
    } catch (error) {
      console.error(`❌ Failed to load sample ${key}:`, error);
      return null;
    }
  }
  
  // ============================================================================
  // HUMANIZATION & EXPRESSION
  // ============================================================================
  
  /**
   * Generate humanized timing offset
   * Adds natural micro-variations to string timing
   */
  private getHumanizedDelay(baseDelay: number, variance: number, enabled: boolean): number {
    if (!enabled) return baseDelay;
    
    // Random offset within ±variance range
    const offset = (Math.random() - 0.5) * 2 * variance;
    return Math.max(5, baseDelay + offset); // Minimum 5ms to prevent overlap issues
  }
  
  /**
   * Get velocity multiplier with random variation
   * Simulates natural picking intensity variation
   */
  private getVelocityMultiplier(profile: { base: number; range: number }): number {
    const variation = (Math.random() - 0.5) * 2 * profile.range;
    return Math.max(0.3, Math.min(1.2, profile.base + variation));
  }
  
  /**
   * Select velocity layer based on intensity and randomization
   * Adds variation by occasionally selecting neighboring velocity layers
   */
  private selectVelocityLayer(intensity: 'light' | 'normal' | 'heavy'): 'soft' | 'medium' | 'hard' {
    const layers: Array<'soft' | 'medium' | 'hard'> = ['soft', 'medium', 'hard'];
    
    // Primary layer for each intensity
    const primaryLayer = {
      light: 'soft',
      normal: 'medium',
      heavy: 'hard',
    }[intensity] as 'soft' | 'medium' | 'hard';
    
    // 70% use primary layer, 30% use neighboring layer for variation
    if (Math.random() > 0.3) {
      return primaryLayer;
    }
    
    // Select neighboring layer
    const currentIndex = layers.indexOf(primaryLayer);
    const neighborOffset = Math.random() > 0.5 ? 1 : -1;
    const neighborIndex = Math.max(0, Math.min(layers.length - 1, currentIndex + neighborOffset));
    
    return layers[neighborIndex];
  }
  
  // ============================================================================
  // SOUND PLAYBACK & MANAGEMENT
  // ============================================================================
  
  /**
   * Get or create a sound instance from the pool
   */
  private async getSoundInstance(): Promise<Audio.Sound> {
    // Reuse pooled sound if available
    if (this.soundPool.length > 0) {
      return this.soundPool.pop()!;
    }
    
    // Create new sound instance
    const { sound } = await Audio.Sound.createAsync(
      { uri: '' }, // Will set URI when playing
      { shouldPlay: false },
      null,
      false // Don't download immediately
    );
    
    return sound;
  }
  
  /**
   * Return sound instance to pool or unload if pool is full
   */
  private async returnSoundToPool(sound: Audio.Sound): Promise<void> {
    if (this.soundPool.length < 6) { // Keep max 6 sounds in pool
      // Reset sound for reuse
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      this.soundPool.push(sound);
    } else {
      // Pool is full, unload the sound
      await sound.unloadAsync();
    }
  }
  
  /**
   * Play individual string sample
   */
  private async playStringSample(
    stringIndex: number,
    fret: number,
    velocity: 'soft' | 'medium' | 'hard',
    volumeMultiplier: number
  ): Promise<void> {
    // Load sample (from cache if available)
    const sampleUri = await this.loadSample(stringIndex, fret, velocity);
    
    if (!sampleUri) {
      // Fallback: Generate synthetic tone (simplified Karplus-Strong)
      console.log(`🎸 String ${stringIndex} fret ${fret} - using synthesis fallback`);
      await this.playSynthesizedString(stringIndex, fret, volumeMultiplier);
      return;
    }
    
    try {
      // Get sound instance from pool
      const sound = await this.getSoundInstance();
      
      // Load and play the sample
      await sound.loadAsync({ uri: sampleUri });
      await sound.setVolumeAsync(volumeMultiplier);
      await sound.playAsync();
      
      // Track active sound for cleanup
      const unloadTimer = setTimeout(async () => {
        await this.returnSoundToPool(sound);
        
        // Remove from active sounds
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
      console.error(`❌ Failed to play string sample:`, error);
    }
  }
  
  /**
   * Synthesis fallback for strings without samples
   * Simplified single-string Karplus-Strong
   */
  private async playSynthesizedString(
    stringIndex: number,
    fret: number,
    volumeMultiplier: number
  ): Promise<void> {
    // Generate simple plucked string tone
    const frequency = this.calculateStringFrequency(stringIndex, fret);
    const duration = 1.5; // seconds
    const sampleRate = 44100;
    
    // Create simple Karplus-Strong tone (lightweight version)
    const wavUri = this.generateSimpleStringTone(frequency, duration, sampleRate, volumeMultiplier);
    
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      // Schedule cleanup
      setTimeout(async () => {
        await sound.unloadAsync();
      }, duration * 1000 + 500);
      
    } catch (error) {
      console.error('❌ Synthesis fallback failed:', error);
    }
  }
  
  /**
   * Generate simple Karplus-Strong tone for single string
   * (Lightweight version optimized for mobile)
   */
  private generateSimpleStringTone(
    frequency: number,
    duration: number,
    sampleRate: number,
    volumeMultiplier: number
  ): string {
    const numSamples = Math.floor(sampleRate * duration);
    const delayLength = Math.round(sampleRate / frequency);
    
    // Mono buffer for efficiency
    const buffer = new Float32Array(numSamples);
    
    // Initialize delay line with noise
    const delayLine = new Float32Array(delayLength);
    for (let i = 0; i < delayLength; i++) {
      delayLine[i] = (Math.random() * 2 - 1) * 0.5;
    }
    
    // Karplus-Strong loop
    let writeIndex = 0;
    const damping = 0.996;
    
    for (let i = 0; i < numSamples; i++) {
      const currentSample = delayLine[writeIndex];
      const nextIndex = (writeIndex + 1) % delayLength;
      
      // Simple averaging filter
      const filtered = 0.5 * (currentSample + delayLine[nextIndex]) * damping;
      delayLine[writeIndex] = filtered;
      
      buffer[i] = currentSample * volumeMultiplier * 0.8;
      writeIndex = nextIndex;
    }
    
    // Convert to WAV
    return this.createMonoWAV(buffer, sampleRate);
  }
  
  /**
   * Create mono WAV file (optimized for mobile)
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
    
    // WAV header (same as stereo version but mono)
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
    
    // Convert to base64 data URI
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
  // PUBLIC API - CHORD STRUMMING
  // ============================================================================
  
  /**
   * Play chord with realistic strumming
   * 
   * This is the PRIMARY method for chord playback with the new strumming engine.
   * 
   * @param chord - Chord data with positions
   * @param config - Strumming configuration (optional)
   */
  async playChordWithStrum(
    chord: ChordData,
    config: Partial<StrumConfig> = {}
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Validate input
      if (!chord || !chord.positions) {
        throw new Error('Invalid chord data');
      }
      
      // Initialize audio mode (once per session)
      if (!this.audioInitialized) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        this.audioInitialized = true;
        console.log('✅ Strumming engine audio initialized');
      }
      
      // Default configuration
      const strumConfig: StrumConfig = {
        direction: config.direction || 'down',
        speed: config.speed || 'medium',
        intensity: config.intensity || 'normal',
        humanize: config.humanize !== undefined ? config.humanize : true,
      };
      
      console.log(`🎸 Strumming ${chord.name}:`, strumConfig);
      
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
      
      // Reverse order for upstroke
      if (strumConfig.direction === 'up') {
        playableStrings.reverse();
      }
      
      // Get timing profile
      const timingProfile = this.STRUM_TIMING[strumConfig.speed];
      const velocityProfile = this.VELOCITY_PROFILES[strumConfig.intensity];
      
      // Strum each string sequentially with humanization
      const strumPromises: Promise<void>[] = [];
      
      playableStrings.forEach((string, index) => {
        // Calculate delay for this string
        const baseDelay = index * timingProfile.base;
        const actualDelay = this.getHumanizedDelay(
          baseDelay,
          timingProfile.variance,
          strumConfig.humanize
        );
        
        // Select velocity layer with variation
        const velocityLayer = this.selectVelocityLayer(strumConfig.intensity);
        
        // Get volume multiplier with humanization
        const volumeMultiplier = this.getVelocityMultiplier(velocityProfile);
        
        // Schedule string playback
        const playPromise = new Promise<void>((resolve) => {
          setTimeout(async () => {
            await this.playStringSample(
              string.stringIndex,
              string.fret,
              velocityLayer,
              volumeMultiplier
            );
            resolve();
          }, actualDelay);
        });
        
        strumPromises.push(playPromise);
      });
      
      // Wait for all strings to be scheduled
      await Promise.all(strumPromises);
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Chord strum initiated in ${totalTime}ms`);
      
    } catch (error) {
      console.error('❌ Chord strum failed:', error);
      throw error;
    }
  }
  
  /**
   * Compatibility wrapper for existing playChordPreview() calls
   * Uses default strumming settings
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
   * Play chord with custom strum pattern
   * 
   * Example patterns:
   * - 'D D U U D U' (down, down, up, up, down, up)
   * - 'D x D U x D U' (down, mute, down, up, mute, down, up)
   */
  async playStrumPattern(
    chord: ChordData,
    pattern: string,
    tempo: number = 120 // BPM
  ): Promise<void> {
    const strokes = pattern.split(' ').filter(s => s.length > 0);
    const beatDuration = 60000 / tempo; // ms per beat
    
    for (let i = 0; i < strokes.length; i++) {
      const stroke = strokes[i];
      const delay = i * beatDuration;
      
      setTimeout(async () => {
        if (stroke === 'D') {
          await this.playChordWithStrum(chord, { direction: 'down', speed: 'fast' });
        } else if (stroke === 'U') {
          await this.playChordWithStrum(chord, { direction: 'up', speed: 'fast' });
        }
        // 'x' = muted strum (no playback)
      }, delay);
    }
  }
  
  /**
   * Stop all active sounds
   */
  async stopAll(): Promise<void> {
    console.log('🛑 Stopping all active sounds...');
    
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
    
    console.log('✅ All sounds stopped');
  }
  
  /**
   * Cleanup service and release resources
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up strumming audio service...');
    
    // Stop all active sounds
    await this.stopAll();
    
    // Clear sound pool
    const poolPromises = this.soundPool.map(sound => sound.unloadAsync());
    await Promise.all(poolPromises);
    this.soundPool = [];
    
    // Clear cache
    this.sampleCache.clear();
    
    console.log('✅ Strumming audio service cleaned up');
  }
  
  // ============================================================================
  // SAMPLE LIBRARY HELPERS
  // ============================================================================
  
  /**
   * Generate sample library from base recordings
   * 
   * This helper function can be used to create velocity-layered samples
   * from a base set of recordings by applying amplitude scaling.
   * 
   * NOTE: For production, use professional sample libraries or record
   * actual guitar samples at different velocities for best quality.
   */
  generateSampleVariations(
    baseRecordings: Map<string, ArrayBuffer>
  ): Map<string, ArrayBuffer> {
    console.log('🎹 Generating velocity-layered sample variations...');
    
    const variations = new Map<string, ArrayBuffer>();
    
    baseRecordings.forEach((audioData, key) => {
      // Parse base recording (assuming WAV format)
      const view = new DataView(audioData);
      
      // Create soft version (0.6× amplitude)
      variations.set(`${key}_soft`, this.scaleAmplitude(audioData, 0.6));
      
      // Use base as medium
      variations.set(`${key}_medium`, audioData);
      
      // Create hard version (1.2× amplitude with light clipping)
      variations.set(`${key}_hard`, this.scaleAmplitude(audioData, 1.2));
    });
    
    console.log(`✅ Generated ${variations.size} sample variations`);
    return variations;
  }
  
  /**
   * Scale amplitude of WAV file
   * (Simple implementation - for production use proper audio processing)
   */
  private scaleAmplitude(wavData: ArrayBuffer, scale: number): ArrayBuffer {
    const view = new DataView(wavData);
    const output = wavData.slice(0); // Clone
    const outputView = new DataView(output);
    
    // Assuming 16-bit PCM, data starts at byte 44
    for (let i = 44; i < wavData.byteLength; i += 2) {
      const sample = view.getInt16(i, true);
      const scaled = Math.max(-32768, Math.min(32767, sample * scale));
      outputView.setInt16(i, scaled, true);
    }
    
    return output;
  }
  
  /**
   * Get sample library statistics
   */
  getSampleStats(): {
    cached: number;
    poolSize: number;
    activeSounds: number;
  } {
    return {
      cached: this.sampleCache.size,
      poolSize: this.soundPool.length,
      activeSounds: this.activeSounds.length,
    };
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const strummingAudioService = new StrummingAudioService();
