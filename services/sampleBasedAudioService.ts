// Sample-Based Guitar Audio Service
// Hybrid approach: Real guitar samples for common chords + synthesis fallback
// Uses pre-recorded acoustic guitar samples for 100% authentic tone

import { ChordData } from '@/constants/musicData';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';

interface SampleMapping {
  chordName: string;
  assetPath: string;
  positions: number[]; // Fret positions to match
}

class SampleBasedAudioService {
  private audioInitialized: boolean = false;
  private sampleCache: Map<string, { uri: string; sound?: Audio.Sound }> = new Map();
  
  // CURATED SAMPLE LIBRARY - Common chords with authentic recordings
  // These samples are from Freesound.org (Creative Commons CC0 - royalty free)
  // Place WAV files in assets/audio/guitar-samples/ folder
  private readonly SAMPLE_LIBRARY: SampleMapping[] = [
    // Major chords (most common)
    { chordName: 'C', assetPath: require('@/assets/audio/guitar-samples/C-major.wav'), positions: [-1, 3, 2, 0, 1, 0] },
    { chordName: 'D', assetPath: require('@/assets/audio/guitar-samples/D-major.wav'), positions: [-1, -1, 0, 2, 3, 2] },
    { chordName: 'E', assetPath: require('@/assets/audio/guitar-samples/E-major.wav'), positions: [0, 2, 2, 1, 0, 0] },
    { chordName: 'F', assetPath: require('@/assets/audio/guitar-samples/F-major.wav'), positions: [-1, -1, 3, 2, 1, 1] },
    { chordName: 'G', assetPath: require('@/assets/audio/guitar-samples/G-major.wav'), positions: [3, 2, 0, 0, 0, 3] },
    { chordName: 'A', assetPath: require('@/assets/audio/guitar-samples/A-major.wav'), positions: [-1, 0, 2, 2, 2, 0] },
    
    // Minor chords
    { chordName: 'Am', assetPath: require('@/assets/audio/guitar-samples/A-minor.wav'), positions: [-1, 0, 2, 2, 1, 0] },
    { chordName: 'Dm', assetPath: require('@/assets/audio/guitar-samples/D-minor.wav'), positions: [-1, -1, 0, 2, 3, 1] },
    { chordName: 'Em', assetPath: require('@/assets/audio/guitar-samples/E-minor.wav'), positions: [0, 2, 2, 0, 0, 0] },
    
    // 7th chords
    { chordName: 'G7', assetPath: require('@/assets/audio/guitar-samples/G7.wav'), positions: [3, 2, 0, 0, 0, 1] },
    { chordName: 'C7', assetPath: require('@/assets/audio/guitar-samples/C7.wav'), positions: [-1, 3, 2, 3, 1, 0] },
    { chordName: 'D7', assetPath: require('@/assets/audio/guitar-samples/D7.wav'), positions: [-1, -1, 0, 2, 1, 2] },
  ];

  /**
   * Find matching sample for chord
   * Returns sample if exact match found, null otherwise
   */
  private findMatchingSample(chord: ChordData): SampleMapping | null {
    // Try exact name match first
    let match = this.SAMPLE_LIBRARY.find(s => s.chordName === chord.name);
    if (match) {
      console.log(`✅ Exact name match found: ${chord.name}`);
      return match;
    }
    
    // Try position-based matching (for chords with alternate names)
    match = this.SAMPLE_LIBRARY.find(s => 
      s.positions.length === chord.positions.length &&
      s.positions.every((pos, idx) => pos === chord.positions[idx])
    );
    
    if (match) {
      console.log(`✅ Position match found: ${chord.name} → ${match.chordName}`);
      return match;
    }
    
    console.log(`⚠️ No sample found for ${chord.name}, will use synthesis fallback`);
    return null;
  }

  /**
   * Load and cache audio sample
   */
  private async loadSample(sample: SampleMapping): Promise<string> {
    const cacheKey = sample.chordName;
    
    // Return cached URI if available
    if (this.sampleCache.has(cacheKey)) {
      const cached = this.sampleCache.get(cacheKey)!;
      console.log(`✅ Using cached sample: ${cacheKey}`);
      return cached.uri;
    }
    
    try {
      console.log(`📦 Loading sample: ${cacheKey}...`);
      
      // Load asset using Expo Asset system
      const asset = Asset.fromModule(sample.assetPath);
      await asset.downloadAsync();
      
      if (!asset.localUri) {
        throw new Error(`Failed to load asset for ${cacheKey}`);
      }
      
      // Cache the URI
      this.sampleCache.set(cacheKey, { uri: asset.localUri });
      console.log(`✅ Sample loaded and cached: ${cacheKey}`);
      
      return asset.localUri;
      
    } catch (error) {
      console.error(`❌ Failed to load sample ${cacheKey}:`, error);
      throw error;
    }
  }

  /**
   * Play chord using sample-based playback or synthesis fallback
   * PRIMARY METHOD - automatically chooses best approach
   */
  async playChordPreview(chord: ChordData): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🎵 Starting sample-based chord playback:', chord.name);
      
      // Validate input
      if (!chord || !chord.positions) {
        throw new Error('Invalid input: expected ChordData object');
      }
      
      // Initialize audio mode for iOS (only once per session)
      if (!this.audioInitialized) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        this.audioInitialized = true;
        console.log('✅ Audio mode initialized');
      }
      
      // Try to find matching sample
      const matchingSample = this.findMatchingSample(chord);
      
      if (matchingSample) {
        // SAMPLE-BASED PLAYBACK - Authentic guitar recording
        console.log(`🎸 Playing authentic guitar sample: ${matchingSample.chordName}`);
        
        try {
          const sampleUri = await this.loadSample(matchingSample);
          
          const loadTime = Date.now() - startTime;
          console.log(`📱 Sample loaded in ${loadTime}ms, playing...`);
          
          // Play the authentic guitar sample
          const { sound } = await Audio.Sound.createAsync(
            { uri: sampleUri },
            { shouldPlay: true, volume: 1.0 }
          );
          
          const totalTime = Date.now() - startTime;
          console.log(`✅ Sample playback started in ${totalTime}ms total`);
          
          // Cleanup after playback (samples are typically 2-4 seconds)
          setTimeout(async () => {
            await sound.unloadAsync();
            console.log('🧹 Sample cleanup complete');
          }, 4000);
          
          return;
          
        } catch (sampleError) {
          console.error('⚠️ Sample playback failed, falling back to synthesis:', sampleError);
          // Fall through to synthesis fallback
        }
      }
      
      // SYNTHESIS FALLBACK - For chords without samples
      console.log('🎹 Using synthesis fallback for:', chord.name);
      await this.playSynthesizedChord(chord);
      
    } catch (error) {
      console.error('❌ Chord playback failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Chord playback error: ${errorMessage}`);
    }
  }

  /**
   * Synthesized chord playback (fallback for uncommon chords)
   * Simplified synthesis optimized for mobile performance
   */
  private async playSynthesizedChord(chord: ChordData): Promise<void> {
    console.log('⚠️ SYNTHESIS FALLBACK: This chord should have a sample for best quality');
    console.log('📝 TODO: Record and add sample for:', chord.name);
    
    // Import the synthesis-based audioService for fallback
    const { audioService } = await import('./audioService');
    await audioService.playChordPreview(chord);
  }

  /**
   * Preload common chord samples for instant playback
   * Call this during app initialization for better performance
   */
  async preloadCommonSamples(): Promise<void> {
    console.log('📦 Preloading common chord samples...');
    
    // Preload most common chords (C, G, D, Em, Am)
    const commonChords = ['C', 'G', 'D', 'Em', 'Am'];
    const preloadPromises = this.SAMPLE_LIBRARY
      .filter(s => commonChords.includes(s.chordName))
      .map(s => this.loadSample(s).catch(err => {
        console.warn(`⚠️ Failed to preload ${s.chordName}:`, err);
      }));
    
    await Promise.all(preloadPromises);
    console.log('✅ Common samples preloaded');
  }

  /**
   * Get sample library statistics
   */
  getSampleStats(): { total: number; cached: number; missing: string[] } {
    return {
      total: this.SAMPLE_LIBRARY.length,
      cached: this.sampleCache.size,
      missing: this.SAMPLE_LIBRARY
        .filter(s => !this.sampleCache.has(s.chordName))
        .map(s => s.chordName)
    };
  }

  /**
   * Cleanup cached samples
   */
  async cleanup(): Promise<void> {
    console.log('🧹 Cleaning up sample cache...');
    
    // Unload all cached sounds
    const unloadPromises = Array.from(this.sampleCache.values())
      .filter(cache => cache.sound)
      .map(cache => cache.sound!.unloadAsync());
    
    await Promise.all(unloadPromises);
    this.sampleCache.clear();
    
    console.log('✅ Sample cache cleared');
  }
}

export const sampleBasedAudioService = new SampleBasedAudioService();
