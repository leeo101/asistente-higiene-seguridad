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
    let changes = 0;

    // Reemplazar overlay de modal con className full-screen
    const overlayPattern = /position: 'fixed',\s*inset:\s*0,\s*background:\s*'rgba\(0,0,0,0\.7\)',\s*backdropFilter:\s*'blur\(8px\)',\s*zIndex:\s*9999,\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*padding:\s*'1\.5rem'/g;
    if (overlayPattern.test(content)) {
        content = content.replace(overlayPattern, "className: 'modal-fullscreen-overlay'");
        changes++;
    }

    // Reemplazar contenido del modal
    const contentPattern = /className: 'card',\s*style:\s*\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',\s*maxHeight:\s*'[\d.]+vh',\s*overflow:\s*'auto',\s*margin:\s*'auto'\s*\}/g;
    if (contentPattern.test(content)) {
        content = content.replace(contentPattern, "className: 'modal-fullscreen-content'");
        changes++;
    }

    // También manejar variantes con maxWidth 800px, 700px, 600px, etc.
    const contentPattern2 = /className: 'card',\s*style:\s*\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',\s*margin:\s*'auto'\s*\}/g;
    if (contentPattern2.test(content)) {
        content = content.replace(contentPattern2, "className: 'modal-fullscreen-content'");
        changes++;
    }

    // Agregar onClick={e => e.stopPropagation()} si no existe
    if (!content.includes("onClick={e => e.stopPropagation()}")) {
        content = content.replace(/className: 'modal-fullscreen-content'/g, "className: 'modal-fullscreen-content' onClick={e => e.stopPropagation()}");
    }

    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`${changes > 0 ? '✅' : '⚠️'} ${file} - ${changes} cambios`);
});

console.log('\n✅ Proceso completado');
