const fs = require('fs');
const path = require('path');

function walk(dir, filter, callback) {
    fs.readdirSync(dir).forEach(f => {
        const dirPath = path.join(dir, f);
        const isDirectory = fs.statSync(dirPath).isDirectory();
        if (isDirectory) {
            walk(dirPath, filter, callback);
        } else if (filter.test(dirPath)) {
            callback(dirPath);
        }
    });
}

walk(path.join(__dirname, '../src'), /PdfGenerator\.tsx$/, (filePath) => {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove overflow: 'hidden'
    content = content.replace(/overflow:\s*['"]hidden['"],?/g, '');
    
    // Add className="avoid-break" to pageBreakInside: 'avoid'
    // This is tricky because we don't want to add it if it's already there, and we don't want to add it if it's an outer container.
    // Let's just remove overflow: hidden for now, which is the main cause of the overlapping bug!
    
    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log('Fixed overflow in:', filePath);
    }
});
