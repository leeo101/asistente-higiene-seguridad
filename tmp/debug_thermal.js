const fs = require('fs');
const c = fs.readFileSync('src/pages/ThermalStress.tsx', 'utf8');
const lines = c.split('\n');
// Print lines 343-358 with exact chars
lines.slice(343, 358).forEach((l, i) => {
    const full = l.replace('\r', '\\r');
    console.log((i+344) + ': ' + full);
});
