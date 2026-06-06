const fs = require('fs');

function fixSyntax(filePath, badString, correctString) {
  let content = fs.readFileSync(filePath, 'utf8');
  if (content.includes(badString)) {
    content = content.replace(badString, correctString);
    fs.writeFileSync(filePath, content);
    console.log('Fixed ' + filePath);
  }
}

fixSyntax('src/pages/AICameraManager.tsx', 'icon={<Camera size={36} / onBack={() => navigate(\'/#tools\')} $3}', 'icon={<Camera size={36} />} onBack={() => navigate(\'/#tools\')}');
fixSyntax('src/pages/AIGeneralCameraManager.tsx', 'icon={<ShieldAlert size={36} / onBack={() => navigate(\'/#tools\')} $3}', 'icon={<ShieldAlert size={36} />} onBack={() => navigate(\'/#tools\')}');
fixSyntax('src/pages/ChemicalSafety.tsx', 'icon={<FlaskConical size={36} / onBack={() => navigate(-1)} $3}', 'icon={<FlaskConical size={36} />} onBack={() => navigate(-1)}');
fixSyntax('src/pages/EvacuationSimulatorHistory.tsx', 'icon={<Timer size={36} / onBack={() => navigate(\'/#activity\')} $3}', 'icon={<Timer size={36} />} onBack={() => navigate(\'/#activity\')}');
fixSyntax('src/pages/LightingReport.tsx', 'icon={<Lightbulb size={32} color=\"#ffffff\" / onBack={() => setIsFormVisible(false)} $3}', 'icon={<Lightbulb size={32} color=\"#ffffff\" />} onBack={() => setIsFormVisible(false)}');
fixSyntax('src/pages/WorkingAtHeight.tsx', 'icon={<HardHat size={36} / onBack={() => navigate(\'/#activity\')} $3}', 'icon={<HardHat size={36} />} onBack={() => navigate(\'/#activity\')}');

let drillsContent = fs.readFileSync('src/pages/DrillsForm.tsx', 'utf8');
if (drillsContent.includes('icon={<Siren size={36} />\\n                    onBack={() => navigate(\'/drills\')}')) {
    // DrillsForm looks fine now or needs adjustment, let's just leave it for now unless tsc fails.
}
