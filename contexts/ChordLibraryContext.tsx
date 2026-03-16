import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ChordShape, ChordType, BarreRoot } from '@/constants/musicData';

interface ChordLibraryContextType {
  // Filters
  filterCategories: ChordShape[];
  filterTypes: ChordType[];
  filterBarreRoots: BarreRoot[];
  searchQuery: string;
  activeLibraryPresetId: string | null;
  selectedChordIds: string[];

  // Actions
  toggleCategory: (cat: ChordShape) => void;
  clearCategories: () => void;
  toggleType: (type: ChordType) => void;
  setFilterTypes: (types: ChordType[]) => void;
  clearTypes: () => void;
  toggleBarreRoot: (root: BarreRoot) => void;
  clearBarreRoots: () => void;
  setSearchQuery: (q: string) => void;
  setActiveLibraryPreset: (id: string | null) => void;
  toggleChordSelection: (id: string) => void;
  setSelectedChordIds: (ids: string[]) => void;
  clearSelectedChords: () => void;
  clearAll: () => void;
}

const ChordLibraryContext = createContext<ChordLibraryContextType | undefined>(undefined);

const STORAGE_KEY = 'fretmaster-chord-library-filters';

export function ChordLibraryProvider({ children }: { children: ReactNode }) {
  const [filterCategories, setFilterCategories] = useState<ChordShape[]>([]);
  const [filterTypes, setFilterTypes] = useState<ChordType[]>([]);
  const [filterBarreRoots, setFilterBarreRoots] = useState<BarreRoot[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeLibraryPresetId, setActiveLibraryPresetId] = useState<string | null>(null);
  const [selectedChordIds, setSelectedChordIds] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load from AsyncStorage on mount
  useEffect(() => {
    loadState();
  }, []);

  // Save to AsyncStorage whenever state changes (but only after initial load)
  useEffect(() => {
    if (isInitialized) {
      saveState();
    }
  }, [filterCategories, filterTypes, filterBarreRoots, searchQuery, activeLibraryPresetId, selectedChordIds, isInitialized]);

  const loadState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setFilterCategories(data.filterCategories || []);
        setFilterTypes(data.filterTypes || []);
        setFilterBarreRoots(data.filterBarreRoots || []);
        setSearchQuery(data.searchQuery || '');
        setActiveLibraryPresetId(data.activeLibraryPresetId || null);
        setSelectedChordIds(data.selectedChordIds || []);
      }
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to load chord library state:', error);
      setIsInitialized(true);
    }
  };

  const saveState = async () => {
    try {
      const data = {
        filterCategories,
        filterTypes,
        filterBarreRoots,
        searchQuery,
        activeLibraryPresetId,
        selectedChordIds,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save chord library state:', error);
    }
  };

  const toggleCategory = (cat: ChordShape) => {
    const next = filterCategories.includes(cat)
      ? filterCategories.filter((c) => c !== cat)
      : [...filterCategories, cat];
    
    // Clear barre roots if no barre/movable selected
    const hasBM = next.includes('barre') || next.includes('movable');
    setFilterCategories(next);
    if (!hasBM) setFilterBarreRoots([]);
  };

  const clearCategories = () => {
    setFilterCategories([]);
    setFilterBarreRoots([]);
  };

  const toggleType = (type: ChordType) => {
    setFilterTypes(prev =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const clearTypes = () => setFilterTypes([]);

  const toggleBarreRoot = (root: BarreRoot) => {
    setFilterBarreRoots(prev =>
      prev.includes(root)
        ? prev.filter((r) => r !== root)
        : [...prev, root]
    );
  };

  const clearBarreRoots = () => setFilterBarreRoots([]);

  const setActiveLibraryPreset = (id: string | null) => {
    setActiveLibraryPresetId(id);
  };

  const toggleChordSelection = (id: string) => {
    setSelectedChordIds(prev =>
      prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id]
    );
  };

  const clearSelectedChords = () => setSelectedChordIds([]);

  const clearAll = () => {
    setFilterCategories([]);
    setFilterTypes([]);
    setFilterBarreRoots([]);
    setSearchQuery('');
    setActiveLibraryPresetId(null);
  };

  return (
    <ChordLibraryContext.Provider
      value={{
        filterCategories,
        filterTypes,
        filterBarreRoots,
        searchQuery,
        activeLibraryPresetId,
        selectedChordIds,
        toggleCategory,
        clearCategories,
        toggleType,
        setFilterTypes,
        clearTypes,
        toggleBarreRoot,
        clearBarreRoots,
        setSearchQuery,
        setActiveLibraryPreset,
        toggleChordSelection,
        setSelectedChordIds,
        clearSelectedChords,
        clearAll,
      }}
    >
      {children}
    </ChordLibraryContext.Provider>
  );
}

export function useChordLibrary() {
  const context = useContext(ChordLibraryContext);
  if (!context) {
    throw new Error('useChordLibrary must be used within ChordLibraryProvider');
  }
  return context;
}
