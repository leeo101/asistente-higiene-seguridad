const fs = require('fs');
const path = require('path');

const modules = [
    'CAPAManager.jsx',
    'ChemicalSafety.jsx',
    'ConfinedSpace.jsx',
    'WorkingAtHeight.jsx',
    'NoiseAssessment.jsx',
    'LOTOManager.jsx',
    'EnvironmentalMonitor.jsx'
];

const srcDir = path.join(__dirname, 'src', 'pages');

modules.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file} no encontrado`);
        return;
    }

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Arreglar: style={{ className: 'modal-fullscreen-overlay' }} -> className: 'modal-fullscreen-overlay'
    const overlayPattern = /style:\s*\{\s*className:\s*'modal-fullscreen-overlay'\s*\}/g;
    if (overlayPattern.test(content)) {
        content = content.replace(overlayPattern, "className: 'modal-fullscreen-overlay'");
        changes++;
        console.log(`✅ ${file} - Overlay arreglado`);
    }

    // Arreglar: style={{ className: 'modal-fullscreen-content' }} -> className: 'modal-fullscreen-content'
    const contentPattern = /style:\s*\{\s*className:\s*'modal-fullscreen-content'\s*\}/g;
    if (contentPattern.test(content)) {
        content = content.replace(contentPattern, "className: 'modal-fullscreen-content'");
        changes++;
        console.log(`✅ ${file} - Content arreglado`);
    }

    if (changes === 0) {
        console.log(`⚠️ ${file} - Sin cambios necesarios`);
    }

    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\n✅ Proceso completado');
