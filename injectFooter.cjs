const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

const findFiles = (dir, ext, fileList = []) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            findFiles(fullPath, ext, fileList);
        } else if (fullPath.endsWith(ext)) {
            fileList.push(fullPath);
        }
    }
    return fileList;
};

const tsxFiles = findFiles(srcDir, '.tsx');

let modifiedCount = 0;

for (const file of tsxFiles) {
    if (file.includes('PdfBrandingFooter.tsx')) continue;

    let content = fs.readFileSync(file, 'utf8');

    // If file has PdfSignatures but no PdfBrandingFooter
    if (content.includes('PdfSignatures') && !content.includes('PdfBrandingFooter')) {
        
        // Find if there's a PdfSignatures component used in the render
        if (content.match(/<PdfSignatures[^>]*\/>/)) {
            
            // Add import if needed
            let importPath = '';
            if (file.includes('src\\components\\') || file.includes('src/components/')) {
                importPath = `import PdfBrandingFooter from './PdfBrandingFooter';\n`;
            } else if (file.includes('src\\pages\\') || file.includes('src/pages/')) {
                importPath = `import PdfBrandingFooter from '../components/PdfBrandingFooter';\n`;
            }

            // Insert import after the last import statement
            if (importPath) {
                const lastImportIndex = content.lastIndexOf('import ');
                if (lastImportIndex !== -1) {
                    const endOfLastImport = content.indexOf('\n', lastImportIndex);
                    content = content.slice(0, endOfLastImport + 1) + importPath + content.slice(endOfLastImport + 1);
                } else {
                    content = importPath + content;
                }
            }

            // Insert <PdfBrandingFooter /> right after <PdfSignatures ... />
            content = content.replace(/(<PdfSignatures[^>]*\/>)/g, '$1\n            <PdfBrandingFooter />');

            fs.writeFileSync(file, content, 'utf8');
            console.log('Updated', file);
            modifiedCount++;
        }
    }
}

console.log(`Modified ${modifiedCount} files.`);
