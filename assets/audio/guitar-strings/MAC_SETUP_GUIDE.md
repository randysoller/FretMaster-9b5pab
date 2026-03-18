# Mac Setup Guide - Guitar Samples

Complete step-by-step guide for Mac users to download, convert, and organize guitar samples.

---

## 🎯 Quick Start (5 Steps)

### Step 1: Install FFmpeg (One-Time Setup)

Open **Terminal** (Applications → Utilities → Terminal) and run:

```bash
# Install Homebrew if you don't have it
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install FFmpeg
brew install ffmpeg

# Verify installation
ffmpeg -version
```

**Expected output:** FFmpeg version info (e.g., `ffmpeg version 6.1.1`)

---

### Step 2: Download Guitar Samples

**Option A: Freesound.org (RECOMMENDED - 45 samples)**
1. Visit: https://freesound.org/people/allan764/packs/26467/
2. Create a free account (if needed)
3. Click "Download pack"
4. Save to Downloads folder

**Option B: University of Iowa MIS Guitar**
1. Visit: https://theremin.music.uiowa.edu/MISguitar.html
2. Scroll to "Mono - zipped"
3. Download `Guitar.mono.1644.1.zip`
4. Extract the ZIP file

---

### Step 3: Extract the Sample Pack

```bash
# Navigate to Downloads
cd ~/Downloads

# Extract the ZIP (if using Freesound)
unzip allan764_26467__45-acoustic-guitar-individual-sounds-e2-c6.zip

# You should now have a folder with 45 FLAC files
ls -la *.flac
```

---

### Step 4: Organize Samples into Your Project

```bash
# Navigate to your FretMaster project
cd ~/path/to/fretmaster/assets/audio/guitar-strings

# Run the organizer script (auto-converts FLAC → WAV)
python3 organize_samples.py ~/Downloads/26467

# OR if you put samples in a different folder:
python3 organize_samples.py ~/Downloads/guitar-samples
```

**What happens:**
- ✅ Script finds all FLAC and WAV files
- 🔄 Auto-converts FLAC → WAV (using ffmpeg)
- 📂 Organizes into string0/ through string5/ folders
- ✅ Renames files to match expected format

**Expected output:**
```
🎸 Guitar Sample Organizer
📂 Source: /Users/yourname/Downloads/26467
📂 Destination: /Users/yourname/fretmaster/assets/audio/guitar-strings

✅ Created: string0
✅ Created: string1
✅ Created: string2
✅ Created: string3
✅ Created: string4
✅ Created: string5

Found 0 WAV files + 45 FLAC files
🔄 FLAC files will be auto-converted to WAV

Processing String 0...
  🔄 Fret  0: E2   - Converting FLAC → WAV...
    ✅ Converted and saved to E2.wav
  🔄 Fret  1: F2   - Converting FLAC → WAV...
    ✅ Converted and saved to F2.wav
  ...

✅ Successfully organized: 45/78 samples
⚠️  Missing samples: 33
```

---

### Step 5: Verify Installation

```bash
# Check how many samples were installed
find string* -name "*.wav" | wc -l

# List installed samples
ls -R string*
```

**Expected:**
- You should see WAV files in each string folder
- Total count depends on your sample pack (45 for Freesound, varies for others)

---

## 🔧 Troubleshooting

### "ffmpeg: command not found"

**Solution:**
```bash
# Install Homebrew first
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Then install ffmpeg
brew install ffmpeg
```

### "No audio files found in source directory"

**Solution:**
- Make sure you extracted the ZIP file
- Check the correct folder path:
  ```bash
  ls ~/Downloads/26467/*.flac
  ```
- Update the script command with the correct path

### "Permission denied"

**Solution:**
```bash
# Make script executable
chmod +x organize_samples.py

# Run with python3 explicitly
python3 organize_samples.py ~/Downloads/26467
```

### Conversion is slow

This is normal! Converting 45 FLAC files takes 1-2 minutes. The script shows progress:
```
🔄 Fret  0: E2   - Converting FLAC → WAV...
  ✅ Converted and saved to E2.wav
```

---

## 📊 What You'll Get

### Freesound Pack (45 samples)
- ✅ Coverage: E2 to C6 (chromatic)
- ✅ Usable: ~40-42 samples within guitar range
- ✅ Quality: Good acoustic steel-string guitar
- ⚠️ Missing: ~33 positions (will use synthesis fallback)

### Iowa MIS Pack (54 samples)
- ✅ Coverage: Full chromatic per string
- ✅ Usable: ~50 samples
- ✅ Quality: Professional classical guitar (high-resolution)
- ⚠️ Missing: ~24 positions (will use synthesis fallback)

---

## ✅ Next Steps After Installation

1. **Verify samples are installed:**
   ```bash
   ls -la string*/
   ```

2. **Update your app to use samples:**
   - Open `services/strummingAudioService.ts`
   - Uncomment the `SAMPLE_MAP` object (currently commented out)
   - Save the file

3. **Test in your app:**
   - Run your FretMaster app
   - Play a chord (like C major)
   - You should hear real guitar samples instead of synthesis!

4. **Check what's working:**
   - Notes with samples: Real guitar sound 🎸
   - Missing notes: Synthesis fallback 🎹

---

## 🎸 Sample Coverage Explanation

**Why are samples missing?**
- Guitar has 78 total positions (6 strings × 13 frets)
- Most free packs have 30-50 unique notes
- Each note can appear on multiple strings/frets
- The organizer script maps each sample to ALL matching positions
- Missing positions automatically use synthesis fallback

**Example:** The note "E3" appears at:
- String 0, Fret 12
- String 1, Fret 7
- String 2, Fret 2

If you have **one E3.flac** sample, the script copies it to **all three positions**.

---

## 📚 Resources

- **FFmpeg Homepage:** https://ffmpeg.org/
- **Freesound.org:** https://freesound.org/people/allan764/packs/26467/
- **Iowa MIS Guitar:** https://theremin.music.uiowa.edu/MISguitar.html
- **Python 3 (pre-installed on Mac):** Verify with `python3 --version`

---

## 🆘 Still Having Issues?

1. **Check Python version:**
   ```bash
   python3 --version
   # Should be 3.7 or higher
   ```

2. **Check FFmpeg installation:**
   ```bash
   which ffmpeg
   # Should show: /opt/homebrew/bin/ffmpeg (or similar)
   ```

3. **Verify file paths:**
   ```bash
   # Check where samples are
   ls ~/Downloads/26467/
   
   # Check where FretMaster is
   pwd
   ```

4. **Run script with verbose output:**
   ```bash
   python3 -v organize_samples.py ~/Downloads/26467
   ```

If you're still stuck, share the error message and I'll help debug! 🎸
