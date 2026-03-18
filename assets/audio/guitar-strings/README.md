# 🎸 Guitar String Samples

**Organized by string and fret for realistic guitar playback**

---

## 📁 Folder Structure

```
guitar-strings/
├── string0/     # Low E (E2)  - 13 samples (frets 0-12)
├── string1/     # A (A2)      - 13 samples (frets 0-12)
├── string2/     # D (D3)      - 13 samples (frets 0-12)
├── string3/     # G (G3)      - 13 samples (frets 0-12)
├── string4/     # B (B3)      - 13 samples (frets 0-12)
└── string5/     # High E (E4) - 13 samples (frets 0-12)
```

**Total: 78 WAV samples** (6 strings × 13 frets each)

---

## 🎵 String Tuning Reference

| String | Note | Frequency | Samples |
|--------|------|-----------|---------|
| 0 | E2 (Low E) | 82.41 Hz | `E2.wav` through `E3.wav` |
| 1 | A2 | 110.00 Hz | `A2.wav` through `A3.wav` |
| 2 | D3 | 146.83 Hz | `D3.wav` through `D4.wav` |
| 3 | G3 | 196.00 Hz | `G3.wav` through `G4.wav` |
| 4 | B3 | 246.94 Hz | `B3.wav` through `B4.wav` |
| 5 | E4 (High E) | 329.63 Hz | `E4.wav` through `E5.wav` |

---

## 📝 File Naming Convention

### Natural Notes
- C, D, E, F, G, A, B → `C3.wav`, `D3.wav`, `E3.wav`, etc.

### Sharp Notes
- F# → `Fs.wav` (F sharp)
- C# → `Cs.wav` (C sharp)
- G# → `Gs.wav` (G sharp)
- D# → `Ds.wav` (D sharp)
- A# → `As.wav` (A sharp)

**Why "s" instead of "#"?** Some file systems don't allow `#` in filenames.

---

## 🚀 Quick Start

### Option 1: Download FreePats (Recommended)

1. **Download the 2.7MB small size pack:**
   ```bash
   # Visit: https://freepats.zenvoid.org/Guitar/steel-acoustic-guitar.html
   # Download: "Sound bank | SFZ WAV | 2.7MiB | Small size"
   ```

2. **Extract the archive:**
   ```bash
   unzip FSS-Steel-String-Acoustic-Guitar-small.zip
   cd FSS-Steel-String-Acoustic-Guitar-small/samples
   ```

3. **Organize samples using the provided script:**
   
   **Python:**
   ```bash
   python3 ../organize_samples.py .
   ```
   
   **Node.js:**
   ```bash
   node ../organize_samples.js .
   ```

4. **Verify samples are organized:**
   ```bash
   ls string0/  # Should show E2.wav, F2.wav, Fs2.wav, etc.
   ```

5. **Update `services/strummingAudioService.ts`:**
   - Uncomment the `SAMPLE_MAP` object (remove `/* */` wrapper)
   - The service will now use real guitar samples!

---

### Option 2: Record Your Own Samples

If you have a guitar and microphone:

1. **Tune your guitar** to standard tuning (E-A-D-G-B-E)

2. **Record each string at each fret** (0-12):
   - Use a clean, quiet environment
   - Record in WAV format (44.1kHz, 16-bit)
   - Let each note ring for 2-3 seconds
   - Pluck with consistent force

3. **Normalize and trim** using Audacity:
   - Effect → Normalize (peak -3dB)
   - Trim silence from start/end
   - Export as WAV

4. **Name files** according to convention:
   - String 0, Fret 0 → `string0/E2.wav`
   - String 0, Fret 1 → `string0/F2.wav`
   - etc.

---

## 🔧 Sample Requirements

Each WAV file should be:
- ✅ **Format**: Uncompressed WAV
- ✅ **Sample Rate**: 44.1 kHz or 48 kHz
- ✅ **Bit Depth**: 16-bit minimum (24-bit preferred)
- ✅ **Channels**: Mono (stereo will be downmixed)
- ✅ **Length**: 1-3 seconds with natural decay
- ✅ **Normalization**: Peak around -3dB to -6dB
- ✅ **Tuning**: Accurately tuned to target frequency
- ✅ **Silence**: Trimmed from beginning and end

---

## 📊 Current Status

**Samples Installed:** 0/78

To check your installation:
```bash
# Count WAV files
find . -name "*.wav" | wc -l

# Should output: 78
```

---

## 🎯 How It Works

When you play a chord like **C Major**:

```
C Major = [3, 3, 2, 0, 1, 0]
          ↓  ↓  ↓  ↓  ↓  ↓
String 0: Fret 3 → plays string0/G2.wav
String 1: Fret 3 → plays string1/C3.wav
String 2: Fret 2 → plays string2/E3.wav
String 3: Fret 0 → plays string3/G3.wav
String 4: Fret 1 → plays string4/C4.wav
String 5: Fret 0 → plays string5/E4.wav
```

The strumming engine sequences these samples with:
- ✅ Humanized timing (15-40ms between strings)
- ✅ Random velocity variation (±15%)
- ✅ Proper stereo panning (low strings left, high strings right)
- ✅ Intelligent sound pooling (no clicks)

**Result:** Realistic guitar chord playback! 🎸

---

## 📚 Additional Resources

- **Complete mapping:** See `ORGANIZATION_GUIDE.md`
- **Setup guide:** See `../FREEPATS_SETUP_GUIDE.md`
- **FreePats website:** https://freepats.zenvoid.org/
- **Guitar frequency calculator:** https://www.translatorscafe.com/unit-converter/en-US/calculator/note-frequency/

---

## ✅ Next Steps

1. Download FreePats samples (2.7MB)
2. Run organization script
3. Verify 78 WAV files are in place
4. Uncomment sample map in `strummingAudioService.ts`
5. Test chord playback → Enjoy realistic guitar sound! 🎉
