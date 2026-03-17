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
   * Generate WAV file using Karplus-Strong algorithm
   * Industry-standard physical modeling for realistic plucked string synthesis
   */
  private generateGuitarWAV(chord: ChordData, duration: number = 2.5): string {
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
    
    console.log(`🎸 Karplus-Strong synthesis for ${stringsToPlay.length} strings:`, stringsToPlay.map(s => `${s.frequency.toFixed(1)}Hz`).join(', '));
    
    // Karplus-Strong synthesis for each string
    stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
      const strumDelay = arrayIndex * 0.015; // 15ms strum delay
      const startSample = Math.floor(strumDelay * sampleRate);
      
      // Calculate delay line length for this frequency
      const delayLength = Math.round(sampleRate / frequency);
      
      // Initialize delay line with random noise (simulates initial pluck)
      const delayLine = new Float32Array(delayLength);
      for (let j = 0; j < delayLength; j++) {
        // Random noise between -1 and 1
        delayLine[j] = (Math.random() * 2 - 1);
      }
      
      // Velocity variation
      const velocityCurve = arrayIndex === 0 || arrayIndex === stringsToPlay.length - 1 ? 0.75 : 0.9;
      const baseAmplitude = (stringIndex > 3 ? 0.35 : 0.32) * velocityCurve;
      
      // Stereo panning
      const panValue = stringIndex < 3 ? -0.15 + (stringIndex * 0.075) : (stringIndex - 3) * 0.10;
      const leftGain = panValue <= 0 ? 1 : 1 - panValue;
      const rightGain = panValue >= 0 ? 1 : 1 + panValue;
      
      // Damping factor for Karplus-Strong (controls decay rate)
      // Higher frequencies decay faster (realistic physics)
      const dampingBase = stringIndex > 3 ? 0.9965 : 0.9975;
      const frequencyFactor = Math.min(1, frequency / 400); // More damping for higher freqs
      const damping = dampingBase - (frequencyFactor * 0.002);
      
      // Low-pass filter coefficient (smooths the sound, removes harshness)
      const lpfCoeff = 0.5; // Simple averaging filter
      
      let writeIndex = 0;
      let prevOutput = 0;
      
      // Generate samples using Karplus-Strong algorithm
      for (let i = startSample; i < durationSamples; i++) {
        // Read from delay line
        let currentSample = delayLine[writeIndex];
        
        // Apply Karplus-Strong loop filter (average with previous + damping)
        // This is the KEY to realistic guitar sound!
        const nextIndex = (writeIndex + 1) % delayLength;
        const filteredSample = lpfCoeff * (currentSample + delayLine[nextIndex]) * damping;
        
        // Write filtered sample back to delay line (feedback loop)
        delayLine[writeIndex] = filteredSample;
        
        // Output sample with amplitude scaling
        let outputSample = currentSample * baseAmplitude;
        
        // Simple body resonance (subtle low-frequency modulation)
        const t = (i - startSample) / sampleRate;
        const bodyResonance = 1 + (Math.sin(2 * Math.PI * 3.5 * t) * 0.015);
        outputSample *= bodyResonance;
        
        // High-pass filter to remove DC offset and sub-bass
        const highPassFiltered = outputSample - (0.97 * prevOutput);
        prevOutput = outputSample;
        outputSample = highPassFiltered;
        
        // Move to next position in delay line
        writeIndex = nextIndex;
        
        // Add to stereo channels with panning
        leftChannel[i] += outputSample * leftGain;
        rightChannel[i] += outputSample * rightGain;
      }
    });
    
    // Dynamic compression + DC offset removal
    let maxPeak = 0;
    let leftDCOffset = 0;
    let rightDCOffset = 0;
    
    // Calculate DC offset
    for (let i = 0; i < durationSamples; i++) {
      leftDCOffset += leftChannel[i];
      rightDCOffset += rightChannel[i];
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    leftDCOffset /= durationSamples;
    rightDCOffset /= durationSamples;
    
    // Remove DC offset and normalize
    const normalizeRatio = maxPeak > 0.75 ? 0.75 / maxPeak : 1.0;
    for (let i = 0; i < durationSamples; i++) {
      leftChannel[i] = (leftChannel[i] - leftDCOffset) * normalizeRatio * 2.2;
      rightChannel[i] = (rightChannel[i] - rightDCOffset) * normalizeRatio * 2.2;
    }
    
    // Natural fade-out (last 100ms)
    const fadeOutStart = durationSamples - Math.floor(sampleRate * 0.1);
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
