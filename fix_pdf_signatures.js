const fs = require('fs');
const path = require('path');
const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx') || f.endsWith('.jsx'));

let changed = 0;
files.forEach(file => {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let original = content;

  // Fix ConfinedSpacePdf crash
  content = content.replace(
    /typeof data\.ventilation === 'object'([\s\S]*?)\? Object\.entries\(data\.ventilation\)/,
    "typeof data.ventilation === 'object' && data.ventilation !== null$1? Object.entries(data.ventilation)"
  );

  // Parent flex container for signatures:
  content = content.replace(
    /display: 'flex', gap: '1rem', paddingBottom: '1rem' \}\}>/g,
    "display: 'flex', gap: '1rem', paddingBottom: '1rem', justifyContent: 'center' }}>"
  );

  // Child signature boxes:
  content = content.replace(
    /flex: 1, border: '1px solid/g,
    "flex: '0 1 32%', border: '1px solid"
  );

  if (content !== original) {
    fs.writeFileSync(p, content);
    changed++;
    console.log('Updated', file);
  }
});
console.log('Total changed files:', changed);
