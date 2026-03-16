const fs = require('fs');
const path = require('path');

// Lista de PDF generators restantes para actualizar
const remainingFiles = [
    'AccidentPdfGenerator.jsx',
    'AiAdvisorPdfGenerator.jsx',
    'AiReportPdfGenerator.jsx',
    'DrillPdfGenerator.jsx',
    'ExtinguisherPdfGenerator.jsx',
    'ProfessionalReportPdfGenerator.jsx',
    'RiskAssessmentPdfGenerator.jsx',
    'RiskMapPdfGenerator.jsx',
    'StopCardPdfGenerator.jsx',
    'ThermalStressPdfGenerator.jsx'
];

const logoCode = `
    // Obtener logo de empresa
    const companyLogo = localStorage.getItem('companyLogo');
    const showLogo = localStorage.getItem('showCompanyLogo') !== 'false';
`;

console.log('🚀 Actualizando 10 PDF generators restantes con logo de empresa...\n');

remainingFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', 'src', 'components', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} - No existe`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene el código del logo
    if (content.includes('companyLogo')) {
        console.log(`✅ ${file} - Ya tiene logo`);
        return;
    }
    
    // 1. Agregar código para obtener logo después de las declaraciones de variables
    const lines = content.split('\n');
    let insertIndex = -1;
    
    // Buscar después del export default function
    for (let i = 0; i < Math.min(30, lines.length); i++) {
        if (lines[i].includes('export default function') && lines[i].includes('PdfGenerator')) {
            // Encontrar el cierre de la función
            for (let j = i; j < Math.min(i + 15, lines.length); j++) {
                if (lines[j].trim().startsWith('if (') || lines[j].trim().startsWith('const ') || lines[j].trim().startsWith('return')) {
                    insertIndex = j;
                    break;
                }
            }
            break;
        }
    }
    
    if (insertIndex > 0) {
        const indent = lines[insertIndex].match(/^(\s*)/)[1];
        lines.splice(insertIndex, 0, indent + logoCode.trim());
        content = lines.join('\n');
        console.log(`✅ ${file} - Código de logo agregado`);
    } else {
        console.log(`⚠️  ${file} - No se pudo insertar`);
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
});

console.log('\n✨ ¡Actualización completada!');
console.log('\n⚠️  NOTA: Ahora necesitas agregar el <img> del logo en el header de cada PDF manualmente.');
