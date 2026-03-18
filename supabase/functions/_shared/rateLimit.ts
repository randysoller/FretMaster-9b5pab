/**
 * Rate Limiting Middleware for Edge Functions
 * Prevents API abuse and DoS attacks
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

export interface RateLimitConfig {
  maxRequests: number;        // Max requests per window
  windowSeconds: number;      // Time window in seconds
  functionName: string;       // Edge Function name
}

export interface RateLimitResult {
  is_limited: boolean;
  current_count: number;
  max_requests: number;
  remaining: number;
  reset_at: string;
  window_seconds: number;
}

/**
 * Default rate limit configurations per Edge Function
 */
export const RATE_LIMITS = {
  'detect-chord-mobile': {
    authenticated: { maxRequests: 100, windowSeconds: 60 },
    anonymous: { maxRequests: 20, windowSeconds: 60 },
  },
  'analyze-chord': {
    authenticated: { maxRequests: 50, windowSeconds: 60 },
    anonymous: { maxRequests: 10, windowSeconds: 60 },
  },
  'detect-pitch': {
    authenticated: { maxRequests: 100, windowSeconds: 60 },
    anonymous: { maxRequests: 20, windowSeconds: 60 },
  },
};

/**
 * Check rate limit for a request
 * 
 * @param supabase - Supabase client instance
 * @param req - HTTP request object
 * @param functionName - Name of the Edge Function
 * @returns Rate limit result or Response if limited
 * 
 * @example
 * const rateLimitResult = await checkRateLimit(supabase, req, 'detect-chord-mobile');
 * if (rateLimitResult instanceof Response) {
 *   return rateLimitResult; // Rate limited - return 429 response
 * }
 * // Continue processing...
 */
export async function checkRateLimit(
  supabase: SupabaseClient,
  req: Request,
  functionName: string
): Promise<RateLimitResult | Response> {
  try {
    // Get user ID from auth token (if authenticated)
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }
    
    // Get IP address as fallback identifier
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    // Use user ID if authenticated, otherwise use IP
    const rateLimitKey = userId || ipAddress;
    
    // Get rate limit config for this function
    const config = RATE_LIMITS[functionName as keyof typeof RATE_LIMITS];
    if (!config) {
      console.warn(`No rate limit config for function: ${functionName}`);
      // No rate limiting configured - allow request
      return {
        is_limited: false,
        current_count: 0,
        max_requests: 999999,
        remaining: 999999,
        reset_at: new Date(Date.now() + 60000).toISOString(),
        window_seconds: 60,
      };
    }
    
    // Select appropriate limits based on authentication status
    const limits = userId ? config.authenticated : config.anonymous;
    
    // Check rate limit via database function
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_key: rateLimitKey,
      p_function_name: functionName,
      p_max_requests: limits.maxRequests,
      p_window_seconds: limits.windowSeconds,
    });
    
    if (error) {
      console.error('Rate limit check failed:', error);
      // On error, allow the request but log it
      return {
        is_limited: false,
        current_count: 0,
        max_requests: limits.maxRequests,
        remaining: limits.maxRequests,
        reset_at: new Date(Date.now() + limits.windowSeconds * 1000).toISOString(),
        window_seconds: limits.windowSeconds,
      };
    }
    
    const result = data as RateLimitResult;
    
    // If rate limited, return 429 response
    if (result.is_limited) {
      const resetAt = new Date(result.reset_at);
      const retryAfter = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Rate limit exceeded',
          message: `Too many requests. Maximum ${result.max_requests} requests per ${result.window_seconds} seconds.`,
          retry_after_seconds: retryAfter,
          reset_at: result.reset_at,
          limit: result.max_requests,
          remaining: 0,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': result.max_requests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': resetAt.getTime().toString(),
          },
        }
      );
    }
    
    // Not rate limited - return result for logging
    return result;
  } catch (error) {
    console.error('Rate limit middleware error:', error);
    // On unexpected error, allow the request to proceed
    // (fail open to prevent blocking legitimate traffic)
    return {
      is_limited: false,
      current_count: 0,
      max_requests: 100,
      remaining: 100,
      reset_at: new Date(Date.now() + 60000).toISOString(),
      window_seconds: 60,
    };
  }
}

/**
 * Add rate limit headers to response
 * Shows client their current rate limit status
 */
export function addRateLimitHeaders(
  headers: Headers,
  rateLimitResult: RateLimitResult
): Headers {
  const resetAt = new Date(rateLimitResult.reset_at);
  
  headers.set('X-RateLimit-Limit', rateLimitResult.max_requests.toString());
  headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString());
  headers.set('X-RateLimit-Reset', resetAt.getTime().toString());
  
  return headers;
}
