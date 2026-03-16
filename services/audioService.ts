// Enhanced audio service using Web Audio API with realistic guitar sounds

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

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      // @ts-ignore - Web Audio API compatibility
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass();
      
      // Create master gain for overall volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.connect(this.audioContext.destination);
      this.masterGain.gain.value = 0.7;
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
   * Nylon string acoustic guitar synthesis
   * Warm, mellow tone with soft attack and natural decay
   */
  playGuitarString(frequency: number, duration: number = 1500, velocity: number = 0.8, stringIndex: number = 0): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      // Nylon strings have a warmer, mellower tone - use sine + triangle blend
      const fundamental = ctx.createOscillator();
      fundamental.type = 'sine'; // Pure, warm fundamental
      fundamental.frequency.value = frequency;
      
      // Second harmonic for body
      const harmonic1 = ctx.createOscillator();
      harmonic1.type = 'triangle';
      harmonic1.frequency.value = frequency * 2;
      
      // Third harmonic for warmth
      const harmonic2 = ctx.createOscillator();
      harmonic2.type = 'sine';
      harmonic2.frequency.value = frequency * 3;
      
      // Gain nodes for mixing harmonics
      const fundamentalGain = ctx.createGain();
      fundamentalGain.gain.value = 1.0; // Full fundamental
      
      const harmonic1Gain = ctx.createGain();
      harmonic1Gain.gain.value = 0.3; // Subtle second harmonic
      
      const harmonic2Gain = ctx.createGain();
      harmonic2Gain.gain.value = 0.15; // Very subtle third harmonic
      
      // Lowpass filter for nylon string mellowness
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      // Nylon strings are much warmer/darker than steel
      filter.frequency.value = 800 + (5 - stringIndex) * 300; // 800Hz - 2.3kHz (much darker)
      filter.Q.value = 0.8; // Gentle rolloff
      
      // Soft pluck envelope - nylon strings have gentler attack than steel
      const envelope = ctx.createGain();
      const attackTime = 0.008; // Slower attack for soft nylon pluck (8ms)
      const decayTime = 0.15; // Gradual decay
      const sustainLevel = velocity * 0.35; // Moderate sustain
      const releaseTime = duration / 1000;
      
      // Soft attack curve
      envelope.gain.setValueAtTime(0, now);
      envelope.gain.linearRampToValueAtTime(velocity * 0.4, now + attackTime); // Softer peak
      // Gentle decay
      envelope.gain.exponentialRampToValueAtTime(Math.max(0.001, sustainLevel), now + attackTime + decayTime);
      // Natural fade
      envelope.gain.exponentialRampToValueAtTime(0.001, now + releaseTime);
      
      // Subtle room ambience for acoustic character
      const reverb = ctx.createConvolver();
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0.15; // Very subtle reverb
      
      // Create simple reverb impulse response
      const reverbLength = ctx.sampleRate * 0.5; // 0.5 second reverb
      const reverbBuffer = ctx.createBuffer(2, reverbLength, ctx.sampleRate);
      for (let channel = 0; channel < 2; channel++) {
        const channelData = reverbBuffer.getChannelData(channel);
        for (let i = 0; i < reverbLength; i++) {
          // Exponentially decaying noise
          channelData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (reverbLength * 0.2));
        }
      }
      reverb.buffer = reverbBuffer;
      
      // Stereo positioning
      const panner = ctx.createStereoPanner();
      panner.pan.value = (stringIndex - 2.5) * 0.1; // Subtle stereo spread
      
      // Connect audio graph:
      // Oscillators -> Harmonic gains -> Filter -> Envelope -> Split (dry + reverb) -> Output
      fundamental.connect(fundamentalGain);
      harmonic1.connect(harmonic1Gain);
      harmonic2.connect(harmonic2Gain);
      
      fundamentalGain.connect(filter);
      harmonic1Gain.connect(filter);
      harmonic2Gain.connect(filter);
      
      filter.connect(envelope);
      
      // Dry signal
      envelope.connect(panner);
      panner.connect(this.masterGain!);
      
      // Wet signal (reverb)
      envelope.connect(reverb);
      reverb.connect(reverbGain);
      reverbGain.connect(this.masterGain!);
      
      // Start playback
      fundamental.start(now);
      harmonic1.start(now);
      harmonic2.start(now);
      
      fundamental.stop(now + releaseTime);
      harmonic1.stop(now + releaseTime);
      harmonic2.stop(now + releaseTime);
      
      // Clean up after playback
      setTimeout(() => {
        try {
          fundamental.disconnect();
          harmonic1.disconnect();
          harmonic2.disconnect();
          fundamentalGain.disconnect();
          harmonic1Gain.disconnect();
          harmonic2Gain.disconnect();
          filter.disconnect();
          envelope.disconnect();
          panner.disconnect();
          reverb.disconnect();
          reverbGain.disconnect();
        } catch (e) {
          // Already disconnected
        }
      }, duration + 100);
      
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }
  
  /**
   * Legacy note playback (kept for compatibility)
   */
  playNote(note: string, duration: number = 500, octave: number = 4, volume: number = 0.3): void {
    const frequency = this.getNoteFrequency(note, octave);
    this.playGuitarString(frequency, duration, volume, 0);
  }

  /**
   * Play a guitar chord with realistic strumming
   */
  playChord(notes: string[], duration: number = 1000, octave: number = 3, strum: boolean = true): void {
    if (strum) {
      // Realistic strum - play from low to high strings with slight randomization
      const strumDelay = 25; // ms between strings
      const velocityVariation = 0.15; // Natural velocity variation
      
      notes.forEach((note, index) => {
        const delay = index * strumDelay + (Math.random() - 0.5) * 5; // Add slight randomness
        const velocity = 0.6 + (Math.random() - 0.5) * velocityVariation;
        const frequency = this.getNoteFrequency(note, octave);
        
        setTimeout(() => {
          this.playGuitarString(frequency, duration, velocity, index);
        }, delay);
      });
    } else {
      // Play all notes simultaneously (less realistic)
      notes.forEach((note, index) => {
        const frequency = this.getNoteFrequency(note, octave);
        this.playGuitarString(frequency, duration, 0.5, index);
      });
    }
  }

  playMetronomeClick(type: 'strong' | 'weak' = 'weak', volume: number = 0.75, sound: string = 'Click'): void {
    try {
      const ctx = this.getAudioContext();
      
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

  private playClickSound(type: 'strong' | 'weak', volume: number): void {
    const ctx = this.getAudioContext();
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

  private playWoodBlock(type: 'strong' | 'weak', volume: number): void {
    const ctx = this.getAudioContext();
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

  private playHiHat(type: 'strong' | 'weak', volume: number): void {
    const ctx = this.getAudioContext();
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

  private playSidestick(type: 'strong' | 'weak', volume: number): void {
    const ctx = this.getAudioContext();
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
        this.playMetronomeClick(isStrongBeat ? 'strong' : 'weak', volume, sound);
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

  playTunerTone(frequency: number, duration: number = 2000): void {
    try {
      const ctx = this.getAudioContext();
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

  playSuccess(): void {
    this.playNote('C', 100, 5, 0.4);
    setTimeout(() => this.playNote('E', 100, 5, 0.4), 100);
    setTimeout(() => this.playNote('G', 200, 5, 0.4), 200);
  }

  playError(): void {
    this.playNote('F', 150, 3, 0.4);
    setTimeout(() => this.playNote('E', 150, 3, 0.4), 150);
  }

  /**
   * Enhanced chord preview with better note mapping
   */
  playChordPreview(chordName: string): void {
    // Enhanced chord mapping with more chords and variations
    const chordMap: { [key: string]: string[] } = {
      // Major chords
      'C': ['C', 'E', 'G', 'C', 'E'],
      'D': ['D', 'A', 'D', 'F#'],
      'E': ['E', 'B', 'E', 'G#', 'B', 'E'],
      'F': ['F', 'A', 'C', 'F'],
      'G': ['G', 'B', 'D', 'G', 'B', 'G'],
      'A': ['A', 'E', 'A', 'C#', 'E'],
      'B': ['B', 'F#', 'B', 'D#'],
      
      // Minor chords
      'Am': ['A', 'E', 'A', 'C', 'E'],
      'Bm': ['B', 'F#', 'B', 'D'],
      'Cm': ['C', 'G', 'C', 'Eb', 'G'],
      'Dm': ['D', 'A', 'D', 'F', 'A'],
      'Em': ['E', 'B', 'E', 'G', 'B', 'E'],
      'Fm': ['F', 'C', 'F', 'Ab', 'C'],
      'Gm': ['G', 'D', 'G', 'Bb', 'D'],
      
      // Seventh chords
      'A7': ['A', 'E', 'G', 'C#', 'E'],
      'B7': ['B', 'F#', 'A', 'D#', 'F#'],
      'C7': ['C', 'E', 'Bb', 'C', 'E'],
      'D7': ['D', 'A', 'C', 'F#'],
      'E7': ['E', 'B', 'D', 'G#', 'B', 'E'],
      'F7': ['F', 'A', 'Eb', 'F'],
      'G7': ['G', 'B', 'D', 'F', 'B'],
      
      // Augmented
      'Caug': ['C', 'E', 'G#'],
      'Daug': ['D', 'F#', 'A#'],
      'Eaug': ['E', 'G#', 'B#'],
      
      // Diminished
      'Cdim': ['C', 'Eb', 'Gb'],
      'Ddim': ['D', 'F', 'Ab'],
      'Edim': ['E', 'G', 'Bb'],
      
      // Suspended
      'Csus2': ['C', 'D', 'G'],
      'Csus4': ['C', 'F', 'G', 'C'],
      'Dsus2': ['D', 'E', 'A'],
      'Dsus4': ['D', 'G', 'A', 'D'],
      'Esus4': ['E', 'A', 'B', 'E'],
      'Asus2': ['A', 'B', 'E'],
      'Asus4': ['A', 'D', 'E'],
    };

    // Try to find exact match or base chord
    let notes = chordMap[chordName];
    
    if (!notes) {
      // Try to extract base note (e.g., "C#m7" -> "C#" or "C#m")
      const baseNote = chordName.match(/^[A-G][#b]?/)?.[0] || 'C';
      const hasMinor = chordName.toLowerCase().includes('m');
      const hasSeventh = chordName.includes('7');
      
      if (hasSeventh && hasMinor) {
        notes = chordMap[baseNote + 'm7'] || chordMap[baseNote + 'm'] || chordMap[baseNote] || ['C', 'E', 'G'];
      } else if (hasMinor) {
        notes = chordMap[baseNote + 'm'] || chordMap[baseNote] || ['C', 'E', 'G'];
      } else if (hasSeventh) {
        notes = chordMap[baseNote + '7'] || chordMap[baseNote] || ['C', 'E', 'G'];
      } else {
        notes = chordMap[baseNote] || ['C', 'E', 'G'];
      }
    }

    // Play with realistic strum
    this.playChord(notes, 1800, 3, true);
  }
}

export const audioService = new AudioService();
