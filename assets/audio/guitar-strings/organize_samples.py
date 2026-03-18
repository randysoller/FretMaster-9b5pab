#!/usr/bin/env python3
"""
Guitar Sample Organizer
Automatically organizes downloaded FreePats samples into string/fret structure
"""

import os
import shutil
from pathlib import Path

# Complete mapping of string -> fret -> note name
SAMPLE_MAP = {
    0: {  # String 0: Low E (E2)
        0: 'E2', 1: 'F2', 2: 'Fs2', 3: 'G2', 4: 'Gs2', 5: 'A2',
        6: 'As2', 7: 'B2', 8: 'C3', 9: 'Cs3', 10: 'D3', 11: 'Ds3', 12: 'E3'
    },
    1: {  # String 1: A (A2)
        0: 'A2', 1: 'As2', 2: 'B2', 3: 'C3', 4: 'Cs3', 5: 'D3',
        6: 'Ds3', 7: 'E3', 8: 'F3', 9: 'Fs3', 10: 'G3', 11: 'Gs3', 12: 'A3'
    },
    2: {  # String 2: D (D3)
        0: 'D3', 1: 'Ds3', 2: 'E3', 3: 'F3', 4: 'Fs3', 5: 'G3',
        6: 'Gs3', 7: 'A3', 8: 'As3', 9: 'B3', 10: 'C4', 11: 'Cs4', 12: 'D4'
    },
    3: {  # String 3: G (G3)
        0: 'G3', 1: 'Gs3', 2: 'A3', 3: 'As3', 4: 'B3', 5: 'C4',
        6: 'Cs4', 7: 'D4', 8: 'Ds4', 9: 'E4', 10: 'F4', 11: 'Fs4', 12: 'G4'
    },
    4: {  # String 4: B (B3)
        0: 'B3', 1: 'C4', 2: 'Cs4', 3: 'D4', 4: 'Ds4', 5: 'E4',
        6: 'F4', 7: 'Fs4', 8: 'G4', 9: 'Gs4', 10: 'A4', 11: 'As4', 12: 'B4'
    },
    5: {  # String 5: High E (E4)
        0: 'E4', 1: 'F4', 2: 'Fs4', 3: 'G4', 4: 'Gs4', 5: 'A4',
        6: 'As4', 7: 'B4', 8: 'C5', 9: 'Cs5', 10: 'D5', 11: 'Ds5', 12: 'E5'
    }
}

def organize_samples(source_dir: str, dest_dir: str = '.'):
    """
    Organize downloaded guitar samples into string folders
    
    Args:
        source_dir: Directory containing downloaded WAV files
        dest_dir: Destination directory (defaults to current directory)
    """
    source_path = Path(source_dir)
    dest_path = Path(dest_dir)
    
    if not source_path.exists():
        print(f"❌ Error: Source directory '{source_dir}' not found!")
        return
    
    print("🎸 Guitar Sample Organizer")
    print(f"📂 Source: {source_path.absolute()}")
    print(f"📂 Destination: {dest_path.absolute()}")
    print()
    
    # Create string folders
    for string_num in range(6):
        string_dir = dest_path / f'string{string_num}'
        string_dir.mkdir(exist_ok=True)
        print(f"✅ Created: {string_dir}")
    
    print()
    
    # Find all WAV files in source directory
    wav_files = list(source_path.glob('*.wav')) + list(source_path.glob('*.WAV'))
    
    if not wav_files:
        print("⚠️  No WAV files found in source directory!")
        print("   Make sure you've extracted the FreePats samples first.")
        return
    
    print(f"Found {len(wav_files)} WAV files")
    print()
    
    # Organize samples
    organized_count = 0
    missing_samples = []
    
    for string_num, fret_map in SAMPLE_MAP.items():
        print(f"Processing String {string_num}...")
        
        for fret, note_name in fret_map.items():
            # Try to find matching WAV file
            # FreePats might use different naming: F# vs Fs, etc.
            possible_names = [
                f"{note_name}.wav",
                f"{note_name}.WAV",
                note_name.replace('s', '#') + '.wav',  # Fs -> F#
                note_name.replace('s', '#') + '.WAV',
            ]
            
            source_file = None
            for name in possible_names:
                potential_file = source_path / name
                if potential_file.exists():
                    source_file = potential_file
                    break
            
            if source_file:
                # Copy to destination
                dest_file = dest_path / f'string{string_num}' / f'{note_name}.wav'
                shutil.copy2(source_file, dest_file)
                print(f"  ✓ Fret {fret:2d}: {note_name:4s} → {dest_file.name}")
                organized_count += 1
            else:
                print(f"  ✗ Fret {fret:2d}: {note_name:4s} - NOT FOUND")
                missing_samples.append(f"String {string_num}, Fret {fret}: {note_name}")
        
        print()
    
    # Summary
    print("=" * 60)
    print(f"✅ Successfully organized: {organized_count}/78 samples")
    
    if missing_samples:
        print(f"⚠️  Missing samples: {len(missing_samples)}")
        print("\nMissing:")
        for sample in missing_samples:
            print(f"  - {sample}")
        print("\n💡 Tip: Check if FreePats uses different note naming")
        print("   (e.g., F# vs Fs, Gb vs Fs)")
    else:
        print("🎉 All samples organized successfully!")
        print("\n✅ Next step: Update strummingAudioService.ts")
        print("   Uncomment the SAMPLE_MAP to enable real guitar samples!")
    
    print("=" * 60)


def main():
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python organize_samples.py <source_directory>")
        print("\nExample:")
        print("  python organize_samples.py ~/Downloads/freepats-guitar/samples")
        print("\nThis script will:")
        print("  1. Find all WAV files in the source directory")
        print("  2. Organize them into string0/ through string5/ folders")
        print("  3. Rename them according to the naming convention")
        return
    
    source_dir = sys.argv[1]
    organize_samples(source_dir)


if __name__ == '__main__':
    main()
