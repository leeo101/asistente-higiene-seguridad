const fs = require('fs');
const path = require('path');
const dir = './src/components';

const fixes = [
    {
        file: 'ChemicalSafetyPdf.tsx',
        dataVar: 'data',
        footerStartString: '<div style={{ marginTop: \'1.5rem\', fontSize: \'0.6rem\'',
        boxProps: ''
    },
    {
        file: 'EnvironmentalPdf.tsx',
        dataVar: 'data',
        footerStartString: '<div style={{ textAlign: \'center\', marginTop: \'3rem\'',
        boxProps: ''
    }
];

fixes.forEach(fix => {
    const filePath = path.join(dir, fix.file);
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf-8');
    
    const sigStartStr = 'className="signature-container-row"';
    const sigStart = content.indexOf(sigStartStr);
    const footerStart = content.indexOf(fix.footerStartString);
    
    if (sigStart !== -1 && footerStart !== -1) {
        const divStart = content.lastIndexOf('<div', sigStart);
        if (divStart !== -1) {
            const before = content.substring(0, divStart);
            const after = content.substring(footerStart);
            
            let newContent = before + '<PdfSignatures data={' + fix.dataVar + '}\n' + fix.boxProps + ' />\n\n                ' + after;
            
            if (!newContent.includes('import PdfSignatures')) {
                newContent = newContent.replace(/import React(.*?);\n/, 'import React$1;\nimport PdfSignatures from \'./PdfSignatures\';\n');
            }
            
            fs.writeFileSync(filePath, newContent);
            console.log('Fixed', fix.file);
        }
    }
});
