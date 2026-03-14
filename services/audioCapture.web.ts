// Web audio capture using Web Audio API
export interface AudioCaptureConfig {
  sampleRate: number;
  channels: number;
  bitDepth: number;
}

export interface AudioCaptureCallback {
  (buffer: Float32Array, sampleRate: number): void;
}

class WebAudioCapture {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private callback: AudioCaptureCallback | null = null;

  async requestPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
        }
      });
      
      // Store the stream for later use
      this.mediaStream = stream;
      return true;
    } catch (error) {
      console.error('Microphone access denied:', error);
      return false;
    }
  }

  async startCapture(callback: AudioCaptureCallback, config?: AudioCaptureConfig): Promise<boolean> {
    if (!this.mediaStream) {
      console.error('No media stream available. Call requestPermission first.');
      return false;
    }

    try {
      // @ts-ignore
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: config?.sampleRate || 48000 });
      this.analyser = this.audioContext.createAnalyser();
      
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      source.connect(this.analyser);

      this.analyser.fftSize = 4096;
      this.callback = callback;

      // Use ScriptProcessorNode for real-time audio processing
      // Note: This is deprecated but AudioWorklet requires separate file
      this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);
      this.analyser.connect(this.scriptProcessor);
      this.scriptProcessor.connect(this.audioContext.destination);

      this.scriptProcessor.onaudioprocess = (e) => {
        const inputBuffer = e.inputBuffer.getChannelData(0);
        if (this.callback) {
          this.callback(inputBuffer, this.audioContext!.sampleRate);
        }
      };

      return true;
    } catch (error) {
      console.error('Failed to start audio capture:', error);
      return false;
    }
  }

  async stopCapture(): Promise<void> {
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
    }

    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }

    if (this.audioContext) {
      await this.audioContext.close();
      this.audioContext = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }

    this.callback = null;
  }

  isCapturing(): boolean {
    return this.audioContext !== null && this.callback !== null;
  }

  getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  getAudioContext(): AudioContext | null {
    return this.audioContext;
  }
}

export const webAudioCapture = new WebAudioCapture();
