const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

// Fix Observaciones textarea specifically
code = code.replace(/<textarea([^>]+)className="input-professional text-\[0\.85rem\] mb-\[0\]"/g, '<textarea$1style={{ padding: \\'0.65rem 0.75rem 0.65rem 2.2rem\\' }} className="input-professional text-[0.85rem] mb-[0]"');

// Re-add padding left to the other classes that were missed or wrongly modified
// I will just explicitly set paddingLeft for all 'pl-[2.2rem]' or 'pl-[2.5rem]' or 'pl-[2.8rem]'
code = code.replace(/className="input-professional([^"]*)"/g, (match, classes) => {
    // We already moved some to style. Let's make sure it's clean.
    return match; // Actually this is risky, let's just use CSS for input-professional to ensure all have padding left if there is an icon
});

fs.writeFileSync('src/pages/AuditForm.tsx', code);
