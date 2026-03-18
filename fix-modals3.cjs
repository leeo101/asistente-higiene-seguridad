const fs = require('fs');
const path = require('path');

const modules = [
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
    
    // Arreglar overlay: style={{ className: 'modal-fullscreen-overlay' }} -> className: 'modal-fullscreen-overlay'
    content = content.replace(/style:\s*\{\s*className:\s*'modal-fullscreen-overlay'\s*\}/g, "className: 'modal-fullscreen-overlay'");
    
    // Arreglar content: className="card" style={{ width: '100%', maxWidth: ... }} -> className="modal-fullscreen-content"
    content = content.replace(/className="card"\s*style=\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',\s*maxHeight:\s*'[\d.]+vh',\s*overflow:\s*'auto',\s*margin:\s*'auto'\s*\}/g, "className: 'modal-fullscreen-content'");
    
    // También manejar variantes sin maxHeight
    content = content.replace(/className="card"\s*style=\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',\s*margin:\s*'auto'\s*\}/g, "className: 'modal-fullscreen-content'");

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} - Actualizado`);
});

console.log('\n✅ Todos los módulos actualizados');
