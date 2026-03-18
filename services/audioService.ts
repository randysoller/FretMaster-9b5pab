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
   * Generate guitar chord audio using Karplus-Strong synthesis
   * Based on André Michelle's acclaimed implementation
   */
  private generateGuitarWAV(chord: ChordData, duration: number = 2.5): string {
    const sampleRate = 44100;
    const durationSamples = Math.floor(sampleRate * duration);
    
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
    
    // André Michelle parameters (the secret sauce!)
    const characterVariation = 0.25;  // Variation between strings
    const stringDamping = 0.5;        // Base string decay rate
    const stringDampingVariation = 0.25; // Damping randomness
    const pluckDamping = 0.5;         // Initial pluck brightness
    const pluckDampingVariation = 0.25;  // Pluck randomness
    const stereoSpread = 0.2;         // Stereo width
    
    // Synthesize each string
    stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
      const strumDelay = arrayIndex * 0.015; // 15ms strum spacing
      const startSample = Math.floor(strumDelay * sampleRate);
      
      const delayLength = Math.round(sampleRate / frequency);
      if (delayLength < 10 || delayLength > 5000) return;
      
      const delayLine = new Float32Array(delayLength);
      
      // Character variation - each string sounds slightly different
      const characterRandom = (Math.random() - 0.5) * characterVariation;
      
      // "Magic" damping calculation (André Michelle's formula)
      // This is the key to realistic tone!
      const targetDamping = 1.0 - (1.0 / delayLength);
      const dampingVariation = (Math.random() - 0.5) * stringDampingVariation;
      const stringDamp = targetDamping * (1.0 - stringDamping) + dampingVariation;
      const finalDamping = Math.max(0.1, Math.min(0.9999, stringDamp));
      
      // Pluck damping (controls initial brightness)
      const pluckDampVariation = (Math.random() - 0.5) * pluckDampingVariation;
      const pluckDamp = pluckDamping + pluckDampVariation;
      
      // Initialize with noise, but apply pluck damping
      let prevNoise = 0;
      for (let j = 0; j < delayLength; j++) {
        const noise = (Math.random() * 2 - 1) * 0.5;
        // Apply low-pass to initial pluck for warmth
        const dampedNoise = noise * (1.0 - pluckDamp) + prevNoise * pluckDamp;
        delayLine[j] = dampedNoise + characterRandom;
        prevNoise = dampedNoise;
      }
      
      // Base amplitude (stronger for bass strings)
      const baseAmplitude = (stringIndex < 3 ? 0.35 : 0.30) / Math.max(1, stringsToPlay.length * 0.8);
      
      // Stereo positioning with spread
      const panPosition = (stringIndex - 2.5) / 5.0; // -0.5 to +0.5
      const spreadOffset = (Math.random() - 0.5) * stereoSpread;
      const finalPan = Math.max(-1, Math.min(1, panPosition + spreadOffset));
      
      // Convert pan to gains (equal power panning)
      const panAngle = (finalPan + 1.0) * 0.25 * Math.PI; // 0 to π/2
      const leftGain = Math.cos(panAngle);
      const rightGain = Math.sin(panAngle);
      
      let writeIndex = 0;
      let prevSample1 = 0;
      let prevSample2 = 0;
      
      // Generate samples with Karplus-Strong feedback loop
      for (let i = startSample; i < durationSamples; i++) {
        const t = (i - startSample) / sampleRate;
        
        // Natural exponential decay
        const envelope = Math.exp(-t * 0.5) * (t < 0.005 ? t / 0.005 : 1.0);
        
        const currentSample = delayLine[writeIndex];
        const nextIndex = (writeIndex + 1) % delayLength;
        const nextSample = delayLine[nextIndex];
        
        // Improved averaging filter with damping
        const averaged = 0.5 * (currentSample + nextSample);
        const damped = averaged * finalDamping;
        
        delayLine[writeIndex] = isFinite(damped) ? damped : 0;
        
        // Output with envelope
        let output = currentSample * baseAmplitude * envelope;
        
        // Two-pole high-pass filter (better DC removal)
        const highPassed = output - (1.96 * prevSample1) + (0.96 * prevSample2);
        prevSample2 = prevSample1;
        prevSample1 = output;
        output = highPassed * 0.5; // Scale down high-pass output
        
        if (!isFinite(output)) output = 0;
        
        // Add to stereo channels
        leftChannel[i] += output * leftGain;
        rightChannel[i] += output * rightGain;
        
        writeIndex = nextIndex;
      }
    });
    
    console.log('✅ André Michelle Karplus-Strong synthesis complete');
    
    // Validate audio data (catch any NaN/Infinity before processing)
    let hasInvalidData = false;
    for (let i = 0; i < durationSamples; i++) {
      if (!isFinite(leftChannel[i]) || !isFinite(rightChannel[i])) {
        leftChannel[i] = 0;
        rightChannel[i] = 0;
        hasInvalidData = true;
      }
    }
    if (hasInvalidData) {
      console.warn('⚠️ Invalid audio data detected and cleaned');
    }
    
    // Find peak level
    let maxPeak = 0;
    for (let i = 0; i < durationSamples; i++) {
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    
    // Normalize to safe level
    const targetPeak = 0.7;
    const normalizeRatio = maxPeak > 0.001 ? targetPeak / maxPeak : 1.0;
    
    console.log(`🎚️ Normalizing: peak=${maxPeak.toFixed(3)}, ratio=${normalizeRatio.toFixed(2)}`);
    
    for (let i = 0; i < durationSamples; i++) {
      leftChannel[i] = Math.max(-0.95, Math.min(0.95, leftChannel[i] * normalizeRatio));
      rightChannel[i] = Math.max(-0.95, Math.min(0.95, rightChannel[i] * normalizeRatio));
    }
    
    // Smooth fade-out (last 150ms)
    const fadeOutStart = durationSamples - Math.floor(sampleRate * 0.15);
    for (let i = fadeOutStart; i < durationSamples; i++) {
      const fadeProgress = (i - fadeOutStart) / (durationSamples - fadeOutStart);
      const fadeFactor = Math.pow(1 - fadeProgress, 2);
      leftChannel[i] *= fadeFactor;
      rightChannel[i] *= fadeFactor;
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
      
      // Generate WAV using Karplus-Strong algorithm
      const wavDataUri = this.generateGuitarWAV(chord, 2.5); // 2.5 seconds - natural decay
      
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
      }, 2800); // 2.8s cleanup (300ms buffer after 2.5s audio)
      
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
