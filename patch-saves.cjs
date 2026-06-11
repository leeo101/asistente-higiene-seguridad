const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'pages');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // 1. Replace onClick={handleSave}
  content = content.replace(/onClick=\{handleSave\}/g, `onClick={(e) => { e.preventDefault(); requirePro(handleSave); }}`);
  // Replace onSubmit={handleSave}
  content = content.replace(/onSubmit=\{handleSave\}/g, `onSubmit={(e) => { e.preventDefault(); requirePro(handleSave); }}`);

  // If no changes, return
  if (content === originalContent) return;

  // 2. Add import for usePaywall if missing
  if (!content.includes(`from '../hooks/usePaywall'`)) {
    content = content.replace(/(import .* from 'react';?)/, `$1\nimport { usePaywall } from '../hooks/usePaywall';`);
  }

  // 3. Add const { requirePro } = usePaywall(); if missing
  if (!content.includes('const { requirePro } = usePaywall()') && !content.includes('const { isPro, requirePro } = usePaywall()') && !content.includes('const { requirePro, isPro') && !content.includes('requirePro } = usePaywall()')) {
    // Find the component declaration
    const componentRegex = /(export default function [A-Za-z0-9_]+\([^)]*\)\s*{|const [A-Za-z0-9_]+ = \([^)]*\)\s*=>\s*{)/;
    const match = content.match(componentRegex);
    if (match) {
      content = content.replace(match[0], `${match[0]}\n  const { requirePro } = usePaywall();`);
    } else {
      console.log('Could not find component body in', filePath);
    }
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Patched:', path.basename(filePath));
}

function traverse(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverse(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

traverse(srcDir);
console.log('Done patching saves.');
