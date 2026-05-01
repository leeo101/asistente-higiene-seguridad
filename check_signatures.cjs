const fs = require('fs');
const path = require('path');
const dir = 'src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Pdf'));
let found = false;
files.forEach(f => {
  const c = fs.readFileSync(path.join(dir, f), 'utf-8');
  if (c.includes('Firma') && !c.includes("flex: '0 1 32%'") && !c.includes('flex: "0 1 32%"')) {
    console.log(f);
    found = true;
  }
});
if (!found) console.log("All Pdf files use flex: '0 1 32%'");
