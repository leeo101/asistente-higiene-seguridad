const fs = require('fs');
const path = require('path');
const dir = './src/components';
const files = fs.readdirSync(dir).filter(f => f.includes('Pdf') && (f.endsWith('.tsx') || f.endsWith('.jsx')));
let replacedCount = 0;
files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf-8');
    if (f === 'ATSPdfGenerator.tsx') return; 
    
    if (!content.includes('className="signature-container-row"')) return;
    
    let dataVar = 'data';
    if (content.match(/const finalData\s*=\s*(.*?);/)) dataVar = 'finalData';
    if (content.match(/const report\s*=\s*(.*?);/)) dataVar = 'report';
    if (content.match(/const reportData\s*=\s*(.*?);/)) dataVar = 'reportData';
    if (f === 'ChecklistPdfGenerator.tsx') dataVar = 'fullData';
    if (f === 'ProfessionalReportPdfGenerator.tsx') dataVar = 'reportData';
    
    const sigStart = content.indexOf('className="signature-container-row"');
    const footerStart = content.indexOf('<PdfBrandingFooter');
    
    if (sigStart !== -1 && footerStart !== -1 && sigStart < footerStart) {
        const divStart = content.lastIndexOf('<div', sigStart);
        if (divStart !== -1) {
            const before = content.substring(0, divStart);
            const after = content.substring(footerStart);
            
            let newContent = before + '<PdfSignatures data={' + dataVar + '} />\n\n                ' + after;
            
            if (!newContent.includes('import PdfSignatures')) {
                newContent = newContent.replace(/import React(.*?);\n/, 'import React$1;\nimport PdfSignatures from \'./PdfSignatures\';\n');
            }
            
            fs.writeFileSync(path.join(dir, f), newContent);
            replacedCount++;
            console.log('Replaced in', f);
        }
    }
});
console.log('Replaced:', replacedCount);
