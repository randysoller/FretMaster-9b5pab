/**
 * Undo Service
 * 
 * Manages temporary storage of deleted items to enable undo functionality.
 * Items are stored for a configurable duration (default 5 seconds) before permanent deletion.
 */

import { ChordData } from '@/constants/musicData';

export interface DeletedChord {
  chord: ChordData;
  deletedAt: number;
  timerId: NodeJS.Timeout | null;
}

export interface DeletedPreset {
  id: string;
  name: string;
  chordIds: string[];
  deletedAt: number;
  timerId: NodeJS.Timeout | null;
}

class UndoService {
  private deletedChords: Map<string, DeletedChord> = new Map();
  private deletedPresets: Map<string, DeletedPreset> = new Map();
  private readonly UNDO_TIMEOUT = 5000; // 5 seconds

  /**
   * Store a deleted chord with automatic cleanup timer
   */
  storeDeletedChord(
    chord: ChordData,
    onPermanentDelete: () => void
  ): void {
    if (!chord.id) return;

    // Cancel existing timer if chord was already deleted
    const existing = this.deletedChords.get(chord.id);
    if (existing?.timerId) {
      clearTimeout(existing.timerId);
    }

    // Set up new deletion timer
    const timerId = setTimeout(() => {
      onPermanentDelete();
      this.deletedChords.delete(chord.id!);
      console.log('⏰ Chord permanently deleted after timeout:', chord.name);
    }, this.UNDO_TIMEOUT);

    this.deletedChords.set(chord.id, {
      chord,
      deletedAt: Date.now(),
      timerId,
    });

    console.log('💾 Stored deleted chord for undo:', chord.name);
  }

  /**
   * Restore a deleted chord (undo)
   */
  restoreChord(chordId: string): ChordData | null {
    const deleted = this.deletedChords.get(chordId);
    if (!deleted) return null;

    // Cancel permanent deletion timer
    if (deleted.timerId) {
      clearTimeout(deleted.timerId);
    }

    this.deletedChords.delete(chordId);
    console.log('↩️ Restored deleted chord:', deleted.chord.name);
    
    return deleted.chord;
  }

  /**
   * Store a deleted preset with automatic cleanup timer
   */
  storeDeletedPreset(
    preset: { id: string; name: string; chordIds: string[] },
    onPermanentDelete: () => void
  ): void {
    // Cancel existing timer if preset was already deleted
    const existing = this.deletedPresets.get(preset.id);
    if (existing?.timerId) {
      clearTimeout(existing.timerId);
    }

    // Set up new deletion timer
    const timerId = setTimeout(() => {
      onPermanentDelete();
      this.deletedPresets.delete(preset.id);
      console.log('⏰ Preset permanently deleted after timeout:', preset.name);
    }, this.UNDO_TIMEOUT);

    this.deletedPresets.set(preset.id, {
      ...preset,
      deletedAt: Date.now(),
      timerId,
    });

    console.log('💾 Stored deleted preset for undo:', preset.name);
  }

  /**
   * Restore a deleted preset (undo)
   */
  restorePreset(presetId: string): DeletedPreset | null {
    const deleted = this.deletedPresets.get(presetId);
    if (!deleted) return null;

    // Cancel permanent deletion timer
    if (deleted.timerId) {
      clearTimeout(deleted.timerId);
    }

    this.deletedPresets.delete(presetId);
    console.log('↩️ Restored deleted preset:', deleted.name);
    
    return deleted;
  }

  /**
   * Clear all temporary storage (called on app close)
   */
  clearAll(): void {
    // Cancel all timers
    this.deletedChords.forEach(item => {
      if (item.timerId) clearTimeout(item.timerId);
    });
    this.deletedPresets.forEach(item => {
      if (item.timerId) clearTimeout(item.timerId);
    });

    this.deletedChords.clear();
    this.deletedPresets.clear();
    console.log('🧹 Cleared all undo storage');
  }

  /**
   * Get time remaining for undo (in milliseconds)
   */
  getTimeRemaining(itemId: string, type: 'chord' | 'preset'): number {
    const deleted = type === 'chord' 
      ? this.deletedChords.get(itemId)
      : this.deletedPresets.get(itemId);
    
    if (!deleted) return 0;

    const elapsed = Date.now() - deleted.deletedAt;
    return Math.max(0, this.UNDO_TIMEOUT - elapsed);
  }
}

// Singleton instance
export const undoService = new UndoService();
