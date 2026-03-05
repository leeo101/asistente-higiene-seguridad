const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
    const fullPath = path.join(dir, file);
    let content = fs.readFileSync(fullPath, 'utf8');
    let original = content;

    // DeleteConfirm Replacements
    // Modal bg
    content = content.replace(/background:\s*'#fff'/g, "background: 'var(--color-surface)'");
    // Modal Title color
    content = content.replace(/color:\s*'#0f172a'/g, "color: 'var(--color-text)'");
    // Modal Description color
    content = content.replace(/color:\s*'#64748b'/g, "color: 'var(--color-text-muted)'");
    // Cancel Btn bg
    content = content.replace(/background:\s*'#f1f5f9'/g, "background: 'var(--color-background)'");
    // Cancel Btn color
    content = content.replace(/color:\s*'#475569'/g, "color: 'var(--color-text)'");

    // General History Page fixes
    // Main history container
    content = content.replace(/background:\s*'white'/g, "background: 'var(--color-surface)'");

    // Other hardcoded dark text
    content = content.replace(/color:\s*'#333'/g, "color: 'var(--color-text)'");
    content = content.replace(/color:\s*'#111827'/g, "color: 'var(--color-text)'");

    if (content !== original) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log('Fixed:', file);
    }
});
