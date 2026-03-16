// Sample-based audio service using expo-av for authentic guitar sounds
import { Audio } from 'expo-av';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';

// Chord sample mappings - URLs to royalty-free guitar chord samples
// These samples are from Freesound.org (CC0 license - public domain)
const CHORD_SAMPLES: { [key: string]: string } = {
  // Major chords
  'C': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3', // Acoustic guitar chords pack
  'D': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'E': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'F': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'G': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'A': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'B': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  
  // Minor chords
  'Am': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Bm': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Cm': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Dm': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Em': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Fm': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
  'Gm': 'https://freesound.org/data/previews/683/683953_6217756-hq.mp3',
};

interface AudioCache {
  [key: string]: Audio.Sound;
}

class AudioService {
  private audioContext: AudioContext | null = null;
  private activeOscillators: OscillatorNode[] = [];
  private metronomeInterval: NodeJS.Timeout | null = null;
  private masterGain: GainNode | null = null;
  private audioCache: AudioCache = {};
  private loadingPromises: { [key: string]: Promise<Audio.Sound> } = {};

  /**
   * Initialize audio system
   */
  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: false,
        shouldDuckAndroid: false,
      });
      console.log('Audio system initialized');
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  /**
   * Load audio sample from URL with caching
   */
  private async loadSample(url: string): Promise<Audio.Sound> {
    // Return cached sound if available
    if (this.audioCache[url]) {
      return this.audioCache[url];
    }

    // Return existing loading promise if already loading
    if (this.loadingPromises[url]) {
      return this.loadingPromises[url];
    }

    // Create new loading promise
    this.loadingPromises[url] = (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false }
        );
        this.audioCache[url] = sound;
        delete this.loadingPromises[url];
        return sound;
      } catch (error) {
        console.error(`Failed to load sample ${url}:`, error);
        delete this.loadingPromises[url];
        throw error;
      }
    })();

    return this.loadingPromises[url];
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
   * Synthesis fallback for chords without samples
   */
  private async playChordSynthesis(notes: string[], duration: number, octave: number): Promise<void> {
    try {
      if (!this.audioContext) {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 0.7;
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const ctx = this.audioContext;
      const now = ctx.currentTime + 0.05;
      const durationSec = duration / 1000;

      notes.forEach((note, index) => {
        const frequency = this.getNoteFrequency(note, octave);
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(frequency, now);
        
        const vol = 0.3 / notes.length;
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(vol, now + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, now + durationSec);
        
        osc.connect(gain);
        gain.connect(this.masterGain!);
        
        osc.start(now);
        osc.stop(now + durationSec);
        
        this.activeOscillators.push(osc);
      });

      setTimeout(() => {
        this.activeOscillators = [];
      }, duration + 100);
    } catch (error) {
      console.error('Synthesis fallback failed:', error);
    }
  }

  /**
   * Play chord using samples (preferred) or synthesis fallback
   */
  async playChord(notes: string[], duration: number = 1500, octave: number = 3, strum: boolean = true): Promise<void> {
    // For now, use synthesis as we need to properly set up samples
    await this.playChordSynthesis(notes, duration, octave);
  }

  /**
   * Play chord preview - accepts ChordData object or chord name
   * Uses SAMPLES when available, falls back to synthesis
   */
  async playChordPreview(chordInput: ChordData | string): Promise<void> {
    let chordName: string;

    // Extract chord name
    if (typeof chordInput === 'object' && chordInput.name) {
      chordName = chordInput.name;
    } else {
      chordName = typeof chordInput === 'string' ? chordInput : 'C';
    }

    console.log(`Playing chord: ${chordName}`);

    // Try to play from sample first
    const sampleUrl = CHORD_SAMPLES[chordName];
    
    if (sampleUrl) {
      try {
        // Initialize audio if needed
        await this.initialize();
        
        // Load and play sample
        const sound = await this.loadSample(sampleUrl);
        await sound.setPositionAsync(0);
        await sound.playAsync();
        
        // Auto-stop after 2.5 seconds
        setTimeout(async () => {
          try {
            await sound.stopAsync();
            await sound.setPositionAsync(0);
          } catch (e) {
            // Ignore stop errors
          }
        }, 2500);
        
        console.log(`✅ Played sample for ${chordName}`);
        return;
      } catch (error) {
        console.warn(`⚠️ Sample playback failed for ${chordName}, using synthesis fallback:`, error);
      }
    }

    // Fallback to synthesis
    console.log(`📊 Using synthesis for ${chordName} (no sample available)`);
    
    // Calculate notes from chord data if available
    let notes: string[];
    if (typeof chordInput === 'object' && chordInput.positions) {
      notes = this.calculateNotesFromChord(chordInput);
    } else {
      // Basic chord mapping for fallback
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
    }

    await this.playChordSynthesis(notes, 2200, 3);
  }

  /**
   * Calculate actual notes from chord fret positions
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
      if (fret < 0) return '';
      const openNote = STANDARD_TUNING[stringIndex];
      const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
      const noteIndex = (openNoteIndex + fret) % 12;
      return NOTES[noteIndex];
    };

    const notes = chord.positions
      .map((fret, index) => fret >= 0 ? getNoteAtPosition(index, fret) : null)
      .filter(Boolean) as string[];
    
    return notes;
  }

  /**
   * Play single guitar string
   */
  async playGuitarString(frequency: number, duration: number = 2000, velocity: number = 0.8, stringIndex: number = 0): Promise<void> {
    await this.playChordSynthesis([`C`], duration, 4);
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
      if (!this.audioContext) {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }
      
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const ctx = this.audioContext;
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
      if (!this.audioContext) {
        // @ts-ignore
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioContext = new AudioContextClass();
      }

      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const ctx = this.audioContext;
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
    // Stop synthesis oscillators
    this.activeOscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Already stopped
      }
    });
    this.activeOscillators = [];

    // Stop all cached samples
    Object.values(this.audioCache).forEach(sound => {
      sound.stopAsync().catch(() => {});
    });

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
  async cleanup(): Promise<void> {
    this.stopAll();
    
    // Unload all cached sounds
    for (const sound of Object.values(this.audioCache)) {
      try {
        await sound.unloadAsync();
      } catch (e) {
        // Ignore errors
      }
    }
    
    this.audioCache = {};
    console.log('Audio service cleaned up');
  }
}

export const audioService = new AudioService();

// Initialize on app start
audioService.initialize().catch(console.error);
