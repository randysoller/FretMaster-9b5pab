# Quick File Organization Guide 🎸

## Step 1: Rename Files First

**Replace `#` with `s` in these filenames:**

| Old Name | → | New Name |
|----------|---|----------|
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

---

## Step 2: Copy Files to Folders

### 📁 string0/ (Low E String - E2 to E3)
Copy these 13 files:
```
E2.wav, F2.wav, Fs2.wav, G2.wav, Gs2.wav, A2.wav, As2.wav, 
B2.wav, C3.wav, Cs3.wav, D3.wav, Ds3.wav, E3.wav
```

### 📁 string1/ (A String - A2 to A3)
Copy these 13 files:
```
A2.wav, As2.wav, B2.wav, C3.wav, Cs3.wav, D3.wav, Ds3.wav, 
E3.wav, F3.wav, Fs3.wav, G3.wav, Gs3.wav, A3.wav
```

### 📁 string2/ (D String - D3 to D4)
Copy these 13 files:
```
D3.wav, Ds3.wav, E3.wav, F3.wav, Fs3.wav, G3.wav, Gs3.wav, 
A3.wav, As3.wav, B3.wav, C4.wav, Cs4.wav, D4.wav
```

### 📁 string3/ (G String - G3 to G4)
Copy these 13 files:
```
G3.wav, Gs3.wav, A3.wav, As3.wav, B3.wav, C4.wav, Cs4.wav, 
D4.wav, Ds4.wav, E4.wav, F4.wav, Fs4.wav, G4.wav
```

### 📁 string4/ (B String - B3 to B4)
Copy these 13 files:
```
B3.wav, C4.wav, Cs4.wav, D4.wav, Ds4.wav, E4.wav, F4.wav, 
Fs4.wav, G4.wav, Gs4.wav, A4.wav, As4.wav, B4.wav
```

### 📁 string5/ (High E String - E4 to E5)
Copy these 13 files:
```
E4.wav, F4.wav, Fs4.wav, G4.wav, Gs4.wav, A4.wav, As4.wav, 
B4.wav, C5.wav, Cs5.wav, D5.wav, Ds5.wav, E5.wav
```

---

## ✅ Verification

**Total files needed:** 78 (13 per string × 6 strings)

**You have 45 samples,** so many files will be used in multiple folders.

**Example:** `A2.wav` goes in both:
- `string0/A2.wav` (fret 5 on low E string)
- `string1/A2.wav` (open A string)

**This is correct!** Copy the same file to both locations.

---

## 🎯 Simple Method (Copy All Files to All Folders)

**Too complicated?** Try this easier way:

1. Copy ALL 45 WAV files into `string0/`
2. Copy ALL 45 WAV files into `string1/`
3. Copy ALL 45 WAV files into `string2/`
4. Copy ALL 45 WAV files into `string3/`
5. Copy ALL 45 WAV files into `string4/`
6. Copy ALL 45 WAV files into `string5/`

**What happens:**
- ✅ The app will only load the files it needs
- ❌ Wastes ~20MB disk space (but much easier!)
- ✅ No risk of missing files

---

## 🚀 Final Step

After organizing files, go to `services/strummingAudioService.ts`:
- Find line ~164: `return null;`
- **Delete that line**
- **Uncomment the SAMPLE_MAP block** below it

Then restart your app:
```bash
npx expo start --clear
```

🎸 **Done!**
