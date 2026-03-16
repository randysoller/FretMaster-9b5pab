/**
 * Chord Utilities Service
 * 
 * Shared utilities for chord diagram rendering and analysis.
 * Provides barre detection, root note identification, and music theory helpers.
 */

import { STANDARD_TUNING } from '@/constants/musicData';

/**
 * Musical notes in chromatic order
 */
export const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Barre chord representation
 */
export interface BarreChord {
  fret: number;
  fromString: number;
  toString: number;
  finger: number;
}

/**
 * Normalizes note names by converting flats to sharps
 * 
 * @param note - Note name (e.g., "Bb", "C#", "D")
 * @returns Normalized note name with sharps (e.g., "A#", "C#", "D")
 * 
 * @example
 * normalizeNote('Bb') // returns 'A#'
 * normalizeNote('C#') // returns 'C#'
 */
export function normalizeNote(note: string): string {
  return note
    .replace('b', '#')
    .replace('Db', 'C#')
    .replace('Eb', 'D#')
    .replace('Gb', 'F#')
    .replace('Ab', 'G#')
    .replace('Bb', 'A#');
}

/**
 * Calculates the note at a specific fret position on a string
 * 
 * @param stringIndex - String index (0-5, low E to high e)
 * @param fret - Fret number (0 = open string, -1 = muted)
 * @returns Note name at that position, or empty string if muted
 * 
 * @example
 * getNoteAtPosition(0, 0) // 'E' (low E string open)
 * getNoteAtPosition(0, 3) // 'G' (low E string, 3rd fret)
 */
export function getNoteAtPosition(stringIndex: number, fret: number): string {
  if (fret < 0) return '';
  
  const openNote = STANDARD_TUNING[stringIndex];
  const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
  const noteIndex = (openNoteIndex + fret) % 12;
  
  return NOTES[noteIndex];
}

/**
 * Checks if a fret position is the root note of a chord
 * 
 * @param stringIndex - String index (0-5)
 * @param fret - Fret number
 * @param chordName - Chord name (e.g., "C Major", "Am", "G7")
 * @returns True if this position is a root note
 * 
 * @example
 * isRootNote(0, 3, 'G Major') // true (G on low E string, 3rd fret)
 * isRootNote(1, 0, 'A Minor') // true (A on A string, open)
 */
export function isRootNote(stringIndex: number, fret: number, chordName: string): boolean {
  // Extract root note from chord name (e.g., "C" from "C Major", "A" from "Am")
  const rootNote = chordName.match(/^[A-G][#b]?/)?.[0] || 'C';
  const normalizedRootNote = normalizeNote(rootNote);
  const noteAtPosition = getNoteAtPosition(stringIndex, fret);
  
  return normalizeNote(noteAtPosition) === normalizedRootNote;
}

/**
 * Detects barre chords in a chord diagram
 * 
 * A barre is created when 2 or more strings share the same fret and finger number.
 * This function analyzes finger positions and returns all detected barres.
 * 
 * @param positions - Array of fret positions for each string (0-24, -1 = muted)
 * @param fingers - Array of finger numbers for each string (0-5, 0 = no finger)
 * @returns Array of barre chord objects
 * 
 * @example
 * // F Major barre chord (1st fret barre with finger 1)
 * detectBarres([1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1])
 * // Returns: [{ fret: 1, fromString: 0, toString: 5, finger: 1 }]
 * 
 * @example
 * // Partial barre on strings 2-4
 * detectBarres([-1, -1, 5, 5, 5, -1], [0, 0, 1, 1, 1, 0])
 * // Returns: [{ fret: 5, fromString: 2, toString: 4, finger: 1 }]
 */
export function detectBarres(positions: number[], fingers: number[]): BarreChord[] {
  const barres: BarreChord[] = [];
  const fretMap: { [key: string]: number[] } = {};

  // Group strings by fret and finger combination
  positions.forEach((fret, stringIndex) => {
    if (fret > 0 && fingers[stringIndex] > 0) {
      const key = `${fret}-${fingers[stringIndex]}`;
      if (!fretMap[key]) {
        fretMap[key] = [];
      }
      fretMap[key].push(stringIndex);
    }
  });

  // Create barre objects for groups with 2+ strings
  Object.entries(fretMap).forEach(([key, strings]) => {
    if (strings.length >= 2) {
      const [fret, finger] = key.split('-').map(Number);
      const fromString = Math.min(...strings);
      const toString = Math.max(...strings);
      
      barres.push({ fret, fromString, toString, finger });
    }
  });

  return barres;
}

/**
 * Gets a set of string indices that are part of barres
 * 
 * Useful for rendering logic to avoid duplicate dots on barred strings.
 * 
 * @param positions - Array of fret positions
 * @param fingers - Array of finger numbers
 * @returns Set of string indices that are part of a barre
 * 
 * @example
 * const barredStrings = getBarredStrings([1, 3, 3, 2, 1, 1], [1, 3, 4, 2, 1, 1]);
 * barredStrings.has(0) // true (part of barre)
 * barredStrings.has(1) // false (not part of barre)
 */
export function getBarredStrings(positions: number[], fingers: number[]): Set<number> {
  const barredStrings = new Set<number>();
  const barres = detectBarres(positions, fingers);
  
  barres.forEach(barre => {
    for (let stringIndex = barre.fromString; stringIndex <= barre.toString; stringIndex++) {
      if (positions[stringIndex] === barre.fret) {
        barredStrings.add(stringIndex);
      }
    }
  });
  
  return barredStrings;
}

/**
 * Extracts the root note name from a chord name
 * 
 * @param chordName - Full chord name (e.g., "C Major", "Bbm7", "F#dim")
 * @returns Root note (e.g., "C", "Bb", "F#")
 * 
 * @example
 * getChordRoot('C Major') // 'C'
 * getChordRoot('Bbm7') // 'Bb'
 * getChordRoot('F#dim') // 'F#'
 */
export function getChordRoot(chordName: string): string {
  return chordName.match(/^[A-G][#b]?/)?.[0] || 'C';
}
