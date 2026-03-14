import { useState, useCallback } from 'react';
import { ChordData } from '@/constants/musicData';
import { getRandomChord, getRandomChordsByCategory } from '@/services/chordService';

export type ChallengeType = 'identify' | 'play' | 'progression';

export interface Challenge {
  type: ChallengeType;
  target: ChordData;
  options?: ChordData[];
}

export function usePractice() {
  const [currentChallenge, setCurrentChallenge] = useState<Challenge | null>(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);

  const startIdentifyChallenge = useCallback(() => {
    const target = getRandomChord();
    const options = getRandomChordsByCategory(target.category, 3);
    
    // Ensure target is in options
    if (!options.find(c => c.name === target.name)) {
      options[0] = target;
    }
    
    // Shuffle options
    const shuffled = [...options].sort(() => Math.random() - 0.5);
    
    setCurrentChallenge({
      type: 'identify',
      target,
      options: shuffled,
    });
  }, []);

  const startPlayChallenge = useCallback(() => {
    const target = getRandomChord();
    setCurrentChallenge({
      type: 'play',
      target,
    });
  }, []);

  const checkAnswer = useCallback((answer: string): boolean => {
    if (!currentChallenge) return false;
    
    setTotalAttempts(prev => prev + 1);
    const correct = answer === currentChallenge.target.name;
    
    if (correct) {
      setScore(prev => prev + 1);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
    
    return correct;
  }, [currentChallenge]);

  const nextChallenge = useCallback(() => {
    if (currentChallenge?.type === 'identify') {
      startIdentifyChallenge();
    } else {
      startPlayChallenge();
    }
  }, [currentChallenge, startIdentifyChallenge, startPlayChallenge]);

  const resetStats = useCallback(() => {
    setScore(0);
    setStreak(0);
    setTotalAttempts(0);
    setCurrentChallenge(null);
  }, []);

  return {
    currentChallenge,
    score,
    streak,
    totalAttempts,
    accuracy: totalAttempts > 0 ? Math.round((score / totalAttempts) * 100) : 0,
    startIdentifyChallenge,
    startPlayChallenge,
    checkAnswer,
    nextChallenge,
    resetStats,
  };
}
