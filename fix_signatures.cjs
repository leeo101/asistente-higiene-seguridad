/**
 * fix_signatures.js
 * Migrates old inline signature boxes (flex: '0 1 32%') to the standardized
 * signature-container-row / signature-item-box CSS class pattern.
 * 
 * Run with:  node fix_signatures.js
 */

const fs = require('fs');
const path = require('path');

const FILES = [
  'src/components/ConfinedSpacePdf.tsx',
  'src/components/EnvironmentalPdf.tsx',
  'src/components/LOTOPdf.tsx',
  'src/components/NoiseAssessmentPdf.tsx',
  'src/components/WorkingAtHeightPdf.tsx',
  'src/components/LightingPdfGenerator.tsx',
  'src/components/ToolboxTalkPdfGenerator.tsx',
  'src/components/ChemicalSafetyPdf.tsx',
  'src/components/RiskAssessmentPdfGenerator.tsx',
  'src/components/ProfessionalReportPdfGenerator.tsx',
  'src/components/WorkPermitPdfGenerator.tsx',
  'src/components/ExtinguisherPdfGenerator.tsx',
  'src/components/TrainingPdfGenerator.tsx',
  'src/components/StopCardPdfGenerator.tsx',
];

// ─────────────────────────────────────────────────────────────────────
// Helper: Given the content of a PDF file, find the signature section
// (everything between a known "signatures" comment and PdfBrandingFooter)
// and rebuild it with standardized classes.
// ─────────────────────────────────────────────────────────────────────

function extractSignatureBoxes(sectionHTML) {
  // Parse each div with flex: '0 1 32%' and extract:
  //   - any <img> tag (signature image)
  //   - the two <p> labels (role + sublabel)
  //   - optional extra <p> for name / license
  const boxes = [];
  const divPattern = /<div style=\{\{[^}]*flex:\s*'0 1 32%'[\s\S]*?\}\}>([\s\S]*?)<\/div>\s*(?=\n\s*(?:<div|<\/div>|\{\/\*))/g;

  // Simpler approach: split by flex: '0 1 32%' occurrences
  const parts = sectionHTML.split(/(?=\s*<div style=\{\{[^}]*flex:\s*'0 1 32%')/);
  
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];
    
    // Extract img if present
    const imgMatch = part.match(/<img\s+src=\{([^}]+)\}[^/]*/s);
    // Extract all <p> tags
    const pTags = [...part.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map(m => m[0]);
    
    boxes.push({ raw: part, img: imgMatch ? imgMatch[1] : null, pTags });
  }
  
  return boxes;
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Pattern: the outer signature wrapper div that uses flex/gap/justifyContent center
  // and contains multiple 0 1 32% boxes.
  // Replace the whole block between "Firmas" comment and closing </div> before PdfBrandingFooter
  
  // Strategy: regex that matches the outer wrapper and all inner boxes, 
  // capturing the inner content for each box.
  const sigWrapperRegex = /(\{\/\*[^*]*(?:Firm|Sign|Responsab)[^*]*\*\/\})\s*<div style=\{\{[^}]*(?:flex|display)[^}]*\}\}>([\s\S]*?)<\/div>\s*(\n\s*(?:<PdfBrandingFooter|<\/div>\s*\n\s*<PdfBrandingFooter))/;
  
  const match = sigWrapperRegex.exec(content);
  if (!match) {
    console.log(`  ⚠️  Could not find signature wrapper in ${path.basename(filePath)}`);
    return false;
  }
  
  const commentPart = match[1];
  const innerContent = match[2];
  const afterPart = match[3];
  
  // ── Parse boxes from innerContent ──
  // Each box starts with <div style={{ flex: '0 1 32%' ...
  const boxSplit = innerContent.split(/(?=\n\s*<div style=\{\{\s*flex:\s*'0 1 32%')/);
  
  const rebuiltBoxes = [];
  
  for (const boxRaw of boxSplit) {
    if (!boxRaw.trim()) continue;
    if (!boxRaw.includes("flex: '0 1 32%'")) continue;
    
    // Extract img src expression
    const imgSrcMatch = boxRaw.match(/<img\s+src=\{([^}]+)\}/);
    const imgSrc = imgSrcMatch ? imgSrcMatch[1] : null;
    const imgAltMatch = boxRaw.match(/alt="([^"]+)"/);
    const imgAlt = imgAltMatch ? imgAltMatch[1] : 'Firma';
    
    // Extract ternary that conditionally renders image (common pattern)
    const ternaryMatch = boxRaw.match(/\{([a-zA-Z.]+)\s*\?\s*\(\s*<img[\s\S]*?\)\s*:\s*\([^)]*\)\s*\}/);
    const condImg = ternaryMatch ? ternaryMatch[0] : null;
    
    // Extract <p> texts (strip JSX)
    const pMatches = [...boxRaw.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)];
    const pTexts = pMatches.map(m => m[1].trim());
    
    // Determine role label (first p), sublabel (second p), extra lines
    const roleLabel = pTexts[0] || '';
    const subLabel = pTexts[1] || '';
    const extraLines = pTexts.slice(2);
    
    // Check if it's the "professional" box (green tint)
    const isProfessional = boxRaw.includes('#f0fdf4') || boxRaw.includes('bbf7d0') || boxRaw.includes('#166534') || boxRaw.includes('actSignature');
    
    let box = `\n          <div className="signature-item-box">`;
    
    if (condImg) {
      // Has a conditional image rendering
      const condVar = boxRaw.match(/\{([a-zA-Z.]+)\s*&&/) || boxRaw.match(/\{([a-zA-Z]+Signature|signature)\s*\?/);
      const varName = condVar ? condVar[1] : null;
      if (varName) {
        box += `\n            {${varName} ? (\n              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>\n                <img src={${varName}} alt="${imgAlt}" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />\n              </div>\n            ) : null}`;
      }
    } else if (imgSrc) {
      box += `\n            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>\n              <img src={${imgSrc}} alt="${imgAlt}" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />\n            </div>`;
    }
    
    box += `\n            <div className="signature-line" />`;
    
    if (roleLabel) {
      const color = isProfessional ? '#94a3b8' : '#94a3b8';
      box += `\n            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '${color}', letterSpacing: '0.08em' }}>${roleLabel}</p>`;
    }
    if (subLabel) {
      box += `\n            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>${subLabel}</p>`;
    }
    for (const extra of extraLines) {
      if (extra) {
        box += `\n            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>${extra}</p>`;
      }
    }
    
    box += `\n          </div>`;
    rebuiltBoxes.push(box);
  }
  
  if (rebuiltBoxes.length === 0) {
    console.log(`  ⚠️  Could not parse boxes from ${path.basename(filePath)}`);
    return false;
  }
  
  const newBlock = `${commentPart}
        <div className="signature-container-row" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1' }}>${rebuiltBoxes.join('')}
        </div>
        ${afterPart.trim()}`;
  
  const newContent = content.slice(0, match.index) + newBlock + content.slice(match.index + match[0].length);
  
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`  ✅ ${path.basename(filePath)} - ${rebuiltBoxes.length} boxes migrated`);
  return true;
}

console.log('🔄 Migrating PDF signature blocks...\n');
let successCount = 0;

for (const file of FILES) {
  const abs = path.join(__dirname, file);
  if (!fs.existsSync(abs)) {
    console.log(`  ❌ Not found: ${file}`);
    continue;
  }
  try {
    const result = processFile(abs);
    if (result) successCount++;
  } catch (e) {
    console.error(`  ❌ Error in ${file}: ${e.message}`);
  }
}

console.log(`\n✨ Done. ${successCount}/${FILES.length} files migrated.`);
