const fs = require('fs');
const path = require('path');

// Lista de TODOS los PDF generators
const pdfGenerators = [
    'AccidentPdfGenerator.jsx',
    'AiAdvisorPdfGenerator.jsx',
    'AiReportPdfGenerator.jsx',
    'DrillPdfGenerator.jsx',
    'ExtinguisherPdfGenerator.jsx',
    'ProfessionalReportPdfGenerator.jsx',
    'RiskAssessmentPdfGenerator.jsx',
    'RiskMapPdfGenerator.jsx',
    'StopCardPdfGenerator.jsx',
    'ThermalStressPdfGenerator.jsx',
    'TrainingPdfGenerator.jsx',
    'WorkPermitPdfGenerator.jsx',
    'LightingPdfGenerator.jsx',
    'ChecklistPdfGenerator.jsx',
    'RiskMatrixPdfGenerator.jsx'
];

console.log('🔧 Agregando clase company-logo y estilos de impresión en TODOS los PDFs...\n');

pdfGenerators.forEach(file => {
    const filePath = path.join(__dirname, '..', 'src', 'components', file);
    
    if (!fs.existsSync(filePath)) {
        console.log(`⏭️  ${file} - No existe`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // 1. Agregar clase CSS en el style tag si no existe
    if (!content.includes('.company-logo')) {
        content = content.replace(
            /(\.print-area \{[^}]+\})\s*`?\s*\}\s*<\/style>/s,
            `$1\n                        .company-logo {\n                            -webkit-print-color-adjust: exact !important;\n                            print-color-adjust: exact !important;\n                            color-adjust: exact !important;\n                        }\n                    `}
        </style>`
        );
    }
    
    // 2. Agregar estilos inline en las imagenes del logo
    content = content.replace(
        /(<img\s+src=\{companyLogo\}\s+alt="Logo de empresa"\s+style=\{\{)/g,
        `$1\n                                className="company-logo",`
    );
    
    content = content.replace(
        /(maxWidth: '\d+px')(\s+}}\s*\/>)/g,
        `$1,\n                                WebkitPrintColorAdjust: 'exact',\n                                printColorAdjust: 'exact',\n                                colorAdjust: 'exact'$2`
    );
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} - Actualizado`);
});

console.log('\n✨ ¡Actualización completada!');
