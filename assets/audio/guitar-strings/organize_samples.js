#!/usr/bin/env node
/**
 * Guitar Sample Organizer (Node.js version)
 * Automatically organizes downloaded FreePats samples into string/fret structure
 */

const fs = require('fs');
const path = require('path');

// Complete mapping of string -> fret -> note name
const SAMPLE_MAP = {
  0: {  // String 0: Low E (E2)
    0: 'E2', 1: 'F2', 2: 'Fs2', 3: 'G2', 4: 'Gs2', 5: 'A2',
    6: 'As2', 7: 'B2', 8: 'C3', 9: 'Cs3', 10: 'D3', 11: 'Ds3', 12: 'E3'
  },
  1: {  // String 1: A (A2)
    0: 'A2', 1: 'As2', 2: 'B2', 3: 'C3', 4: 'Cs3', 5: 'D3',
    6: 'Ds3', 7: 'E3', 8: 'F3', 9: 'Fs3', 10: 'G3', 11: 'Gs3', 12: 'A3'
  },
  2: {  // String 2: D (D3)
    0: 'D3', 1: 'Ds3', 2: 'E3', 3: 'F3', 4: 'Fs3', 5: 'G3',
    6: 'Gs3', 7: 'A3', 8: 'As3', 9: 'B3', 10: 'C4', 11: 'Cs4', 12: 'D4'
  },
  3: {  // String 3: G (G3)
    0: 'G3', 1: 'Gs3', 2: 'A3', 3: 'As3', 4: 'B3', 5: 'C4',
    6: 'Cs4', 7: 'D4', 8: 'Ds4', 9: 'E4', 10: 'F4', 11: 'Fs4', 12: 'G4'
  },
  4: {  // String 4: B (B3)
    0: 'B3', 1: 'C4', 2: 'Cs4', 3: 'D4', 4: 'Ds4', 5: 'E4',
    6: 'F4', 7: 'Fs4', 8: 'G4', 9: 'Gs4', 10: 'A4', 11: 'As4', 12: 'B4'
  },
  5: {  // String 5: High E (E4)
    0: 'E4', 1: 'F4', 2: 'Fs4', 3: 'G4', 4: 'Gs4', 5: 'A4',
    6: 'As4', 7: 'B4', 8: 'C5', 9: 'Cs5', 10: 'D5', 11: 'Ds5', 12: 'E5'
  }
};

function organizeSamples(sourceDir, destDir = '.') {
  /**
   * Organize downloaded guitar samples into string folders
   */
  
  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Error: Source directory '${sourceDir}' not found!`);
    return;
  }
  
  console.log('🎸 Guitar Sample Organizer');
  console.log(`📂 Source: ${path.resolve(sourceDir)}`);
  console.log(`📂 Destination: ${path.resolve(destDir)}`);
  console.log();
  
  // Create string folders
  for (let stringNum = 0; stringNum < 6; stringNum++) {
    const stringDir = path.join(destDir, `string${stringNum}`);
    if (!fs.existsSync(stringDir)) {
      fs.mkdirSync(stringDir, { recursive: true });
    }
    console.log(`✅ Created: ${stringDir}`);
  }
  
  console.log();
  
  // Find all WAV files in source directory
  let wavFiles = [];
  try {
    const files = fs.readdirSync(sourceDir);
    wavFiles = files.filter(f => 
      f.toLowerCase().endsWith('.wav')
    );
  } catch (err) {
    console.error('❌ Error reading source directory:', err.message);
    return;
  }
  
  if (wavFiles.length === 0) {
    console.warn('⚠️  No WAV files found in source directory!');
    console.warn('   Make sure you\'ve extracted the FreePats samples first.');
    return;
  }
  
  console.log(`Found ${wavFiles.length} WAV files`);
  console.log();
  
  // Organize samples
  let organizedCount = 0;
  const missingSamples = [];
  
  for (const [stringNum, fretMap] of Object.entries(SAMPLE_MAP)) {
    console.log(`Processing String ${stringNum}...`);
    
    for (const [fret, noteName] of Object.entries(fretMap)) {
      // Try to find matching WAV file
      const possibleNames = [
        `${noteName}.wav`,
        `${noteName}.WAV`,
        `${noteName.replace('s', '#')}.wav`,  // Fs -> F#
        `${noteName.replace('s', '#')}.WAV`,
      ];
      
      let sourceFile = null;
      for (const name of possibleNames) {
        const potentialFile = path.join(sourceDir, name);
        if (fs.existsSync(potentialFile)) {
          sourceFile = potentialFile;
          break;
        }
      }
      
      if (sourceFile) {
        // Copy to destination
        const destFile = path.join(destDir, `string${stringNum}`, `${noteName}.wav`);
        fs.copyFileSync(sourceFile, destFile);
        console.log(`  ✓ Fret ${fret.padStart(2)}: ${noteName.padEnd(4)} → ${path.basename(destFile)}`);
        organizedCount++;
      } else {
        console.log(`  ✗ Fret ${fret.padStart(2)}: ${noteName.padEnd(4)} - NOT FOUND`);
        missingSamples.push(`String ${stringNum}, Fret ${fret}: ${noteName}`);
      }
    }
    
    console.log();
  }
  
  // Summary
  console.log('='.repeat(60));
  console.log(`✅ Successfully organized: ${organizedCount}/78 samples`);
  
  if (missingSamples.length > 0) {
    console.log(`⚠️  Missing samples: ${missingSamples.length}`);
    console.log('\nMissing:');
    missingSamples.forEach(sample => {
      console.log(`  - ${sample}`);
    });
    console.log('\n💡 Tip: Check if FreePats uses different note naming');
    console.log('   (e.g., F# vs Fs, Gb vs Fs)');
  } else {
    console.log('🎉 All samples organized successfully!');
    console.log('\n✅ Next step: Update strummingAudioService.ts');
    console.log('   Uncomment the SAMPLE_MAP to enable real guitar samples!');
  }
  
  console.log('='.repeat(60));
}

// Main execution
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 1) {
    console.log('Usage: node organize_samples.js <source_directory>');
    console.log('\nExample:');
    console.log('  node organize_samples.js ~/Downloads/freepats-guitar/samples');
    console.log('\nThis script will:');
    console.log('  1. Find all WAV files in the source directory');
    console.log('  2. Organize them into string0/ through string5/ folders');
    console.log('  3. Rename them according to the naming convention');
    process.exit(1);
  }
  
  const sourceDir = args[0];
  organizeSamples(sourceDir);
}

module.exports = { organizeSamples };
