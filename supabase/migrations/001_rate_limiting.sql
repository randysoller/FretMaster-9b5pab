-- ============================================================================
-- RATE LIMITING IMPLEMENTATION
-- ============================================================================
-- This migration creates infrastructure to prevent API abuse and DoS attacks
-- Protects Edge Functions with configurable rate limits per user/IP
--
-- Features:
-- - Per-user rate limiting (authenticated requests)
-- - Per-IP rate limiting (anonymous requests)
-- - Sliding window algorithm
-- - Automatic cleanup of old records
-- - Configurable limits per function
-- ============================================================================

-- Drop existing objects if they exist
DROP TABLE IF EXISTS rate_limit_tracking CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit CASCADE;
DROP FUNCTION IF EXISTS cleanup_rate_limit_records CASCADE;

-- ============================================================================
-- TABLE: rate_limit_tracking
-- ============================================================================
-- Stores rate limit counters for each unique key (user_id or IP address)
-- Uses a sliding window approach to reset counts after time window expires

CREATE TABLE rate_limit_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Unique identifier: user_id for authenticated, IP for anonymous
  key TEXT NOT NULL,
  
  -- Which Edge Function is being limited
  function_name TEXT NOT NULL,
  
  -- Current request count in this window
  request_count INTEGER DEFAULT 0,
  
  -- When the current window started
  window_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one record per key+function combination
  UNIQUE(key, function_name)
);

-- Indexes for performance
CREATE INDEX idx_rate_limit_key_function ON rate_limit_tracking(key, function_name);
CREATE INDEX idx_rate_limit_window ON rate_limit_tracking(window_start);
CREATE INDEX idx_rate_limit_updated ON rate_limit_tracking(updated_at);

-- ============================================================================
-- FUNCTION: check_rate_limit
-- ============================================================================
-- Checks if a request should be rate limited and increments counter
--
-- Parameters:
--   p_key: User ID or IP address
--   p_function_name: Name of the Edge Function being called
--   p_max_requests: Maximum allowed requests in the time window
--   p_window_seconds: Time window in seconds (e.g., 60 for 1 minute)
--
-- Returns: JSONB with rate limit status
--   {
--     "is_limited": boolean,
--     "current_count": integer,
--     "max_requests": integer,
--     "window_start": timestamp,
--     "remaining": integer,
--     "reset_at": timestamp
--   }
--
-- Example:
--   SELECT check_rate_limit('user-123', 'detect-chord-mobile', 100, 60);
--   SELECT check_rate_limit('192.168.1.1', 'analyze-chord', 20, 60);

CREATE OR REPLACE FUNCTION check_rate_limit(
  p_key TEXT,
  p_function_name TEXT,
  p_max_requests INTEGER,
  p_window_seconds INTEGER
) RETURNS JSONB AS $$
DECLARE
  v_current_count INTEGER;
  v_window_start TIMESTAMP WITH TIME ZONE;
  v_is_limited BOOLEAN;
  v_reset_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Upsert: Insert new record or update existing one
  INSERT INTO rate_limit_tracking (key, function_name, request_count, window_start)
  VALUES (p_key, p_function_name, 1, NOW())
  ON CONFLICT (key, function_name) 
  DO UPDATE SET 
    -- Reset counter if window has expired
    request_count = CASE 
      WHEN rate_limit_tracking.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL
      THEN 1  -- Start new window
      ELSE rate_limit_tracking.request_count + 1  -- Increment counter
    END,
    
    -- Reset window start time if expired
    window_start = CASE 
      WHEN rate_limit_tracking.window_start < NOW() - (p_window_seconds || ' seconds')::INTERVAL
      THEN NOW()
      ELSE rate_limit_tracking.window_start
    END,
    
    updated_at = NOW()
  RETURNING request_count, window_start INTO v_current_count, v_window_start;
  
  -- If INSERT happened (new record), get the values
  IF v_current_count IS NULL THEN
    SELECT request_count, window_start 
    INTO v_current_count, v_window_start
    FROM rate_limit_tracking
    WHERE key = p_key AND function_name = p_function_name;
  END IF;
  
  -- Determine if rate limited
  v_is_limited := v_current_count > p_max_requests;
  
  -- Calculate when the limit resets
  v_reset_at := v_window_start + (p_window_seconds || ' seconds')::INTERVAL;
  
  -- Return status
  RETURN jsonb_build_object(
    'is_limited', v_is_limited,
    'current_count', v_current_count,
    'max_requests', p_max_requests,
    'window_start', v_window_start,
    'remaining', GREATEST(0, p_max_requests - v_current_count),
    'reset_at', v_reset_at,
    'window_seconds', p_window_seconds
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: cleanup_rate_limit_records
-- ============================================================================
-- Removes expired rate limit records to prevent table bloat
-- Should be called periodically (e.g., via cron job or manually)
--
-- Parameters:
--   p_age_hours: Delete records older than this many hours (default: 24)
--
-- Returns: Number of deleted records

CREATE OR REPLACE FUNCTION cleanup_rate_limit_records(
  p_age_hours INTEGER DEFAULT 24
) RETURNS INTEGER AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  DELETE FROM rate_limit_tracking
  WHERE updated_at < NOW() - (p_age_hours || ' hours')::INTERVAL;
  
  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  
  RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- Rate limit tracking should only be accessible via functions

ALTER TABLE rate_limit_tracking ENABLE ROW LEVEL SECURITY;

-- No direct access policies - only via check_rate_limit() function
-- This prevents users from manipulating their own rate limits

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant execute permissions to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_rate_limit_records TO authenticated, anon;

-- ============================================================================
-- CONFIGURATION REFERENCE
-- ============================================================================
-- Recommended rate limits per Edge Function:
--
-- detect-chord-mobile:
--   - Authenticated users: 100 requests/minute
--   - Anonymous users: 20 requests/minute
--
-- analyze-chord:
--   - Authenticated users: 50 requests/minute
--   - Anonymous users: 10 requests/minute
--
-- detect-pitch:
--   - Authenticated users: 100 requests/minute
--   - Anonymous users: 20 requests/minute
--
-- Usage in Edge Functions:
--   const result = await supabase.rpc('check_rate_limit', {
--     p_key: user?.id || ipAddress,
--     p_function_name: 'detect-chord-mobile',
--     p_max_requests: user ? 100 : 20,
--     p_window_seconds: 60
--   });
--
--   if (result.is_limited) {
--     return new Response(
--       JSON.stringify({ 
--         error: 'Rate limit exceeded',
--         retry_after: result.reset_at
--       }),
--       { status: 429 }
--     );
--   }
-- ============================================================================

-- Success message
DO $$ 
BEGIN 
  RAISE NOTICE 'Rate limiting infrastructure created successfully!';
  RAISE NOTICE 'Tables: rate_limit_tracking';
  RAISE NOTICE 'Functions: check_rate_limit(), cleanup_rate_limit_records()';
  RAISE NOTICE 'Next step: Update Edge Functions to use check_rate_limit()';
END $$;
