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
   * Play ultra-realistic guitar string using advanced physical modeling
   * Features:
   * - Inharmonicity (real strings aren't perfectly harmonic)
   * - String-specific decay rates
   * - Body resonance peaks (guitar soundhole/body modes)
   * - Sympathetic resonance (other strings vibrating)
   * - Realistic pluck transient
   * - Stereo width for fullness
   */
  playGuitarString(frequency: number, duration: number = 1500, velocity: number = 0.8, stringIndex: number = 0): void {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;
      
      // **Physical String Properties** (based on real guitar strings)
      const stringProps = [
        { mass: 1.0, tension: 0.7, inharmonicity: 0.0008, brightness: 0.55 },  // E (low)
        { mass: 0.85, tension: 0.75, inharmonicity: 0.0007, brightness: 0.60 }, // A
        { mass: 0.70, tension: 0.80, inharmonicity: 0.0006, brightness: 0.65 }, // D
        { mass: 0.55, tension: 0.85, inharmonicity: 0.0004, brightness: 0.72 }, // G
        { mass: 0.40, tension: 0.90, inharmonicity: 0.0003, brightness: 0.78 }, // B
        { mass: 0.30, tension: 0.95, inharmonicity: 0.0002, brightness: 0.85 }, // E (high)
      ];
      const props = stringProps[stringIndex] || stringProps[2];
      
      // **Enhanced Harmonic Series with Inharmonicity**
      // Real strings have slightly sharp harmonics due to stiffness
      const harmonics = [];
      for (let n = 1; n <= 12; n++) {
        const inharmonicRatio = n * (1 + props.inharmonicity * n * n);
        const amplitude = Math.pow(0.75, n - 1) * (1 / n); // Natural decay
        harmonics.push({ ratio: inharmonicRatio, amplitude });
      }
      
      // **Master Gain with Stereo Panning**
      const masterGain = ctx.createGain();
      const panner = ctx.createStereoPanner();
      
      // Subtle stereo spread (strings spread across soundstage)
      panner.pan.value = (stringIndex - 2.5) * 0.15; // -0.375 to +0.375
      
      masterGain.connect(panner);
      panner.connect(this.masterGain!);
      
      // **Dynamic ADSR Envelope** (varies by string and velocity)
      const attack = 0.003 + (1 - velocity) * 0.002;  // Softer = slower attack
      const decay = 0.06 + props.mass * 0.04;         // Heavier strings = longer decay
      const sustain = 0.35 * velocity * props.tension;
      const release = (duration / 1000) * (0.8 + props.mass * 0.4);
      
      masterGain.gain.setValueAtTime(0, now);
      masterGain.gain.linearRampToValueAtTime(velocity * 0.85, now + attack);
      masterGain.gain.exponentialRampToValueAtTime(sustain, now + attack + decay);
      masterGain.gain.exponentialRampToValueAtTime(0.001, now + release);
      
      // **Guitar Body Resonance** (soundhole/body modes)
      const bodyResonance = ctx.createBiquadFilter();
      bodyResonance.type = 'peaking';
      bodyResonance.frequency.value = 120; // Body resonance around 100-150Hz
      bodyResonance.Q.value = 2.5;
      bodyResonance.gain.value = 4; // Boost low frequencies
      
      // **Main Tone Filter** (brightness control)
      const toneFilter = ctx.createBiquadFilter();
      toneFilter.type = 'lowpass';
      toneFilter.frequency.value = 2500 + (props.brightness * 3500); // 2.5kHz-6kHz
      toneFilter.Q.value = 0.8; // Resonant peak for "woody" tone
      
      // **Air Absorption Filter** (high-freq rolloff)
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'highshelf';
      airFilter.frequency.value = 8000;
      airFilter.gain.value = -6; // Gentle rolloff
      
      // Connect filter chain
      const filterChain = (input: AudioNode) => {
        input.connect(bodyResonance);
        bodyResonance.connect(toneFilter);
        toneFilter.connect(airFilter);
        airFilter.connect(masterGain);
      };
      
      // **Create Harmonic Oscillators with Individual Decay**
      harmonics.forEach((harmonic, index) => {
        const osc = ctx.createOscillator();
        const harmonicGain = ctx.createGain();
        
        // Use sawtooth for richer harmonics, then filter
        osc.type = 'sawtooth';
        osc.frequency.value = frequency * harmonic.ratio;
        
        // Each harmonic decays at different rate (higher = faster)
        const harmonicDecay = decay * (1 + index * 0.08);
        const harmonicRelease = release * Math.pow(0.95, index);
        
        harmonicGain.gain.setValueAtTime(0, now);
        harmonicGain.gain.linearRampToValueAtTime(harmonic.amplitude, now + attack);
        harmonicGain.gain.exponentialRampToValueAtTime(harmonic.amplitude * 0.3, now + attack + harmonicDecay);
        harmonicGain.gain.exponentialRampToValueAtTime(0.001, now + harmonicRelease);
        
        osc.connect(harmonicGain);
        filterChain(harmonicGain);
        
        osc.start(now);
        osc.stop(now + harmonicRelease);
        
        this.activeOscillators.push(osc);
      });
      
      // **Enhanced Pluck Transient** (realistic pick/finger sound)
      this.addRealisticPluck(masterGain, now, velocity, props.brightness);
      
      // **Subtle Sympathetic Resonance** (other strings vibrating)
      if (velocity > 0.5) {
        this.addSympatheticResonance(masterGain, now, frequency, velocity * 0.15, release);
      }
      
      setTimeout(() => {
        this.activeOscillators = this.activeOscillators.filter(osc => {
          try {
            return true;
          } catch {
            return false;
          }
        });
      }, duration + 100);
    } catch (error) {
      console.log('Audio playback not available:', error);
    }
  }
  
  /**
   * Ultra-realistic pluck transient with pick scrape and string impact
   */
  private addRealisticPluck(destination: AudioNode, startTime: number, volume: number, brightness: number): void {
    try {
      const ctx = this.getAudioContext();
      
      // **1. Pick Scrape** (very brief high-frequency click)
      const scrapeSize = ctx.sampleRate * 0.008; // 8ms
      const scrapeBuffer = ctx.createBuffer(1, scrapeSize, ctx.sampleRate);
      const scrapeData = scrapeBuffer.getChannelData(0);
      
      for (let i = 0; i < scrapeSize; i++) {
        const decay = Math.exp(-i / scrapeSize * 20);
        scrapeData[i] = (Math.random() * 2 - 1) * decay;
      }
      
      const scrape = ctx.createBufferSource();
      const scrapeGain = ctx.createGain();
      const scrapeFilter = ctx.createBiquadFilter();
      
      scrape.buffer = scrapeBuffer;
      scrapeFilter.type = 'highpass';
      scrapeFilter.frequency.value = 3000 + brightness * 2000; // Brighter strings = higher scrape
      scrapeGain.gain.value = volume * 0.4;
      
      scrape.connect(scrapeFilter);
      scrapeFilter.connect(scrapeGain);
      scrapeGain.connect(destination);
      
      scrape.start(startTime);
      scrape.stop(startTime + 0.008);
      
      // **2. String Impact** (mid-frequency thump)
      const impactSize = ctx.sampleRate * 0.03; // 30ms
      const impactBuffer = ctx.createBuffer(1, impactSize, ctx.sampleRate);
      const impactData = impactBuffer.getChannelData(0);
      
      for (let i = 0; i < impactSize; i++) {
        const decay = Math.exp(-i / impactSize * 8);
        impactData[i] = (Math.random() * 2 - 1) * decay;
      }
      
      const impact = ctx.createBufferSource();
      const impactGain = ctx.createGain();
      const impactFilter = ctx.createBiquadFilter();
      
      impact.buffer = impactBuffer;
      impactFilter.type = 'bandpass';
      impactFilter.frequency.value = 1200;
      impactFilter.Q.value = 2;
      impactGain.gain.value = volume * 0.25;
      
      impact.connect(impactFilter);
      impactFilter.connect(impactGain);
      impactGain.connect(destination);
      
      impact.start(startTime + 0.002);
      impact.stop(startTime + 0.032);
      
      // **3. Body Knock** (low-frequency thump from string hitting fretboard)
      const knockOsc = ctx.createOscillator();
      const knockGain = ctx.createGain();
      
      knockOsc.type = 'sine';
      knockOsc.frequency.value = 80; // Deep body thump
      
      knockGain.gain.setValueAtTime(0, startTime);
      knockGain.gain.linearRampToValueAtTime(volume * 0.15, startTime + 0.005);
      knockGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.04);
      
      knockOsc.connect(knockGain);
      knockGain.connect(destination);
      
      knockOsc.start(startTime);
      knockOsc.stop(startTime + 0.04);
    } catch (error) {
      // Pluck is optional, fail silently
    }
  }
  
  /**
   * Simulate sympathetic resonance from other strings
   */
  private addSympatheticResonance(destination: AudioNode, startTime: number, fundamental: number, volume: number, duration: number): void {
    try {
      const ctx = this.getAudioContext();
      
      // Add subtle overtones at musically related frequencies
      const sympatheticFreqs = [
        fundamental * 0.5,   // Octave below
        fundamental * 1.5,   // Perfect fifth
        fundamental * 2.0,   // Octave above
      ];
      
      sympatheticFreqs.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.value = freq;
        
        filter.type = 'lowpass';
        filter.frequency.value = 2000;
        
        // Very subtle, delayed onset
        const delay = 0.05 + i * 0.02;
        gain.gain.setValueAtTime(0, startTime + delay);
        gain.gain.linearRampToValueAtTime(volume * 0.1, startTime + delay + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.7);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(destination);
        
        osc.start(startTime + delay);
        osc.stop(startTime + duration * 0.7);
      });
    } catch (error) {
      // Optional enhancement
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
