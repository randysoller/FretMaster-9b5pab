export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const STANDARD_TUNING = ['E', 'A', 'D', 'G', 'B', 'E'];

export interface ChordData {
  name: string;
  positions: number[]; // -1 = muted, 0 = open, 1+ = fret number
  fingers: number[]; // 0 = not played, 1-4 = finger
  category: 'major' | 'minor' | 'seventh' | 'extended';
}

export const CHORDS: ChordData[] = [
  // Major Chords
  { name: 'C', positions: [-1, 3, 2, 0, 1, 0], fingers: [0, 3, 2, 0, 1, 0], category: 'major' },
  { name: 'D', positions: [-1, -1, 0, 2, 3, 2], fingers: [0, 0, 0, 1, 3, 2], category: 'major' },
  { name: 'E', positions: [0, 2, 2, 1, 0, 0], fingers: [0, 2, 3, 1, 0, 0], category: 'major' },
  { name: 'G', positions: [3, 2, 0, 0, 0, 3], fingers: [3, 2, 0, 0, 0, 4], category: 'major' },
  { name: 'A', positions: [-1, 0, 2, 2, 2, 0], fingers: [0, 0, 1, 2, 3, 0], category: 'major' },
  
  // Minor Chords
  { name: 'Am', positions: [-1, 0, 2, 2, 1, 0], fingers: [0, 0, 2, 3, 1, 0], category: 'minor' },
  { name: 'Dm', positions: [-1, -1, 0, 2, 3, 1], fingers: [0, 0, 0, 2, 3, 1], category: 'minor' },
  { name: 'Em', positions: [0, 2, 2, 0, 0, 0], fingers: [0, 2, 3, 0, 0, 0], category: 'minor' },
  
  // Seventh Chords
  { name: 'G7', positions: [3, 2, 0, 0, 0, 1], fingers: [3, 2, 0, 0, 0, 1], category: 'seventh' },
  { name: 'D7', positions: [-1, -1, 0, 2, 1, 2], fingers: [0, 0, 0, 2, 1, 3], category: 'seventh' },
];

export interface ScaleData {
  name: string;
  intervals: number[]; // Semitone intervals from root
  pattern: string; // Description
}

export const SCALES: ScaleData[] = [
  { name: 'Major', intervals: [0, 2, 4, 5, 7, 9, 11], pattern: 'W-W-H-W-W-W-H' },
  { name: 'Minor', intervals: [0, 2, 3, 5, 7, 8, 10], pattern: 'W-H-W-W-H-W-W' },
  { name: 'Pentatonic Major', intervals: [0, 2, 4, 7, 9], pattern: 'W-W-m3-W-m3' },
  { name: 'Pentatonic Minor', intervals: [0, 3, 5, 7, 10], pattern: 'm3-W-W-m3-W' },
  { name: 'Blues', intervals: [0, 3, 5, 6, 7, 10], pattern: 'm3-W-H-H-m3-W' },
];

export const CHORD_PROGRESSIONS = [
  { name: 'I-IV-V', chords: ['C', 'F', 'G'], description: 'Classic rock' },
  { name: 'I-V-vi-IV', chords: ['C', 'G', 'Am', 'F'], description: 'Pop progression' },
  { name: 'ii-V-I', chords: ['Dm', 'G7', 'C'], description: 'Jazz turnaround' },
];

export const FRET_MARKERS = [3, 5, 7, 9, 12, 15, 17, 19, 21];
export const NUM_FRETS = 15;
