const fs = require('fs');
const path = require('path');

function processDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let original = content;

            // Match each button independently
            content = content.replace(/<button[\s\S]*?<\/button>/gi, (match) => {
                // If it's a navigation button back or a visual back button
                if ((match.includes('navigate') || match.includes('ArrowLeft')) && 
                    (match.includes('Volver') || match.includes('VOLVER') || match.includes('Inicio'))) {
                    return '<></>';
                }
                return match;
            });

            if (content !== original) {
                fs.writeFileSync(fullPath, content);
                console.log('Modificado:', fullPath);
            }
        }
    }
}

processDir('./src/pages');
processDir('./src/components');
