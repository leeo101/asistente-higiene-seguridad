const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.tsx'));

let fixedCount = 0;

for (const file of files) {
  const filePath = path.join(pagesDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Check if it has the bad injection
  const badInjectionRegex = /((?:const|let|var|function) \w+\s*=\s*\([^)]*\)\s*=>\s*{|export const \w+\s*=\s*\([^)]*\)\s*=>\s*{|const \w+\s*=\s*function\s*\([^)]*\)\s*{)\s*const { requirePro } = usePaywall\(\);/g;
  
  if (badInjectionRegex.test(content) || content.includes('const { requirePro } = usePaywall();')) {
    // Let's remove ALL instances of `const { requirePro } = usePaywall();`
    // and `const { isPro, requirePro } = usePaywall();`
    // but wait, some are correct!
    
    // To be safe, let's remove ALL `const { requirePro } = usePaywall();`
    // that are immediately following a non-component function.
    // Actually, let's just find the component declaration manually and insert it there.
    
    // Find the main component
    const componentRegex = /(export default function [A-Za-z0-9_]+\([^)]*\)(?:\s*:\s*[A-Za-z0-9_|<>\s]+)?\s*{|const [A-Za-z0-9_]+ = \([^)]*\)(?:\s*:\s*[A-Za-z0-9_|<>\s]+)?\s*=>\s*{)/;
    const match = content.match(componentRegex);
    
    if (match) {
        // Strip out any existing usePaywall lines that declare requirePro
        const originalContent = content;
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
    }
  }
}

console.log('Total fixed:', fixedCount);
