/**
 * Input Validation Utilities for Edge Functions
 * Protects against malicious payloads and DoS attacks
 */

export const LIMITS = {
  MAX_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FREQUENCIES: 100,
  MAX_CHORD_NAME_LENGTH: 50,
  MAX_NOTES: 12,
};

/**
 * Validate audio data
 */
export function validateAudioData(audioData: any): { valid: boolean; error?: string } {
  if (!audioData || typeof audioData !== 'string') {
    return { valid: false, error: 'Invalid audioData: must be a base64 string' };
  }
  
  if (audioData.length === 0) {
    return { valid: false, error: 'Invalid audioData: empty string' };
  }
  
  if (audioData.length > LIMITS.MAX_AUDIO_SIZE) {
    return { valid: false, error: `Audio data too large (max ${LIMITS.MAX_AUDIO_SIZE / 1024 / 1024}MB)` };
  }
  
  // Basic base64 validation
  const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
  if (!base64Regex.test(audioData)) {
    return { valid: false, error: 'Invalid audioData: not valid base64' };
  }
  
  return { valid: true };
}

/**
 * Validate chord structure
 */
export function validateChord(chord: any): { valid: boolean; error?: string } {
  if (!chord || typeof chord !== 'object') {
    return { valid: false, error: 'Invalid chord: must be an object' };
  }
  
  if (!chord.name || typeof chord.name !== 'string') {
    return { valid: false, error: 'Invalid chord: name is required' };
  }
  
  if (chord.name.length > LIMITS.MAX_CHORD_NAME_LENGTH) {
    return { valid: false, error: 'Invalid chord: name too long' };
  }
  
  if (!Array.isArray(chord.positions)) {
    return { valid: false, error: 'Invalid chord: positions must be an array' };
  }
  
  if (chord.positions.length > 6) {
    return { valid: false, error: 'Invalid chord: too many positions (max 6)' };
  }
  
  if (!Array.isArray(chord.notes)) {
    return { valid: false, error: 'Invalid chord: notes must be an array' };
  }
  
  if (chord.notes.length > LIMITS.MAX_NOTES) {
    return { valid: false, error: 'Invalid chord: too many notes' };
  }
  
  return { valid: true };
}

/**
 * Validate frequency array
 */
export function validateFrequencies(frequencies: any): { valid: boolean; error?: string } {
  if (!Array.isArray(frequencies)) {
    return { valid: false, error: 'Invalid frequencies: must be an array' };
  }
  
  if (frequencies.length === 0) {
    return { valid: false, error: 'Invalid frequencies: empty array' };
  }
  
  if (frequencies.length > LIMITS.MAX_FREQUENCIES) {
    return { valid: false, error: 'Invalid frequencies: too many values' };
  }
  
  for (const freq of frequencies) {
    if (typeof freq !== 'number' || isNaN(freq) || freq < 0 || freq > 20000) {
      return { valid: false, error: 'Invalid frequencies: values must be numbers between 0-20000' };
    }
  }
  
  return { valid: true };
}

/**
 * Sanitize string input
 */
export function sanitizeString(input: string, maxLength: number = 500): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '')           // Remove HTML tags
    .replace(/['"]/g, '')           // Remove quotes
    .trim()
    .substring(0, maxLength);
}
