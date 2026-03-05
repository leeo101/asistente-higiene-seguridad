const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const compDir = path.join(__dirname, 'src', 'components');

const dirs = [pagesDir, compDir];

const hexToVar = {
    // Backgrounds
    "'#fff'": "'var(--color-surface)'",
    "'#ffffff'": "'var(--color-surface)'",
    "'#F4F5F7'": "'var(--color-background)'",
    "'#f1f5f9'": "'var(--color-background)'",
    "'#f8fafc'": "'var(--color-background)'",
    // Text Primary
    "'#172B4D'": "'var(--color-text)'",
    "'#0f172a'": "'var(--color-text)'",
    "'#333'": "'var(--color-text)'",
    "'#000'": "'var(--color-text)'",
    "'black'": "'var(--color-text)'",
    // Text Muted
    "'#6B778C'": "'var(--color-text-muted)'",
    "'#64748b'": "'var(--color-text-muted)'",
    "'#475569'": "'var(--color-text-muted)'",
    "'#42526E'": "'var(--color-text)'",
    "'#94a3b8'": "'var(--color-text-muted)'"
};

dirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

    files.forEach(file => {
        // Exclude specific print-only reports that MUST have white backgrounds
        if (file.includes('Report') || file === 'SignatureStamp.jsx' || file === 'QRModal.jsx') {
            return;
        }

        const fullPath = path.join(dir, file);
        let content = fs.readFileSync(fullPath, 'utf8');
        let original = content;

        for (const [hex, cssVar] of Object.entries(hexToVar)) {
            // we use a regex with global flag and case insensitivity
            const regex = new RegExp(hex.replace(/'/g, "['\"]"), 'gi');
            content = content.replace(regex, cssVar);
        }

        // Special case: `background: 'white'` -> `background: 'var(--color-surface)'`
        // We only want to replace literal 'white' or "white" in styling objects.
        content = content.replace(/background:\s*['"]white['"]/g, "background: 'var(--color-surface)'");
        content = content.replace(/color:\s*['"]white['"]/g, "color: '#ffffff'"); // actual white text for colored buttons should stay real white

        // Let's protect gradient text or colored buttons that explicitly need real white text.
        // Actually it's better to just leave `color: 'white'` alone, as it usually means a primary button text.
        // I will revert the previous line replace if it broke standard buttons using `color: 'white'`.
        // Let's re-read the original to do it properly.

        if (content !== original) {
            fs.writeFileSync(fullPath, content, 'utf8');
            console.log('Fixed styles in:', file);
        }
    });
});
