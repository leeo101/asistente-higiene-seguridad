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
                const hasNavAction = /navigate|ArrowLeft/.test(match);
                const hasBackWord = /volver|inicio|volver atrás|volver al historial/i.test(match);
                
                if (hasNavAction && hasBackWord) {
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
