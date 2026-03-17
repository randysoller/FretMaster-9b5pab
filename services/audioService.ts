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
   * OPTIMIZED: Percussive pluck attack, NOT trumpet-like sustain
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
    
    // Generate random harmonic phases per string (eliminates initial transient spike)
    const harmonicPhases: number[][] = [];
    stringsToPlay.forEach(() => {
      const phases = [Math.PI / 2]; // Fundamental always at zero-crossing
      // Randomize phases for harmonics 2-8 to prevent constructive interference
      for (let h = 2; h <= 8; h++) {
        phases.push(Math.random() * Math.PI * 2);
      }
      harmonicPhases.push(phases);
    });
    
    // Synthesize each string
    stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
      const strumDelay = arrayIndex * 0.012; // 12ms between strings (natural strum)
      const startSample = Math.floor(strumDelay * sampleRate);
      
      // Velocity variation (softer on first/last strings) + realistic guitar dynamics
      const velocityCurve = arrayIndex === 0 || arrayIndex === stringsToPlay.length - 1 ? 0.85 : 1.0;
      // Base volume optimized for guitar (NOT trumpet)
      const baseVolume = (stringIndex > 3 ? 0.48 : 0.43) * velocityCurve;
      
      // Tighter stereo field for more centered power
      const panValue = stringIndex < 3 ? -0.12 + (stringIndex * 0.06) : (stringIndex - 3) * 0.09;
      const leftGain = panValue <= 0 ? 1 : 1 - panValue;
      const rightGain = panValue >= 0 ? 1 : 1 + panValue;
      
      // High-pass filter state (eliminates sub-audible rumble)
      let prevSample = 0;
      const hpfCoeff = 0.98; // Cutoff ~15 Hz
      
      // Generate samples for this string
      for (let i = startSample; i < durationSamples; i++) {
        const t = (i - startSample) / sampleRate;
        
        // PERCUSSIVE GUITAR ENVELOPE (NOT trumpet-like sustain)
        let envelope = 0;
        if (t < 0.002) {
          // Brief pre-roll silence (2ms - minimal)
          envelope = 0;
        } else if (t < 0.008) {
          // SHARP PLUCK ATTACK - percussive like guitar pick hitting strings (6ms)
          const attackProgress = (t - 0.002) / 0.006;
          // Sharper exponential curve for percussive guitar attack (power 1.8 - NOT trumpet-smooth)
          envelope = baseVolume * Math.pow(attackProgress, 1.8);
        } else if (t < 0.025) {
          // Immediate fast decay after pluck (17ms - guitar strings settle quickly)
          const decayProgress = (t - 0.008) / 0.017;
          // Fast exponential drop (NOT sustained like trumpet)
          envelope = baseVolume * (1.0 - (decayProgress * 0.35));
        } else if (t < 0.080) {
          // Secondary decay to sustain (55ms - faster than trumpet, like plucked string)
          const decayProgress = (t - 0.025) / 0.055;
          envelope = baseVolume * 0.65 * (1.0 - (decayProgress * 0.15));
        } else {
          // Natural plucked string decay - FASTER than trumpet (guitar strings don't sustain like brass)
          const sustainLevel = baseVolume * 0.55; // LOWER sustain (not trumpet-like)
          const timeSinceSustain = t - 0.080;
          const decayTime = duration - 0.080;
          
          // AGGRESSIVE guitar string damping (NOT sustained like trumpet)
          // Higher strings decay faster (realistic physics)
          const dampingFactor = stringIndex > 3 ? 3.2 : 3.8; // INCREASED damping (guitar, not trumpet)
          const decayRatio = timeSinceSustain / decayTime;
          
          // Fast exponential decay matching plucked guitar strings
          envelope = sustainLevel * Math.exp(-decayRatio * dampingFactor);
          
          // Minimal body resonance (guitar strings, not trumpet vibrato)
          const resonanceFreq = 2.8; // Hz - guitar body resonance
          const lowFreqResonance = Math.sin(2 * Math.PI * resonanceFreq * t);
          const resonanceMod = 1 + (lowFreqResonance * 0.008); // Minimal (not trumpet vibrato)
          envelope *= resonanceMod;
        }
        
        // GUITAR-LIKE HARMONIC SYNTHESIS (NOT trumpet-like)
        // Key differences from trumpet:
        // 1. FAST harmonic decay (plucked string physics, not sustained brass)
        // 2. Stronger upper harmonics during attack (percussive pick strike)
        // 3. Rapid high-frequency rolloff (string damping, not brass resonance)
        const phase = 2 * Math.PI * frequency * t;
        let sample = 0;
        
        // Time-based harmonic decay (AGGRESSIVE - guitar strings, not trumpet)
        const attackPhase = Math.min(1, t / 0.015); // First 15ms - percussive attack
        const decayPhase = Math.min(1, t / 0.3);    // Fast 300ms decay (not trumpet sustain)
        
        // GUITAR-SPECIFIC HARMONIC CONTENT:
        // - Moderate fundamental (not trumpet-dominant)
        // - Bright attack harmonics (pick strike)
        // - FAST decay on upper harmonics (plucked string physics)
        
        // Fundamental - moderate strength (not trumpet-powerful)
        sample += Math.sin(phase + harmonicPhases[arrayIndex][0]) * 1.0;
        
        // 2nd harmonic - strong during attack, decays moderately
        const h2Decay = 1 - (decayPhase * 0.25);
        sample += Math.sin(phase * 2 + harmonicPhases[arrayIndex][1]) * (0.65 * h2Decay);
        
        // 3rd harmonic - bright attack, faster decay (guitar characteristic)
        const h3Decay = 1 - (decayPhase * 0.35);
        const h3Attack = 1 + (attackPhase * 0.4); // Boost during pick attack
        sample += Math.sin(phase * 3 + harmonicPhases[arrayIndex][2]) * (0.52 * h3Decay * h3Attack);
        
        // 4th harmonic - percussive attack emphasis, rapid decay
        const h4Decay = 1 - (decayPhase * 0.50);
        const h4Attack = 1 + (attackPhase * 0.6); // Strong pick attack brightness
        sample += Math.sin(phase * 4 + harmonicPhases[arrayIndex][3]) * (0.35 * h4Decay * h4Attack);
        
        // 5th-8th harmonics - FAST decay (guitar strings lose high frequencies quickly)
        const h5Decay = Math.pow(1 - decayPhase, 2.0); // Exponential fast decay
        sample += Math.sin(phase * 5 + harmonicPhases[arrayIndex][4]) * (0.22 * h5Decay * (1 + attackPhase * 0.5));
        
        const h6Decay = Math.pow(1 - decayPhase, 2.5);
        sample += Math.sin(phase * 6 + harmonicPhases[arrayIndex][5]) * (0.12 * h6Decay * (1 + attackPhase * 0.4));
        
        const h7Decay = Math.pow(1 - decayPhase, 3.0);
        sample += Math.sin(phase * 7 + harmonicPhases[arrayIndex][6]) * (0.06 * h7Decay * (1 + attackPhase * 0.3));
        
        const h8Decay = Math.pow(1 - decayPhase, 3.5);
        sample += Math.sin(phase * 8 + harmonicPhases[arrayIndex][7]) * (0.03 * h8Decay * (1 + attackPhase * 0.2));
        
        // Apply envelope
        sample *= envelope;
        
        // GUITAR-SPECIFIC EQ PROCESSING (NOT trumpet-like)
        // Key differences: Less low-end dominance, faster high-frequency decay
        
        // 1. Moderate low-end (guitar, not bass-heavy trumpet)
        const lowShelfBoost = frequency < 200 ? 1.15 : 1.0;
        
        // 2. Balanced low-mids (guitar body, not trumpet brass)
        const lowMidBoost = (frequency >= 200 && frequency < 500) ? 1.22 : 1.0;
        
        // 3. Enhanced mid-range (guitar presence, not trumpet mellowness)
        const midRangeBoost = (frequency >= 500 && frequency < 1500) ? 1.28 : 1.0;
        
        // 4. Strong presence lift (guitar pick attack clarity)
        const presenceLift = (frequency >= 2000 && frequency < 4500) ? 1.18 : 1.0;
        
        // 5. Gentle high-frequency rolloff (guitar natural damping)
        const highRolloff = frequency > 6000 ? 0.85 : 1.0;
        
        // 6. AGGRESSIVE high-frequency damping (plucked strings lose brightness FAST)
        const brightnessDecay = Math.exp(-t * 1.5); // FAST decay (guitar, not sustained trumpet)
        const toneBalance = 0.55 + (brightnessDecay * 0.45); // 55% to 100% (rapid brightness loss)
        
        // Apply comprehensive EQ processing
        sample *= lowShelfBoost * lowMidBoost * midRangeBoost * presenceLift * highRolloff * toneBalance;
        
        // Apply high-pass filter (removes sub-audible rumble)
        const filteredSample = sample - (hpfCoeff * prevSample);
        prevSample = sample;
        
        // Add to stereo channels with panning
        leftChannel[i] += filteredSample * leftGain;
        rightChannel[i] += filteredSample * rightGain;
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
    
    // Remove DC offset and apply gentle compression
    const compressionRatio = maxPeak > 0.85 ? 0.85 / maxPeak : 1.0;
    for (let i = 0; i < durationSamples; i++) {
      leftChannel[i] = (leftChannel[i] - leftDCOffset) * compressionRatio * 1.85;
      rightChannel[i] = (rightChannel[i] - rightDCOffset) * compressionRatio * 1.85;
    }
    
    // Apply noise gate
    const gateThreshold = 0.00008;
    for (let i = 0; i < durationSamples; i++) {
      if (Math.abs(leftChannel[i]) < gateThreshold) leftChannel[i] = 0;
      if (Math.abs(rightChannel[i]) < gateThreshold) rightChannel[i] = 0;
    }
    
    // Natural fade-out (last 80ms) - guitar strings dampen naturally
    const fadeOutStart = durationSamples - Math.floor(sampleRate * 0.08);
    for (let i = fadeOutStart; i < durationSamples; i++) {
      const fadeProgress = (i - fadeOutStart) / (durationSamples - fadeOutStart);
      // Fast exponential fade (plucked string physics)
      const fadeFactor = Math.pow(1 - fadeProgress, 3);
      leftChannel[i] *= fadeFactor;
      rightChannel[i] *= fadeFactor;
    }
    
    // Final silence window (last 20ms) for clean ending
    const silenceStart = durationSamples - Math.floor(sampleRate * 0.020);
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
