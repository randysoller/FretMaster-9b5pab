
// Edge Function for mobile chord detection
// Processes audio from mobile devices using ML/DSP algorithms
// 🔒 SECURITY HARDENED: Input validation, CORS restrictions, rate limiting

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';
import { getAllHeaders, getCorsHeaders } from '../_shared/cors.ts';
import { validateAudioData, validateChord } from '../_shared/validation.ts';
import { checkRateLimit, addRateLimitHeaders } from '../_shared/rateLimit.ts';

interface ChordDetectionRequest {
  audioData: string; // base64 WAV
  targetChord: {
    name: string;
    positions: number[];
    notes: string[];
  };
}

interface ChordDetectionResponse {
  detectedNotes: string[];
  accuracy: number;
  confidence: number;
  isCorrect: boolean;
  stringFeedback: Array<{
    stringNumber: number;
    targetNote: string;
    detectedNote: string | null;
    isCorrect: boolean;
    expectedFret: number;
  }>;
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

    // 🔒 SECURITY: Parse and validate request body
    let requestData: ChordDetectionRequest;
    try {
      requestData = await req.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON' }),
        { status: 400, headers: getAllHeaders(req) }
      );
    }

    const { audioData, targetChord } = requestData;

    // 🔒 SECURITY: Validate audio data
    const audioValidation = validateAudioData(audioData);
    if (!audioValidation.valid) {
      return new Response(
        JSON.stringify({ error: audioValidation.error }),
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

    // 🔒 SECURITY: Check rate limit
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );
    
    const rateLimitResult = await checkRateLimit(supabaseClient, req, 'detect-chord-mobile');
    if (rateLimitResult instanceof Response) {
      return rateLimitResult; // Rate limited - return 429
    }

    console.log('Processing chord detection for:', targetChord.name);
    console.log('Rate limit status:', rateLimitResult.remaining, 'requests remaining');

    // Decode audio
    const audioBuffer = decodeBase64ToAudioBuffer(audioData);
    
    // Detect pitches using polyphonic detection
    const detectedPitches = detectPolyphonicPitches(audioBuffer, 48000);
    
    console.log('Detected pitches:', detectedPitches);
    
    // Match to target chord
    const result = matchToChord(detectedPitches, targetChord);
    
    // Log to database (non-blocking)
    try {
      const authHeader = req.headers.get('Authorization');
      const token = authHeader?.replace('Bearer ', '');
        
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      
      if (user) {
        await supabaseClient.rpc('log_chord_detection', {
          p_target_chord: targetChord.name,
          p_detected_notes: result.detectedNotes,
          p_accuracy: result.accuracy,
          p_confidence: result.confidence,
          p_method: 'mobile-api',
        });
      }
    } catch (logError) { // This catch block was missing a closing brace for the preceding try block.
      // Log error but don't fail the request
      if (Deno.env.get('ENV') !== 'production') {
        console.error('Logging failed:', logError);
      }
    } // Added closing brace here for the try block related to logging.

    // Add rate limit headers to response
    const responseHeaders = getAllHeaders(req);
    addRateLimitHeaders(responseHeaders, rateLimitResult);
    
    return new Response(
      JSON.stringify(result),
      {
        headers: responseHeaders,
        status: 200,
      }
    );
  } catch (error) {
    console.error('Chord detection error:', error);
    
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

function decodeBase64ToAudioBuffer(base64: string): Float32Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  const dataView = new DataView(bytes.buffer);
  let offset = 12;
  
  while (offset < bytes.length - 8) {
    const chunkId = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const chunkSize = dataView.getUint32(offset + 4, true);
    
    if (chunkId === 'data') {
      const audioData = new Int16Array(bytes.buffer, offset + 8, chunkSize / 2);
      const float32 = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32[i] = audioData[i] / 32768;
      }
      return float32;
    }
    
    offset += 8 + chunkSize;
  }
  
  throw new Error('No audio data in WAV');
}

/**
 * Detect multiple pitches using FFT peak detection
 */
function detectPolyphonicPitches(buffer: Float32Array, sampleRate: number): number[] {
  const fftSize = 4096;
  const fft = computeFFT(buffer, fftSize);
  const binWidth = sampleRate / fftSize;
  const peaks: Array<{ freq: number; mag: number }> = [];

  // Find peaks
  for (let i = 2; i < fft.length - 2; i++) {
    if (fft[i] > fft[i - 1] && fft[i] > fft[i + 1] && fft[i] > fft[i - 2] && fft[i] > fft[i + 2]) {
      const frequency = i * binWidth;
      
      if (frequency >= 80 && frequency <= 1200 && fft[i] > 10) {
        peaks.push({ freq: frequency, mag: fft[i] });
      }
    }
  }

  // Sort by magnitude and take top 6
  peaks.sort((a, b) => b.mag - a.mag);
  return peaks.slice(0, 6).map(p => p.freq);
}

function computeFFT(buffer: Float32Array, size: number): Float32Array {
  const result = new Float32Array(size / 2);
  
  for (let k = 0; k < size / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < Math.min(buffer.length, size); n++) {
      const angle = (2 * Math.PI * k * n) / size;
      real += buffer[n] * Math.cos(angle);
      imag -= buffer[n] * Math.sin(angle);
    }
    
    result[k] = Math.sqrt(real * real + imag * imag);
  }
  
  return result;
}

function matchToChord(
  detectedFreqs: number[],
  targetChord: { name: string; positions: number[]; notes: string[] }
): ChordDetectionResponse {
  const STRING_RANGES = [
    { openFreq: 82.41 },  // E2
    { openFreq: 110.00 }, // A2
    { openFreq: 146.83 }, // D3
    { openFreq: 196.00 }, // G3
    { openFreq: 246.94 }, // B3
    { openFreq: 329.63 }, // E4
  ];

  const stringTuning = ['E', 'A', 'D', 'G', 'B', 'E'];
  const stringFeedback = [];
  const detectedNotes: string[] = [];

  for (let i = 0; i < targetChord.positions.length; i++) {
    const fret = targetChord.positions[i];
    
    if (fret < 0) {
      stringFeedback.push({
        stringNumber: i,
        targetNote: 'X',
        detectedNote: null,
        isCorrect: true,
        expectedFret: -1,
      });
      continue;
    }

    const expectedFreq = STRING_RANGES[i].openFreq * Math.pow(2, fret / 12);
    const targetNote = fretToNote(stringTuning[i], fret);

    // Find closest detected frequency
    let closestFreq: number | null = null;
    let minDiff = Infinity;

    for (const freq of detectedFreqs) {
      const diff = Math.abs(freq - expectedFreq);
      if (diff < minDiff && diff < 20) { // Within 20Hz
        minDiff = diff;
        closestFreq = freq;
      }
    }

    let detectedNote: string | null = null;
    let isCorrect = false;

    if (closestFreq) {
      detectedNote = frequencyToNote(closestFreq).note;
      isCorrect = detectedNote.substring(0, detectedNote.length - 1) === targetNote.substring(0, targetNote.length - 1);
      
      if (isCorrect && !detectedNotes.includes(detectedNote)) {
        detectedNotes.push(detectedNote);
      }
    }

    stringFeedback.push({
      stringNumber: i,
      targetNote,
      detectedNote,
      isCorrect,
      expectedFret: fret,
    });
  }

  const activeStrings = stringFeedback.filter(s => s.expectedFret >= 0);
  const correctStrings = activeStrings.filter(s => s.isCorrect).length;
  const accuracy = activeStrings.length > 0 ? (correctStrings / activeStrings.length) * 100 : 0;
  const confidence = Math.min(detectedFreqs.length / 6, 1);

  return {
    detectedNotes,
    accuracy,
    confidence,
    isCorrect: accuracy >= 80,
    stringFeedback,
  };
}

function fretToNote(stringTuning: string, fret: number): string {
  const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const noteIndex = NOTE_STRINGS.indexOf(stringTuning);
  const targetIndex = (noteIndex + fret) % 12;
  return NOTE_STRINGS[targetIndex];
}

function frequencyToNote(frequency: number): { note: string; cents: number } {
  const NOTE_STRINGS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const a4Freq = 440;
  
  const noteNum = 12 * (Math.log(frequency / a4Freq) / Math.log(2));
  const noteIndex = Math.round(noteNum) + 69;
  const cents = Math.floor((noteNum - Math.round(noteNum)) * 100);
  
  const noteName = NOTE_STRINGS[noteIndex % 12];
  const octave = Math.floor(noteIndex / 12) - 1;
  
  return {
    note: `${noteName}${octave}`,
    cents,
  };
}
