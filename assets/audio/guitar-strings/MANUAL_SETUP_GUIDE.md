# Manual Setup Guide - No Scripts Required! 🎸

**This guide uses drag-and-drop and GUI apps only. No terminal commands needed!**

---

## 📋 What You'll Need

1. ✅ **Your FretMaster project** (onspace-app folder)
2. ✅ **Audacity** (free audio editor) - for converting FLAC to WAV
3. ✅ **Guitar samples** (we'll download together)

**Total time:** 15-20 minutes

---

## Step 1: Download Audacity (Free Audio Converter)

1. Visit: **https://www.audacityteam.org/download/mac/**
2. Click "Download Audacity" (latest version)
3. Open the downloaded DMG file
4. Drag Audacity to your Applications folder
5. Open Audacity (you might need to allow it in System Preferences → Privacy & Security)

**✅ Done when:** Audacity opens successfully

---

## Step 2: Download Guitar Samples

1. Visit: **https://freesound.org/people/allan764/packs/26467/**
2. Click "Join Freesound" (create a free account - takes 1 minute)
3. Log in
4. Click "Download pack" button
5. Save the ZIP file to your Downloads folder
6. **Double-click the ZIP** to extract it

**✅ Done when:** You see a folder with 45 FLAC files

---

## Step 3: Convert FLAC to WAV (Using Audacity)

### Option A: Batch Convert All Files (Recommended)

1. **Open Audacity**
2. Go to **File → Open**
3. Navigate to your extracted sample folder
4. **Select ALL 45 FLAC files** (Cmd + A)
5. Click "Open"
6. Wait for files to load (takes 30-60 seconds)
7. Go to **File → Export → Export Multiple...**
8. Set these options:
   - Export Location: Choose your Downloads folder
   - Format: **WAV (Microsoft)**
   - Sample Rate: **44100 Hz**
9. Click "Export"
10. Click "OK" on each export dialog (or check "Use for all")

**✅ Done when:** You have 45 WAV files in your Downloads folder

### Option B: Use Online Converter (No App Needed)

1. Visit: **https://cloudconvert.com/flac-to-wav**
2. Click "Select Files"
3. Select all 45 FLAC files
4. Click "Convert"
5. Wait for conversion (2-3 minutes)
6. Download all converted WAV files

**✅ Done when:** You have 45 WAV files downloaded

---

## Step 4: Rename Files (Fix Sharp Note Names)

Some files have `#` in the name, which needs to be changed to `s`:

**Find these files and rename them:**

| Original Name | → | New Name |
|---------------|---|----------|
| `D#3.wav` | → | `Ds3.wav` |
| `D#4.wav` | → | `Ds4.wav` |
| `D#5.wav` | → | `Ds5.wav` |
| `F#2.wav` | → | `Fs2.wav` |
| `F#3.wav` | → | `Fs3.wav` |
| `F#4.wav` | → | `Fs4.wav` |
| `F#5.wav` | → | `Fs5.wav` |
| `G#2.wav` | → | `Gs2.wav` |
| `G#3.wav` | → | `Gs3.wav` |
| `G#4.wav` | → | `Gs4.wav` |
| `G#5.wav` | → | `Gs5.wav` |
| `A#2.wav` | → | `As2.wav` |
| `A#3.wav` | → | `As3.wav` |
| `A#4.wav` | → | `As4.wav` |
| `A#5.wav` | → | `As5.wav` |
| `C#3.wav` | → | `Cs3.wav` |
| `C#4.wav` | → | `Cs4.wav` |
| `C#5.wav` | → | `Cs5.wav` |

**How to rename on Mac:**
1. Find the file in Finder
2. Click once on the filename
3. Change `#` to `s`
4. Press Enter

**✅ Done when:** All `#` symbols are replaced with `s`

---

## Step 5: Organize Files into String Folders

Open **two Finder windows side-by-side:**
- **Left window:** Your WAV files (Downloads)
- **Right window:** `onspace-app/assets/audio/guitar-strings/`

Now **drag-and-drop** files according to this chart:

### STRING 0 FOLDER (Low E String)

Drag these files into `string0/`:
- `E2.wav`
- `F2.wav`
- `Fs2.wav`
- `G2.wav`
- `Gs2.wav`
- `A2.wav`
- `As2.wav`
- `B2.wav`
- `C3.wav`
- `Cs3.wav`
- `D3.wav`
- `Ds3.wav`
- `E3.wav`

### STRING 1 FOLDER (A String)

Drag these files into `string1/`:
- `A2.wav` *(copy from Downloads again)*
- `As2.wav` *(copy again)*
- `B2.wav` *(copy again)*
- `C3.wav` *(copy again)*
- `Cs3.wav` *(copy again)*
- `D3.wav` *(copy again)*
- `Ds3.wav` *(copy again)*
- `E3.wav` *(copy again)*
- `F3.wav`
- `Fs3.wav`
- `G3.wav`
- `Gs3.wav`
- `A3.wav`

### STRING 2 FOLDER (D String)

Drag these files into `string2/`:
- `D3.wav` *(copy again)*
- `Ds3.wav` *(copy again)*
- `E3.wav` *(copy again)*
- `F3.wav` *(copy again)*
- `Fs3.wav` *(copy again)*
- `G3.wav` *(copy again)*
- `Gs3.wav` *(copy again)*
- `A3.wav` *(copy again)*
- `As3.wav`
- `B3.wav`
- `C4.wav`
- `Cs4.wav`
- `D4.wav`

### STRING 3 FOLDER (G String)

Drag these files into `string3/`:
- `G3.wav` *(copy again)*
- `Gs3.wav` *(copy again)*
- `A3.wav` *(copy again)*
- `As3.wav` *(copy again)*
- `B3.wav` *(copy again)*
- `C4.wav` *(copy again)*
- `Cs4.wav` *(copy again)*
- `D4.wav` *(copy again)*
- `Ds4.wav`
- `E4.wav`
- `F4.wav`
- `Fs4.wav`
- `G4.wav`

### STRING 4 FOLDER (B String)

Drag these files into `string4/`:
- `B3.wav` *(copy again)*
- `C4.wav` *(copy again)*
- `Cs4.wav` *(copy again)*
- `D4.wav` *(copy again)*
- `Ds4.wav` *(copy again)*
- `E4.wav` *(copy again)*
- `F4.wav` *(copy again)*
- `Fs4.wav` *(copy again)*
- `G4.wav` *(copy again)*
- `Gs4.wav`
- `A4.wav`
- `As4.wav`
- `B4.wav`

### STRING 5 FOLDER (High E String)

Drag these files into `string5/`:
- `E4.wav` *(copy again)*
- `F4.wav` *(copy again)*
- `Fs4.wav` *(copy again)*
- `G4.wav` *(copy again)*
- `Gs4.wav` *(copy again)*
- `A4.wav` *(copy again)*
- `As4.wav` *(copy again)*
- `B4.wav` *(copy again)*
- `C5.wav`
- `Cs5.wav`
- `D5.wav`
- `Ds5.wav`
- `E5.wav`

**✅ Done when:** All string folders have WAV files

---

## Step 6: Verify Installation

Open each string folder and count the files:

- `string0/` should have **13 files**
- `string1/` should have **13 files**
- `string2/` should have **13 files**
- `string3/` should have **13 files**
- `string4/` should have **13 files**
- `string5/` should have **13 files**

**Total:** 78 files

**To check missing samples:**
- If a folder has fewer than 13 files, those positions will use synthesis
- That's perfectly fine! The app will automatically fall back to synthesis

**✅ Done when:** You have at least 30+ total WAV files across all folders

---

## Step 7: Activate Samples in Your App

1. Open your FretMaster project in your code editor
2. Find the file: `services/strummingAudioService.ts`
3. Look for the `SAMPLE_MAP` object (it's currently commented out)
4. **Uncomment it** by removing the `/*` at the start and `*/` at the end
5. Save the file

---

## ✅ Test Your Samples!

1. Run your FretMaster app
2. Go to the Practice tab
3. Play a C major chord
4. **You should hear real guitar samples!** 🎸

---

## 🎯 Expected Results

With 45 Freesound samples, you'll get:
- ✅ **Real guitar sound** for most common notes
- 🎹 **Synthesis fallback** for missing positions (seamless)
- ✅ **Mixed playback** (some strings real, some synthetic - this is normal!)

---

## 🆘 Troubleshooting

### Can't find my onspace-app folder

1. Open Finder
2. Press `Cmd + F` (search)
3. Type "onspace-app"
4. Look for a folder with `assets/audio/` inside

### Files won't copy to string folders

- Make sure you're **copying** (Cmd + C → Cmd + V), not moving
- Each string needs its own copy of shared notes

### Too many files to track!

**Simplified approach:**
1. Just copy ALL 45 WAV files into `string0/`
2. Then copy ALL 45 WAV files into `string1/`, `string2/`, etc.
3. Delete files that don't belong (the app will ignore extras)

**Files each string needs:**
- String 0: E2 through E3
- String 1: A2 through A3
- String 2: D3 through D4
- String 3: G3 through G4
- String 4: B3 through B4
- String 5: E4 through E5

---

## 🎉 You're Done!

Once you've copied the files and uncommented `SAMPLE_MAP`, your app will use real guitar samples!

**Questions?** Let me know which step you're on and I'll help! 🎸
