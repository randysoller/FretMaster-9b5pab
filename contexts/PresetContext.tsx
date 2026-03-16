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

  const [isInitialized, setIsInitialized] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadPresets();
  }, []);

  // Save to AsyncStorage whenever presets change (but only after initial load)
  useEffect(() => {
    if (isInitialized) {
      savePresets();
    }
  }, [presets, isInitialized]);

  const loadPresets = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        console.log('Loading presets from AsyncStorage:', data.presets?.length || 0, 'presets');
        setPresets(data.presets || []);
      } else {
        console.log('No stored presets found, starting with empty array');
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('❌ Failed to load presets:', error);
      setIsInitialized(true);
    }
  };

  const savePresets = async () => {
    try {
      console.log('Saving presets to AsyncStorage:', presets.length, 'presets');
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ presets }));
      console.log('✅ Successfully saved presets to AsyncStorage');
    } catch (error) {
      console.error('❌ Failed to save presets:', error);
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
    console.log('Adding new preset:', name, 'with', chordIds.length, 'chords');
    setPresets(prev => {
      const updated = [...prev, newPreset];
      console.log('Updated presets array, total count:', updated.length);
      return updated;
    });
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
