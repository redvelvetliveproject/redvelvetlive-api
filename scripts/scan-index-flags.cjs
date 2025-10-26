// scripts/scan-index-flags.js
const fs = require('fs');
const path = require('path');

const MODEL_DIR = path.join(__dirname, '../backend/src/models');

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  return lines
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => line.includes('index: true'));
}

function scanDirectory(dirPath) {
  const results = [];

  const files = fs.readdirSync(dirPath);
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isFile() && file.endsWith('.js')) {
      const matches = scanFile(fullPath);
      if (matches.length > 0) {
        results.push({ file, matches });
      }
    }
  }

  return results;
}

const findings = scanDirectory(MODEL_DIR);

if (findings.length === 0) {
  console.log('✅ No se encontraron usos de `index: true` en los modelos.');
} else {
  console.log('⚠️  Se encontraron usos de `index: true` en los siguientes archivos:\n');
  findings.forEach(({ file, matches }) => {
    console.log(`📄 ${file}`);
    matches.forEach(({ line, index }) => {
      console.log(`   Línea ${index + 1}: ${line.trim()}`);
    });
    console.log('');
  });
}
