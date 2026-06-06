const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'src', 'pages');

function processFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Use a regex that allows > inside onClick={...}
    // We can just match the whole button tag since it's on a single line usually, or multi-line.
    // onClick=\{.*?\} is non-greedy match for the handler.
    const buttonRegex = /<button\s+([^>]*?)onClick=\{(.*?)\}([^>]*?)>\s*<ArrowLeft(.*?)\/>\s*<\/button>/gs;

    content = content.replace(buttonRegex, (match, beforeClick, onClickFn, afterClick, arrowAttrs) => {
        const stripAttrs = (str) => {
            return str
                .replace(/style=\{\{.*?\}\}/g, '')
                .replace(/className=(["'])(?:(?=(\\?))\2.)*?\1/g, '')
                .replace(/title=(["'])(?:(?=(\\?))\2.)*?\1/g, '')
                .replace(/aria-label=(["'])(?:(?=(\\?))\2.)*?\1/g, '')
                .replace(/\s+/g, ' ')
                .trim();
        };

        const cleanedBefore = stripAttrs(beforeClick);
        const cleanedAfter = stripAttrs(afterClick);
        
        const spaceBefore = cleanedBefore ? ` ${cleanedBefore}` : '';
        const spaceAfter = cleanedAfter ? ` ${cleanedAfter}` : '';

        let cleanArrow = arrowAttrs;
        if (!cleanArrow.includes('size=')) {
            cleanArrow += ' size={20}';
        }

        return `<button${spaceBefore} onClick={${onClickFn}}${spaceAfter} className="btn-back-premium" title="Volver" aria-label="Volver atrás">
                            <ArrowLeft${cleanArrow} />
                        </button>`;
    });

    if (content !== original) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated: ${path.basename(filePath)}`);
    }
}

function scanDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath);
        } else if (fullPath.endsWith('.tsx')) {
            processFile(fullPath);
        }
    }
}

scanDir(pagesDir);
console.log("Done updating back buttons.");
