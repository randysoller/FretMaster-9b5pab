// Platform-agnostic audio capture
import { Platform } from 'react-native';

export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface AudioCaptureCallback {
  (buffer: Float32Array, sampleRate: number): void;
}

// Dynamic import based on platform
let audioCapture: any;

if (Platform.OS === 'web') {
  audioCapture = require('./audioCapture.web').webAudioCapture;
} else {
  audioCapture = require('./audioCapture.native').nativeAudioCapture;
}

export { audioCapture };
