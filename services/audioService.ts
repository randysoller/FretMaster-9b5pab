// Guitar audio synthesis service with accurate note-to-frequency mapping
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';

class AudioService {
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private metronomeInterval: NodeJS.Timeout | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;

  /**
   * Get or create audio context with proper initialization
   * MUST be called directly from user gesture on mobile
   */
  private async getAudioContext(): Promise<AudioContext> {
    try {
      if (!this.audioContext) {
        console.log('🎵 Creating new audio context...');
        // @ts-ignore - WebKit prefix for Safari
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        
        if (!AudioContextClass) {
          throw new Error('Web Audio API not supported in this browser');
        }
        
        this.audioContext = new AudioContextClass();
        console.log('🎵 Audio context created, state:', this.audioContext.state);
        
        // Create master gain node
        this.masterGain = this.audioContext.createGain();
        this.masterGain.gain.value = 0.7;
        console.log('✅ Master gain created');
        
        // Create dynamic compressor for automatic volume balancing
        this.compressor = this.audioContext.createDynamicsCompressor();
        this.compressor.threshold.value = -24; // dB
        this.compressor.knee.value = 10;
        this.compressor.ratio.value = 4;
        this.compressor.attack.value = 0.003; // 3ms
        this.compressor.release.value = 0.1; // 100ms
        console.log('✅ Compressor created');
        
        // Connect: masterGain -> compressor -> destination
        this.masterGain.connect(this.compressor);
        this.compressor.connect(this.audioContext.destination);
        console.log('✅ Audio graph connected');
      }
      
      // CRITICAL: Resume context if suspended (always check on mobile)
      if (this.audioContext.state === 'suspended') {
        console.log('⚠️ Audio context suspended, resuming...');
        await this.audioContext.resume();
        console.log('✅ Audio context resumed, state:', this.audioContext.state);
        
        // Verify it actually resumed
        if (this.audioContext.state !== 'running') {
          throw new Error(`Audio context failed to resume. State: ${this.audioContext.state}`);
        }
      }
      
      console.log('✅ Audio context ready, state:', this.audioContext.state);
      return this.audioContext;
      
    } catch (err) {
      console.error('❌ Audio context initialization failed:', err);
      throw new Error(`Audio context error: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Get note frequency for synthesis fallback
   */
  private getNoteFrequency(note: string, octave: number = 4): number {
    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63, 'C#': 277.18, 'Db': 277.18,
      'D': 293.66, 'D#': 311.13, 'Eb': 311.13,
      'E': 329.63, 'F': 349.23, 'F#': 369.99,
      'Gb': 369.99, 'G': 392.00, 'G#': 415.30,
      'Ab': 415.30, 'A': 440.00, 'A#': 466.16,
      'Bb': 466.16, 'B': 493.88,
    };
    const baseFreq = noteFrequencies[note] || 440;
    return baseFreq * Math.pow(2, octave - 4);
  }

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
   * Create custom acoustic guitar waveform with specific harmonic content
   */
  private createGuitarWaveform(ctx: AudioContext): PeriodicWave {
    // Acoustic guitar harmonic profile (fundamental + harmonics with specific amplitudes)
    const real = new Float32Array([0, 1, 0.5, 0.3, 0.15, 0.08, 0.04, 0.02]); // Harmonic amplitudes
    const imag = new Float32Array(real.length); // Phase (zeros for simplicity)
    return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
  }

  /**
   * Create guitar body resonance filter (simulates acoustic body)
   */
  private createBodyResonance(ctx: AudioContext): BiquadFilterNode {
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.value = 100; // Main body resonance around 100Hz
    bodyFilter.Q.value = 8; // Resonant peak
    return bodyFilter;
  }

  /**
   * Create formant filters (characteristic resonances of acoustic guitar)
   */
  private createFormantFilters(ctx: AudioContext, frequency: number): BiquadFilterNode[] {
    const filters: BiquadFilterNode[] = [];
    
    // Formant 1: Body resonance boost (80-120Hz)
    const f1 = ctx.createBiquadFilter();
    f1.type = 'peaking';
    f1.frequency.value = 100;
    f1.Q.value = 3;
    f1.gain.value = 4; // +4dB boost
    filters.push(f1);
    
    // Formant 2: Lower midrange character (200-400Hz)
    const f2 = ctx.createBiquadFilter();
    f2.type = 'peaking';
    f2.frequency.value = 300;
    f2.Q.value = 2;
    f2.gain.value = 3; // +3dB
    filters.push(f2);
    
    // Formant 3: Presence/brightness (2-4kHz)
    const f3 = ctx.createBiquadFilter();
    f3.type = 'peaking';
    f3.frequency.value = 2800;
    f3.Q.value = 1.5;
    f3.gain.value = 5; // +5dB for clarity
    filters.push(f3);
    
    // High-shelf for air/sparkle
    const highShelf = ctx.createBiquadFilter();
    highShelf.type = 'highshelf';
    highShelf.frequency.value = 6000;
    highShelf.gain.value = 2; // +2dB above 6kHz
    filters.push(highShelf);
    
    return filters;
  }

  /**
   * Create pick attack noise (transient for realism)
   */
  private createPickNoise(ctx: AudioContext, startTime: number, stringIndex: number): AudioBufferSourceNode | null {
    try {
      // Create short noise burst
      const bufferSize = ctx.sampleRate * 0.01; // 10ms
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      
      // Generate filtered noise (simulates pick scraping string)
      for (let i = 0; i < bufferSize; i++) {
        const envelope = Math.exp(-i / (bufferSize * 0.3)); // Quick decay
        data[i] = (Math.random() * 2 - 1) * envelope * 0.1; // Subtle noise
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      // Filter noise to match string frequency range
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.value = 2000 + (stringIndex * 500); // Higher for higher strings
      noiseFilter.Q.value = 2;
      
      noise.connect(noiseFilter);
      return noise;
    } catch (error) {
      console.warn('Pick noise creation failed:', error);
      return null;
    }
  }

  /**
   * Create simple reverb effect (room ambience)
   */
  private createReverb(ctx: AudioContext): ConvolverNode | null {
    try {
      // Create impulse response for small room reverb
      const reverbTime = 0.8; // 800ms reverb tail
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * reverbTime;
      const impulse = ctx.createBuffer(2, length, sampleRate);
      
      for (let channel = 0; channel < 2; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          // Exponentially decaying random noise
          const decay = Math.exp(-i / (length * 0.3));
          channelData[i] = (Math.random() * 2 - 1) * decay;
        }
      }
      
      const convolver = ctx.createConvolver();
      convolver.buffer = impulse;
      return convolver;
    } catch (error) {
      console.warn('Reverb creation failed:', error);
      return null;
    }
  }

  /**
   * Play chord using professional acoustic guitar synthesis
   * Calculates exact frequencies from chord fret positions
   */
  private async playChordSynthesis(chord: ChordData, duration: number = 2500): Promise<void> {
    try {
      console.log(`🎸 Starting playChordSynthesis for: ${chord.name}`);
      const ctx = await this.getAudioContext();
      
      console.log('🎵 Got audio context, state:', ctx.state);
      
      // Double-check context is running (mobile safety)
      if (ctx.state !== 'running') {
        console.warn('⚠️ Audio context not running after getAudioContext, state:', ctx.state);
        throw new Error(`Audio context is ${ctx.state}, not running`);
      }
      
      const now = ctx.currentTime;
      const durationSec = duration / 1000;

      // Create custom guitar waveform
      const guitarWave = this.createGuitarWaveform(ctx);
      
      // Create reverb (wet/dry mix)
      const reverb = this.createReverb(ctx);
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.25; // 25% wet signal
      const dryGain = ctx.createGain();
      dryGain.gain.value = 0.75; // 75% dry signal

      // Calculate which strings to play
      const stringsToPlay: Array<{ stringIndex: number; frequency: number }> = [];
      chord.positions.forEach((fret, stringIndex) => {
        if (fret >= 0) {
          const frequency = this.calculateStringFrequency(stringIndex, fret);
          stringsToPlay.push({ stringIndex, frequency });
        }
      });

      console.log(`🎸 Professional synthesis: ${chord.name}, ${stringsToPlay.length} strings to play`);
      console.log('🎸 String frequencies:', stringsToPlay.map(s => `${s.frequency.toFixed(1)}Hz`).join(', '));

      if (stringsToPlay.length === 0) {
        throw new Error('No strings to play in chord');
      }

      // Play each string with advanced synthesis
      stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
        // Natural strum timing (downstroke from bass to treble)
        const strumDelay = arrayIndex * 0.012; // 12ms between strings
        const startTime = now + strumDelay;
        
        // Slight detuning for natural chorus effect
        const detune = (Math.random() - 0.5) * 4; // ±2 cents
        
        // Velocity variation (softer on first/last strings)
        const velocityCurve = arrayIndex === 0 || arrayIndex === stringsToPlay.length - 1 ? 0.85 : 1.0;
        const baseVolume = (stringIndex > 3 ? 0.28 : 0.24) * velocityCurve;

        // === MAIN OSCILLATOR ===
        const osc = ctx.createOscillator();
        osc.setPeriodicWave(guitarWave); // Custom guitar waveform
        osc.frequency.setValueAtTime(frequency, startTime);
        osc.detune.setValueAtTime(detune, startTime);

        // === PICK ATTACK NOISE ===
        const pickNoise = this.createPickNoise(ctx, startTime, stringIndex);
        const pickGain = ctx.createGain();
        pickGain.gain.value = 0.12; // Reduced for subtlety

        // === STRING ENVELOPE ===
        const stringGain = ctx.createGain();
        stringGain.gain.setValueAtTime(0, startTime);
        stringGain.gain.linearRampToValueAtTime(baseVolume, startTime + 0.003); // 3ms attack (pick)
        stringGain.gain.linearRampToValueAtTime(baseVolume * 0.75, startTime + 0.08); // 80ms decay
        stringGain.gain.setValueAtTime(baseVolume * 0.75, startTime + 0.08); // Sustain
        stringGain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec); // Natural decay

        // === FORMANT FILTERS (guitar body character) ===
        const formants = this.createFormantFilters(ctx, frequency);
        
        // === MAIN LOWPASS (string tone) ===
        const mainFilter = ctx.createBiquadFilter();
        mainFilter.type = 'lowpass';
        const initialCutoff = Math.min(frequency * 12, 8000); // Bright attack
        const sustainCutoff = Math.min(frequency * 6, 4000); // Mellower sustain
        mainFilter.frequency.setValueAtTime(initialCutoff, startTime);
        mainFilter.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + 0.5);
        mainFilter.Q.value = 0.7;

        // === STEREO POSITIONING ===
        const panner = ctx.createStereoPanner();
        const panValue = stringIndex < 3 ? -0.2 + (stringIndex * 0.1) : (stringIndex - 3) * 0.15;
        panner.pan.setValueAtTime(panValue, now);

        // === SIGNAL CHAIN ===
        // Main oscillator path: osc -> formants -> mainFilter -> stringGain -> panner
        let lastNode: AudioNode = osc;
        formants.forEach(filter => {
          lastNode.connect(filter);
          lastNode = filter;
        });
        lastNode.connect(mainFilter);
        mainFilter.connect(stringGain);
        stringGain.connect(panner);
        
        // Split to dry and wet (reverb)
        panner.connect(dryGain);
        if (reverb) {
          panner.connect(reverb);
          reverb.connect(reverbGain);
          reverbGain.connect(this.masterGain!);
        }
        dryGain.connect(this.masterGain!);

        // Pick noise path
        if (pickNoise) {
          pickNoise.connect(pickGain);
          pickGain.connect(this.masterGain!);
          pickNoise.start(startTime);
        }

        // Start main oscillator
        osc.start(startTime);
        osc.stop(startTime + durationSec);
        this.activeOscillators.push(osc);
      });

      console.log(`✅ Started ${stringsToPlay.length} oscillators for chord ${chord.name}`);

      // Cleanup
      setTimeout(() => {
        this.activeOscillators = [];
        console.log('🧹 Cleaned up oscillators');
      }, duration + 200);

    } catch (error) {
      console.error('❌ Professional chord synthesis failed:', error);
      throw error; // Re-throw to propagate to caller
    }
  }

  /**
   * Play chord - legacy method for compatibility
   */
  async playChord(notes: string[], duration: number = 1500, octave: number = 3, strum: boolean = true): Promise<void> {
    console.warn('playChord() with note array is deprecated. Use playChordPreview() with ChordData instead.');
    // This method is kept for backward compatibility but not recommended
  }

  /**
   * Play chord preview - PRIMARY METHOD for chord playback
   * Accepts ChordData object and plays exact frequencies based on fret positions
   * This ensures audio ALWAYS matches the visual chord diagram
   */
  async playChordPreview(chordInput: ChordData | string): Promise<void> {
    console.log('🎵 playChordPreview called with:', typeof chordInput === 'object' ? chordInput.name : chordInput);
    
    try {
      // Ensure audio context is ready (CRITICAL for mobile)
      console.log('🎵 Initializing audio context...');
      const ctx = await this.getAudioContext();
      console.log('✅ Audio context ready, state:', ctx.state);
      
      // Handle ChordData object (preferred)
      if (typeof chordInput === 'object' && chordInput.positions) {
        console.log(`🎸 Playing chord: ${chordInput.name}, positions:`, chordInput.positions);
        
        // Validate chord has playable strings
        const playableStrings = chordInput.positions.filter(f => f >= 0).length;
        if (playableStrings === 0) {
          throw new Error('Chord has no playable strings');
        }
        
        await this.playChordSynthesis(chordInput, 2200);
        console.log('✅ Chord playback completed successfully');
        return;
      }
      
      // Handle string input (fallback - not recommended)
      console.warn(`⚠️ playChordPreview() called with string "${chordInput}". Pass ChordData object for accurate playback.`);
      throw new Error('Invalid input: expected ChordData object');
      
    } catch (error) {
      console.error('❌ playChordPreview failed:', error);
      // Include error details in thrown error
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Chord playback error: ${errorMessage}`);
    }
  }



  /**
   * Play single guitar string at specific fret
   */
  async playGuitarString(frequency: number, duration: number = 2000, velocity: number = 0.8, stringIndex: number = 0): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const now = ctx.currentTime;
      const durationSec = duration / 1000;

      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(frequency, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.005);
      gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(frequency * 6, now);
      filter.Q.value = 1;

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain!);

      osc.start(now);
      osc.stop(now + durationSec);
      
      this.activeOscillators.push(osc);
    } catch (error) {
      console.error('Failed to play guitar string:', error);
    }
  }

  /**
   * Play single note
   */
  async playNote(note: string, duration: number = 500, octave: number = 4, volume: number = 0.3): Promise<void> {
    const frequency = this.getNoteFrequency(note, octave);
    await this.playGuitarString(frequency, duration, volume, 0);
  }

  /**
   * Metronome click sounds
   */
  async playMetronomeClick(type: 'strong' | 'weak' = 'weak', volume: number = 0.75, sound: string = 'Click'): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = type === 'strong' ? 1200 : 800;
      oscillator.type = 'sine';

      const duration = 0.05;
      gainNode.gain.setValueAtTime(volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration);
    } catch (error) {
      console.log('Metronome click not available:', error);
    }
  }

  /**
   * Start metronome
   */
  startMetronome(bpm: number, beatsPerMeasure: number = 4, sound: string = 'Click', subdivision: number = 1, callback?: (beatInfo: { beat: number; isStrong: boolean; subdivision: number }) => void): void {
    this.stopMetronome();

    const interval = (60 / bpm) * 1000 / subdivision;
    let beat = 0;

    this.metronomeInterval = setInterval(() => {
      const actualBeat = Math.floor(beat / subdivision);
      const isStrongBeat = actualBeat % beatsPerMeasure === 0 && beat % subdivision === 0;
      const isMainBeat = beat % subdivision === 0;
      
      if (isMainBeat || subdivision > 1) {
        const volume = isStrongBeat ? 0.75 : isMainBeat ? 0.5 : 0.3;
        this.playMetronomeClick(isStrongBeat ? 'strong' : 'weak', volume, sound).catch(err => 
          console.error('Metronome click failed:', err)
        );
      }
      
      callback?.({
        beat: actualBeat,
        isStrong: isStrongBeat,
        subdivision: beat % subdivision,
      });
      
      beat++;
    }, interval);
  }

  /**
   * Stop metronome
   */
  stopMetronome(): void {
    if (this.metronomeInterval) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

  /**
   * Play tuner tone
   */
  async playTunerTone(frequency: number, duration: number = 2000): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration / 1000);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + duration / 1000);

      this.activeOscillators.push(oscillator);

      setTimeout(() => {
        const index = this.activeOscillators.indexOf(oscillator);
        if (index > -1) {
          this.activeOscillators.splice(index, 1);
        }
      }, duration);
    } catch (error) {
      console.log('Tuner tone not available:', error);
    }
  }

  /**
   * Stop all audio
   */
  stopAll(): void {
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators = [];
    this.stopMetronome();
  }

  /**
   * Play success sound
   */
  async playSuccess(): Promise<void> {
    await this.playNote('C', 100, 5, 0.4);
    setTimeout(() => this.playNote('E', 100, 5, 0.4), 100);
    setTimeout(() => this.playNote('G', 200, 5, 0.4), 200);
  }

  /**
   * Play error sound
   */
  async playError(): Promise<void> {
    await this.playNote('F', 150, 3, 0.4);
    setTimeout(() => this.playNote('E', 150, 3, 0.4), 150);
  }

  /**
   * Cleanup on app close
   */
  cleanup(): void {
    this.stopAll();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    console.log('Audio service cleaned up');
  }
}

export const audioService = new AudioService();
