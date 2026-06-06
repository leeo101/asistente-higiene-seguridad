const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/**/*.tsx');
let modifications = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  const oldContent = content;
  
  // Use [\s\S]*? to handle the case where onClick contains => which would break [^>]*
  const buttonRegex = /(<button[\s\S]*?btn-back-premium[\s\S]*?>)([\s\S]*?)(<\/button>)/gi;
  
  content = content.replace(buttonRegex, (match, openTag, innerHtml, closeTag) => {
    // Remove "Volver" and any text following it up to the next HTML tag or end of line.
    let newInner = innerHtml.replace(/Volver[ a-zA-ZáéíóúÁÉÍÓÚ]*/gi, '');
    return openTag + newInner + closeTag;
  });

  if (oldContent !== content) {
    fs.writeFileSync(file, content);
    modifications++;
    console.log('Fixed text in ' + file);
  }
}
console.log('Modified ' + modifications + ' files to remove text.');
