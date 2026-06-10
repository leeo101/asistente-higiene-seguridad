const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src', 'pages');

const FILES = [
    'AICameraManager.tsx',
    'AIChatAdvisor.tsx',
    'AIGeneralCameraManager.tsx',
    'AccidentInvestigation.tsx',
    'ChecklistManager.tsx',
    'Ergonomics.tsx',
    'FireLoad.tsx',
    'History.tsx',
    'Reports.tsx',
    'RiskAssessmentHistory.tsx',
    'StopCards.tsx',
    'ToolboxTalk.tsx',
];

const NEW_BODY = `function DeleteConfirm({ onConfirm, onCancel }: any) {
    return (
        <ConfirmModal
            isOpen={true}
            onClose={onCancel}
            onConfirm={onConfirm}
            title="¿Eliminar registro?"
            message="Esta acción no se puede deshacer."
            iconEmoji="🗑️"
        />
    );
}`;

FILES.forEach(f => {
    const fpath = path.join(dir, f);
    let content = fs.readFileSync(fpath, 'utf-8');

    if (!content.includes('function DeleteConfirm')) {
        console.log('Skipped (no DeleteConfirm):', f);
        return;
    }

    // Add import if missing
    let changed = false;
    if (!content.includes("import ConfirmModal")) {
        content = content.replace(/(import React.*?[\r\n]+)/, "$1import ConfirmModal from '../components/ConfirmModal';\n");
        changed = true;
    }

    // Find the FULL function block by finding the function body start
    // The function signature is: function DeleteConfirm({ ... }) {
    // We need to find the '{' that opens the FUNCTION BODY, not the destructuring
    const funcMarker = 'function DeleteConfirm(';
    const funcIdx = content.indexOf(funcMarker);
    if (funcIdx === -1) {
        console.log('Not found:', f);
        return;
    }

    // Find the closing ')' of the parameter list, then the '{' of the body
    let parenDepth = 0;
    let paramEnd = -1;
    for (let i = funcIdx + funcMarker.length - 1; i < content.length; i++) {
        if (content[i] === '(') parenDepth++;
        else if (content[i] === ')') {
            parenDepth--;
            if (parenDepth === 0) {
                paramEnd = i;
                break;
            }
        }
    }

    if (paramEnd === -1) {
        console.log('Could not find param end:', f);
        return;
    }

    // Find the opening brace of the function body after the parameter list
    let bodyStart = -1;
    for (let i = paramEnd + 1; i < content.length; i++) {
        if (content[i] === '{') {
            bodyStart = i;
            break;
        }
    }

    if (bodyStart === -1) {
        console.log('Could not find body start:', f);
        return;
    }

    // Now count braces from bodyStart to find the matching closing brace
    let depth = 0;
    let bodyEnd = -1;
    for (let i = bodyStart; i < content.length; i++) {
        if (content[i] === '{') depth++;
        else if (content[i] === '}') {
            depth--;
            if (depth === 0) {
                bodyEnd = i;
                break;
            }
        }
    }

    if (bodyEnd === -1) {
        console.log('Could not find body end:', f);
        return;
    }

    // Replace from function start to body end
    content = content.slice(0, funcIdx) + NEW_BODY + content.slice(bodyEnd + 1);
    changed = true;

    if (changed) {
        fs.writeFileSync(fpath, content, 'utf-8');
        console.log('Updated:', f);
    }
});
