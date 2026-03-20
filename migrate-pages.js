/**
 * Script para migrar páginas a TypeScript
 * Agrega tipos básicos a los componentes de página
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pagesDir = path.join(__dirname, 'src', 'pages');

// Obtener todos los archivos .jsx de páginas
const pageFiles = fs.readdirSync(pagesDir)
  .filter(file => file.endsWith('.jsx'));

console.log(`📦 Migrando ${pageFiles.length} páginas...\n`);

let migrated = 0;
let skipped = 0;

pageFiles.forEach(file => {
  const name = file.replace('.jsx', '');
  const jsxPath = path.join(pagesDir, file);
  const tsxPath = path.join(pagesDir, `${name}.tsx`);
  
  // Skip if already exists
  if (fs.existsSync(tsxPath)) {
    console.log(`⏭️  ${name}.tsx ya existe`);
    skipped++;
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
        // Extraer nombre de prop principal si existe
        const propMatch = props.match(/\{\s*(\w+)\s*\}/);
        const mainProp = propMatch ? propMatch[1] : 'props';
        
        return `export default function ${funcName}(${props.trim() ? `{ ${mainProp} }: { ${mainProp}: any }` : ''}): React.ReactElement | null`;
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

console.log(`\n🎉 Migrados ${migrated} de ${pageFiles.length} páginas`);
console.log(`⏭️  Saltados ${skipped} archivos (ya existen)`);
console.log('\n⚠️  Nota: Los tipos son básicos (any). Refinar según sea necesario.');
