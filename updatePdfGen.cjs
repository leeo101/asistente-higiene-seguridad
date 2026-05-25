const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'utils', 'pdf', 'legajoPdfGenerator.ts');
let content = fs.readFileSync(filePath, 'utf8');

const signatureCode = `
  // SIGNATURE AREA
  yOffset = (pdf as any).lastAutoTable.finalY + 40;
  
  if (data.firmas?.representante) {
    pdf.addImage(data.firmas.representante, 'PNG', 30, yOffset - 25, 40, 20);
  }
  pdf.line(20, yOffset, 80, yOffset);
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);
  pdf.text('Firma Representante Empresa', 50, yOffset + 5, { align: 'center' });

  if (data.firmas?.profesional) {
    pdf.addImage(data.firmas.profesional, 'PNG', 130, yOffset - 25, 40, 20);
  }
  pdf.line(120, yOffset, 180, yOffset);
  pdf.text('Firma y Sello del Profesional', 150, yOffset + 5, { align: 'center' });
  pdf.text('Higiene y Seguridad en el Trabajo', 150, yOffset + 10, { align: 'center' });
`;

// Replace the old signature area
const oldSignatureRegex = /\/\/ SIGNATURE AREA[\s\S]*?(?=\/\/ SAVE PDF)/;
if (oldSignatureRegex.test(content)) {
  content = content.replace(oldSignatureRegex, signatureCode + "\n  ");
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully upgraded legajoPdfGenerator.ts');
