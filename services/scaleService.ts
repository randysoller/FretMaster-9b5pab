import { SCALES, NOTES, ScaleData } from '@/constants/musicData';

export function getAllScales(): ScaleData[] {
  return SCALES;
}

export function getScaleByName(name: string): ScaleData | undefined {
  return SCALES.find(scale => scale.name === name);
}

export function getScaleNotes(scale: ScaleData, root: string): string[] {
  const rootIndex = NOTES.indexOf(root);
  if (rootIndex === -1) return [];
  
  return scale.intervals.map(interval => {
    const noteIndex = (rootIndex + interval) % 12;
    return NOTES[noteIndex];
  });
}

export function getScalePositions(
  scale: ScaleData,
  root: string,
  tuning: string[],
  startFret: number = 0,
  endFret: number = 12
): { string: number; fret: number; note: string; isRoot: boolean }[] {
  const scaleNotes = getScaleNotes(scale, root);
  const positions: { string: number; fret: number; note: string; isRoot: boolean }[] = [];
  
  tuning.forEach((openNote, stringIndex) => {
    const openNoteIndex = NOTES.indexOf(openNote);
    
    for (let fret = startFret; fret <= endFret; fret++) {
      const noteIndex = (openNoteIndex + fret) % 12;
      const note = NOTES[noteIndex];
      
      if (scaleNotes.includes(note)) {
        positions.push({
          string: stringIndex,
          fret,
          note,
          isRoot: note === root,
        });
      }
    }
  });
  
  return positions;
}

export function getRandomScale(): ScaleData {
  return SCALES[Math.floor(Math.random() * SCALES.length)];
}

export function getRandomNote(): string {
  return NOTES[Math.floor(Math.random() * NOTES.length)];
}
