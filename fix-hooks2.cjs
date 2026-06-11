const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has the bad injection
  if (content.includes('const { requirePro } = usePaywall();') || content.includes('requirePro } = usePaywall();')) {
    const originalContent = content;
    
    // Find the main component
    const componentRegex = /(export default function [A-Za-z0-9_]+\([^)]*\)(?:\s*:\s*[^\{]+)?\s*{|const [A-Za-z0-9_]+ = \([^)]*\)(?:\s*:\s*[^\{]+)?\s*=>\s*{)/;
    const match = content.match(componentRegex);
    
    if (match) {
        // Count how many times it was injected inside the file.
        // We want to ensure the ONLY requirePro is right after the component declaration.
        
        content = content.replace(/\s*const { requirePro } = usePaywall\(\);/g, '');
        content = content.replace(/\s*const { isPro, requirePro } = usePaywall\(\);/g, '\n  const { isPro } = usePaywall();');
        content = content.replace(/\s*const { requirePro, isPro } = usePaywall\(\);/g, '\n  const { isPro } = usePaywall();');
        
        // Re-inject right after the component declaration
        content = content.replace(match[0], `${match[0]}\n  const { requirePro } = usePaywall();`);
        
        if (content !== originalContent) {
            fs.writeFileSync(filePath, content, 'utf8');
            fixedCount++;
            console.log('Fixed', file);
        }
    } else {
        console.log('Regex did not match component in', file);
    }
  }
}

console.log('Total fixed:', fixedCount);
