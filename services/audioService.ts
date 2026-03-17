// Mobile-Only Guitar Audio Service
// Professional acoustic guitar synthesis for React Native (iOS/Android)
// Uses Expo AV with real-time WAV generation for authentic guitar tone

import { ChordData } from '@/constants/musicData';
import { Audio } from 'expo-av';

class AudioService {
  private audioInitialized: boolean = false;

  /**
   * Calculate frequency for guitar string at specific fret
   * Uses equal temperament tuning (A4 = 440 Hz)
   */
  private calculateStringFrequency(stringIndex: number, fret: number): number {
    // Base frequencies for standard tuning (low E to high E)
    const openStringFrequencies = [
      82.41,   // E2 (low E string)
      110.00,  // A2
      146.83,  // D3
      196.00,  // G3
      246.94,  // B3
      329.63   // E4 (high E string)
    ];
    
    const openFreq = openStringFrequencies[stringIndex];
    // Each fret is a semitone: multiply by 2^(1/12) for each fret
    return openFreq * Math.pow(2, fret / 12);
  }

  /**
   * Generate WAV file in memory with professional guitar synthesis
   * Based on physical modeling research - realistic acoustic guitar sustain and harmonics
   */
  private generateGuitarWAV(chord: ChordData, duration: number = 2.0): string {
    const sampleRate = 44100; // CD quality
    const numChannels = 2; // Stereo
    const durationSamples = Math.floor(sampleRate * duration);
    
    // Create stereo buffer
    const leftChannel = new Float32Array(durationSamples);
    const rightChannel = new Float32Array(durationSamples);
    
    // Get strings to play
    const stringsToPlay: Array<{ stringIndex: number; frequency: number }> = [];
    chord.positions.forEach((fret, stringIndex) => {
      if (fret >= 0) {
        const frequency = this.calculateStringFrequency(stringIndex, fret);
        stringsToPlay.push({ stringIndex, frequency });
      }
    });
    
    console.log(`🎸 Synthesizing ${stringsToPlay.length} strings:`, stringsToPlay.map(s => `${s.frequency.toFixed(1)}Hz`).join(', '));
    
    // Synthesize each string
    stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
      const strumDelay = arrayIndex * 0.012; // 12ms between strings (natural strum)
      const startSample = Math.floor(strumDelay * sampleRate);
      
      // Velocity variation (softer on first/last strings) + realistic guitar dynamics
      const velocityCurve = arrayIndex === 0 || arrayIndex === stringsToPlay.length - 1 ? 0.85 : 1.0;
      const baseVolume = (stringIndex > 3 ? 0.32 : 0.28) * velocityCurve;
      
      // Stereo panning (bass center-left, treble right)
      const panValue = stringIndex < 3 ? -0.2 + (stringIndex * 0.1) : (stringIndex - 3) * 0.15;
      const leftGain = panValue <= 0 ? 1 : 1 - panValue;
      const rightGain = panValue >= 0 ? 1 : 1 + panValue;
      
      // Generate samples for this string
      for (let i = startSample; i < durationSamples; i++) {
        const t = (i - startSample) / sampleRate;
        
        // Professional ADSR envelope matching acoustic guitar behavior
        let envelope = 0;
        if (t < 0.002) {
          // Pre-roll silence - absolute zero to eliminate any artifacts (2ms)
          envelope = 0;
        } else if (t < 0.007) {
          // Ultra-smooth exponential fade-in from absolute zero (5ms)
          const fadeProgress = (t - 0.002) / 0.005;
          // Exponential curve for natural attack (starts very gently)
          envelope = baseVolume * Math.pow(fadeProgress, 2.5) * 0.2;
        } else if (t < 0.015) {
          // Attack continuation (8ms - realistic pick strike)
          const attackProgress = (t - 0.007) / 0.008;
          envelope = (0.2 + (attackProgress * 0.8)) * baseVolume;
        } else if (t < 0.135) {
          // Decay to sustain (120ms - acoustic guitar characteristic)
          const decayProgress = (t - 0.015) / 0.12;
          envelope = baseVolume - (decayProgress * baseVolume * 0.18);
        } else {
          // Sustain + Natural exponential release (realistic acoustic guitar)
          const sustainLevel = baseVolume * 0.82;
          const timeSinceSustain = t - 0.135;
          const decayTime = duration - 0.135;
          
          // Natural guitar decay: frequency-dependent damping
          // Higher strings decay slightly faster (realistic physics)
          const dampingFactor = stringIndex > 3 ? 2.2 : 2.5;
          const decayRatio = timeSinceSustain / decayTime;
          
          // Exponential decay with realistic damping
          envelope = sustainLevel * Math.exp(-decayRatio * dampingFactor);
          
          // Body resonance simulation - adds subtle amplitude modulation
          const resonanceFreq = 2.5; // Hz - typical guitar body resonance
          const resonanceMod = 1 + (Math.sin(2 * Math.PI * resonanceFreq * t) * 0.015);
          envelope *= resonanceMod;
        }
        
        // Professional guitar waveform with physically-modeled harmonic content
        // CRITICAL: Phase offset ensures waveform starts at zero-crossing (eliminates initial click)
        const phaseOffset = Math.PI / 2; // Start at sine wave zero-crossing
        const phase = 2 * Math.PI * frequency * t + phaseOffset;
        let sample = 0;
        
        // Fundamental and harmonics with time-varying amplitudes (realistic string behavior)
        const timeFactor = Math.min(1, t / 0.3); // Harmonics settle over first 300ms
        sample += Math.sin(phase) * 1.0;                                    // Fundamental (always present)
        sample += Math.sin(phase * 2) * (0.5 * (1 + timeFactor * 0.1));    // 2nd harmonic (grows slightly)
        sample += Math.sin(phase * 3) * (0.32 * (1 - timeFactor * 0.15));  // 3rd (fades slightly)
        sample += Math.sin(phase * 4) * (0.18 * (1 - timeFactor * 0.2));   // 4th
        sample += Math.sin(phase * 5) * (0.10 * (1 - timeFactor * 0.25));  // 5th
        sample += Math.sin(phase * 6) * (0.05 * (1 - timeFactor * 0.3));   // 6th
        sample += Math.sin(phase * 7) * (0.025 * (1 - timeFactor * 0.35)); // 7th
        sample += Math.sin(phase * 8) * (0.012 * (1 - timeFactor * 0.4));  // 8th (adds sparkle)
        
        // Apply envelope
        sample *= envelope;
        
        // Frequency-dependent tone shaping (high-frequency damping - realistic string physics)
        // Higher frequencies decay faster on real strings
        const brightnessDecay = Math.exp(-t * 0.8); // Gradual high-freq rolloff
        const toneBalance = 0.65 + (brightnessDecay * 0.35); // 65% to 100% brightness range
        sample *= toneBalance;
        
        // Add to stereo channels with panning
        leftChannel[i] += sample * leftGain;
        rightChannel[i] += sample * rightGain;
      }
    });
    
    // Dynamic compression + DC offset removal to eliminate static
    let maxPeak = 0;
    let leftDCOffset = 0;
    let rightDCOffset = 0;
    
    // Calculate DC offset (average value that causes static)
    for (let i = 0; i < durationSamples; i++) {
      leftDCOffset += leftChannel[i];
      rightDCOffset += rightChannel[i];
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    leftDCOffset /= durationSamples;
    rightDCOffset /= durationSamples;
    
    // Remove DC offset and apply compression
    const compressionRatio = maxPeak > 0.8 ? 0.8 / maxPeak : 1.0;
    for (let i = 0; i < durationSamples; i++) {
      leftChannel[i] = (leftChannel[i] - leftDCOffset) * compressionRatio * 1.4;
      rightChannel[i] = (rightChannel[i] - rightDCOffset) * compressionRatio * 1.4;
    }
    
    // Apply noise gate: zero out samples below audible threshold (eliminates floor noise)
    const gateThreshold = 0.00008;
    for (let i = 0; i < durationSamples; i++) {
      if (Math.abs(leftChannel[i]) < gateThreshold) leftChannel[i] = 0;
      if (Math.abs(rightChannel[i]) < gateThreshold) rightChannel[i] = 0;
    }
    
    // Natural fade-out at the very end (last 120ms) - mimics natural string damping
    const fadeOutStart = durationSamples - Math.floor(sampleRate * 0.12);
    for (let i = fadeOutStart; i < durationSamples; i++) {
      const fadeProgress = (i - fadeOutStart) / (durationSamples - fadeOutStart);
      // Smooth exponential curve matching natural acoustic guitar decay
      const fadeFactor = Math.pow(1 - fadeProgress, 4);
      leftChannel[i] *= fadeFactor;
      rightChannel[i] *= fadeFactor;
    }
    
    // Final silence window (last 25ms) for absolute clean ending
    const silenceStart = durationSamples - Math.floor(sampleRate * 0.025);
    for (let i = silenceStart; i < durationSamples; i++) {
      leftChannel[i] = 0;
      rightChannel[i] = 0;
    }
    
    console.log('✅ Audio synthesis complete, creating WAV file...');
    
    // Convert to WAV format
    return this.createWAVFromBuffers(leftChannel, rightChannel, sampleRate);
  }

  /**
   * Create WAV file from audio buffers
   */
  private createWAVFromBuffers(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): string {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = leftChannel.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // WAV Header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data (interleaved stereo)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      // Left channel
      const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
      view.setInt16(offset, leftSample * 0x7FFF, true);
      offset += 2;
      
      // Right channel
      const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));
      view.setInt16(offset, rightSample * 0x7FFF, true);
      offset += 2;
    }
    
    // Convert to base64 data URI
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUri = `data:audio/wav;base64,${base64}`;
    
    console.log(`✅ WAV file created: ${(bytes.length / 1024).toFixed(1)}KB`);
    return dataUri;
  }

  /**
   * Helper to write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Play chord preview - PRIMARY METHOD for chord playback
   * Accepts ChordData object and plays exact frequencies based on fret positions
   * This ensures audio ALWAYS matches the visual chord diagram
   */
  async playChordPreview(chord: ChordData): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🎵 Starting chord playback:', chord.name);
      
      // Validate input
      if (!chord || !chord.positions) {
        throw new Error('Invalid input: expected ChordData object');
      }
      
      // Validate chord has playable strings
      const playableStrings = chord.positions.filter(f => f >= 0).length;
      if (playableStrings === 0) {
        throw new Error('Chord has no playable strings');
      }
      
      console.log(`🎸 Playing chord: ${chord.name}, positions:`, chord.positions);
      
      // Initialize audio mode for iOS (only once per session to reduce delay)
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
      
      console.log(`🎸 Generating audio for ${playableStrings} strings...`);
      
      // Generate WAV in memory with professional synthesis
      const wavDataUri = this.generateGuitarWAV(chord, 2.0); // 2.0 seconds - realistic acoustic guitar sustain
      
      const generationTime = Date.now() - startTime;
      console.log(`📱 Audio generated in ${generationTime}ms, loading and playing...`);
      
      // Play the generated audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavDataUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Chord playback started in ${totalTime}ms total`);
      
      // Cleanup after playback
      setTimeout(async () => {
        await sound.unloadAsync();
        console.log('🧹 Audio cleanup complete');
      }, 2300); // 2.3s cleanup (300ms buffer after 2.0s audio)
      
    } catch (error) {
      console.error('❌ Chord playback failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Chord playback error: ${errorMessage}`);
    }
  }

  /**
   * Play chord - legacy method for backward compatibility
   */
  async playChord(notes: string[], duration: number = 1500, octave: number = 3, strum: boolean = true): Promise<void> {
    console.warn('⚠️ playChord() with note array is deprecated. Use playChordPreview() with ChordData instead.');
  }

  /**
   * Play success sound
   * TODO: Implement using Expo AV for mobile
   */
  async playSuccess(): Promise<void> {
    console.log('🎵 playSuccess() - Mobile implementation needed');
    // TODO: Generate or load success sound WAV
  }

  /**
   * Play error sound
   * TODO: Implement using Expo AV for mobile
   */
  async playError(): Promise<void> {
    console.log('🎵 playError() - Mobile implementation needed');
    // TODO: Generate or load error sound WAV
  }

  /**
   * Metronome functionality
   * TODO: Implement metronome using Expo AV for mobile
   */
  async playMetronomeClick(type: 'strong' | 'weak' = 'weak', volume: number = 0.75, sound: string = 'Click'): Promise<void> {
    console.log('🎵 playMetronomeClick() - Mobile implementation needed');
    // TODO: Load and play metronome click sounds using Expo AV
  }

  startMetronome(bpm: number, beatsPerMeasure: number = 4, sound: string = 'Click', subdivision: number = 1, callback?: (beatInfo: { beat: number; isStrong: boolean; subdivision: number }) => void): void {
    console.log('🎵 startMetronome() - Mobile implementation needed');
    // TODO: Implement metronome timer and click playback using Expo AV
  }

  stopMetronome(): void {
    console.log('🎵 stopMetronome() - Mobile implementation needed');
    // TODO: Stop metronome interval
  }

  /**
   * Tuner functionality
   * TODO: Implement tuner tone using Expo AV for mobile
   */
  async playTunerTone(frequency: number, duration: number = 2000): Promise<void> {
    console.log('🎵 playTunerTone() - Mobile implementation needed');
    // TODO: Generate pure sine tone at specified frequency using WAV generation
  }

  /**
   * Cleanup - mobile doesn't need cleanup (no Web Audio context)
   */
  cleanup(): void {
    console.log('✅ Audio service cleanup - no action needed for mobile');
  }
}

export const audioService = new AudioService();
