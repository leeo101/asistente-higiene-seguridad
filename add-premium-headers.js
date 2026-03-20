/**
 * Script para agregar PremiumHeader a todos los módulos
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src', 'pages');

// Módulos a mejorar con su icono y título
const modules = [
  { file: 'FireLoad.tsx', title: 'Carga de Fuego', subtitle: 'Cálculo según Dec. 351/79', icon: 'Flame' },
  { file: 'LightingReport.tsx', title: 'Iluminación', subtitle: 'Estudio de niveles lumínicos', icon: 'Lightbulb' },
  { file: 'RiskMatrix.tsx', title: 'Matriz de Riesgos', subtitle: 'Evaluación ISO 31000', icon: 'ShieldAlert' },
  { file: 'WorkPermit.tsx', title: 'Permisos de Trabajo', subtitle: 'Tareas críticas y peligrosas', icon: 'KeySquare' },
  { file: 'Ergonomics.tsx', title: 'Ergonomía', subtitle: 'Evaluación según Res. SRT 886/15', icon: 'Accessibility' },
  { file: 'ThermalStress.tsx', title: 'Estrés Térmico', subtitle: 'TGBH - Res. 295/03', icon: 'ThermometerSun' },
  { file: 'Drills.tsx', title: 'Simulacros', subtitle: 'Plan de evacuación y emergencias', icon: 'Siren' },
  { file: 'Extinguishers.tsx', title: 'Extintores', subtitle: 'Control y vencimientos', icon: 'Flame' },
  { file: 'RiskAssessment.tsx', title: 'Evaluación de Riesgos', subtitle: 'IPER - Matriz IPERC', icon: 'TriangleAlert' },
  { file: 'ConfinedSpace.tsx', title: 'Espacios Confinados', subtitle: 'Permiso de trabajo crítico', icon: 'Tent' },
  { file: 'WorkingAtHeight.tsx', title: 'Trabajo en Altura', subtitle: 'Permiso según normativa', icon: 'ArrowDown' },
  { file: 'NoiseAssessment.tsx', title: 'Ruido Ambiental', subtitle: 'Evaluación audiometría', icon: 'Volume2' },
  { file: 'LOTOPage.tsx', title: 'LOTO', subtitle: 'Lockout/Tagout - OSHA 1910.147', icon: 'Lock' },
  { file: 'ChemicalSafety.tsx', title: 'Seguridad Química', subtitle: 'SGA/GHS - Fichas SDS', icon: 'FlaskConical' },
  { file: 'EnvironmentalMonitor.tsx', title: 'Monitoreo Ambiental', subtitle: 'ISO 14001', icon: 'Leaf' },
  { file: 'AuditManager.tsx', title: 'Auditorías', subtitle: 'ISO 45001 - Auditorías internas', icon: 'ClipboardCheck' },
  { file: 'CAPAManager.tsx', title: 'CAPA', subtitle: 'Acciones Correctivas y Preventivas', icon: 'RefreshCw' },
  { file: 'TrainingManagement.tsx', title: 'Capacitaciones', subtitle: 'Gestión de formación H&S', icon: 'Users' },
  { file: 'ChecklistManager.tsx', title: 'Checklists', subtitle: 'Listas de verificación', icon: 'ClipboardList' },
  { file: 'AccidentInvestigation.tsx', title: 'Investigación Accidentes', subtitle: 'Árbol de causas', icon: 'Siren' },
];

let updated = 0;

modules.forEach(({ file, title, subtitle, icon }) => {
  const filePath = path.join(pagesDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  ${file} no existe`);
    return;
  }
  
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Agregar import de PremiumHeader si no existe
    if (!content.includes('PremiumHeader')) {
      content = content.replace(
        /(import Breadcrumbs from ['"]\.\.\/components\/Breadcrumbs['"];)/,
        `import Breadcrumbs from '../components/Breadcrumbs';\nimport PremiumHeader from '../components/PremiumHeader';`
      );
      
      // Agregar icon import si no existe
      if (!content.includes(`import {.*${icon}`)) {
        content = content.replace(
          /(import\s*\{[^}]*)(from\s*['"]lucide-react['"])/,
          (match, imports, from) => {
            if (!imports.includes(icon)) {
              return `${imports}, ${icon} ${from}`;
            }
            return match;
          }
        );
      }
    }
    
    // Agregar PremiumHeader después del Breadcrumbs
    if (!content.includes('<PremiumHeader')) {
      const iconComponent = `<${icon} size={36} />`;
      const premiumHeader = `
                {/* Premium Header */}
                <PremiumHeader
                    title="${title}"
                    subtitle="${subtitle}"
                    icon={${iconComponent}}
                />`;
      
      content = content.replace(
        /(<Breadcrumbs\s*\/?>)/,
        `$1\n${premiumHeader}`
      );
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
    updated++;
    console.log(`✅ ${file} - ${title}`);
  } catch (error) {
    console.error(`❌ Error en ${file}:`, error.message);
  }
});

console.log(`\n🎉 ${updated} de ${modules.length} módulos actualizados`);
