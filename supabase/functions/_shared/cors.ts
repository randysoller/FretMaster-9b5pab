/**
 * Secure CORS Configuration
 * Restricts access to specific allowed origins
 */

const ALLOWED_ORIGINS = [
  'https://your-production-domain.com', // Replace with actual production domain
  'https://staging.your-domain.com',    // Replace with staging domain
  'exp://127.0.0.1:8081',               // Expo dev
  'exp://localhost:8081',               // Expo dev
  'http://localhost:8081',              // Local dev
];

/**
 * Get CORS headers with origin validation
 */
export function getCorsHeaders(request: Request): Record<string, string> {
  const origin = request.headers.get('Origin') || '';
  
  // Allow origin if it's in the whitelist, otherwise deny
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : 'null';
  
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Max-Age': '86400', // 24 hours
  };
}

/**
 * Get security headers
 */
export function getSecurityHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': "default-src 'self'; script-src 'self'",
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  };
}

/**
 * Combine all headers
 */
export function getAllHeaders(request: Request): Record<string, string> {
  return {
    ...getCorsHeaders(request),
    ...getSecurityHeaders(),
    'Content-Type': 'application/json',
  };
}
