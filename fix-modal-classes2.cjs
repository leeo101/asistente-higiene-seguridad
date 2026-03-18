const fs = require('fs');
const path = require('path');

const files = [
    'NoiseAssessment.jsx',
    'LOTOManager.jsx', 
    'EnvironmentalMonitor.jsx',
    'ConfinedSpace.jsx',
    'WorkingAtHeight.jsx',
    'CAPAManager.jsx'
];

const srcDir = path.join(__dirname, 'src', 'pages');

files.forEach(file => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file} no encontrado`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;
    
    // Arreglar: style={{ className: 'modal-fullscreen-overlay' }} -> className: 'modal-fullscreen-overlay'
    if (content.includes("style={{ className: 'modal-fullscreen-overlay' }}")) {
        content = content.replace(/style=\{\{\s*className:\s*'modal-fullscreen-overlay'\s*\}\}/g, "className: 'modal-fullscreen-overlay'");
        changes++;
        console.log(`  ✅ Overlay arreglado en ${file}`);
    }
    
    // Arreglar: style={{ className: 'modal-fullscreen-content' }} -> className: 'modal-fullscreen-content'
    if (content.includes("style={{ className: 'modal-fullscreen-content' }}")) {
        content = content.replace(/style=\{\{\s*className:\s*'modal-fullscreen-content'\s*\}\}/g, "className: 'modal-fullscreen-content'");
        changes++;
        console.log(`  ✅ Content arreglado en ${file}`);
    }
    
    // Reemplazar modales con estilo inline antiguo
    const oldOverlay = /<div\s+style=\{\{\s*position:\s*'fixed',\s*inset:\s*0,\s*background:\s*'rgba\(0,0,0,0\.7\)',[^}]*\}\}\s+onClick=\{onClose\}>/g;
    if (oldOverlay.test(content)) {
        content = content.replace(oldOverlay, '<div className="modal-fullscreen-overlay" onClick={onClose}>');
        changes++;
        console.log(`  ✅ Overlay inline reemplazado en ${file}`);
    }
    
    const oldContent = /<div\s+className="card"\s+style=\{\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',[^}]*\}\}\s+onClick=\{e\s*=>\s*e\.stopPropagation\(\)\}>/g;
    if (oldContent.test(content)) {
        content = content.replace(oldContent, '<div className="modal-fullscreen-content" onClick={e => e.stopPropagation()}>');
        changes++;
        console.log(`  ✅ Content inline reemplazado en ${file}`);
    }
    
    if (changes === 0) {
        console.log(`⚠️ ${file} - Sin cambios (ya usa navegación o no tiene modales)`);
    } else {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} actualizado (${changes} cambios)`);
    }
});

console.log('\n✅ Proceso completado');
