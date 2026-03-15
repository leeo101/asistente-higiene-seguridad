// Script para agregar logo de empresa a todos los PDF generators
const fs = require('fs');
const path = require('path');

const pdfGenerators = [
    'ChecklistPdfGenerator.jsx',
    'LightingPdfGenerator.jsx',
    'RiskMatrixPdfGenerator.jsx',
    'TrainingPdfGenerator.jsx',
    'WorkPermitPdfGenerator.jsx',
    'ThermalStressPdfGenerator.jsx',
    'DrillPdfGenerator.jsx',
    'ExtinguisherPdfGenerator.jsx',
    'RiskAssessmentPdfGenerator.jsx',
    'AccidentPdfGenerator.jsx',
    'RiskMapPdfGenerator.jsx',
    'StopCardPdfGenerator.jsx',
    'AiReportPdfGenerator.jsx',
    'AiAdvisorPdfGenerator.jsx',
    'ProfessionalReportPdfGenerator.jsx',
    'ErgonomicsReportPdfGenerator.jsx'
];

const logoCode = `
    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
`;

const logoImg = `{companyLogo && showLogo && (
                            <img 
                                src={companyLogo} 
                                alt="Logo de empresa" 
                                style={{ 
                                    height: '45px', 
                                    width: 'auto', 
                                    objectFit: 'contain',
                                    maxWidth: '140px'
                                }} 
                            />
                        )}`;

console.log('Actualizando PDF generators con logo de empresa...');

pdfGenerators.forEach(file => {
    const filePath = path.join(__dirname, '..', 'src', 'components', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} - No existe`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Agregar código para obtener logo después del export default
    if (!content.includes('companyLogo')) {
        content = content.replace(
            /(export default function \w+\([^)]+\) \{[^}]*\n)/,
            (match) => {
                const lines = match.split('\n');
                const lastLine = lines[lines.length - 2];
                const indent = lastLine.match(/^(\s*)/)[1];
                lines.splice(lines.length - 2, 0, indent + logoCode.trim());
                return lines.join('\n');
            }
        );
        
        console.log(`✅ ${file} - Código de logo agregado`);
    } else {
        console.log(`⏭️  ${file} - Ya tiene logo`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\n¡Actualización completada!');
