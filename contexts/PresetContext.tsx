import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChordPreset {
  id: string;
  name: string;
  chordIds: string[];
  createdAt: number;
}

interface PresetContextType {
  presets: ChordPreset[];
  addPreset: (name: string, chordIds: string[]) => Promise<string>;
  updatePreset: (id: string, chordIds: string[]) => void;
  removePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  reorderPreset: (fromIndex: number, toIndex: number) => void;
  getPreset: (id: string) => ChordPreset | undefined;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

const STORAGE_KEY = 'fretmaster-presets';

export function PresetProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<ChordPreset[]>([]);

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Save to AsyncStorage whenever presets change
  useEffect(() => {
    savePresets();
  }, [presets]);

  const loadPresets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setPresets(data.presets || []);
      }
    } catch (error) {
      console.error('Failed to load presets:', error);
    }
  };

  const savePresets = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ presets }));
    } catch (error) {
      console.error('Failed to save presets:', error);
    }
  };

  const addPreset = async (name: string, chordIds: string[]): Promise<string> => {
    const id = `preset-${Date.now()}`;
    const newPreset: ChordPreset = {
      id,
      name,
      chordIds,
      createdAt: Date.now(),
    };
    setPresets(prev => [...prev, newPreset]);
    return id;
  };

  const updatePreset = (id: string, chordIds: string[]) => {
    setPresets(prev =>
      prev.map((p) => (p.id === id ? { ...p, chordIds } : p))
    );
  };

  const removePreset = (id: string) => {
    setPresets(prev => prev.filter((p) => p.id !== id));
  };

  const renamePreset = (id: string, name: string) => {
    setPresets(prev =>
      prev.map((p) => (p.id === id ? { ...p, name } : p))
    );
  };

  const reorderPreset = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0 || fromIndex >= presets.length || toIndex >= presets.length) {
      return;
    }
    
    setPresets(prev => {
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  };

  const getPreset = (id: string) => {
    return presets.find((p) => p.id === id);
  };

  return (
    <PresetContext.Provider
      value={{
        presets,
        addPreset,
        updatePreset,
        removePreset,
        renamePreset,
        reorderPreset,
        getPreset,
      }}
    >
      {children}
    </PresetContext.Provider>
  );
}

export function usePresets() {
  const context = useContext(PresetContext);
  if (!context) {
    throw new Error('usePresets must be used within PresetProvider');
  }
  return context;
}
