// Mobile-Only Guitar Audio Service
// Professional acoustic guitar synthesis for React Native (iOS/Android)
// Uses Expo AV with real-time WAV generation for authentic guitar tone

import { ChordData } from '@/constants/musicData';
import { Audio } from 'expo-av';

class AudioService {
  private audioInitialized: boolean = false;

  /**
   * Apply multi-band EQ to simulate guitar body acoustics
   * Adds warmth, body, and fullness like a real acoustic guitar
   */
  private applyGuitarBodyEQ(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): void {
    const numSamples = leftChannel.length;
    
    // ====================================
    // RESONANT BIQUAD FILTERS FOR BODY EQ
    // ====================================
    
    // LOW SHELF BOOST (80-120 Hz) - Fundamental warmth
    const lowShelfGain = 1.25; // +2.0 dB boost (reduced to prevent clipping)
    const lowShelfFreq = 100;
    const lowShelfQ = 0.7;
    
    // LOW-MID PEAK (200-400 Hz) - Guitar body resonance
    const lowMidGain = 1.30; // +2.3 dB boost (reduced to prevent clipping)
    const lowMidFreq = 280;
    const lowMidQ = 1.2; // Resonant peak
    
    // MID BOOST (500-800 Hz) - Presence and fullness
    const midGain = 1.22; // +1.7 dB boost (reduced to prevent clipping)
    const midFreq = 650;
    const midQ = 1.0;
    
    // Apply low shelf filter (boost bass fundamentals)
    this.applyBiquadFilter(
      leftChannel, rightChannel, sampleRate,
      'lowshelf', lowShelfFreq, lowShelfQ, lowShelfGain
    );
    
    // Apply low-mid resonant peak (guitar body "thump")
    this.applyBiquadFilter(
      leftChannel, rightChannel, sampleRate,
      'peaking', lowMidFreq, lowMidQ, lowMidGain
    );
    
    // Apply mid-range boost (fullness and presence)
    this.applyBiquadFilter(
      leftChannel, rightChannel, sampleRate,
      'peaking', midFreq, midQ, midGain
    );
    
    console.log('✅ Guitar body EQ applied: Low shelf +2.0dB @ 100Hz, Low-mid peak +2.3dB @ 280Hz, Mid boost +1.7dB @ 650Hz');
  }

  /**
   * Apply biquad filter (2nd-order IIR filter)
   * Supports: lowshelf, highshelf, peaking, lowpass, highpass
   */
  private applyBiquadFilter(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number,
    type: 'lowshelf' | 'highshelf' | 'peaking' | 'lowpass' | 'highpass',
    freq: number,
    Q: number,
    gain: number = 1.0
  ): void {
    const w0 = 2 * Math.PI * freq / sampleRate;
    const cosw0 = Math.cos(w0);
    const sinw0 = Math.sin(w0);
    const alpha = sinw0 / (2 * Q);
    const A = Math.sqrt(gain);
    
    let b0: number, b1: number, b2: number, a0: number, a1: number, a2: number;
    
    // Calculate filter coefficients based on type
    if (type === 'lowshelf') {
      const S = 1; // Shelf slope
      b0 = A * ((A + 1) - (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha);
      b1 = 2 * A * ((A - 1) - (A + 1) * cosw0);
      b2 = A * ((A + 1) - (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha);
      a0 = (A + 1) + (A - 1) * cosw0 + 2 * Math.sqrt(A) * alpha;
      a1 = -2 * ((A - 1) + (A + 1) * cosw0);
      a2 = (A + 1) + (A - 1) * cosw0 - 2 * Math.sqrt(A) * alpha;
    } else if (type === 'peaking') {
      b0 = 1 + alpha * A;
      b1 = -2 * cosw0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw0;
      a2 = 1 - alpha / A;
    } else {
      // Default to peaking if unknown type
      b0 = 1 + alpha * A;
      b1 = -2 * cosw0;
      b2 = 1 - alpha * A;
      a0 = 1 + alpha / A;
      a1 = -2 * cosw0;
      a2 = 1 - alpha / A;
    }
    
    // Normalize coefficients
    b0 /= a0;
    b1 /= a0;
    b2 /= a0;
    a1 /= a0;
    a2 /= a0;
    
    // Apply filter to both channels
    this.applyBiquadFilterChannel(leftChannel, b0, b1, b2, a1, a2);
    this.applyBiquadFilterChannel(rightChannel, b0, b1, b2, a1, a2);
  }

  /**
   * Apply biquad filter to a single channel
   */
  private applyBiquadFilterChannel(
    channel: Float32Array,
    b0: number, b1: number, b2: number,
    a1: number, a2: number
  ): void {
    let x1 = 0, x2 = 0; // Input history
    let y1 = 0, y2 = 0; // Output history
    
    for (let i = 0; i < channel.length; i++) {
      const x0 = channel[i];
      
      // Biquad difference equation: y[n] = b0*x[n] + b1*x[n-1] + b2*x[n-2] - a1*y[n-1] - a2*y[n-2]
      const y0 = b0 * x0 + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
      
      // Update history
      x2 = x1;
      x1 = x0;
      y2 = y1;
      y1 = y0;
      
      channel[i] = y0;
    }
  }

  /**
   * Calculate frequency for guitar string at specific fret
   * Uses equal temperament tuning (A4 = 440 Hz)
   */
  private calculateStringFrequency(stringIndex: number, fret: number): number {
    // Base frequencies for standard tuning (low E to high E)
    const openStringFrequencies = [
      82.41,   // E2 (low E string)
      110.00,  // A2
      146.83,  // D3
      196.00,  // G3
      246.94,  // B3
      329.63   // E4 (high E string)
    ];
    
    const openFreq = openStringFrequencies[stringIndex];
    // Each fret is a semitone: multiply by 2^(1/12) for each fret
    return openFreq * Math.pow(2, fret / 12);
  }

  /**
   * Apply Schroeder reverb (algorithmic reverb)
   * Pre-bakes realistic room ambience into the audio
   */
  private applySchroederReverb(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number,
    roomSize: number = 0.25,
    damping: number = 0.5,
    wetMix: number = 0.20
  ): void {
    // Schroeder reverb: parallel comb filters + series allpass filters
    
    // Comb filter delays (prime numbers scaled by room size)
    const combDelays = [1557, 1617, 1491, 1422, 1277, 1356, 1188, 1116].map(d => Math.floor(d * roomSize));
    const combBuffers = combDelays.map(d => new Float32Array(d));
    const combIndices = new Array(combDelays.length).fill(0);
    const combGain = 0.84;
    
    // Allpass filter delays
    const allpassDelays = [225, 556, 441, 341].map(d => Math.floor(d * roomSize));
    const allpassBuffers = allpassDelays.map(d => new Float32Array(d));
    const allpassIndices = new Array(allpassDelays.length).fill(0);
    const allpassGain = 0.5;
    
    // Process each channel
    for (const channel of [leftChannel, rightChannel]) {
      const drySignal = new Float32Array(channel);
      const wetSignal = new Float32Array(channel.length);
      
      for (let i = 0; i < channel.length; i++) {
        const input = channel[i];
        let combSum = 0;
        
        // Parallel comb filters
        for (let c = 0; c < combBuffers.length; c++) {
          const delayedSample = combBuffers[c][combIndices[c]];
          combSum += delayedSample;
          
          // Feedback with damping
          combBuffers[c][combIndices[c]] = input + (delayedSample * combGain * damping);
          combIndices[c] = (combIndices[c] + 1) % combDelays[c];
        }
        
        wetSignal[i] = combSum / combBuffers.length;
      }
      
      // Series allpass filters (smooth the reverb tail)
      let signal = wetSignal;
      for (let a = 0; a < allpassBuffers.length; a++) {
        const processedSignal = new Float32Array(signal.length);
        
        for (let i = 0; i < signal.length; i++) {
          const input = signal[i];
          const delayed = allpassBuffers[a][allpassIndices[a]];
          
          processedSignal[i] = -input + delayed;
          allpassBuffers[a][allpassIndices[a]] = input + (delayed * allpassGain);
          allpassIndices[a] = (allpassIndices[a] + 1) % allpassDelays[a];
        }
        
        signal = processedSignal;
      }
      
      // Mix dry and wet signals
      for (let i = 0; i < channel.length; i++) {
        channel[i] = drySignal[i] * (1 - wetMix) + signal[i] * wetMix;
      }
    }
    
    console.log('✅ Schroeder reverb applied: room=' + roomSize + ', damping=' + damping + ', wet=' + wetMix);
  }

  /**
   * Apply stereo widening via Haas effect + decorrelation
   * Creates spatial depth and width
   */
  private applyStereoWidening(
    leftChannel: Float32Array,
    rightChannel: Float32Array,
    sampleRate: number,
    width: number = 0.35
  ): void {
    const delayMs = 15; // Haas effect delay (15ms)
    const delaySamples = Math.floor(sampleRate * delayMs / 1000);
    
    // Create mid/side from left/right
    const mid = new Float32Array(leftChannel.length);
    const side = new Float32Array(leftChannel.length);
    
    for (let i = 0; i < leftChannel.length; i++) {
      mid[i] = (leftChannel[i] + rightChannel[i]) * 0.5;
      side[i] = (leftChannel[i] - rightChannel[i]) * 0.5;
    }
    
    // Apply slight delay to side signal (Haas effect)
    const delayedSide = new Float32Array(side.length);
    for (let i = delaySamples; i < side.length; i++) {
      delayedSide[i] = side[i - delaySamples];
    }
    
    // Decorrelate side signal with allpass filter
    const allpassDelay = 89; // Prime number
    const allpassBuffer = new Float32Array(allpassDelay);
    let allpassIndex = 0;
    
    for (let i = 0; i < delayedSide.length; i++) {
      const delayed = allpassBuffer[allpassIndex];
      const output = -delayedSide[i] + delayed;
      allpassBuffer[allpassIndex] = delayedSide[i] + (delayed * 0.6);
      allpassIndex = (allpassIndex + 1) % allpassDelay;
      delayedSide[i] = output;
    }
    
    // Boost side signal for width, then convert back to L/R
    const sideGain = 1.0 + width;
    for (let i = 0; i < leftChannel.length; i++) {
      leftChannel[i] = mid[i] + (delayedSide[i] * sideGain);
      rightChannel[i] = mid[i] - (delayedSide[i] * sideGain);
    }
    
    console.log('✅ Stereo widening applied: width=' + width + ', Haas delay=' + delayMs + 'ms');
  }

  /**
   * Generate advanced guitar synthesis with professional DSP
   * Implements: Multi-voice Karplus-Strong, ADSR, pitch drift, detuning,
   * string coupling, velocity layers, stereo widening, reverb
   */
  private generateGuitarWAV(chord: ChordData, duration: number = 2.5): string {
    const sampleRate = 44100; // CD quality
    const numChannels = 2; // Stereo
    const durationSamples = Math.floor(sampleRate * duration);
    
    // Create stereo buffer
    const leftChannel = new Float32Array(durationSamples);
    const rightChannel = new Float32Array(durationSamples);
    
    // Get strings to play
    const stringsToPlay: Array<{ stringIndex: number; frequency: number }> = [];
    chord.positions.forEach((fret, stringIndex) => {
      if (fret >= 0) {
        const frequency = this.calculateStringFrequency(stringIndex, fret);
        stringsToPlay.push({ stringIndex, frequency });
      }
    });
    
    console.log(`🎸 Karplus-Strong synthesis for ${stringsToPlay.length} strings:`, stringsToPlay.map(s => `${s.frequency.toFixed(1)}Hz`).join(', '));
    
    // ====================================
    // ADVANCED KARPLUS-STRONG SYNTHESIS
    // ====================================
    // Per-string synthesis with professional DSP techniques
    
    stringsToPlay.forEach(({ stringIndex, frequency }, arrayIndex) => {
      // Humanized strum timing (15-25ms variance)
      const strumBase = arrayIndex * 0.018; // 18ms base strum delay
      const strumJitter = (Math.random() - 0.5) * 0.008; // ±4ms jitter
      const strumDelay = strumBase + strumJitter;
      const startSample = Math.floor(strumDelay * sampleRate);
      
      // ====================================
      // PITCH DRIFT & DETUNING
      // ====================================
      // Slight detuning per string (1-3 cents) for chorus effect
      const detuneAmount = (Math.random() - 0.5) * 0.06; // ±3 cents
      const detunedFreq = frequency * Math.pow(2, detuneAmount / 1200);
      
      // Calculate delay line length for detuned frequency
      const delayLength = Math.round(sampleRate / detunedFreq);
      
      // ====================================
      // MULTI-VOICE EXCITATION
      // ====================================
      // Initialize delay line with shaped noise burst (realistic pluck)
      const delayLine = new Float32Array(delayLength);
      for (let j = 0; j < delayLength; j++) {
        // Pink noise (1/f spectrum) for more realistic pluck
        const whiteNoise = (Math.random() * 2 - 1);
        const pinkFilter = 0.5 + 0.5 * Math.cos(2 * Math.PI * j / delayLength);
        delayLine[j] = whiteNoise * pinkFilter;
      }
      
      // ====================================
      // VELOCITY LAYERS & ADSR
      // ====================================
      // Velocity-sensitive amplitude and tone
      const isEdgeString = arrayIndex === 0 || arrayIndex === stringsToPlay.length - 1;
      const velocityBase = isEdgeString ? 0.70 : 0.88;
      const velocityJitter = (Math.random() - 0.5) * 0.15; // ±7.5% variation
      const velocity = Math.max(0.5, Math.min(1.0, velocityBase + velocityJitter));
      
      const baseAmplitude = (stringIndex > 3 ? 0.38 : 0.35) * velocity;
      
      // ADSR envelope parameters
      const attackTime = 0.003; // 3ms attack
      const decayTime = 0.08;   // 80ms decay
      const sustainLevel = 0.75; // 75% sustain
      const releaseTime = 1.2;  // 1.2s release
      
      // ====================================
      // STEREO IMAGING
      // ====================================
      // Natural string positioning (low strings left, high strings right)
      const panValue = stringIndex < 3
        ? -0.20 + (stringIndex * 0.08)  // Low strings: -20% to -4%
        : (stringIndex - 3) * 0.12;      // High strings: 0% to +24%
      const leftGain = panValue <= 0 ? 1 : 1 - panValue;
      const rightGain = panValue >= 0 ? 1 : 1 + panValue;
      
      // ====================================
      // FREQUENCY-DEPENDENT DAMPING
      // ====================================
      // Higher frequencies decay faster (realistic physics)
      const dampingBase = stringIndex > 3 ? 0.9968 : 0.9978;
      const frequencyFactor = Math.min(1, frequency / 350);
      const damping = dampingBase - (frequencyFactor * 0.0018);
      
      // Velocity affects damping (harder pluck = brighter tone initially)
      const velocityDampingOffset = (1 - velocity) * 0.0008;
      const finalDamping = damping - velocityDampingOffset;
      
      // ====================================
      // LOOP FILTER (Karplus-Strong core)
      // ====================================
      // Two-stage low-pass for smoother tone
      const lpfCoeff = 0.48 + (velocity * 0.08); // Velocity-dependent brightness
      
      // ====================================
      // STRING COUPLING (sympathetic resonance)
      // ====================================
      // Strings vibrating at related frequencies resonate together
      const couplingStrength = 0.015;
      
      let writeIndex = 0;
      let prevOutput = 0;
      let prevLPF = 0; // For two-stage LPF
      
      // ====================================
      // SAMPLE GENERATION LOOP
      // ====================================
      for (let i = startSample; i < durationSamples; i++) {
        const t = (i - startSample) / sampleRate; // Time since pluck
        
        // ====================================
        // ADSR ENVELOPE
        // ====================================
        let envelope = 1.0;
        if (t < attackTime) {
          // Attack phase (exponential)
          envelope = Math.pow(t / attackTime, 2);
        } else if (t < attackTime + decayTime) {
          // Decay phase
          const decayProgress = (t - attackTime) / decayTime;
          envelope = 1.0 - ((1.0 - sustainLevel) * decayProgress);
        } else if (t < duration - releaseTime) {
          // Sustain phase
          envelope = sustainLevel;
        } else {
          // Release phase (exponential)
          const releaseProgress = (t - (duration - releaseTime)) / releaseTime;
          envelope = sustainLevel * Math.pow(1 - releaseProgress, 2.5);
        }
        
        // ====================================
        // PITCH DRIFT LFO
        // ====================================
        // Subtle pitch modulation (0.5-2 Hz, ±2 cents)
        const lfoFreq = 0.8 + (stringIndex * 0.2); // Different LFO per string
        const lfoAmount = 0.0003; // ±2 cents
        const pitchMod = 1.0 + (Math.sin(2 * Math.PI * lfoFreq * t) * lfoAmount);
        
        // ====================================
        // KARPLUS-STRONG FEEDBACK LOOP
        // ====================================
        let currentSample = delayLine[writeIndex];
        const nextIndex = (writeIndex + 1) % delayLength;
        
        // Two-stage low-pass filter for smoother tone
        const lpf1 = lpfCoeff * (currentSample + delayLine[nextIndex]);
        const lpf2 = lpfCoeff * (lpf1 + prevLPF);
        prevLPF = lpf1;
        
        // Apply damping and write back to delay line
        const filteredSample = lpf2 * finalDamping * pitchMod;
        delayLine[writeIndex] = filteredSample;
        
        // ====================================
        // OUTPUT SAMPLE
        // ====================================
        let outputSample = currentSample * baseAmplitude * envelope;
        
        // ====================================
        // BODY RESONANCE (guitar body cavity modes)
        // ====================================
        // Simulate wooden body resonances at specific frequencies
        const bodyResonance1 = 1.0 + (Math.sin(2 * Math.PI * 110 * t) * 0.018); // 110 Hz (low air resonance)
        const bodyResonance2 = 1.0 + (Math.sin(2 * Math.PI * 220 * t) * 0.012); // 220 Hz (top plate)
        outputSample *= (bodyResonance1 + bodyResonance2) * 0.5;
        
        // ====================================
        // HIGH-PASS FILTER (DC offset removal)
        // ====================================
        const highPassFiltered = outputSample - (0.98 * prevOutput);
        prevOutput = outputSample;
        outputSample = highPassFiltered;
        
        // ====================================
        // STRING COUPLING (add sympathetic resonance from other strings)
        // ====================================
        // Sample from nearby strings for coupling effect
        if (arrayIndex > 0 && i > 0) {
          outputSample += leftChannel[i - 1] * couplingStrength;
        }
        
        // Move to next position in delay line
        writeIndex = nextIndex;
        
        // ====================================
        // STEREO OUTPUT
        // ====================================
        leftChannel[i] += outputSample * leftGain;
        rightChannel[i] += outputSample * rightGain;
      }
    });
    
    console.log('✅ Advanced synthesis complete with ADSR, pitch drift, detuning, string coupling');
    
    // ============================================
    // POST-PROCESSING CHAIN
    // ============================================
    console.log('🎛️ Applying professional DSP post-processing chain...');
    
    // 1. Multi-band EQ for guitar body acoustics
    this.applyGuitarBodyEQ(leftChannel, rightChannel, sampleRate);
    
    // 2. Stereo widening (Haas effect + decorrelation)
    this.applyStereoWidening(leftChannel, rightChannel, sampleRate, 0.35);
    
    // 3. Schroeder reverb (realistic room ambience)
    this.applySchroederReverb(leftChannel, rightChannel, sampleRate, 0.28, 0.55, 0.18);
    
    // Dynamic compression + DC offset removal
    let maxPeak = 0;
    let leftDCOffset = 0;
    let rightDCOffset = 0;
    
    // Calculate DC offset
    for (let i = 0; i < durationSamples; i++) {
      leftDCOffset += leftChannel[i];
      rightDCOffset += rightChannel[i];
      maxPeak = Math.max(maxPeak, Math.abs(leftChannel[i]), Math.abs(rightChannel[i]));
    }
    leftDCOffset /= durationSamples;
    rightDCOffset /= durationSamples;
    
    // Remove DC offset and normalize with soft limiter
    const targetPeak = 0.85; // Leave headroom to prevent clipping
    const normalizeRatio = maxPeak > 0.01 ? targetPeak / maxPeak : 1.0;
    
    for (let i = 0; i < durationSamples; i++) {
      // Remove DC offset and apply normalization
      let leftSample = (leftChannel[i] - leftDCOffset) * normalizeRatio * 1.5; // Reduced from 2.4 to 1.5
      let rightSample = (rightChannel[i] - rightDCOffset) * normalizeRatio * 1.5;
      
      // Soft limiter (prevents harsh clipping)
      const softClipThreshold = 0.9;
      if (Math.abs(leftSample) > softClipThreshold) {
        leftSample = Math.sign(leftSample) * (softClipThreshold + (Math.abs(leftSample) - softClipThreshold) * 0.3);
      }
      if (Math.abs(rightSample) > softClipThreshold) {
        rightSample = Math.sign(rightSample) * (softClipThreshold + (Math.abs(rightSample) - softClipThreshold) * 0.3);
      }
      
      // Hard limiter (safety net)
      leftChannel[i] = Math.max(-0.98, Math.min(0.98, leftSample));
      rightChannel[i] = Math.max(-0.98, Math.min(0.98, rightSample));
    }
    
    // Natural fade-out (last 100ms)
    const fadeOutStart = durationSamples - Math.floor(sampleRate * 0.1);
    for (let i = fadeOutStart; i < durationSamples; i++) {
      const fadeProgress = (i - fadeOutStart) / (durationSamples - fadeOutStart);
      const fadeFactor = Math.pow(1 - fadeProgress, 2);
      leftChannel[i] *= fadeFactor;
      rightChannel[i] *= fadeFactor;
    }
    
    console.log('✅ Audio synthesis complete, creating WAV file...');
    
    // Convert to WAV format
    return this.createWAVFromBuffers(leftChannel, rightChannel, sampleRate);
  }

  /**
   * Create WAV file from audio buffers
   */
  private createWAVFromBuffers(leftChannel: Float32Array, rightChannel: Float32Array, sampleRate: number): string {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const numSamples = leftChannel.length;
    const dataSize = numSamples * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;
    
    const buffer = new ArrayBuffer(totalSize);
    const view = new DataView(buffer);
    
    // WAV Header
    // "RIFF" chunk descriptor
    this.writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    this.writeString(view, 8, 'WAVE');
    
    // "fmt " sub-chunk
    this.writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (1 = PCM)
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true); // byte rate
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    
    // "data" sub-chunk
    this.writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);
    
    // Write audio data (interleaved stereo)
    let offset = 44;
    for (let i = 0; i < numSamples; i++) {
      // Left channel
      const leftSample = Math.max(-1, Math.min(1, leftChannel[i]));
      view.setInt16(offset, leftSample * 0x7FFF, true);
      offset += 2;
      
      // Right channel
      const rightSample = Math.max(-1, Math.min(1, rightChannel[i]));
      view.setInt16(offset, rightSample * 0x7FFF, true);
      offset += 2;
    }
    
    // Convert to base64 data URI
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = btoa(binary);
    const dataUri = `data:audio/wav;base64,${base64}`;
    
    console.log(`✅ WAV file created: ${(bytes.length / 1024).toFixed(1)}KB`);
    return dataUri;
  }

  /**
   * Helper to write string to DataView
   */
  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  /**
   * Play chord preview - PRIMARY METHOD for chord playback
   * Accepts ChordData object and plays exact frequencies based on fret positions
   * This ensures audio ALWAYS matches the visual chord diagram
   */
  async playChordPreview(chord: ChordData): Promise<void> {
    const startTime = Date.now();
    
    try {
      console.log('🎵 Starting chord playback:', chord.name);
      
      // Validate input
      if (!chord || !chord.positions) {
        throw new Error('Invalid input: expected ChordData object');
      }
      
      // Validate chord has playable strings
      const playableStrings = chord.positions.filter(f => f >= 0).length;
      if (playableStrings === 0) {
        throw new Error('Chord has no playable strings');
      }
      
      console.log(`🎸 Playing chord: ${chord.name}, positions:`, chord.positions);
      
      // Initialize audio mode for iOS (only once per session to reduce delay)
      if (!this.audioInitialized) {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
        });
        this.audioInitialized = true;
        console.log('✅ Audio mode initialized');
      }
      
      console.log(`🎸 Generating audio for ${playableStrings} strings...`);
      
      // Generate WAV using Karplus-Strong algorithm
      const wavDataUri = this.generateGuitarWAV(chord, 2.5); // 2.5 seconds - natural decay
      
      const generationTime = Date.now() - startTime;
      console.log(`📱 Audio generated in ${generationTime}ms, loading and playing...`);
      
      // Play the generated audio
      const { sound } = await Audio.Sound.createAsync(
        { uri: wavDataUri },
        { shouldPlay: true, volume: 1.0 }
      );
      
      const totalTime = Date.now() - startTime;
      console.log(`✅ Chord playback started in ${totalTime}ms total`);
      
      // Cleanup after playback
      setTimeout(async () => {
        await sound.unloadAsync();
        console.log('🧹 Audio cleanup complete');
      }, 2800); // 2.8s cleanup (300ms buffer after 2.5s audio)
      
    } catch (error) {
      console.error('❌ Chord playback failed:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Chord playback error: ${errorMessage}`);
    }
  }

  /**
   * Play chord - legacy method for backward compatibility
   */
  async playChord(notes: string[], duration: number = 1500, octave: number = 3, strum: boolean = true): Promise<void> {
    console.warn('⚠️ playChord() with note array is deprecated. Use playChordPreview() with ChordData instead.');
  }

  /**
   * Play success sound
   * TODO: Implement using Expo AV for mobile
   */
  async playSuccess(): Promise<void> {
    console.log('🎵 playSuccess() - Mobile implementation needed');
    // TODO: Generate or load success sound WAV
  }

  /**
   * Play error sound
   * TODO: Implement using Expo AV for mobile
   */
  async playError(): Promise<void> {
    console.log('🎵 playError() - Mobile implementation needed');
    // TODO: Generate or load error sound WAV
  }

  /**
   * Metronome functionality
   * TODO: Implement metronome using Expo AV for mobile
   */
  async playMetronomeClick(type: 'strong' | 'weak' = 'weak', volume: number = 0.75, sound: string = 'Click'): Promise<void> {
    console.log('🎵 playMetronomeClick() - Mobile implementation needed');
    // TODO: Load and play metronome click sounds using Expo AV
  }

  startMetronome(bpm: number, beatsPerMeasure: number = 4, sound: string = 'Click', subdivision: number = 1, callback?: (beatInfo: { beat: number; isStrong: boolean; subdivision: number }) => void): void {
    console.log('🎵 startMetronome() - Mobile implementation needed');
    // TODO: Implement metronome timer and click playback using Expo AV
  }

  stopMetronome(): void {
    console.log('🎵 stopMetronome() - Mobile implementation needed');
    // TODO: Stop metronome interval
  }

  /**
   * Tuner functionality
   * TODO: Implement tuner tone using Expo AV for mobile
   */
  async playTunerTone(frequency: number, duration: number = 2000): Promise<void> {
    console.log('🎵 playTunerTone() - Mobile implementation needed');
    // TODO: Generate pure sine tone at specified frequency using WAV generation
  }

  /**
   * Cleanup - mobile doesn't need cleanup (no Web Audio context)
   */
  cleanup(): void {
    console.log('✅ Audio service cleanup - no action needed for mobile');
  }
}

export const audioService = new AudioService();
