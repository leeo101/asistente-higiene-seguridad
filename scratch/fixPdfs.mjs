import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dir = path.join(__dirname, '../src/components');

const files = fs.readdirSync(dir).filter(f => f.includes('Pdf') && f.endsWith('.tsx'));

for (const file of files) {
    const filePath = path.join(dir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // 1. Fix tables
    content = content.replace(/<table(?:\s+([^>]+?))?>/g, (match, attributes) => {
        if (!attributes) attributes = '';
        
        let newAttributes = attributes;
        if (newAttributes.includes('style={{')) {
            if (!newAttributes.includes('tableLayout')) {
                newAttributes = newAttributes.replace(/style=\{\{/, "style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word', ");
            }
        } else {
            newAttributes = newAttributes + ` style={{ width: '100%', tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word', borderCollapse: 'collapse' }}`;
        }
        return `<table ${newAttributes.trim()}>`;
    });

    // 2. Fix rows
    content = content.replace(/<tr(?:\s+([^>]+?))?>/g, (match, attributes) => {
        // Exclude self-closing tags just in case, though tr shouldn't be
        if (match.endsWith('/>')) return match;

        if (!attributes) attributes = '';
        if (attributes.includes('avoid-break')) return match;
        
        let newAttributes = attributes;
        if (newAttributes.includes('className="')) {
            newAttributes = newAttributes.replace(/className="/, 'className="avoid-break ');
        } else if (newAttributes.includes("className='")) {
            newAttributes = newAttributes.replace(/className='/, "className='avoid-break ");
        } else if (newAttributes.includes('className={')) {
            if (newAttributes.includes('className={`')) {
                newAttributes = newAttributes.replace(/className=\{`/, 'className={`avoid-break ');
            } else {
                // If it's something like className={classes.row}, just inject a template literal
                newAttributes = newAttributes.replace(/className=\{([^}]+)\}/, 'className={`avoid-break ${$1}`}');
            }
        } else {
            newAttributes = `className="avoid-break" ` + newAttributes;
        }
        
        if (newAttributes.includes('style={{')) {
            if (!newAttributes.includes('pageBreakInside')) {
                newAttributes = newAttributes.replace(/style=\{\{/, "style={{ pageBreakInside: 'avoid', breakInside: 'avoid', ");
            }
        } else {
            newAttributes = newAttributes + ` style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}`;
        }
        
        return `<tr ${newAttributes.trim()}>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated ${file}`);
    }
}
