export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

export type ChordShape = 'open' | 'barre' | 'movable';
export type ChordType = 'major' | 'minor' | 'augmented' | 'diminished' | 'suspended' | 
                        'major7' | 'dominant7' | 'minor7' | 'ninth' | 'eleventh' | 'thirteenth' | 'slash';

export interface ChordData {
  name: string;
  fullName: string;
  positions: number[]; // -1 = muted, 0 = open, 1+ = fret number
  fingers: number[]; // 0 = not played, 1-4 = finger
  shape: ChordShape;
  type: ChordType;
}

export const CHORDS: ChordData[] = [
  // ========== MAJOR CHORDS ==========
  // Open Major
  { name: 'C', fullName: 'C Major', positions: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], shape: 'open', type: 'major' },
  { name: 'D', fullName: 'D Major', positions: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], shape: 'open', type: 'major' },
  { name: 'E', fullName: 'E Major', positions: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], shape: 'open', type: 'major' },
  { name: 'G', fullName: 'G Major', positions: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], shape: 'open', type: 'major' },
  { name: 'A', fullName: 'A Major', positions: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], shape: 'open', type: 'major' },
  
  // Barre Major
  { name: 'F', fullName: 'F Major', positions: [1, 3, 3, 2, 1, 1], fingers: [1, 3, 4, 2, 1, 1], shape: 'barre', type: 'major' },
  { name: 'B', fullName: 'B Major', positions: [-1, 2, 4, 4, 4, 2], fingers: [0, 1, 3, 3, 3, 1], shape: 'barre', type: 'major' },
  { name: 'Bb', fullName: 'Bb Major', positions: [-1, 1, 3, 3, 3, 1], fingers: [0, 1, 3, 3, 3, 1], shape: 'barre', type: 'major' },
  
  // ========== MINOR CHORDS ==========
  // Open Minor
  { name: 'Am', fullName: 'A Minor', positions: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], shape: 'open', type: 'minor' },
  { name: 'Dm', fullName: 'D Minor', positions: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], shape: 'open', type: 'minor' },
  { name: 'Em', fullName: 'E Minor', positions: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], shape: 'open', type: 'minor' },
  
  // Barre Minor
  { name: 'Fm', fullName: 'F Minor', positions: [1, 3, 3, 1, 1, 1], fingers: [1, 3, 4, 1, 1, 1], shape: 'barre', type: 'minor' },
  { name: 'Bm', fullName: 'B Minor', positions: [-1, 2, 4, 4, 3, 2], fingers: [0, 1, 3, 4, 2, 1], shape: 'barre', type: 'minor' },
  { name: 'Cm', fullName: 'C Minor', positions: [-1, 3, 5, 5, 4, 3], fingers: [0, 1, 3, 4, 2, 1], shape: 'barre', type: 'minor' },
  
  // ========== AUGMENTED CHORDS ==========
  { name: 'Caug', fullName: 'C Augmented', positions: [-1, 3, 2, 1, 1, 0], fingers: [0, 4, 3, 1, 2, 0], shape: 'open', type: 'augmented' },
  { name: 'Gaug', fullName: 'G Augmented', positions: [3, 2, 1, 0, 0, 3], fingers: [3, 2, 1, 0, 0, 4], shape: 'open', type: 'augmented' },
  { name: 'Daug', fullName: 'D Augmented', positions: [-1, -1, 0, 3, 3, 2], fingers: [0, 0, 0, 2, 3, 1], shape: 'movable', type: 'augmented' },
  
  // ========== DIMINISHED CHORDS ==========
  { name: 'Cdim', fullName: 'C Diminished', positions: [-1, 3, 1, 2, 1, 2], fingers: [0, 4, 1, 2, 1, 3], shape: 'movable', type: 'diminished' },
  { name: 'Ddim', fullName: 'D Diminished', positions: [-1, -1, 0, 1, 0, 1], fingers: [0, 0, 0, 1, 0, 2], shape: 'open', type: 'diminished' },
  { name: 'Bdim', fullName: 'B Diminished', positions: [-1, 2, 3, 4, 3, -1], fingers: [0, 1, 2, 4, 3, 0], shape: 'movable', type: 'diminished' },
  
  // ========== SUSPENDED CHORDS ==========
  { name: 'Csus2', fullName: 'C Suspended 2', positions: [-1, 3, 0, 0, 1, 3], fingers: [0, 2, 0, 0, 1, 3], shape: 'open', type: 'suspended' },
  { name: 'Csus4', fullName: 'C Suspended 4', positions: [-1, 3, 3, 0, 1, 1], fingers: [0, 3, 4, 0, 1, 1], shape: 'open', type: 'suspended' },
  { name: 'Dsus2', fullName: 'D Suspended 2', positions: [-1, -1, 0, 2, 3, 0], fingers: [0, 0, 0, 1, 2, 0], shape: 'open', type: 'suspended' },
  { name: 'Dsus4', fullName: 'D Suspended 4', positions: [-1, -1, 0, 2, 3, 3], fingers: [0, 0, 0, 1, 3, 4], shape: 'open', type: 'suspended' },
  { name: 'Esus4', fullName: 'E Suspended 4', positions: [0, 2, 2, 2, 0, 0], fingers: [0, 2, 3, 4, 0, 0], shape: 'open', type: 'suspended' },
  { name: 'Asus4', fullName: 'A Suspended 4', positions: [-1, 0, 2, 2, 3, 0], fingers: [0, 0, 1, 2, 3, 0], shape: 'open', type: 'suspended' },
  
  // ========== MAJOR 7TH CHORDS ==========
  { name: 'Cmaj7', fullName: 'C Major 7', positions: [-1, 3, 2, 0, 0, 0], fingers: [0, 3, 2, 0, 0, 0], shape: 'open', type: 'major7' },
  { name: 'Dmaj7', fullName: 'D Major 7', positions: [-1, -1, 0, 2, 2, 2], fingers: [0, 0, 0, 1, 1, 1], shape: 'open', type: 'major7' },
  { name: 'Emaj7', fullName: 'E Major 7', positions: [0, 2, 1, 1, 0, 0], fingers: [0, 3, 1, 2, 0, 0], shape: 'open', type: 'major7' },
  { name: 'Gmaj7', fullName: 'G Major 7', positions: [3, 2, 0, 0, 0, 2], fingers: [3, 2, 0, 0, 0, 1], shape: 'open', type: 'major7' },
  { name: 'Amaj7', fullName: 'A Major 7', positions: [-1, 0, 2, 1, 2, 0], fingers: [0, 0, 2, 1, 3, 0], shape: 'open', type: 'major7' },
  
  // ========== DOMINANT 7TH CHORDS ==========
  { name: 'C7', fullName: 'C Dominant 7', positions: [-1, 3, 2, 3, 1, 0], fingers: [0, 3, 2, 4, 1, 0], shape: 'open', type: 'dominant7' },
  { name: 'D7', fullName: 'D Dominant 7', positions: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], shape: 'open', type: 'dominant7' },
  { name: 'E7', fullName: 'E Dominant 7', positions: [0, 2, 0, 1, 0, 0], fingers: [0, 2, 0, 1, 0, 0], shape: 'open', type: 'dominant7' },
  { name: 'G7', fullName: 'G Dominant 7', positions: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], shape: 'open', type: 'dominant7' },
  { name: 'A7', fullName: 'A Dominant 7', positions: [-1, 0, 2, 0, 2, 0], fingers: [0, 0, 2, 0, 3, 0], shape: 'open', type: 'dominant7' },
  { name: 'B7', fullName: 'B Dominant 7', positions: [-1, 2, 1, 2, 0, 2], fingers: [0, 2, 1, 3, 0, 4], shape: 'open', type: 'dominant7' },
  
  // ========== MINOR 7TH CHORDS ==========
  { name: 'Am7', fullName: 'A Minor 7', positions: [-1, 0, 2, 0, 1, 0], fingers: [0, 0, 2, 0, 1, 0], shape: 'open', type: 'minor7' },
  { name: 'Dm7', fullName: 'D Minor 7', positions: [-1, -1, 0, 2, 1, 1], fingers: [0, 0, 0, 2, 1, 1], shape: 'open', type: 'minor7' },
  { name: 'Em7', fullName: 'E Minor 7', positions: [0, 2, 0, 0, 0, 0], fingers: [0, 2, 0, 0, 0, 0], shape: 'open', type: 'minor7' },
  { name: 'Bm7', fullName: 'B Minor 7', positions: [-1, 2, 0, 2, 0, 2], fingers: [0, 2, 0, 3, 0, 4], shape: 'open', type: 'minor7' },
  
  // ========== 9TH CHORDS ==========
  { name: 'C9', fullName: 'C Dominant 9', positions: [-1, 3, 2, 3, 3, 3], fingers: [0, 2, 1, 3, 3, 3], shape: 'movable', type: 'ninth' },
  { name: 'D9', fullName: 'D Dominant 9', positions: [-1, -1, 0, 2, 1, 0], fingers: [0, 0, 0, 2, 1, 0], shape: 'open', type: 'ninth' },
  { name: 'E9', fullName: 'E Dominant 9', positions: [0, 2, 0, 1, 0, 2], fingers: [0, 2, 0, 1, 0, 3], shape: 'open', type: 'ninth' },
  { name: 'G9', fullName: 'G Dominant 9', positions: [3, 2, 3, 2, 3, 3], fingers: [2, 1, 3, 1, 4, 4], shape: 'movable', type: 'ninth' },
  
  // ========== 11TH CHORDS ==========
  { name: 'C11', fullName: 'C Dominant 11', positions: [-1, 3, 3, 3, 1, 1], fingers: [0, 2, 3, 4, 1, 1], shape: 'movable', type: 'eleventh' },
  { name: 'D11', fullName: 'D Dominant 11', positions: [-1, -1, 0, 0, 1, 0], fingers: [0, 0, 0, 0, 1, 0], shape: 'open', type: 'eleventh' },
  { name: 'E11', fullName: 'E Dominant 11', positions: [0, 0, 0, 1, 0, 0], fingers: [0, 0, 0, 1, 0, 0], shape: 'open', type: 'eleventh' },
  
  // ========== 13TH CHORDS ==========
  { name: 'C13', fullName: 'C Dominant 13', positions: [-1, 3, 2, 3, 5, 5], fingers: [0, 1, 1, 2, 3, 4], shape: 'movable', type: 'thirteenth' },
  { name: 'G13', fullName: 'G Dominant 13', positions: [3, 2, 3, 2, 0, 0], fingers: [3, 1, 4, 2, 0, 0], shape: 'movable', type: 'thirteenth' },
  { name: 'A13', fullName: 'A Dominant 13', positions: [-1, 0, 2, 0, 2, 2], fingers: [0, 0, 1, 0, 2, 3], shape: 'movable', type: 'thirteenth' },
  
  // ========== SLASH CHORDS ==========
  { name: 'C/G', fullName: 'C over G', positions: [3, 3, 2, 0, 1, 0], fingers: [3, 4, 2, 0, 1, 0], shape: 'open', type: 'slash' },
  { name: 'D/F#', fullName: 'D over F#', positions: [2, -1, 0, 2, 3, 2], fingers: [1, 0, 0, 2, 4, 3], shape: 'open', type: 'slash' },
  { name: 'G/B', fullName: 'G over B', positions: [-1, 2, 0, 0, 0, 3], fingers: [0, 2, 0, 0, 0, 4], shape: 'open', type: 'slash' },
];

export interface ScaleData {
  name: string;
  intervals: number[];
  pattern: string;
}

export const SCALES: ScaleData[] = [
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11], pattern: 'W-W-H-W-W-W-H' },
  { name: 'Minor', intervals: [0, 2, 3, 5, 7, 8, 10], pattern: 'W-H-W-W-H-W-W' },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9], pattern: 'W-W-m3-W-m3' },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10], pattern: 'm3-W-W-m3-W' },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], pattern: 'm3-W-H-H-m3-W' },
];

export const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
export const NUM_FRETS = 15;
