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
   */
  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      // @ts-ignore - WebKit prefix for Safari
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create master gain node
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.7;
      
      // Create dynamic compressor for automatic volume balancing
      this.compressor = this.audioContext.createDynamicsCompressor();
      this.compressor.threshold.value = -24; // dB
      this.compressor.knee.value = 10;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.003; // 3ms
      this.compressor.release.value = 0.1; // 100ms
      
      // Connect: masterGain -> compressor -> destination
      this.masterGain.connect(this.compressor);
      this.compressor.connect(this.audioContext.destination);
    }
    
    // Resume context if suspended (required for mobile)
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
    
    return this.audioContext;
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
   * Play chord using Web Audio API synthesis
   * Calculates exact frequencies from chord fret positions
   */
  private async playChordSynthesis(chord: ChordData, duration: number = 2200): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const now = ctx.currentTime;
      const durationSec = duration / 1000;

      // Calculate which strings to play based on chord positions
      const stringsToPlay: Array<{ stringIndex: number; frequency: number }> = [];
      
      chord.positions.forEach((fret, stringIndex) => {
        if (fret >= 0) { // -1 means don't play this string
          const frequency = this.calculateStringFrequency(stringIndex, fret);
          stringsToPlay.push({ stringIndex, frequency });
        }
      });

      console.log(`Playing ${chord.name}:`, stringsToPlay.map(s => `String ${s.stringIndex + 1}: ${s.frequency.toFixed(1)}Hz`));

      // Play each string
      stringsToPlay.forEach(({ stringIndex, frequency }) => {
        // Create oscillator with sawtooth wave (natural harmonics)
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, now);

        // Create gain envelope for this string
        const gain = ctx.createGain();
        
        // String-specific timing: high strings attack slightly earlier
        const attackDelay = stringIndex > 3 ? 0 : 0.005; // High strings 5ms earlier
        const startTime = now + attackDelay;
        
        // Base volume for this string (higher strings slightly louder)
        const baseVolume = stringIndex > 3 ? 0.25 : 0.2;
        
        // ADSR envelope
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(baseVolume, startTime + 0.005); // 5ms attack
        gain.gain.linearRampToValueAtTime(baseVolume * 0.7, startTime + 0.1); // 100ms decay
        gain.gain.setValueAtTime(baseVolume * 0.7, startTime + 0.1); // Sustain
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec); // Release

        // Create lowpass filter for acoustic guitar tone
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 8, startTime); // Initial bright tone
        filter.frequency.exponentialRampToValueAtTime(frequency * 4, startTime + durationSec); // Darken over time
        filter.Q.value = 1;

        // Create stereo panner for spatial separation
        const panner = ctx.createStereoPanner();
        // Bass strings (0-2) panned center-left, high strings (3-5) panned right
        const panValue = stringIndex < 3 ? -0.15 : (stringIndex - 3) * 0.15;
        panner.pan.setValueAtTime(panValue, now);

        // Connect: oscillator -> filter -> gain -> panner -> masterGain -> compressor -> destination
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(panner);
        panner.connect(this.masterGain!);

        // Start and stop
        osc.start(startTime);
        osc.stop(startTime + durationSec);
        
        this.activeOscillators.push(osc);
      });

      // Clean up oscillator references after playback
      setTimeout(() => {
        this.activeOscillators = [];
      }, duration + 100);

    } catch (error) {
      console.error('Chord synthesis failed:', error);
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
    // Handle ChordData object (preferred)
    if (typeof chordInput === 'object' && chordInput.positions) {
      console.log(`🎸 Playing chord: ${chordInput.name}`);
      await this.playChordSynthesis(chordInput, 2200);
      return;
    }
    
    // Handle string input (fallback - not recommended)
    console.warn(`⚠️ playChordPreview() called with string "${chordInput}". Pass ChordData object for accurate playback.`);
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
