const fs = require('fs');
let code = fs.readFileSync('src/pages/AuditForm.tsx', 'utf8');

// Fix signature wrapping
code = code.replace(/className="flex items-center gap-2 cursor-pointer select-none p-\[0\.55rem_1\.1rem\] rounded-\[var\(--radius-full\)\] font-\[750\] text-\[0\.8rem\] transition-\[all_0\.2s_ease\]"/g, 
'className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease] whitespace-nowrap"');

// Fix hidden checkbox
code = code.replace(/className="none" \/>/g, 'className="hidden" />');

// Fix Compartir button
code = code.replace(/className="btn-floating-action bg-blue-600 text-\[#ffffff\]"/g, 'style={{ backgroundColor: "#0052CC", color: "#ffffff" }} className="btn-floating-action"');

// Fix Imprimir button
code = code.replace(/className="btn-floating-action bg-orange-500 text-\[#ffffff\]"/g, 'style={{ backgroundColor: "#FF8B00", color: "#ffffff" }} className="btn-floating-action"');

// Fix Guardar button
code = code.replace(/className="btn-floating-action bg-emerald-500 text-\[#ffffff\]"/g, 'style={{ backgroundColor: "#36B37E", color: "#ffffff" }} className="btn-floating-action"');

fs.writeFileSync('src/pages/AuditForm.tsx', code);
