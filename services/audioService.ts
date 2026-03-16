// Professional audio service using Web Audio API with simplified guitar synthesis
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';

interface GuitarStringConfig {
  frequency: number;
  harmonics: number[];
  pluckPosition: number;
  damping: number;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private metronomeInterval: NodeJS.Timeout | null = null;
  private masterGain: GainNode | null = null;

  private async getAudioContext(): Promise<AudioContext> {
    if (!this.audioContext) {
      // @ts-ignore - Web Audio API compatibility
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create master gain for overall volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7;
    }
    
    // CRITICAL: Mobile browsers require AudioContext to be resumed after user interaction
    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
        console.log('AudioContext resumed successfully');
      } catch (error) {
        console.error('Failed to resume AudioContext:', error);
      }
    }
    
    return this.audioContext;
  }

  private getNoteFrequency(note: string, octave: number = 4): number {
    const noteFrequencies: { [key: string]: number } = {
      'C': 261.63,
      'C#': 277.18,
      'Db': 277.18,
      'D': 293.66,
      'D#': 311.13,
      'Eb': 311.13,
      'E': 329.63,
      'F': 349.23,
      'F#': 369.99,
      'Gb': 369.99,
      'G': 392.00,
      'G#': 415.30,
      'Ab': 415.30,
      'A': 440.00,
      'A#': 466.16,
      'Bb': 466.16,
      'B': 493.88,
    };

    const baseFreq = noteFrequencies[note] || 440;
    return baseFreq * Math.pow(2, octave - 4);
  }

  /**
   * Create simplified guitar string sound with sawtooth wave
   * SIMPLIFIED APPROACH: 1 oscillator instead of 3 (66% CPU reduction)
   * Sawtooth naturally contains harmonics - no need for layering
   */
  private createPluck(
    ctx: AudioContext,
    frequency: number,
    startTime: number,
    duration: number,
    volume: number,
    destinationNode: AudioNode,
    stringIndex: number
  ): OscillatorNode {
    // Single sawtooth oscillator - naturally rich in harmonics
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, startTime);

    // ADSR envelope - guitar pluck characteristics
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.008); // Fast attack (pick)
    gainNode.gain.exponentialRampToValueAtTime(volume * 0.25, startTime + 0.12); // Quick decay
    gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration); // Gentle release

    // Lowpass filter - tame the bright sawtooth to sound more like a guitar
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    const initialCutoff = Math.min(frequency * 8, 8000);
    const sustainCutoff = Math.min(frequency * 4, 4000);
    lowpass.frequency.setValueAtTime(initialCutoff, startTime);
    lowpass.frequency.exponentialRampToValueAtTime(sustainCutoff, startTime + duration * 0.5);
    lowpass.Q.setValueAtTime(1.0, startTime); // Slight resonance

    // Stereo panning for spatial separation
    // Bass strings (0-2): center to slight left
    // High strings (3-5): slight right for clarity
    const panner = ctx.createStereoPanner();
    if (stringIndex <= 2) {
      panner.pan.setValueAtTime(-0.1 * stringIndex, startTime); // 0.0 to -0.2 (center-left)
    } else {
      panner.pan.setValueAtTime(0.15 * (stringIndex - 2), startTime); // 0.15 to 0.45 (right)
    }

    // Signal chain: oscillator → lowpass → gain → panner → destination
    osc.connect(lowpass);
    lowpass.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(destinationNode);

    osc.start(startTime);
    osc.stop(startTime + duration + 0.05);

    return osc;
  }

  /**
   * Play a guitar string with simplified sawtooth synthesis
   */
  async playGuitarString(frequency: number, duration: number = 2000, velocity: number = 0.8, stringIndex: number = 0): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const now = ctx.currentTime + 0.05;
      const durationSec = duration / 1000;
      
      // Balanced volume - compression will help even things out
      // String index: 0=low E, 1=A, 2=D, 3=G, 4=B, 5=high E
      const vol = stringIndex >= 4 ? 0.38 : // High strings - boosted
                  stringIndex >= 2 ? 0.32 : // Mid strings
                  0.28;                      // Low strings
      
      const osc = this.createPluck(ctx, frequency, now, durationSec, vol * velocity, this.masterGain!, stringIndex);
      this.activeOscillators.push(osc);
      
      // Clean up after playback
      setTimeout(() => {
        const index = this.activeOscillators.indexOf(osc);
        if (index > -1) {
          this.activeOscillators.splice(index, 1);
        }
      }, duration + 100);
      
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }
  
  /**
   * Legacy note playback (kept for compatibility)
   */
  async playNote(note: string, duration: number = 500, octave: number = 4, volume: number = 0.3): Promise<void> {
    const frequency = this.getNoteFrequency(note, octave);
    await this.playGuitarString(frequency, duration, volume, 0);
  }

  /**
   * Play a guitar chord with compression and spatial separation
   * OPTIMIZED: 6 oscillators instead of 18 (66% reduction)
   */
  async playChord(notes: string[], duration: number = 1500, octave: number = 3, strum: boolean = true): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      const now = ctx.currentTime + 0.05;
      
      // Dynamic compressor - automatically balances loud/quiet strings
      const compressor = ctx.createDynamicsCompressor();
      compressor.threshold.setValueAtTime(-24, now);
      compressor.knee.setValueAtTime(10, now);
      compressor.ratio.setValueAtTime(4, now);
      compressor.attack.setValueAtTime(0.003, now);
      compressor.release.setValueAtTime(0.1, now);
      compressor.connect(this.masterGain!);

      const strumDelay = 0.035; // 35ms between strings
      const noteDuration = 2.5; // ring out for 2.5 seconds
      
      if (strum) {
        // Strum with attack timing optimization
        notes.forEach((note, index) => {
          const frequency = this.getNoteFrequency(note, octave);
          
          // High strings attack 5ms earlier for clarity
          const attackOffset = index >= 3 ? -0.005 : 0;
          const startTime = now + index * strumDelay + attackOffset;
          
          // Balanced volume - compressor will even things out
          const vol = index >= 4 ? 0.35 : index >= 2 ? 0.30 : 0.28;
          
          const osc = this.createPluck(ctx, frequency, startTime, noteDuration, vol, compressor, index);
          this.activeOscillators.push(osc);
        });
      } else {
        // Play all notes simultaneously
        notes.forEach((note, index) => {
          const frequency = this.getNoteFrequency(note, octave);
          const vol = index >= 4 ? 0.35 : index >= 2 ? 0.30 : 0.28;
          
          const osc = this.createPluck(ctx, frequency, now, noteDuration, vol, compressor, index);
          this.activeOscillators.push(osc);
        });
      }
      
      // Clean up after playback
      setTimeout(() => {
        this.activeOscillators = [];
        compressor.disconnect();
      }, (noteDuration * 1000) + 100);
      
    } catch (error) {
      console.log('Chord playback not available:', error);
    }
  }

  async playMetronomeClick(type: 'strong' | 'weak' = 'weak', volume: number = 0.75, sound: string = 'Click'): Promise<void> {
    try {
      const ctx = await this.getAudioContext();
      
      if (sound === 'Wood Block') {
        this.playWoodBlock(type, volume);
      } else if (sound === 'Hi-Hat') {
        this.playHiHat(type, volume);
      } else if (sound === 'Sidestick') {
        this.playSidestick(type, volume);
      } else if (sound === 'Voice Count') {
        // Voice count would require speech synthesis or pre-recorded audio
        this.playClickSound(type, volume);
      } else {
        this.playClickSound(type, volume);
      }
    } catch (error) {
      console.log('Metronome click not available:', error);
    }
  }

  private async playClickSound(type: 'strong' | 'weak', volume: number): Promise<void> {
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
  }

  private async playWoodBlock(type: 'strong' | 'weak', volume: number): Promise<void> {
    const ctx = await this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    oscillator.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    filter.type = 'bandpass';
    filter.frequency.value = type === 'strong' ? 600 : 500;
    filter.Q.value = 10;

    oscillator.frequency.value = type === 'strong' ? 600 : 500;
    oscillator.type = 'square';

    const duration = 0.03;
    gainNode.gain.setValueAtTime(volume * 0.8, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  private async playHiHat(type: 'strong' | 'weak', volume: number): Promise<void> {
    const ctx = await this.getAudioContext();
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    // White noise
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const gainNode = ctx.createGain();

    noise.buffer = buffer;
    noise.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(ctx.destination);

    filter.type = 'highpass';
    filter.frequency.value = 7000;

    const duration = type === 'strong' ? 0.08 : 0.05;
    gainNode.gain.setValueAtTime(volume * 0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    noise.start(ctx.currentTime);
    noise.stop(ctx.currentTime + duration);
  }

  private async playSidestick(type: 'strong' | 'weak', volume: number): Promise<void> {
    const ctx = await this.getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = type === 'strong' ? 3000 : 2500;
    oscillator.type = 'sine';

    const duration = 0.02;
    gainNode.gain.setValueAtTime(volume * 0.5, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

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

  stopMetronome(): void {
    if (this.metronomeInterval) {
      clearInterval(this.metronomeInterval);
      this.metronomeInterval = null;
    }
  }

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

  async playSuccess(): Promise<void> {
    await this.playNote('C', 100, 5, 0.4);
    setTimeout(() => this.playNote('E', 100, 5, 0.4), 100);
    setTimeout(() => this.playNote('G', 200, 5, 0.4), 200);
  }

  async playError(): Promise<void> {
    await this.playNote('F', 150, 3, 0.4);
    setTimeout(() => this.playNote('E', 150, 3, 0.4), 150);
  }

  /**
   * Calculate actual notes from chord fret positions
   * This ensures audio matches the visual fretboard exactly
   */
  private calculateNotesFromChord(chord: ChordData): string[] {
    const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    
    const normalizeNote = (note: string): string => {
      return note
        .replace('b', '#')
        .replace('Db', 'C#')
        .replace('Eb', 'D#')
        .replace('Gb', 'F#')
        .replace('Ab', 'G#')
        .replace('Bb', 'A#');
    };
    
    const getNoteAtPosition = (stringIndex: number, fret: number): string => {
      if (fret < 0) return ''; // Muted string
      const openNote = STANDARD_TUNING[stringIndex];
      const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
      const noteIndex = (openNoteIndex + fret) % 12;
      return NOTES[noteIndex];
    };

    // Calculate notes from fret positions (same logic as visual fretboard)
    const notes = chord.positions
      .map((fret, index) => fret >= 0 ? getNoteAtPosition(index, fret) : null)
      .filter(Boolean) as string[];
    
    return notes;
  }

  /**
   * Play chord preview - accepts ChordData object or chord name string
   * When ChordData is provided, calculates exact notes from fret positions
   * When string is provided, uses fallback chord mapping
   */
  async playChordPreview(chordInput: ChordData | string): Promise<void> {
    let notes: string[];

    // If we have full chord data, calculate exact notes from positions
    if (typeof chordInput === 'object' && chordInput.positions) {
      notes = this.calculateNotesFromChord(chordInput);
      console.log(`Playing chord ${chordInput.name} with calculated notes:`, notes);
    } else {
      // Fallback: Use chord name with predefined mappings
      const chordName = typeof chordInput === 'string' ? chordInput : '';
      
      // Basic chord mapping for fallback when only name is available
      const chordMap: { [key: string]: string[] } = {
        'C': ['C', 'E', 'G', 'C', 'E'],
        'D': ['D', 'A', 'D', 'F#'],
        'E': ['E', 'B', 'E', 'G#', 'B', 'E'],
        'F': ['F', 'A', 'C', 'F'],
        'G': ['G', 'B', 'D', 'G', 'B', 'G'],
        'A': ['A', 'E', 'A', 'C#', 'E'],
        'B': ['B', 'F#', 'B', 'D#'],
        'Am': ['A', 'E', 'A', 'C', 'E'],
        'Dm': ['D', 'A', 'D', 'F', 'A'],
        'Em': ['E', 'B', 'E', 'G', 'B', 'E'],
      };

      notes = chordMap[chordName] || ['C', 'E', 'G'];
      console.log(`Playing chord ${chordName} with fallback notes:`, notes);
    }

    // Play with realistic strum - extended duration
    await this.playChord(notes, 2200, 3, true);
  }
}

export const audioService = new AudioService();
