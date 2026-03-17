# FretMaster Sample-Based Audio System

## Overview

This document explains the **hybrid sample-based audio system** that provides 100% authentic guitar tone by using real recorded guitar samples for common chords, with synthesis fallback for uncommon/custom chords.

## Architecture

### Hybrid Approach Benefits:
1. **Authentic Tone** - Real guitar recordings sound exactly like an acoustic guitar (no synthesis artifacts)
2. **Small Bundle Size** - Only include samples for most common chords (~12-15 samples = 3-5MB total)
3. **Instant Playback** - Preloaded samples play immediately with zero latency
4. **Universal Coverage** - Synthesis fallback ensures ALL chords can be played
5. **Easy Maintenance** - Add new samples over time to improve quality

## Sample Library Structure

### Current Implementation:
```typescript
services/sampleBasedAudioService.ts  // Sample-based playback engine
services/audioService.ts              // Synthesis fallback (unchanged)
assets/audio/guitar-samples/          // WAV sample files
```

### Included Samples (12 common chords):
- **Major**: C, D, E, F, G, A
- **Minor**: Am, Dm, Em
- **7th**: G7, C7, D7

### Playback Logic:
```
User plays chord
    ↓
Find matching sample?
    ↓ YES               ↓ NO
Play authentic      Use synthesis
guitar sample       fallback
```

## Adding Guitar Samples

### Step 1: Download Authentic Samples

**Recommended Source: Freesound.org (Creative Commons CC0)**

Direct links to high-quality guitar chord samples:

1. **C Major Chord**
   - URL: https://freesound.org/people/spitefuloctopus/sounds/315706/
   - License: CC0 (royalty-free)
   - Format: WAV, 44.1kHz, stereo
   - Download → Rename to `C-major.wav`

2. **D Major Chord**
   - URL: https://freesound.org/people/ValentinSosnitskiy/sounds/527326/
   - License: CC0
   - Download → Rename to `D-major.wav`

3. **Guitar Chord Pack (Multiple Chords)**
   - URL: https://freesound.org/people/eqavox/sounds/683953/
   - License: CC0
   - Contains: Multiple chords in one file
   - Process: Split into individual chord files

4. **Alternative: Use FreePats Steel-String Library**
   - URL: https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html
   - Download: SFZ WAV (2.7MB small size version)
   - Extract individual note samples and map to chord positions

### Step 2: Prepare Sample Files

**Requirements:**
- Format: WAV (16-bit PCM)
- Sample Rate: 44100 Hz (44.1kHz)
- Channels: Stereo
- Duration: 2-4 seconds (natural guitar sustain)
- Bit Depth: 16-bit

**Processing (if needed):**
```bash
# Use Audacity or ffmpeg to convert/normalize

# Convert to proper format
ffmpeg -i input.wav -ar 44100 -ac 2 -sample_fmt s16 output.wav

# Normalize volume
ffmpeg -i input.wav -filter:a "loudnorm" output.wav

# Trim to 3 seconds
ffmpeg -i input.wav -t 3 output.wav
```

### Step 3: Add to Project

1. Create directory structure:
```bash
mkdir -p assets/audio/guitar-samples
```

2. Copy WAV files:
```bash
assets/audio/guitar-samples/
├── C-major.wav
├── D-major.wav
├── E-major.wav
├── F-major.wav
├── G-major.wav
├── A-major.wav
├── A-minor.wav
├── D-minor.wav
├── E-minor.wav
├── G7.wav
├── C7.wav
└── D7.wav
```

3. Update `sampleBasedAudioService.ts` - verify `SAMPLE_LIBRARY` array has correct paths and positions:

```typescript
private readonly SAMPLE_LIBRARY: SampleMapping[] = [
  { 
    chordName: 'C', 
    assetPath: require('@/assets/audio/guitar-samples/C-major.wav'), 
    positions: [-1, 3, 2, 0, 1, 0] 
  },
  // ... add more samples
];
```

### Step 4: Test Samples

Run the app and check console logs:
```
✅ Exact name match found: C
🎸 Playing authentic guitar sample: C
📱 Sample loaded in 45ms, playing...
✅ Sample playback started in 52ms total
```

If you see:
```
⚠️ No sample found for C, will use synthesis fallback
```
→ Check file path and chord name/positions matching

## Expanding the Sample Library

### Priority Order for Adding Samples:

**Tier 1 - Essential (Current Implementation):**
- C, G, D, Em, Am (Most common in popular music)

**Tier 2 - Very Common:**
- F, E, A, Dm, B7, A7, E7

**Tier 3 - Common Variations:**
- Cmaj7, Gmaj7, Dmaj7, Asus4, Dsus4, Gsus4

**Tier 4 - Extended Chords:**
- Cadd9, Gadd9, Em7, Am7, Fmaj7

**Tier 5 - Barre Chords:**
- Bm, F#m, C#m, Bb, Eb

### Expected Bundle Size:
- 12 samples (Tier 1): ~3-5 MB
- 24 samples (Tier 1+2): ~6-10 MB
- 50 samples (All tiers): ~15-20 MB

### Quality vs Size Trade-off:
- **Small bundle** (3-5MB): 12 most common chords
- **Medium bundle** (10-15MB): 24-30 common chords
- **Large bundle** (20-30MB): 50+ chords including variations

**Recommendation**: Start with Tier 1 (12 samples), expand based on user feedback and analytics showing which chords are played most frequently.

## Integration with Existing Code

### Switching to Sample-Based Audio:

**Option 1: Replace Current Service (Recommended)**
```typescript
// In any component using audioService
import { sampleBasedAudioService } from '@/services/sampleBasedAudioService';

// Play chord (automatically uses samples or synthesis)
await sampleBasedAudioService.playChordPreview(chord);
```

**Option 2: Gradual Migration**
```typescript
// Keep both services available
import { audioService } from '@/services/audioService';
import { sampleBasedAudioService } from '@/services/sampleBasedAudioService';

// Use sample-based by default, fallback to synthesis
try {
  await sampleBasedAudioService.playChordPreview(chord);
} catch (error) {
  await audioService.playChordPreview(chord);
}
```

**Option 3: User Preference**
```typescript
// Add setting in user preferences
const useAuthenticSamples = userPreferences.audioQuality === 'high';

if (useAuthenticSamples) {
  await sampleBasedAudioService.playChordPreview(chord);
} else {
  await audioService.playChordPreview(chord);
}
```

### Performance Optimization:

**Preload Common Samples on App Start:**
```typescript
// In app/_layout.tsx or App.tsx
useEffect(() => {
  sampleBasedAudioService.preloadCommonSamples()
    .then(() => console.log('✅ Samples ready for instant playback'))
    .catch(err => console.error('⚠️ Sample preload failed:', err));
}, []);
```

## Licensing & Attribution

### Creative Commons CC0 Samples:
- No attribution required
- Commercial use allowed
- Modification allowed
- Redistribution allowed

**Recommended Attribution (Optional):**
```
Guitar samples sourced from Freesound.org
- C Major: spitefuloctopus (CC0)
- D Major: ValentinSosnitskiy (CC0)
- Multiple chords: eqavox (CC0)
```

### FreePats GPL with Exception:
- Requires attribution
- Commercial use allowed with GPL exception clause
- Musical compositions using samples can be under any license

**Required Attribution:**
```
Guitar samples from FreePats Steel-String Acoustic Guitar
Created by FlameStudios, distributed under GPL v3+ with special exception
https://freepats.zenvoid.org/
```

## Future Enhancements

### 1. Dynamic Sample Loading
Load samples on-demand instead of bundling in app:
```typescript
// Download from CDN when needed
const sampleUrl = `https://cdn.example.com/samples/${chordName}.wav`;
```

### 2. Sample Variations
Multiple velocity layers and playing styles:
```typescript
// Soft, medium, hard plucking
await playChordPreview(chord, { velocity: 'soft' });
await playChordPreview(chord, { velocity: 'medium' });
await playChordPreview(chord, { velocity: 'hard' });
```

### 3. Intelligent Caching
Cache most-played chords based on user patterns:
```typescript
// Track chord usage
analyticsService.trackChordPlayed(chord.name);

// Preload user's most common chords
const topChords = analyticsService.getTopChords(10);
await preloadCustomSamples(topChords);
```

### 4. User-Recorded Samples
Allow users to record their own guitar for personalized tone:
```typescript
// Record custom sample
await recordCustomChordSample(chord);

// Use in playback
await playChordPreview(chord, { useCustomSample: true });
```

## Troubleshooting

### "Sample playback failed, falling back to synthesis"
**Cause**: Sample file missing or corrupt
**Fix**: 
1. Verify file exists in `assets/audio/guitar-samples/`
2. Check file format is WAV (not MP3/M4A)
3. Run `npx expo prebuild --clean` to rebuild assets

### "Failed to load asset"
**Cause**: Incorrect `require()` path or file not included in bundle
**Fix**:
1. Check path in `SAMPLE_LIBRARY` matches actual file location
2. Ensure file extension is `.wav` (case-sensitive on some platforms)
3. Clear Metro bundler cache: `npx expo start -c`

### Playback sounds choppy/stuttering
**Cause**: Sample file size too large or device memory constraints
**Fix**:
1. Compress samples to 16-bit PCM (not 24-bit or 32-bit float)
2. Use mono instead of stereo to reduce size by 50%
3. Trim samples to 2-3 seconds maximum

### High memory usage
**Cause**: Too many samples cached simultaneously
**Fix**:
1. Reduce number of preloaded samples
2. Implement LRU (Least Recently Used) cache eviction
3. Call `cleanup()` when navigating away from practice screens

## Conclusion

The **hybrid sample-based audio system** provides the best of both worlds:
- ✅ **Authentic guitar tone** for common chords (100% real recordings)
- ✅ **Universal coverage** via synthesis fallback
- ✅ **Small bundle size** (only 3-5MB for core samples)
- ✅ **Instant playback** with preloading
- ✅ **Easy expansion** - add samples over time

**Next Steps:**
1. Download sample files from Freesound.org
2. Place in `assets/audio/guitar-samples/` folder
3. Test playback and verify console logs
4. Gradually expand library based on user analytics

For questions or issues, refer to this guide or check the implementation in `services/sampleBasedAudioService.ts`.
