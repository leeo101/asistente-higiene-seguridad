/**
 * Script para corregir errores comunes de ESLint
 * Ejecutar con: node fix-eslint-errors.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.join(__dirname, 'src');

// Función para leer archivos recursivamente
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

// Función para corregir imports no usados
function fixUnusedImports(content, filePath) {
  let fixed = content;
  
  // Eliminar imports específicos no usados
  const unusedImportPatterns = [
    { pattern: /import\s*\{\s*useEffect\s*\}\s*from\s*['"]react['"];?\n?/g, replacement: '' },
    { pattern: /import\s*\{\s*useRef\s*\}\s*from\s*['"]react['"];?\n?/g, replacement: '' },
    { pattern: /import\s*\{\s*useEffect,\s*useRef\s*\}\s*from\s*['"]react['"];?\n?/g, replacement: 'import { useState } from \'react\';\n' },
    { pattern: /,\s*useEffect/g, replacement: '' },
    { pattern: /,\s*useRef/g, replacement: '' },
    { pattern: /useEffect,\s*/g, replacement: '' },
    { pattern: /useRef,\s*/g, replacement: '' },
  ];

  unusedImportPatterns.forEach(({ pattern, replacement }) => {
    fixed = fixed.replace(pattern, replacement);
  });

  return fixed;
}

// Función para eliminar variables no usadas
function fixUnusedVariables(content, filePath) {
  let fixed = content;

  // Lista de variables no usadas comunes
  const unusedVars = [
    'safeNombre',
    'safeFecha',
    'safeEmpresa',
    'safePuesto',
    'safeTema',
    'isGeneratingPdf',
    'setIsGeneratingPdf',
    'viewMode',
    'setViewMode',
    'showMap',
    'setShowMap',
    'logo',
    'isUploading',
    'handleLogoUpload',
    'toggleShowLogo',
    'removeLogo',
    'onComplete',
    'toastId',
    'stream',
    'navigate',
    'currentUser',
    'showSignatures',
    'setShowSignatures',
    'labelStyle',
    'inputStyle',
    'daysLeft',
    'showOnboarding',
    'setShowOnboarding',
    'thermalData',
    'isPasswordStrong',
    'granted',
    'handleBack',
    'userCountry',
    'handleShare',
    'sectionFails',
    'currentData',
    'incompatible',
    'checkCompatibility',
    'chemical1',
    'chemical2',
    'saveWorkers',
    'calculateDose',
    'applyOrtho',
    'onSuspend',
    'permit',
    'capa',
    'preview',
    'sectionIdx',
    'index',
    'idx',
    'pageNum',
    'filename',
    'updatedAt',
    'flex',
    'collection',
    'query',
    'where',
    'getDocs',
    'doc',
    'getDoc',
    'updateDoc',
    'useDocumentTitle',
    'useNavigate',
    'onBack',
    'handlePrint',
    'queryParams',
    'handleCreateAudit',
    'addFinding',
    'updateActionStatus',
    'error',
  ];

  unusedVars.forEach((varName) => {
    // Eliminar declaraciones de variables no usadas
    const patterns = [
      new RegExp(`const\\s+${varName}\\s*=\\s*[^;\\n]+;\\n`, 'g'),
      new RegExp(`let\\s+${varName}\\s*=\\s*[^;\\n]+;\\n`, 'g'),
      new RegExp(`var\\s+${varName}\\s*=\\s*[^;\\n]+;\\n`, 'g'),
    ];

    patterns.forEach((pattern) => {
      fixed = fixed.replace(pattern, '');
    });
  });

  return fixed;
}

// Función para eliminar parámetros no usados en catch
function fixUnusedCatchParams(content) {
  return content.replace(/catch\s*\(\s*e\s*\)\s*\{/g, 'catch {\n');
}

// Función para eliminar escapes innecesarios
function fixUnnecessaryEscapes(content) {
  return content.replace(/\\\[/g, '[');
}

// Función para eliminar imports de toast no usados
function fixUnusedToast(content, filePath) {
  if (filePath.includes('toast') === false && content.includes('toast') === false) {
    content = content.replace(/import\s*\{\s*toast\s*\}\s*from\s*['"]react-hot-toast['"];?\n?/g, '');
  }
  return content;
}

// Main
const files = getAllFiles(srcDir);
let fixedCount = 0;

files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = fixUnusedImports(content, file);
  content = fixUnusedVariables(content, file);
  content = fixUnusedCatchParams(content);
  content = fixUnnecessaryEscapes(content);
  content = fixUnusedToast(content, file);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    fixedCount++;
    console.log(`✓ Fixed: ${path.relative(srcDir, file)}`);
  }
});

console.log(`\n✅ Total files fixed: ${fixedCount}`);
