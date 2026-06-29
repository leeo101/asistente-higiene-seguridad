const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

// Replace top-[50%] -translate-y-1/2 with explicit style
code = code.replace(/className="absolute([^"]*)top-\[50%\] -translate-y-1\/2([^"]*)"/g, 'style={{ top: \\'50%\\', transform: \\'translateY(-50%)\\' }} className="absolute$1$2"');

// Also for Reunión de Cierre, I had changed them to top-1/2 -translate-y-1/2
code = code.replace(/className="absolute([^"]*)top-1\/2 -translate-y-1\/2([^"]*)"/g, 'style={{ top: \\'50%\\', transform: \\'translateY(-50%)\\' }} className="absolute$1$2"');

fs.writeFileSync('src/pages/AuditForm.tsx', code);
