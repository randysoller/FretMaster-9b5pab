import { CHORDS, NOTES, ChordData } from '@/constants/musicData';

export function getChordsByCategory(category: string): ChordData[] {
  return CHORDS.filter(chord => chord.category === category);
}

export function getAllChords(): ChordData[] {
  return CHORDS;
}

export function getChordByName(name: string): ChordData | undefined {
  return CHORDS.find(chord => chord.name === name);
}

export function getChordNotes(chord: ChordData, tuning: string[]): string[] {
  const notes: string[] = [];
  
  chord.positions.forEach((fret, stringIndex) => {
    if (fret === -1) return; // Muted string
    
    const openNote = tuning[stringIndex];
    const openNoteIndex = NOTES.indexOf(openNote);
    const noteIndex = (openNoteIndex + fret) % 12;
    notes.push(NOTES[noteIndex]);
  });
  
  return notes;
}

export function validateChordShape(positions: number[]): boolean {
  if (positions.length !== 6) return false;
  return positions.every(pos => pos >= -1 && pos <= 24);
}

export function getRandomChord(): ChordData {
  return CHORDS[Math.floor(Math.random() * CHORDS.length)];
}

export function getRandomChordsByCategory(category: string, count: number): ChordData[] {
  const chords = getChordsByCategory(category);
  const shuffled = [...chords].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
