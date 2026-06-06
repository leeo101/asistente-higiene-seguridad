const fs = require('fs');
const files = [
  'src/pages/WorkingAtHeight.tsx',
  'src/pages/LightingReport.tsx',
  'src/pages/EvacuationSimulatorHistory.tsx',
  'src/pages/DrillsForm.tsx',
  'src/pages/ChemicalSafety.tsx',
  'src/pages/AIGeneralCameraManager.tsx',
  'src/pages/AICameraManager.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  const lines = content.split('\n');
  lines.forEach((line, i) => {
    if (line.includes('$3')) {
      console.log(file + ' line ' + (i+1) + ': ' + line.trim());
    }
  });
}
