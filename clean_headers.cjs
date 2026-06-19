const fs = require('fs');
const glob = require('glob');

const files = glob.sync('src/pages/*.tsx');

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let hasChanges = false;
    
    // The broken prop ends with '/>}' and contains 'undefined}'
    const regex = /\n\s*onBack=\{.*?\? \(\) => \{.*?\} : undefined\}\/>\}/g;
    
    if (regex.test(content)) {
        content = content.replace(regex, ' />}');
        hasChanges = true;
    }
    
    if (hasChanges) {
        fs.writeFileSync(file, content);
        console.log('Cleaned:', file);
    }
});
