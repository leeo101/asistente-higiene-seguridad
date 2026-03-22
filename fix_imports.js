const fs = require('fs');
const path = require('path');

function fixReactImports(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Pattern to find React imports
    const importPattern = /^import\s+React(?:\s*,\s*\{[^}]+\})?\s+from\s+['"]react['"];?\n?/gm;
    const matches = content.match(importPattern);

    if (!matches || matches.length <= 1) {
        return false;
    }

    console.log(`Fixing ${filePath} - found ${matches.length} React imports`);

    const namedImports = new Set();
    const namedPattern = /\{([^}]+)\}/;
    
    matches.forEach(m => {
        const namedMatch = m.match(namedPattern);
        if (namedMatch) {
            namedMatch[1].split(',').forEach(i => namedImports.add(i.trim()));
        }
    });

    let newImport;
    if (namedImports.size > 0) {
        const sortedImports = Array.from(namedImports).sort();
        newImport = `import React, { ${sortedImports.join(', ')} } from 'react';\n`;
    } else {
        newImport = `import React from 'react';\n`;
    }

    const originalLines = content.split('\n');
    let inserted = false;
    const cleanLines = [];

    for (let i = 0; i < originalLines.length; i++) {
        const line = originalLines[i];
        let isMatch = false;
        for (const m of matches) {
            if (m.trim() === line.trim()) {
                isMatch = true;
                break;
            }
        }

        if (isMatch) {
            if (!inserted) {
                cleanLines.push(newImport.trim());
                inserted = true;
            }
        } else {
            cleanLines.push(line);
        }
    }

    fs.writeFileSync(filePath, cleanLines.join('\n'), 'utf8');
    return true;
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== 'dist' && file !== '.git') {
                walkDir(filePath);
            }
        } else if (/\.(jsx|tsx|js|ts)$/.test(file)) {
            fixReactImports(filePath);
        }
    });
}

walkDir('src');
console.log('Finished fixing imports.');
