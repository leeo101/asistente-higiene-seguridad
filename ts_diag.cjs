const fs = require('fs');

const content = fs.readFileSync('src/pages/ATS.tsx', 'utf8');

// Strip JSX expressions entirely.
// This is tricky because {} can contain tags. But we know the syntax errors are mostly about fragments.
// Wait, TS compiler finds the error very quickly.

const ts = require('typescript');
const sourceFile = ts.createSourceFile('ATS.tsx', content, ts.ScriptTarget.Latest, true);

function traverse(node) {
    if (node.kind === ts.SyntaxKind.JsxElement || node.kind === ts.SyntaxKind.JsxFragment) {
        // Just checking what ts sees
    }
    ts.forEachChild(node, traverse);
}
traverse(sourceFile);

// Let's print out all diagnostic messages
const program = ts.createProgram(['src/pages/ATS.tsx'], { jsx: ts.JsxEmit.ReactJSX, noEmit: true });
const diagnostics = ts.getPreEmitDiagnostics(program);

for (let diag of diagnostics) {
    if (diag.file) {
        let { line, character } = ts.getLineAndCharacterOfPosition(diag.file, diag.start);
        console.log(`Line ${line + 1}, col ${character + 1}: ${ts.flattenDiagnosticMessageText(diag.messageText, '\n')}`);
    }
}

