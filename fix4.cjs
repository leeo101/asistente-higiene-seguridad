const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

// For any style={{ something }}, add marginBottom: 0 if it is an input
code = code.replace(/style={{ (paddingLeft[^}]*) }} className="input-professional/g, 'style={{ $1, marginBottom: 0 }} className="input-professional');

// There are a few inputs that didn't have paddingLeft but are still input-professional:
code = code.replace(/className="input-professional mb-0/g, 'style={{ marginBottom: 0 }} className="input-professional');

fs.writeFileSync('src/pages/AuditForm.tsx', code);
