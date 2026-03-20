/**
 * Script para migrar PDF generators a TypeScript
 * Agrega tipos básicos a los componentes PDF
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const componentsDir = path.join(__dirname, 'src', 'components');

// Lista de PDF generators para migrar
const pdfGenerators = [
  'FireLoadPdfGenerator',
  'LightingPdfGenerator',
  'AccidentPdfGenerator',
  'DrillPdfGenerator',
  'ExtinguisherPdfGenerator',
  'TrainingPdfGenerator',
  'ThermalStressPdfGenerator',
  'RiskAssessmentPdfGenerator',
  'RiskMatrixPdfGenerator',
  'RiskMapPdfGenerator',
  'WorkPermitPdfGenerator',
  'WorkingAtHeightPdf',
  'ConfinedSpacePdf',
  'NoiseAssessmentPdf',
  'LOTOPdf',
  'ChemicalSafetyPdf',
  'EnvironmentalPdf',
  'AuditPdf',
  'CAPAPdf',
  'StopCardPdfGenerator',
  'ChecklistPdfGenerator',
  'AiReportPdfGenerator',
  'AiAdvisorPdfGenerator',
  'ProfessionalReportPdfGenerator',
  'ReportsPdfGenerator',
  'ErgonomicsPdfGenerator',
  'InspectionPdfGenerator',
  'PPEPdfGenerator',
  'SafetyCalendarPdf',
  'ManagementReportPdf',
].filter(name => {
  const jsxPath = path.join(componentsDir, `${name}.jsx`);
  return fs.existsSync(jsxPath);
});

console.log(`📦 Migrando ${pdfGenerators.length} PDF generators...\n`);

let migrated = 0;

pdfGenerators.forEach(name => {
  const jsxPath = path.join(componentsDir, `${name}.jsx`);
  const tsxPath = path.join(componentsDir, `${name}.tsx`);
  
  // Skip if already exists
  if (fs.existsSync(tsxPath)) {
    console.log(`⏭️  ${name}.tsx ya existe`);
    return;
  }
  
  try {
    let content = fs.readFileSync(jsxPath, 'utf8');
    
    // Reemplazar import React
    content = content.replace(
      /import\s+React\s+from\s+['"]react['"];?/g,
      "import React from 'react';"
    );
    
    // Reemplazar export default function
    content = content.replace(
      /export default function (\w+)\(([^)]*)\)/g,
      (match, funcName, props) => {
        // Extraer nombre de prop principal
        const propMatch = props.match(/\{\s*(\w+)\s*\}/);
        const mainProp = propMatch ? propMatch[1] : 'data';
        
        return `export default function ${funcName}({ ${mainProp} }: { ${mainProp}: any }): React.ReactElement | null`;
      }
    );
    
    // Agregar import de React si no existe
    if (!content.includes("import React from 'react'")) {
      content = "import React from 'react';\n" + content;
    }
    
    // Escribir archivo .tsx
    fs.writeFileSync(tsxPath, content, 'utf8');
    
    // Eliminar archivo .jsx
    fs.unlinkSync(jsxPath);
    
    migrated++;
    console.log(`✅ ${name}.jsx → ${name}.tsx`);
  } catch (error) {
    console.error(`❌ Error migrando ${name}:`, error.message);
  }
});

console.log(`\n🎉 Migrados ${migrated} de ${pdfGenerators.length} PDF generators`);
console.log('\n⚠️  Nota: Los tipos son básicos (any). Refinar según sea necesario.');
