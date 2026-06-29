const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

// Fix transform issues
code = code.replace(/transform-\[translateY\(-50%\)\]/g, '-translate-y-1/2');

// Fix padding issues for all pl-[...] classes by moving them to style
code = code.replace(/className="([^"]*)pl-\[([0-9\.]+(?:rem|px))\]([^"]*)"/g, (match, p1, p2, p3) => {
    return `style={{ paddingLeft: '${p2}' }} className="${p1.trim()} ${p3.trim()}"`;
});

// Fix bottom button colors
code = code.replace(/bg-\[#0052CC\]/g, 'bg-blue-600');
code = code.replace(/bg-\[#FF8B00\]/g, 'bg-orange-500');
code = code.replace(/bg-\[#36B37E\]/g, 'bg-emerald-500');

fs.writeFileSync('src/pages/AuditForm.tsx', code);
