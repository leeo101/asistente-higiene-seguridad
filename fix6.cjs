const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

code = code.replace(/style={{ , marginBottom: 0 }} className="input-professional h-\[48px\] text-\[0\.95rem\]"/g, 'style={{ paddingLeft: "2.8rem", marginBottom: 0 }} className="input-professional h-[48px] text-[0.95rem]"');
code = code.replace(/style={{ , marginBottom: 0 }} className="input-professional"/g, 'style={{ paddingLeft: "2.5rem", marginBottom: 0 }} className="input-professional"');

fs.writeFileSync('src/pages/AuditForm.tsx', code);
