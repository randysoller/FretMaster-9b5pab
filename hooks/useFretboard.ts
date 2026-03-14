import { useState, useCallback } from 'react';

export interface FretPosition {
  string: number;
  fret: number;
}

export interface FretboardState {
  activePositions: FretPosition[];
  highlightedPositions: FretPosition[];
}

export function useFretboard() {
  const [activePositions, setActivePositions] = useState<FretPosition[]>([]);
  const [highlightedPositions, setHighlightedPositions] = useState<FretPosition[]>([]);

  const addPosition = useCallback((position: FretPosition) => {
    setActivePositions(prev => {
      const exists = prev.some(p => p.string === position.string && p.fret === position.fret);
      if (exists) {
        return prev.filter(p => !(p.string === position.string && p.fret === position.fret));
      }
      return [...prev, position];
    });
  }, []);

  const clearPositions = useCallback(() => {
    setActivePositions([]);
  }, []);

  const setPositions = useCallback((positions: FretPosition[]) => {
    setActivePositions(positions);
  }, []);

  const setHighlighted = useCallback((positions: FretPosition[]) => {
    setHighlightedPositions(positions);
  }, []);

  const clearHighlighted = useCallback(() => {
    setHighlightedPositions([]);
  }, []);

  const isPositionActive = useCallback((string: number, fret: number) => {
    return activePositions.some(p => p.string === string && p.fret === fret);
  }, [activePositions]);

  const isPositionHighlighted = useCallback((string: number, fret: number) => {
    return highlightedPositions.some(p => p.string === string && p.fret === fret);
  }, [highlightedPositions]);

  return {
    activePositions,
    highlightedPositions,
    addPosition,
    clearPositions,
    setPositions,
    setHighlighted,
    clearHighlighted,
    isPositionActive,
    isPositionHighlighted,
  };
}
