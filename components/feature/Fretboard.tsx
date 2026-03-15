
import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Line, Circle, Rect, Polygon, Text as SvgText } from 'react-native-svg';
import { ChordData, STANDARD_TUNING } from '@/constants/musicData';
import { colors } from '@/constants/theme';

interface FretboardProps {
  chord: ChordData;
  size?: 'sm' | 'md' | 'lg';
}

const SIZES = {
  sm: { width: 100, height: 130, dotRadius: 5, fontSize: 12, topY: 18, fretLabelSize: 9 }, // Reduced dotRadius from 7 to 5 (4pts smaller), fontSize from 14 to 12
  md: { width: 140, height: 175, dotRadius: 7.5, fontSize: 16, topY: 22, fretLabelSize: 11 }, // Reduced dotRadius from 9.5 to 7.5, fontSize from 18 to 16
  lg: { width: 200, height: 250, dotRadius: 11, fontSize: 22, topY: 30, fretLabelSize: 14 }, // Reduced dotRadius from 13 to 11, fontSize from 24 to 22
};

const FRET_LABEL_PAD = { sm: 10, md: 14, lg: 20 };

const ROOT_NOTE_COLOR = colors.rootNoteBlue; // #4DB8E8
const OTHER_NOTE_COLOR = colors.primary; // #D4952A
const STRING_COLOR = colors.textSubtle;
const FRET_COLOR = '#ffffff';
const NUT_COLOR = colors.text;
const MUTED_COLOR = colors.textMuted;
const OPEN_COLOR = colors.textSubtle;
const INLAY_COLOR = 'rgba(255, 255, 255, 0.15)';

export function Fretboard({ chord, size = 'md' }: FretboardProps) {
  const config = SIZES[size];
  const numStrings = 6;
  const numFrets = 5;

  // Calculate baseFret from chord positions
  const activeFrets = chord.positions.filter(f => f > 0);
  const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
  const baseFret = minFret > 3 ? minFret : 1;
  
  const showNut = baseFret === 1;
  const needsFretLabel = !showNut;

  const basePadLeft = size === 'lg' ? 30 : 22;
  const extraLeft = needsFretLabel ? FRET_LABEL_PAD[size] : 0;
  const padLeft = basePadLeft + extraLeft;
  const padRight = size === 'lg' ? 16 : 12;
  const padTop = config.topY + 8;

  const svgWidth = config.width + extraLeft;
  const gridWidth = svgWidth - padLeft - padRight;
  const gridHeight = config.height - padTop - 16;
  const stringSpacing = gridWidth / (numStrings - 1);
  const fretSpacing = gridHeight / numFrets;

  const getStringX = (i: number) => padLeft + i * stringSpacing;
  const getFretY = (f: number) => padTop + f * fretSpacing;

  // Realistic string thickness: low E (thickest) → high e (thinnest)
  const STRING_WIDTHS = [2.6, 2.2, 1.8, 1.4, 1.0, 0.7];

  // Detect and render barre chords
  const detectBarres = () => {
    const barres: Array<{ fret: number; fromString: number; toString: number; finger: number }> = [];
    const fingerGroups = new Map<number, number[]>();
    
    chord.fingers.forEach((finger, idx) => {
      if (finger > 0 && chord.positions[idx] > 0) {
        if (!fingerGroups.has(finger)) {
          fingerGroups.set(finger, []);
        }
        fingerGroups.get(finger)!.push(idx);
      }
    });

    fingerGroups.forEach((stringIndices, finger) => {
      if (stringIndices.length >= 2) {
        const frets = stringIndices.map(si => chord.positions[si]);
        const uniqueFrets = [...new Set(frets)];
        if (uniqueFrets.length === 1) {
          const fret = uniqueFrets[0];
          const fromString = Math.min(...stringIndices);
          const toString = Math.max(...stringIndices);
          barres.push({ fret, fromString, toString, finger });
        }
      }
    });

    return barres;
  };

  const barres = detectBarres();
  const barreRenderedStrings = new Set<string>();
  barres.forEach(barre => {
    for (let si = barre.fromString; si <= barre.toString; si++) {
      if (chord.positions[si] === barre.fret) {
        barreRenderedStrings.add(`${si}-${barre.fret}`);
      }
    }
  });

  // Calculate root note for diamond detection
  const rootNote = chord.name.match(/^[A-G][#b]?/)?.[0] || 'C';
  const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  const normalizeNote = (note: string) => {
    return note.replace('b', '#').replace('Db', 'C#').replace('Eb', 'D#')
      .replace('Gb', 'F#').replace('Ab', 'G#').replace('Bb', 'A#');
  };
  
  const getNoteAtPosition = (stringIndex: number, fret: number): string => {
    if (fret < 0) return '';
    const openNote = STANDARD_TUNING[stringIndex];
    const openNoteIndex = NOTES.indexOf(normalizeNote(openNote));
    const noteIndex = (openNoteIndex + fret) % 12;
    return NOTES[noteIndex];
  };
  
  const normalizedRootNote = normalizeNote(rootNote);

  // Build a set of (stringIndex-fret) that are rendered by barre
  const barreRenderedStrings = new Set<string>();
  
  // Calculate barre positions (not part of original chord data, infer from finger positions)
  const barres: number[] = [];
  const fingerGroups = new Map<number, number[]>();
  
  chord.fingers.forEach((finger, idx) => {
    if (finger > 0 && chord.positions[idx] > 0) {
      if (!fingerGroups.has(finger)) {
        fingerGroups.set(finger, []);
      }
      fingerGroups.get(finger)!.push(idx);
    }
  });

  // Detect barre: same finger on 3+ strings at same fret
  fingerGroups.forEach((stringIndices, finger) => {
    if (stringIndices.length >= 3) {
      const frets = stringIndices.map(si => chord.positions[si]);
      const uniqueFrets = [...new Set(frets)];
      if (uniqueFrets.length === 1) {
        barres.push(uniqueFrets[0]);
        stringIndices.forEach(si => {
          barreRenderedStrings.add(`${si}-${chord.positions[si]}`);
        });
      }
    }
  });

  return (
    <Svg width={svgWidth} height={config.height}>
      {/* Fret number indicator */}
      {needsFretLabel && (
        <SvgText
          x={basePadLeft / 2}
          y={padTop + fretSpacing * 1.5}
          fontSize={config.fretLabelSize}
          fontWeight="600"
          fill={colors.textSubtle}
          textAnchor="middle"
        >
          {baseFret}fr
        </SvgText>
      )}

      {/* Fret lines - exact width to match strings */}
      {Array.from({ length: numFrets + 1 }).map((_, i) => (
        <Line
          key={`fret-${i}`}
          x1={padLeft}
          y1={getFretY(i)}
          x2={padLeft + gridWidth}
          y2={getFretY(i)}
          stroke={FRET_COLOR}
          strokeWidth={2}
        />
      ))}

      {/* Fret dot inlays (3rd, 5th, 7th, 9th, 12th frets) */}
      {Array.from({ length: numFrets }).map((_, i) => {
        const absoluteFret = baseFret + i;
        const inlayR = config.dotRadius / 2;
        const y = getFretY(i) + fretSpacing / 2;
        const centerX = (getStringX(0) + getStringX(numStrings - 1)) / 2;
        const isSingle = [3, 5, 7, 9, 15, 17, 19, 21].includes(absoluteFret);
        const isDouble = [12, 24].includes(absoluteFret);
        
        if (!isSingle && !isDouble) return null;
        
        if (isDouble) {
          const leftX = (getStringX(1) + getStringX(2)) / 2;
          const rightX = (getStringX(3) + getStringX(4)) / 2;
          return (
            <React.Fragment key={`inlay-${i}`}>
              <Circle cx={leftX} cy={y} r={inlayR} fill={INLAY_COLOR} />
              <Circle cx={rightX} cy={y} r={inlayR} fill={INLAY_COLOR} />
            </React.Fragment>
          );
        }
        
        return <Circle key={`inlay-${i}`} cx={centerX} cy={y} r={inlayR} fill={INLAY_COLOR} />;
      })}

      {/* String lines — realistic thickness, colored by status */}
      {Array.from({ length: numStrings }).map((_, i) => {
        const fret = chord.positions[i];
        let stringColor = STRING_COLOR;
        
        // Muted strings are dimmer
        if (fret === -1) stringColor = MUTED_COLOR;
        // Open strings highlighted
        if (fret === 0) stringColor = OPEN_COLOR;
        
        return (
          <Line
            key={`string-${i}`}
            x1={getStringX(i)}
            y1={padTop}
            x2={getStringX(i)}
            y2={padTop + gridHeight}
            stroke={stringColor}
            strokeWidth={STRING_WIDTHS[i]}
          />
        );
      })}

      {/* Nut (solid bar at top when baseFret = 1) */}
      {showNut && (
        <Rect
          x={padLeft}
          y={padTop - 3}
          width={gridWidth}
          height={6}
          fill={NUT_COLOR}
          rx={1}
        />
      )}

      {/* Barre indicators - connecting lines */}
      {barres.map((barre, idx) => {
        const relFret = barre.fret - baseFret + 1;
        if (relFret < 1 || relFret > numFrets) return null;

        const y = getFretY(relFret) - fretSpacing / 2;
        const x1 = getStringX(barre.fromString);
        const x2 = getStringX(barre.toString);
        const barHeight = config.dotRadius * 1.5;

        return (
          <Rect
            key={`barre-line-${idx}`}
            x={x1}
            y={y - barHeight / 2}
            width={x2 - x1}
            height={barHeight}
            fill={OTHER_NOTE_COLOR}
            rx={barHeight / 2}
          />
        );
      })}

      {/* OLD Barre indicators - KEEP FOR DOTS */}
      {barres.map((barreFret, idx) => {
        const relFret = barreFret - baseFret + 1;
        if (relFret < 1 || relFret > numFrets) return null;

        const barreStrings = chord.positions
          .map((f, sidx) => (f >= barreFret ? sidx : -1))
          .filter((sidx) => sidx >= 0);

        if (barreStrings.length < 2) return null;

        const fromString = barreStrings[0];
        const toString = barreStrings[barreStrings.length - 1];
        const y = getFretY(relFret) - fretSpacing / 2;

        const barreFingerNum = chord.fingers[fromString];
        const barHeight = config.dotRadius * 0.38;

        const contactStrings: number[] = [];
        for (let si = fromString; si <= toString; si++) {
          if (chord.positions[si] === barreFret) {
            contactStrings.push(si);
          }
        }

        return (
          <React.Fragment key={`barre-${idx}`}>
            {contactStrings.length >= 2 && (
              <Rect
                x={getStringX(fromString)}
                y={y - barHeight / 2}
                width={getStringX(toString) - getStringX(fromString)}
                height={barHeight}
                fill={OTHER_NOTE_COLOR}
                rx={barHeight / 2}
              />
            )}
            {contactStrings.map((si) => {
              const isRoot = si === chord.positions.findIndex(f => {
                const note = getNoteAtPosition(si, f);
                return normalizeNote(note) === normalizedRootNote;
              });
              
              return (
                <React.Fragment key={`barre-dot-${si}`}>
                  {isRoot ? (
                    <RootDiamond x={getStringX(si)} y={y} r={config.dotRadius} fingerNum={barreFingerNum} fontSize={config.fontSize} />
                  ) : (
                    <>
                      <Circle cx={getStringX(si)} cy={y} r={config.dotRadius} fill={OTHER_NOTE_COLOR} />
                      {barreFingerNum > 0 && (
                        <SvgText
                          x={getStringX(si)}
                          y={y + config.fontSize * 0.35}
                          fontSize={config.fontSize}
                          fontWeight="700"
                          fill={colors.background}
                          textAnchor="middle"
                        >
                          {barreFingerNum}
                        </SvgText>
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        );
      })} {/* Removed extra '}' here */}

      {/* Open and muted string indicators */}
      {chord.positions.map((fret, i) => {
        const x = getStringX(i);
        const y = config.topY - 4;
        const r = config.dotRadius * 0.65;

        if (fret === 0) {
          const noteAtPosition = getNoteAtPosition(i, 0);
          const isRoot = normalizeNote(noteAtPosition) === normalizedRootNote;
          
          if (isRoot) {
            return <RootDiamond key={`open-${i}`} x={x} y={y} r={r} fingerNum={0} fontSize={config.fontSize * 0.65} />;
          }
          return <Circle key={`open-${i}`} cx={x} cy={y} r={r} stroke={OPEN_COLOR} strokeWidth={1.5} fill="none" />;
        }
        
        if (fret === -1) {
          return (
            <React.Fragment key={`muted-${i}`}>
              <Line x1={x - r} y1={y - r} x2={x + r} y2={y + r} stroke={MUTED_COLOR} strokeWidth={1.5} />
              <Line x1={x + r} y1={y - r} x2={x - r} y2={y + r} stroke={MUTED_COLOR} strokeWidth={1.5} />
            </React.Fragment>
          );
        }
        
        return null;
      })} {/* Removed extra '}' here */}

      {/* Finger dots (non-barre) - KEEP EXISTING LOGIC */}
      {chord.positions.map((fret, i) => {
        if (fret <= 0) return null;

        const relFret = fret - baseFret + 1;
        if (relFret < 1 || relFret > numFrets) return null;

        // Skip if already rendered by barre
        if (barreRenderedStrings.has(`${i}-${fret}`)) return null;

        const x = getStringX(i);
        const y = getFretY(relFret) - fretSpacing / 2;
        const noteAtPosition = getNoteAtPosition(i, fret);
        const isRoot = normalizeNote(noteAtPosition) === normalizedRootNote;

        return (
          <React.Fragment key={`dot-${i}`}>
            {isRoot ? (
              <RootDiamond x={x} y={y} r={config.dotRadius} fingerNum={chord.fingers[i]} fontSize={config.fontSize} />
            ) : (
              <>
                <Circle cx={x} cy={y} r={config.dotRadius} fill={OTHER_NOTE_COLOR} />
                {chord.fingers[i] > 0 && (
                  <SvgText
                    x={x}
                    y={y + config.fontSize * 0.35}
                    fontSize={config.fontSize}
                    fontWeight="700"
                    fill={colors.background}
                    textAnchor="middle"
                  >
                    {chord.fingers[i]}
                  </SvgText>
                )}
              </>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

/** Light blue diamond shape for root notes with upright finger number */
function RootDiamond({ x, y, r, fingerNum, fontSize }: { x: number; y: number; r: number; fingerNum?: number; fontSize?: number }) {
  const d = r * 1.15;
  const points = `${x},${y - d} ${x + d},${y} ${x},${y + d} ${x - d},${y}`;
  return (
    <>
      <Polygon points={points} fill={ROOT_NOTE_COLOR} />
      {fingerNum != null && fingerNum > 0 && fontSize && (
        <SvgText
          x={x}
          y={y + fontSize * 0.35}
          fontSize={fontSize}
          fontWeight="700"
          fill="#1A1D24"
          textAnchor="middle"
        >
          {fingerNum}
        </SvgText>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
