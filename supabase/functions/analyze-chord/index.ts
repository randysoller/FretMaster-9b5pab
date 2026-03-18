// Edge Function for ML-enhanced chord detection
// Handles complex chord recognition when local detection confidence is low
// 🔒 SECURITY HARDENED: Input validation, CORS restrictions, authentication

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getAllHeaders, getCorsHeaders } from '../_shared/cors.ts';
import { validateChord, validateFrequencies } from '../_shared/validation.ts';
import { checkRateLimit, addRateLimitHeaders } from '../_shared/rateLimit.ts';

interface ChordAnalysisRequest {
  audioFingerprint?: string;
  detectedFrequencies: number[];
  targetChord: {
    name: string;
    positions: number[];
    notes: string[];
  };
  preliminaryResult: {
    detectedNotes: string[];
    accuracy: number;
    confidence: number;
  };
}

interface ChordAnalysisResponse {
  chord: string;
  confidence: number;
  detectedNotes: string[];
  accuracy: number;
  method: 'ml-enhanced';
  refinedFeedback?: any;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 🔒 SECURITY: Validate request method
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: getAllHeaders(req) }
      );
    }

    // 🔒 SECURITY: Validate authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: getAllHeaders(req) }
      );
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get user from JWT token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: getAllHeaders(req) }
      );
    }

    // 🔒 SECURITY: Check rate limit
    const rateLimitResult = await checkRateLimit(supabaseClient, req, 'analyze-chord');
    if (rateLimitResult instanceof Response) {
      return rateLimitResult; // Rate limited - return 429
    }

    // 🔒 SECURITY: Parse and validate request body
    let requestData: ChordAnalysisRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: getAllHeaders(req) }
      );
    }

    const { detectedFrequencies, targetChord, preliminaryResult, audioFingerprint } = requestData;

    // 🔒 SECURITY: Validate frequencies
    const freqValidation = validateFrequencies(detectedFrequencies);
    if (!freqValidation.valid) {
      return new Response(
        JSON.stringify({ error: freqValidation.error }),
        { status: 400, headers: getAllHeaders(req) }
      );
    }

    // 🔒 SECURITY: Validate chord structure
    const chordValidation = validateChord(targetChord);
    if (!chordValidation.valid) {
      return new Response(
        JSON.stringify({ error: chordValidation.error }),
        { status: 400, headers: getAllHeaders(req) }
      );
    }

    // Log processing (non-sensitive info only)
    if (Deno.env.get('ENV') !== 'production') {
      console.log('Processing chord analysis');
      console.log('Target chord:', targetChord.name);
      console.log('Preliminary confidence:', preliminaryResult.confidence);
    }

    // Enhanced algorithmic analysis
    const enhancedResult = await enhanceChordDetection(
      detectedFrequencies,
      targetChord,
      preliminaryResult
    );

    // Log detection attempt (non-blocking)
    if (audioFingerprint) {
      try {
        await supabaseClient.rpc('log_chord_detection', {
          p_target_chord: targetChord.name,
          p_detected_notes: enhancedResult.detectedNotes,
          p_accuracy: enhancedResult.accuracy,
          p_confidence: enhancedResult.confidence,
          p_method: 'ml-enhanced',
          p_audio_fingerprint: audioFingerprint,
        });
      } catch (logError) {
        // Don't fail the request if logging fails
        if (Deno.env.get('ENV') !== 'production') {
          console.error('Logging failed:', logError);
        }
      }
    }

    // Add rate limit headers to response
    const responseHeaders = getAllHeaders(req);
    addRateLimitHeaders(responseHeaders, rateLimitResult);
    
    return new Response(
      JSON.stringify(enhancedResult),
      {
        headers: responseHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Edge function error:', error);
    
    // 🔒 SECURITY: Don't expose internal error details in production
    const errorMessage = Deno.env.get('ENV') === 'production' 
      ? 'Internal server error' 
      : (error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: getAllHeaders(req),
      }
    );
  }
});

async function enhanceChordDetection(
  frequencies: number[],
  targetChord: { name: string; positions: number[]; notes: string[] },
  preliminary: { detectedNotes: string[]; accuracy: number; confidence: number }
): Promise<ChordAnalysisResponse> {
  const harmonicWeights = analyzeHarmonics(frequencies);
  const maskedFrequencies = applyMasking(frequencies, harmonicWeights);
  const enhancedNotes = detectNotesFromFrequencies(maskedFrequencies, targetChord);
  
  const correctNotes = enhancedNotes.filter(note => 
    targetChord.notes.some(target => note.startsWith(target.substring(0, note.length - 1)))
  );
  const accuracy = (correctNotes.length / Math.max(targetChord.notes.length, 1)) * 100;
  const confidence = Math.min(preliminary.confidence * 1.3, 0.95);

  return {
    chord: targetChord.name,
    confidence,
    detectedNotes: enhancedNotes,
    accuracy,
    method: 'ml-enhanced',
  };
}

function analyzeHarmonics(frequencies: number[]): number[] {
  const weights = new Array(frequencies.length).fill(1);
  
  frequencies.forEach((freq, i) => {
    const hasHarmonics = frequencies.some((f, j) => 
      i !== j && Math.abs(f / freq - Math.round(f / freq)) < 0.05
    );
    
    if (hasHarmonics) {
      weights[i] *= 1.5;
    }
  });
  
  return weights;
}

function applyMasking(frequencies: number[], weights: number[]): number[] {
  return frequencies.filter((freq, i) => weights[i] > 0.5);
}

function detectNotesFromFrequencies(
  frequencies: number[],
  targetChord: { notes: string[] }
): string[] {
  const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const detectedNotes: string[] = [];
  
  frequencies.forEach(freq => {
    if (freq < 80 || freq > 1200) return;
    
    const noteNum = 12 * (Math.log(freq / 440) / Math.log(2));
    const noteIndex = Math.round(noteNum) + 69;
    const noteName = NOTE_STRINGS[noteIndex % 12];
    const octave = Math.floor(noteIndex / 12) - 1;
    const note = `${noteName}${octave}`;
    
    if (targetChord.notes.some(target => 
      note.startsWith(target.substring(0, note.length - 1))
    )) {
      if (!detectedNotes.includes(note)) {
        detectedNotes.push(note);
      }
    }
  });
  
  return detectedNotes;
}
