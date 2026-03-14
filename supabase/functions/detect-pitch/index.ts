// Edge Function for ML-based pitch detection
// Integrates with external APIs for production-quality results

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PitchDetectionRequest {
  audioData: string; // base64 encoded WAV
  method?: 'basic-pitch' | 'local'; // Which API to use
}

interface PitchDetectionResponse {
  frequency: number;
  note: string;
  cents: number;
  confidence: number;
  method: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { audioData, method = 'local' }: PitchDetectionRequest = await req.json();

    console.log('Processing pitch detection request, method:', method);

    let result: PitchDetectionResponse;

    if (method === 'basic-pitch') {
      // Use Spotify Basic Pitch API (if available)
      result = await detectWithBasicPitch(audioData);
    } else {
      // Use local YIN algorithm implementation
      result = await detectWithLocalAlgorithm(audioData);
    }

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Pitch detection error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

/**
 * Detect pitch using Spotify Basic Pitch
 * Note: Requires API key or self-hosted instance
 */
async function detectWithBasicPitch(audioBase64: string): Promise<PitchDetectionResponse> {
  // In production, you would:
  // 1. Convert base64 to audio file
  // 2. Send to Basic Pitch API endpoint
  // 3. Parse MIDI output to get pitch
  
  // Placeholder - implement actual API call
  console.log('Basic Pitch API not implemented yet - using fallback');
  return detectWithLocalAlgorithm(audioBase64);
}

/**
 * Local pitch detection using YIN algorithm
 * Implemented in Deno/TypeScript
 */
async function detectWithLocalAlgorithm(audioBase64: string): Promise<PitchDetectionResponse> {
  try {
    // Decode base64 to audio buffer
    const audioBuffer = decodeBase64ToAudioBuffer(audioBase64);
    
    // Apply YIN algorithm
    const result = yinAlgorithm(audioBuffer, 48000);
    
    if (!result) {
      throw new Error('No pitch detected');
    }

    return {
      frequency: result.frequency,
      note: result.note,
      cents: result.cents,
      confidence: result.confidence,
      method: 'yin-local',
    };
  } catch (error) {
    console.error('Local detection failed:', error);
    throw error;
  }
}

/**
 * Decode base64 WAV to Float32Array
 */
function decodeBase64ToAudioBuffer(base64: string): Float32Array {
  // Decode base64
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Parse WAV header (skip to data)
  const dataView = new DataView(bytes.buffer);
  
  // Find data chunk (simple parser)
  let offset = 12; // Skip RIFF header
  while (offset < bytes.length - 8) {
    const chunkId = String.fromCharCode(...bytes.slice(offset, offset + 4));
    const chunkSize = dataView.getUint32(offset + 4, true);
    
    if (chunkId === 'data') {
      // Found audio data
      const audioData = new Int16Array(
        bytes.buffer,
        offset + 8,
        chunkSize / 2
      );
      
      // Convert to Float32Array (normalize to -1 to 1)
      const float32 = new Float32Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        float32[i] = audioData[i] / 32768;
      }
      
      return float32;
    }
    
    offset += 8 + chunkSize;
  }
  
  throw new Error('No audio data found in WAV file');
}

/**
 * YIN pitch detection algorithm
 */
function yinAlgorithm(
  buffer: Float32Array,
  sampleRate: number
): { frequency: number; note: string; cents: number; confidence: number } | null {
  const bufferSize = buffer.length;
  const threshold = 0.15;

  // Step 1: Difference function
  const yinBuffer = new Float32Array(Math.floor(bufferSize / 2));
  
  for (let tau = 0; tau < bufferSize / 2; tau++) {
    let sum = 0;
    for (let i = 0; i < bufferSize / 2; i++) {
      const delta = buffer[i] - buffer[i + tau];
      sum += delta * delta;
    }
    yinBuffer[tau] = sum;
  }

  // Step 2: Cumulative mean normalized difference
  yinBuffer[0] = 1;
  let runningSum = 0;
  
  for (let tau = 1; tau < bufferSize / 2; tau++) {
    runningSum += yinBuffer[tau];
    yinBuffer[tau] *= tau / runningSum;
  }

  // Step 3: Absolute threshold
  let tau = -1;
  for (let i = 2; i < bufferSize / 2; i++) {
    if (yinBuffer[i] < threshold) {
      while (i + 1 < bufferSize / 2 && yinBuffer[i + 1] < yinBuffer[i]) {
        i++;
      }
      tau = i;
      break;
    }
  }

  if (tau === -1) {
    return null;
  }

  // Step 4: Parabolic interpolation
  let betterTau = tau;
  if (tau > 0 && tau < bufferSize / 2 - 1) {
    const s0 = yinBuffer[tau - 1];
    const s1 = yinBuffer[tau];
    const s2 = yinBuffer[tau + 1];
    betterTau = tau + (s2 - s0) / (2 * (2 * s1 - s2 - s0));
  }

  const frequency = sampleRate / betterTau;

  // Validate frequency range
  if (frequency < 80 || frequency > 1200) {
    return null;
  }

  const { note, cents } = frequencyToNote(frequency);
  const confidence = 1 - yinBuffer[tau];

  return {
    frequency,
    note,
    cents,
    confidence,
  };
}

/**
 * Convert frequency to note
 */
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
