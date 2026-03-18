# Guitar String Samples

This folder contains individual guitar string samples for authentic playback.

## Required Structure

```
guitar-strings/
├── string0/  (Low E - 82.41 Hz)
│   ├── fret0-soft.wav ... fret12-soft.wav
│   ├── fret0-medium.wav ... fret12-medium.wav
│   └── fret0-hard.wav ... fret12-hard.wav
├── string1/  (A - 110.00 Hz)
├── string2/  (D - 146.83 Hz)
├── string3/  (G - 196.00 Hz)
├── string4/  (B - 246.94 Hz)
└── string5/  (High e - 329.63 Hz)
```

**Total**: 234 samples (6 strings × 13 frets × 3 velocities)

## Setup Instructions

**Follow the detailed guide**: `FREEPATS_SETUP_GUIDE.md` in the project root

**Quick start**:
1. Download FreePats steel-string samples (2.7MB): https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html
2. Run the Python organization script from the guide
3. Copy organized samples to this folder
4. Restart the app with `npx expo start --clear`

## Fallback Behavior

If samples are missing, the app automatically uses Karplus-Strong synthesis as a fallback. The console will show:

- ✅ `Loaded sample s0_f0_medium` - Using real sample
- ⚠️ `No sample for s0_f0_medium - using synthesis fallback` - Synthesis used

## File Format Requirements

- **Format**: WAV (16-bit PCM)
- **Sample Rate**: 44100 Hz
- **Channels**: Mono preferred (stereo works but 2× larger)
- **Duration**: 1.5-2.5 seconds with natural decay
- **Size**: ~20-40 KB per sample, ~8-12 MB total

## Attribution

FreePats samples require attribution:

```
Guitar samples from FreePats Steel-String Acoustic Guitar
Created by FlameStudios, distributed under GPL v3+ with special exception
https://freepats.zenvoid.org/
```
