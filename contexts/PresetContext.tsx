import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export interface ChordPreset {
  id: string;
  name: string;
  chordIds: string[];
  createdAt: number;
}

interface PresetContextType {
  presets: ChordPreset[];
  isLoading: boolean;
  error: string | null;
  addPreset: (name: string, chordIds: string[]) => Promise<string>;
  updatePreset: (id: string, chordIds: string[]) => void;
  removePreset: (id: string) => void;
  renamePreset: (id: string, name: string) => void;
  reorderPreset: (fromIndex: number, toIndex: number) => void;
  getPreset: (id: string) => ChordPreset | undefined;
  retryLoad: () => Promise<void>;
}

const PresetContext = createContext<PresetContextType | undefined>(undefined);

const STORAGE_KEY = 'fretmaster-presets';

export function PresetProvider({ children }: { children: ReactNode }) {
  const [presets, setPresets] = useState<ChordPreset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(true);
    setError(null);
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          
          // Validate data structure
          if (data && Array.isArray(data.presets)) {
            // Validate each preset has required fields
            const validPresets = data.presets.filter((preset: any) => 
              preset &&
              typeof preset.id === 'string' &&
              typeof preset.name === 'string' &&
              Array.isArray(preset.chordIds) &&
              typeof preset.createdAt === 'number'
            );
            
            console.log('✅ Loaded', validPresets.length, 'valid presets from AsyncStorage');
            setPresets(validPresets);
            
            // Warn if some presets were invalid
            if (validPresets.length < data.presets.length) {
              console.warn('⚠️ Skipped', data.presets.length - validPresets.length, 'invalid presets');
            }
          } else {
            console.warn('⚠️ Invalid preset data structure, starting fresh');
            setPresets([]);
          }
        } catch (parseError) {
          console.error('❌ Failed to parse preset data:', parseError);
          setError('Corrupted preset data detected. Starting fresh.');
          setPresets([]);
          
          // Clear corrupted data
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } else {
        console.log('No stored presets found, starting with empty array');
        setPresets([]);
      }
    } catch (storageError) {
      console.error('❌ Failed to access AsyncStorage:', storageError);
      setError('Failed to load presets. Please check storage permissions.');
      setPresets([]);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const retryLoad = async () => {
    await loadPresets();
  };

  const savePresets = async () => {
    if (!isInitialized) return; // Don't save before initial load
    
    try {
      console.log('Saving', presets.length, 'presets to AsyncStorage');
      const dataToSave = JSON.stringify({ presets });
      
      // Check data size (AsyncStorage has ~10MB limit on most devices)
      if (dataToSave.length > 5000000) { // ~5MB warning
        console.warn('⚠️ Preset data is very large:', dataToSave.length, 'bytes');
      }
      
      await AsyncStorage.setItem(STORAGE_KEY, dataToSave);
      console.log('✅ Successfully saved presets to AsyncStorage');
      setError(null); // Clear any previous errors
    } catch (saveError: any) {
      console.error('❌ Failed to save presets:', saveError);
      
      // Check for quota exceeded error
      if (saveError.message?.includes('quota') || saveError.message?.includes('QuotaExceeded')) {
        setError('Storage quota exceeded. Please delete some presets.');
        Alert.alert(
          'Storage Full',
          'Unable to save presets. Your device storage is full. Please delete some presets.',
          [{ text: 'OK' }]
        );
      } else {
        setError('Failed to save presets. Changes may not persist.');
      }
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
        isLoading,
        error,
        addPreset,
        updatePreset,
        removePreset,
        renamePreset,
        reorderPreset,
        getPreset,
        retryLoad,
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
