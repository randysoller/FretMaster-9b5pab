import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { ChordShape, ChordType, BarreRoot } from '@/constants/musicData';

interface ChordLibraryContextType {
  // State
  isLoading: boolean;
  error: string | null;
  
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
    setIsLoading(true);
    setError(null);
    
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      
      if (stored) {
        try {
          const data = JSON.parse(stored);
          
          // Validate and apply filters with fallbacks
          setFilterCategories(Array.isArray(data.filterCategories) ? data.filterCategories : []);
          setFilterTypes(Array.isArray(data.filterTypes) ? data.filterTypes : []);
          setFilterBarreRoots(Array.isArray(data.filterBarreRoots) ? data.filterBarreRoots : []);
          setSearchQuery(typeof data.searchQuery === 'string' ? data.searchQuery : '');
          setActiveLibraryPresetId(typeof data.activeLibraryPresetId === 'string' ? data.activeLibraryPresetId : null);
          setSelectedChordIds(Array.isArray(data.selectedChordIds) ? data.selectedChordIds : []);
          
          console.log('✅ Loaded chord library filters from AsyncStorage');
        } catch (parseError) {
          console.error('❌ Failed to parse chord library state:', parseError);
          setError('Corrupted filter data. Using defaults.');
          // Keep default empty state
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (storageError) {
      console.error('❌ Failed to access AsyncStorage:', storageError);
      setError('Failed to load filters.');
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const saveState = async () => {
    if (!isInitialized) return;
    
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
      setError(null);
    } catch (saveError) {
      console.error('❌ Failed to save chord library state:', saveError);
      setError('Failed to save filter settings.');
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
    console.log('📋 ChordLibraryContext: setActiveLibraryPreset called with ID:', id);
    setActiveLibraryPresetId(id);
    console.log('✅ ChordLibraryContext: activeLibraryPresetId state updated');
  };

  const toggleChordSelection = (id: string) => {
    setSelectedChordIds(prev => {
      const updated = prev.includes(id)
        ? prev.filter((c) => c !== id)
        : [...prev, id];
      console.log('🔄 toggleChordSelection:', id, 'New count:', updated.length);
      return updated;
    });
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
        isLoading,
        error,
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
