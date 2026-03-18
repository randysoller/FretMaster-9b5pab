/**
 * Security Utilities
 * Centralized security functions for input validation and sanitization
 */

export const SecurityLimits = {
  MAX_AUDIO_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_STRING_LENGTH: 500,
  MAX_USERNAME_LENGTH: 20,
  MIN_USERNAME_LENGTH: 3,
  MIN_PASSWORD_LENGTH: 12,
};

/**
 * Allowed origins for CORS
 * Add your production domains here
 */
export const ALLOWED_ORIGINS = [
  'https://your-production-domain.com', // Replace with your actual domain
  'https://staging.your-domain.com',    // Replace with staging domain
  'exp://127.0.0.1:8081',               // Expo dev
  'exp://localhost:8081',               // Expo dev
];

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string, maxLength: number = SecurityLimits.MAX_STRING_LENGTH): string {
  if (!input) return '';
  
  return input
    .replace(/[<>]/g, '')           // Remove HTML tags
    .replace(/['"]/g, '')           // Remove quotes
    .trim()
    .substring(0, maxLength);       // Limit length
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate base64 string
 */
export function isValidBase64(str: string): boolean {
  if (!str) return false;
  try {
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    return base64Regex.test(str);
  } catch {
    return false;
  }
}

/**
 * Validate audio data size
 */
export function isValidAudioSize(base64Data: string): boolean {
  if (!base64Data) return false;
  return base64Data.length <= SecurityLimits.MAX_AUDIO_SIZE;
}

/**
 * Validate chord structure
 */
export function isValidChordStructure(chord: any): boolean {
  if (!chord || typeof chord !== 'object') return false;
  
  return (
    typeof chord.name === 'string' &&
    chord.name.length > 0 &&
    chord.name.length < 50 &&
    Array.isArray(chord.positions) &&
    chord.positions.length <= 6 &&
    Array.isArray(chord.notes) &&
    chord.notes.length <= 6
  );
}

/**
 * Check if password meets strength requirements
 */
export function validatePasswordStrength(password: string): { 
  valid: boolean; 
  error?: string;
  score: number;
} {
  if (!password || password.length < SecurityLimits.MIN_PASSWORD_LENGTH) {
    return { 
      valid: false, 
      error: `Password must be at least ${SecurityLimits.MIN_PASSWORD_LENGTH} characters`,
      score: 0
    };
  }
  
  let score = 0;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (hasUpper) score++;
  if (hasLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  
  if (score < 4) {
    return { 
      valid: false, 
      error: 'Password must contain uppercase, lowercase, number, and special character',
      score
    };
  }
  
  return { valid: true, score };
}

/**
 * Rate limit key generator
 */
export function generateRateLimitKey(userId?: string, ipAddress?: string): string {
  return `rate_limit:${userId || ipAddress || 'anonymous'}`;
}
