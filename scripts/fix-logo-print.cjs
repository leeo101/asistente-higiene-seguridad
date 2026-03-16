const fs = require('fs');
const path = require('path');

const pdfGenerators = [
    'ATSPdfGenerator.jsx',
    'ReportPdfGenerator.jsx',
    'ChecklistPdfGenerator.jsx',
    'LightingPdfGenerator.jsx',
    'RiskMatrixPdfGenerator.jsx',
    'TrainingPdfGenerator.jsx',
    'WorkPermitPdfGenerator.jsx',
    'AccidentPdfGenerator.jsx',
    'DrillPdfGenerator.jsx',
    'ExtinguisherPdfGenerator.jsx',
    'ThermalStressPdfGenerator.jsx',
    'AiReportPdfGenerator.jsx',
    'RiskAssessmentPdfGenerator.jsx',
    'StopCardPdfGenerator.jsx',
    'AiAdvisorPdfGenerator.jsx',
    'RiskMapPdfGenerator.jsx',
    'ProfessionalReportPdfGenerator.jsx'
];

console.log('🔧 Agregando estilo de impresión para logo en PDFs...\n');

pdfGenerators.forEach(file => {
    const filePath = path.join(__dirname, '..', 'src', 'components', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} - No existe`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar el style de print y agregar img { -webkit-print-color-adjust }
    if (content.includes('img { -webkit-print-color-adjust')) {
        console.log(`✅ ${file} - Ya tiene el estilo`);
        return;
    }
    
    // Reemplazar el style de print
    content = content.replace(
        /(\.print-area \{[^}]+\})\s*`?\s*\}\s*<\/style>/s,
        `$1\n                        img { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }\n                    `}
        </style>`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} - Estilo agregado`);
});

console.log('\n✨ ¡Actualización completada!');
