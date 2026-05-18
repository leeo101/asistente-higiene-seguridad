const fs = require('fs');
const path = require('path');
const dir = './src/components';

function findSignatureBlockEnd(content, startIndex) {
    let divCount = 0;
    let i = startIndex;
    // Advance to the first <div
    const firstDiv = content.indexOf('<div', i);
    if (firstDiv === -1) return -1;
    
    // We start just before the first <div so our loop can find it
    i = firstDiv;
    
    while (i < content.length) {
        // Find next <div or </div
        const nextOpen = content.indexOf('<div', i);
        const nextClose = content.indexOf('</div', i);
        
        if (nextClose === -1) return -1; // Should not happen in well-formed JSX
        
        if (nextOpen !== -1 && nextOpen < nextClose) {
            divCount++;
            i = nextOpen + 4;
        } else {
            divCount--;
            i = nextClose + 6; // length of </div>
            
            if (divCount === 0) {
                // We found the closing div of the signature block!
                return i;
            }
        }
    }
    return -1;
}

const files = fs.readdirSync(dir).filter(f => f.includes('Pdf') && (f.endsWith('.tsx') || f.endsWith('.jsx')));
let replacedCount = 0;

files.forEach(f => {
    let content = fs.readFileSync(path.join(dir, f), 'utf-8');
    
    // Skip already replaced
    if (content.includes('<PdfSignatures')) return;
    
    const sigStartStr = 'className="signature-container-row"';
    const sigStartIdx = content.indexOf(sigStartStr);
    
    if (sigStartIdx === -1) return;
    
    // Check if it's just a style definition
    if (content.substring(sigStartIdx - 20, sigStartIdx).includes('.')) {
        // might be CSS .signature-container-row
        const nextMatch = content.indexOf(sigStartStr, sigStartIdx + 10);
        if (nextMatch === -1) return;
    }
    
    const blockStart = content.lastIndexOf('<div', sigStartIdx);
    if (blockStart === -1) return;
    
    const blockEnd = findSignatureBlockEnd(content, blockStart);
    if (blockEnd === -1) {
        console.log('Could not find block end for', f);
        return;
    }
    
    let dataVar = 'data';
    if (content.match(/const finalData\s*=\s*(.*?);/)) dataVar = 'finalData';
    if (content.match(/const report\s*=\s*(.*?);/)) dataVar = 'report';
    if (content.match(/const reportData\s*=\s*(.*?);/)) dataVar = 'reportData';
    if (f === 'ProfessionalReportPdfGenerator.tsx') dataVar = 'reportData';
    if (f === 'AiAdvisorPdfGenerator.tsx') dataVar = 'data';
    
    const before = content.substring(0, blockStart);
    const after = content.substring(blockEnd);
    
    let newContent = before + '<PdfSignatures data={' + dataVar + '} />' + after;
    
    // Add import cleanly
    if (!newContent.includes('import PdfSignatures')) {
        newContent = newContent.replace(/import React(.*?);\n/, 'import React$1;\nimport PdfSignatures from \'./PdfSignatures\';\n');
    }
    
    fs.writeFileSync(path.join(dir, f), newContent);
    replacedCount++;
    console.log('Replaced in', f);
});

console.log('Total replaced:', replacedCount);
