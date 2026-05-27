const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
    fs.readdirSync(dir).forEach(f => {
        let dirPath = path.join(dir, f);
        let isDirectory = fs.statSync(dirPath).isDirectory();
        isDirectory ? walkDir(dirPath, callback) : callback(dirPath);
    });
}

let totalReplaced = 0;
walkDir(path.join(__dirname, 'src'), function(filePath) {
    if (filePath.endsWith('.tsx')) {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;
        
        // 1. Fix absolute inline positioning
        if (content.includes("left: '-9999px'")) {
            content = content.replace(/left:\s*'-9999px'/g, "left: 0, opacity: 0.01");
            modified = true;
        }
        
        // 2. Fix fixed inline positioning
        if (content.includes("position: 'fixed'")) {
            if (content.includes("left: '-9999px'")) {
                content = content.replace(/left:\s*'-9999px'/g, "left: 0, opacity: 0.01");
                modified = true;
            }
        }

        // 3. Just replace all left: '-9999px' remaining
        if (content.includes("left: '-9999px'")) {
            content = content.replace(/left:\s*'-9999px'/g, "left: 0, opacity: 0.01");
            modified = true;
        }

        if (modified) {
            fs.writeFileSync(filePath, content);
            totalReplaced++;
        }
    }
});
console.log(`Replaced in ${totalReplaced} files.`);
