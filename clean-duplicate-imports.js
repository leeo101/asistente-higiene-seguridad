/**
 * Script para limpiar imports duplicados de React
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

function cleanDuplicateImports(content) {
  let fixed = content;
  
  // Combinar múltiples imports de React en uno solo
  const reactImports = [];
  const reactImportRegex = /import\s+(?:React\s*,?\s*)?(?:\{\s*([^}]+)\s*\})?\s+from\s+['"]react['"];?\n?/g;
  
  let match;
  let hasReactDefault = false;
  
  while ((match = reactImportRegex.exec(fixed)) !== null) {
    if (match[0].includes('React,')) {
      hasReactDefault = true;
    }
    if (match[1]) {
      const imports = match[1].split(',').map(s => s.trim()).filter(Boolean);
      reactImports.push(...imports);
    }
  }
  
  if (reactImports.length > 0 || hasReactDefault) {
    const uniqueImports = [...new Set(reactImports)];
    let newImport = 'import ';
    if (hasReactDefault) {
      newImport += 'React, ';
    }
    if (uniqueImports.length > 0) {
      newImport += `{ ${uniqueImports.join(', ')} } `;
    }
    newImport += 'from \'react\';';
    
    // Eliminar todos los imports de React y reemplazar con uno limpio
    fixed = fixed.replace(/import\s+(?:React\s*,?\s*)?(?:\{\s*[^}]+\s*\})?\s+from\s+['"]react['"];?\n?/g, '');
    
    // Insertar el import limpio al principio
    const firstNonReactImport = fixed.match(/import\s+(?!React)(?!.*from\s+['"]react['"]).*from\s+['"][^'"]+['"];?/);
    if (firstNonReactImport) {
      fixed = fixed.replace(firstNonReactImport[0], `${newImport}\n${firstNonReactImport[0]}`);
    } else {
      fixed = `${newImport}\n${fixed}`;
    }
  }
  
  // Limpiar imports duplicados de react-router-dom
  const routerImports = [];
  const routerImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-router-dom['"];?\n?/g;
  
  while ((match = routerImportRegex.exec(fixed)) !== null) {
    if (match[1]) {
      const imports = match[1].split(',').map(s => s.trim()).filter(Boolean);
      routerImports.push(...imports);
    }
  }
  
  if (routerImports.length > 0) {
    const uniqueImports = [...new Set(routerImports)];
    const newImport = `import { ${uniqueImports.join(', ')} } from 'react-router-dom';`;
    
    // Eliminar todos los imports de react-router-dom
    fixed = fixed.replace(/import\s*\{\s*[^}]+\s*\}\s*from\s*['"]react-router-dom['"];?\n?/g, '');
    
    // Insertar el import limpio
    const firstOtherImport = fixed.match(/import\s+.*from\s+['"][^'"]+['"];?/);
    if (firstOtherImport) {
      fixed = fixed.replace(firstOtherImport[0], `${newImport}\n${firstOtherImport[0]}`);
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

    content = cleanDuplicateImports(content);

    if (content !== original) {
      fs.writeFileSync(file, content, 'utf8');
      fixedCount++;
      console.log(`✓ Cleaned: ${path.relative(srcDir, file)}`);
    }
  } catch (e) {
    console.error(`✗ Error processing ${file}: ${e.message}`);
  }
});

console.log(`\n✅ Total files cleaned: ${fixedCount}`);
