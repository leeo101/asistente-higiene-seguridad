/**
 * Script para restaurar imports de React eliminados incorrectamente
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

function fixReactImports(content) {
  let fixed = content;

  // Si usa useEffect pero no está importado, agregarlo
  if (/\buseEffect\b/.test(fixed) && !/import.*useEffect.*from ['"]react['"]/.test(fixed)) {
    fixed = fixed.replace(
      /import\s*React\s*(?:,\s*\{\s*([^}]+)\s*\})?\s*from\s*['"]react['"];?/,
      (match, existing) => {
        const existingImports = existing ? existing.split(',').map(s => s.trim()).filter(Boolean) : [];
        if (!existingImports.includes('useEffect')) {
          existingImports.push('useEffect');
        }
        return `import React, { ${existingImports.join(', ')} } from 'react';`;
      }
    );
  }

  // Si usa useRef pero no está importado
  if (/\buseRef\b/.test(fixed) && !/import.*useRef.*from ['"]react['"]/.test(fixed)) {
    fixed = fixed.replace(
      /import\s*React\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react['"];?/,
      (match, existing) => {
        const existingImports = existing.split(',').map(s => s.trim()).filter(Boolean);
        if (!existingImports.includes('useRef')) {
          existingImports.push('useRef');
        }
        return `import React, { ${existingImports.join(', ')} } from 'react';`;
      }
    );
  }

  // Si usa useNavigate pero no está importado de react-router-dom
  if (/\buseNavigate\b/.test(fixed) && !/import.*useNavigate.*from ['"]react-router-dom['"]/.test(fixed)) {
    const reactRouterImport = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]react-router-dom['"];?/;
    if (reactRouterImport.test(fixed)) {
      fixed = fixed.replace(
        reactRouterImport,
        (match, existing) => {
          const existingImports = existing.split(',').map(s => s.trim()).filter(Boolean);
          if (!existingImports.includes('useNavigate')) {
            existingImports.push('useNavigate');
          }
          return `import { ${existingImports.join(', ')} } from 'react-router-dom';`;
        }
      );
    } else {
      // Agregar import si no existe ninguno de react-router-dom
      const firstImport = fixed.match(/import\s+.*from\s+['"][^'"]+['"];?/);
      if (firstImport) {
        fixed = fixed.replace(
          firstImport[0],
          `import { useNavigate } from 'react-router-dom';\n${firstImport[0]}`
        );
      }
    }
  }

  return fixed;
}

const files = getAllFiles(srcDir);
let fixedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = fixReactImports(content);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed imports: ${path.relative(srcDir, file)}`);
  }
});

console.log(`\n✅ Total files with import fixes: ${fixedCount}`);
