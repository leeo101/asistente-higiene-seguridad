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
  
  // Find the button block
  const btnRegex = /<button\s+onClick={([^}]+)}\s+className=\"btn-back-premium\"[^>]*>[\s\S]*?<\/button>/;
  const match = content.match(btnRegex);
  
  if (match) {
    const onClickContent = match[1]; // e.g. () => navigate('/#activity')
    
    // Find the last PremiumHeader WITHOUT onBack
    const headerRegex = /(<PremiumHeader(?![\s\S]*?onBack=)[^>]*)(>|\/>)/;
    
    if (!content.match(/<PremiumHeader[^>]*onBack/)) {
      content = content.replace(headerRegex, '$1 onBack={' + onClickContent + '} $3');
      content = content.replace(btnRegex, ''); // Remove the button
      
      fs.writeFileSync(file, content);
      console.log('Fixed ' + file);
    }
  }
}
