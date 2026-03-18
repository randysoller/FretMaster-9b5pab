# FreePats Guitar Samples Setup Guide

## Quick Start (30 minutes)

This guide will walk you through setting up the FreePats steel-string guitar samples for **instant realistic playback** in your app.

---

## Step 1: Download FreePats Samples (5 minutes)

### Download Link
🔗 **https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html**

### What to Download
Click on: **"Sound bank - SFZ WAV - 2.7MiB - Small size"**

- File: `FSS-SteelStringAcousticGuitar-Small-20200521.tar.bz2` (2.7MB)
- License: GPL v3 with special exception (free for musical use)
- Quality: Professional recordings from FlameStudios

### Extract the Archive
```bash
# On macOS/Linux
tar -xjf FSS-SteelStringAcousticGuitar-Small-20200521.tar.bz2

# On Windows (use 7-Zip or WinRAR)
# Right-click → Extract Here
```

---

## Step 2: Organize Samples (10 minutes)

### What You'll Find Inside
The extracted folder contains:
- `FSS-SteelStringAcousticGuitar-Small.sfz` (mapping file - not needed)
- `samples/` folder with WAV files like:
  - `E2v4.wav` (Low E string, velocity 4)
  - `A2v4.wav` (A string, velocity 4)
  - etc.

### Sample Naming Convention
FreePats uses this format: `{NOTE}{OCTAVE}v{VELOCITY}.wav`

Examples:
- `E2v4.wav` = E note, octave 2, velocity layer 4
- `A2v4.wav` = A note, octave 2, velocity layer 4
- `F3v4.wav` = F note, octave 3, velocity layer 4

### Create Project Structure
Create this folder in your project:
```bash
mkdir -p assets/audio/guitar-strings
```

### Organize by String and Fret

**Guitar Tuning Reference:**
- String 0 (Low E): E2, F2, F#2, G2, G#2, A2, A#2, B2, C3, C#3, D3, D#3, E3
- String 1 (A): A2, A#2, B2, C3, C#3, D3, D#3, E3, F3, F#3, G3, G#3, A3
- String 2 (D): D3, D#3, E3, F3, F#3, G3, G#3, A3, A#3, B3, C4, C#4, D4
- String 3 (G): G3, G#3, A3, A#3, B3, C4, C#4, D4, D#4, E4, F4, F#4, G4
- String 4 (B): B3, C4, C#4, D4, D#4, E4, F4, F#4, G4, G#4, A4, A#4, B4
- String 5 (High e): E4, F4, F#4, G4, G#4, A4, A#4, B4, C5, C#5, D5, D#5, E5

### Mapping Script

Save this as `organize_samples.py` in the FreePats extracted folder:

```python
#!/usr/bin/env python3
import os
import shutil

# Note to MIDI mapping
NOTE_MAP = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
}

# Standard tuning (MIDI notes for open strings)
OPEN_STRINGS = [40, 45, 50, 55, 59, 64]  # E2, A2, D3, G3, B3, E4

def note_to_midi(note_name):
    """Convert note name like 'E2' to MIDI number"""
    note = note_name[:-1]
    octave = int(note_name[-1])
    return (octave + 1) * 12 + NOTE_MAP.get(note, 0)

def find_string_and_fret(midi_note):
    """Find which string and fret produces this note"""
    for string_idx, open_note in enumerate(OPEN_STRINGS):
        fret = midi_note - open_note
        if 0 <= fret <= 12:  # Only map frets 0-12
            return string_idx, fret
    return None, None

def organize_samples(source_dir, output_dir):
    """Organize FreePats samples into string/fret structure"""
    samples_dir = os.path.join(source_dir, 'samples')
    
    if not os.path.exists(samples_dir):
        print(f"Error: {samples_dir} not found!")
        return
    
    # Create output structure
    for string_idx in range(6):
        string_dir = os.path.join(output_dir, f'string{string_idx}')
        os.makedirs(string_dir, exist_ok=True)
    
    # Process each WAV file
    for filename in os.listdir(samples_dir):
        if not filename.endswith('.wav'):
            continue
        
        # Parse filename (e.g., "E2v4.wav")
        note_name = filename.replace('v4.wav', '').replace('v2.wav', '')
        velocity = 'medium' if 'v4' in filename else 'soft'
        
        # Convert to MIDI note
        midi_note = note_to_midi(note_name)
        
        # Find string and fret
        string_idx, fret = find_string_and_fret(midi_note)
        
        if string_idx is not None:
            # Copy to correct location
            src = os.path.join(samples_dir, filename)
            dst = os.path.join(output_dir, f'string{string_idx}', f'fret{fret}-{velocity}.wav')
            shutil.copy2(src, dst)
            print(f"✓ {filename} → string{string_idx}/fret{fret}-{velocity}.wav")
        else:
            print(f"✗ Skipped {filename} (out of range)")

if __name__ == '__main__':
    source = '.'  # Current directory (FreePats extracted folder)
    output = '../assets/audio/guitar-strings'  # Your project folder
    
    print("🎸 Organizing FreePats samples...\n")
    organize_samples(source, output)
    print("\n✅ Done! Samples organized into string/fret structure")
```

### Run the Script
```bash
python3 organize_samples.py
```

**Result**: Samples will be copied to `assets/audio/guitar-strings/` in the correct structure!

---

## Step 3: Verify Sample Structure (2 minutes)

Check that you have files like:
```
assets/audio/guitar-strings/
├── string0/
│   ├── fret0-medium.wav  (E2)
│   ├── fret1-medium.wav  (F2)
│   ├── fret2-medium.wav  (F#2)
│   └── ... (up to fret12)
├── string1/
│   ├── fret0-medium.wav  (A2)
│   └── ...
└── ... (string2-5)
```

**Expected**: ~78 files (6 strings × 13 frets × 1 velocity layer)

**Note**: FreePats 2.7MB version has limited velocity layers. You'll mostly get "medium" velocity. For full velocity layers (soft/medium/hard), you'd need to:
1. Download the 13MB version instead, OR
2. Generate variations using the script in Step 4

---

## Step 4: Generate Velocity Layers (Optional - 5 minutes)

To create soft/hard variations from the medium samples:

```python
#!/usr/bin/env python3
import numpy as np
import soundfile as sf
import os

def create_velocity_layers(base_dir):
    """Generate soft/hard variations from medium samples"""
    for string_idx in range(6):
        string_dir = os.path.join(base_dir, f'string{string_idx}')
        
        for fret in range(13):
            medium_file = os.path.join(string_dir, f'fret{fret}-medium.wav')
            
            if not os.path.exists(medium_file):
                continue
            
            # Load audio
            audio, sr = sf.read(medium_file)
            
            # Create soft version (0.6× amplitude)
            soft_file = os.path.join(string_dir, f'fret{fret}-soft.wav')
            sf.write(soft_file, audio * 0.6, sr)
            
            # Create hard version (1.2× amplitude with light clipping)
            hard_file = os.path.join(string_dir, f'fret{fret}-hard.wav')
            hard_audio = np.clip(audio * 1.2, -1.0, 1.0)
            sf.write(hard_file, hard_audio, sr)
            
            print(f"✓ String {string_idx} fret {fret}: soft/medium/hard")

if __name__ == '__main__':
    import sys
    
    # Check if soundfile is installed
    try:
        import soundfile
    except ImportError:
        print("⚠️  Installing soundfile library...")
        os.system("pip3 install soundfile numpy")
    
    base_dir = '../assets/audio/guitar-strings'
    print("🎹 Generating velocity layers...\n")
    create_velocity_layers(base_dir)
    print("\n✅ Done! Now you have 234 samples (78 × 3 velocities)")
```

**Run**:
```bash
pip3 install soundfile numpy
python3 generate_velocity_layers.py
```

---

## Step 5: Integration Complete! (2 minutes)

Your samples are now ready! The code has already been updated to use them.

### Test the Setup

1. **Run the app**:
   ```bash
   npx expo start
   ```

2. **Play a chord** in the Chord Library or Practice screen

3. **Check console logs**:
   ```
   ✅ Exact string sample match: string 0, fret 0, medium
   🎸 Playing authentic guitar sample
   ```

### Fallback Behavior

If a sample is missing, the app automatically uses synthesis:
```
⚠️ No sample for string 2 fret 9 - using synthesis fallback
```

---

## Troubleshooting

### "Failed to load asset"
**Solution**: Make sure samples are in the correct location and run:
```bash
npx expo start --clear
```

### "No samples found"
**Solution**: Verify the `assets/audio/guitar-strings/` structure matches the expected layout

### Playback sounds wrong
**Solution**: The FreePats samples might have different tuning/velocity. Try:
1. Download the 13MB "best quality" version instead
2. Re-run the organization script
3. Check console logs to see which samples are being used

---

## Advanced: Using the 13MB Version (Better Quality)

For professional quality:

1. **Download**: "Sound bank - SFZ WAV - 13MiB - Best quality"
2. **Extract**: Same as Step 2
3. **Organize**: Run the same `organize_samples.py` script
4. **Result**: More samples with better velocity layers!

---

## Attribution (Required by License)

Add to your app's About/Credits screen:

```
Guitar samples from FreePats Steel-String Acoustic Guitar
Created by FlameStudios, distributed under GPL v3+ with special exception
https://freepats.zenvoid.org/
```

---

## Summary

✅ **Download**: FreePats 2.7MB SFZ WAV  
✅ **Extract**: Unzip the archive  
✅ **Organize**: Run Python script to structure samples  
✅ **Generate**: (Optional) Create velocity layers  
✅ **Integration**: Already done - code updated!  

**Total time**: ~30 minutes  
**Result**: 🎸 **Professional guitar playback with real samples!**

---

## Next Steps

Once samples are working:
1. Fine-tune strum timing in the practice screens
2. Add UI controls for velocity/direction
3. Consider downloading the 13MB version for even better quality
4. Create your own custom samples with your guitar!

**Questions?** Check the console logs when playing chords - they'll tell you exactly which samples are being used or if fallback is happening.
