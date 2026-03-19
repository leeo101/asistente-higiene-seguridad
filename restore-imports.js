/**
 * Script para restaurar imports de React y react-router-dom
 * Este script detecta hooks usados y agrega los imports faltantes
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);
  files.forEach((file) => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      getAllFiles(fullPath, arrayOfFiles);
    } else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      arrayOfFiles.push(fullPath);
    }
  });
  return arrayOfFiles;
}

function fixImports(content) {
  let fixed = content;
  
  // Hooks de React que pueden faltar
  const reactHooks = {
    'useEffect': /\buseEffect\s*\(/,
    'useState': /\buseState\s*\(/,
    'useRef': /\buseRef\s*\(/,
    'useCallback': /\buseCallback\s*\(/,
    'useMemo': /\buseMemo\s*\(/,
    'useContext': /\buseContext\s*\(/,
    'useReducer': /\buseReducer\s*\(/,
  };

  // Hooks de react-router-dom
  const routerHooks = {
    'useNavigate': /\buseNavigate\s*\(/,
    'useLocation': /\buseLocation\s*\(/,
    'useParams': /\buseParams\s*\(/,
    'Link': /\bLink\s*[</]/,
    'useNavigate': /\buseNavigate\s*\(/,
  };

  // Verificar si necesita imports de React
  let neededReactHooks = [];
  for (const [hook, regex] of Object.entries(reactHooks)) {
    if (regex.test(fixed)) {
      neededReactHooks.push(hook);
    }
  }

  // Verificar si necesita imports de react-router-dom
  let neededRouterHooks = [];
  for (const [hook, regex] of Object.entries(routerHooks)) {
    if (regex.test(fixed)) {
      neededRouterHooks.push(hook);
    }
  }

  // Fix React imports
  if (neededReactHooks.length > 0) {
    const reactImportRegex = /import\s+React\s*(?:,\s*\{\s*([^}]+)\s*\})?\s*from\s*['"]react['"];?/;
    const match = fixed.match(reactImportRegex);
    
    if (match) {
      const existing = match[1] ? match[1].split(',').map(s => s.trim()).filter(Boolean) : [];
      const allHooks = [...new Set([...existing, ...neededReactHooks])];
      const newImport = `import React, { ${allHooks.join(', ')} } from 'react';`;
      fixed = fixed.replace(reactImportRegex, newImport);
    } else if (neededReactHooks.length > 0) {
      // No hay import de React, agregar uno
      const firstImport = fixed.match(/import\s+.*from\s+['"][^'"]+['"];?/);
      if (firstImport) {
        fixed = fixed.replace(
          firstImport[0],
          `import React, { ${neededReactHooks.join(', ')} } from 'react';\n${firstImport[0]}`
        );
      }
    }
  }

  // Fix react-router-dom imports
  if (neededRouterHooks.length > 0) {
    const routerImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-router-dom['"];?/;
    const match = fixed.match(routerImportRegex);
    
    if (match) {
      const existing = match[1].split(',').map(s => s.trim()).filter(Boolean);
      const allHooks = [...new Set([...existing, ...neededRouterHooks])];
      const newImport = `import { ${allHooks.join(', ')} } from 'react-router-dom';`;
      fixed = fixed.replace(routerImportRegex, newImport);
    } else {
      // No hay import de react-router-dom, agregar uno
      const firstImport = fixed.match(/import\s+.*from\s+['"][^'"]+['"];?/);
      if (firstImport) {
        fixed = fixed.replace(
          firstImport[0],
          `import { ${neededRouterHooks.join(', ')} } from 'react-router-dom';\n${firstImport[0]}`
        );
      }
    }
  }

  return fixed;
}

const files = getAllFiles(srcDir);
let fixedCount = 0;

files.forEach((file) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    const original = content;

    content = fixImports(content);

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log(`✓ Fixed: ${path.relative(srcDir, file)}`);
    }
  } catch (e) {
    console.error(`✗ Error processing ${file}: ${e.message}`);
  }
});

console.log(`\n✅ Total files fixed: ${fixedCount}`);
