const fs = require('fs');
const path = require('path');

const files = [
    'NoiseAssessment.jsx',
    'LOTOManager.jsx', 
    'EnvironmentalMonitor.jsx',
    'ConfinedSpace.jsx',
    'WorkingAtHeight.jsx'
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
    
    // Reemplazar overlay style con className
    const overlayPattern = /<div\s+style=\{\{\s*position:\s*'fixed',\s*inset:\s*0,\s*background:\s*'rgba\(0,0,0,0\.7\)',\s*backdropFilter:\s*'blur\(8px\)',\s*zIndex:\s*9999,\s*display:\s*'flex',\s*alignItems:\s*'center',\s*justifyContent:\s*'center',\s*padding:\s*'1\.5rem'\s*\}\}\s+onClick=\{onClose\}>/g;
    if (overlayPattern.test(content)) {
        content = content.replace(overlayPattern, '<div className="modal-fullscreen-overlay" onClick={onClose}>');
        changes++;
        console.log(`  ✅ Overlay actualizado en ${file}`);
    }
    
    // Reemplazar content style con className
    const contentPattern = /<div\s+className="card"\s+style=\{\{\s*width:\s*'100%',\s*maxWidth:\s*'[\d.]+px',\s*(?:maxHeight:\s*'[\d.]+vh',\s*)?overflow:\s*'auto',\s*margin:\s*'auto'\s*\}\}\s+onClick=\{e\s*=>\s*e\.stopPropagation\(\)\}>/g;
    if (contentPattern.test(content)) {
        content = content.replace(contentPattern, '<div className="modal-fullscreen-content" onClick={e => e.stopPropagation()}>');
        changes++;
        console.log(`  ✅ Content actualizado en ${file}`);
    }
    
    if (changes === 0) {
        console.log(`⚠️ ${file} - No se encontraron modales para actualizar (ya usan navegación o tienen estructura diferente)`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\n✅ Proceso completado');
