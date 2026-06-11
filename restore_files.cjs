const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const FILES = ['AuditPage.tsx', 'CAPAPage.tsx', 'ConfinedSpacePage.tsx', 'EnvironmentalPage.tsx'];
const COMMIT = '4f2ec93'; // last known good commit

FILES.forEach(f => {
    const destPath = path.join(__dirname, 'src', 'pages', f);
    // Get the original content from git
    const content = execSync(`git show ${COMMIT}:src/pages/${f}`, { encoding: 'utf8' });
    // Write with explicit UTF-8 no BOM
    fs.writeFileSync(destPath, content, { encoding: 'utf8' });
    console.log('Restored:', f, '(' + content.length + ' bytes)');
});

console.log('Done restoring files from git.');
