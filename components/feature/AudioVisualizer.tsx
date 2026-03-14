// Real-time audio visualization component
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { colors } from '@/constants/theme';

interface AudioVisualizerProps {
  audioData: Float32Array | null;
  frequencyData?: Uint8Array | null;
  type?: 'waveform' | 'spectrum' | 'both';
  height?: number;
  color?: string;
}

export function AudioVisualizer({ 
  audioData, 
  frequencyData,
  type = 'waveform',
  height = 100,
  color = colors.primary,
}: AudioVisualizerProps) {
  const canvasRef = useRef<any>(null);
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (!audioData && !frequencyData) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    // For web, use HTML5 Canvas
    if (Platform.OS === 'web') {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, width, height);

      if (type === 'waveform' && audioData) {
        drawWaveform(ctx, audioData, width, height, color);
      } else if (type === 'spectrum' && frequencyData) {
        drawSpectrum(ctx, frequencyData, width, height, color);
      } else if (type === 'both' && audioData && frequencyData) {
        drawWaveform(ctx, audioData, width, height / 2, color);
        ctx.save();
        ctx.translate(0, height / 2);
        drawSpectrum(ctx, frequencyData, width, height / 2, color);
        ctx.restore();
      }
    }
  }, [audioData, frequencyData, type, width, height, color]);

  if (Platform.OS === 'web') {
    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={styles.canvas}
      />
    );
  }

  // For native, we'd use react-native-svg
  // For now, show a placeholder
  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.placeholder} />
    </View>
  );
}

function drawWaveform(
  ctx: CanvasRenderingContext2D,
  data: Float32Array,
  width: number,
  height: number,
  color: string
): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();

  const sliceWidth = width / data.length;
  let x = 0;

  for (let i = 0; i < data.length; i++) {
    const v = data[i];
    const y = (v + 1) * height / 2;

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }

    x += sliceWidth;
  }

  ctx.stroke();
}

function drawSpectrum(
  ctx: CanvasRenderingContext2D,
  data: Uint8Array,
  width: number,
  height: number,
  color: string
): void {
  const barWidth = width / data.length;
  let x = 0;

  // Create gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, color);
  gradient.addColorStop(1, colors.background);

  for (let i = 0; i < data.length; i++) {
    const barHeight = (data[i] / 255) * height;

    ctx.fillStyle = gradient;
    ctx.fillRect(x, height - barHeight, barWidth - 1, barHeight);

    x += barWidth;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    overflow: 'hidden',
  },
  canvas: {
    display: 'block',
  },
  placeholder: {
    flex: 1,
    backgroundColor: colors.surface,
  },
});
