const fs = require('fs');
const path = require('path');

// For each file: take the .orig version, add ConfirmModal import + state + handler, replace confirm() calls
const FILES = [
    {
        name: 'AuditPage.tsx',
        confirmPattern: /if \(confirm\(['"].*?['"]\)\)\s*save\(audits\.filter\(\(a: any\) => a\.id !== id\)\);/,
        confirmReplacement: `setConfirmModal({ isOpen: true, payload: id });`,
        deleteFunc: `del`,
        collectionVar: 'audits',
        filterExpr: `audits.filter((a: any) => a.id !== confirmModal.payload)`,
        saveFunc: 'save',
        stateDecl: `const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });`,
        executeDelete: `const executeDelete = () => {
        if (confirmModal.payload) save(audits.filter((a: any) => a.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };`,
        importLine: `import ConfirmModal from '../components/ConfirmModal';`,
        afterImport: `import EmptyStateIllustrated from '../components/EmptyStateIllustrated';`,
        confirmModalJSX: `
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, payload: null })}
                onConfirm={executeDelete}
                title="¿Eliminar auditoría?"
                message="Esta acción no se puede deshacer."
                iconEmoji="🗑️"
            />`,
        beforeReturnClose: `    );`,
    },
    {
        name: 'CAPAPage.tsx',
        confirmPattern: /if \(confirm\(['"].*?['"]\)\)\s*save\(capas\.filter\(\(c: any\) => c\.id !== id\)\);/,
        confirmReplacement: `setConfirmModal({ isOpen: true, payload: id });`,
        collectionVar: 'capas',
        saveFunc: 'save',
        stateDecl: `const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });`,
        executeDelete: `const executeDelete = () => {
        if (confirmModal.payload) save(capas.filter((c: any) => c.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };`,
        importLine: `import ConfirmModal from '../components/ConfirmModal';`,
        afterImport: `import CAPAPdf from '../components/CAPAPdf';`,
        confirmModalJSX: `
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, payload: null })}
                onConfirm={executeDelete}
                title="¿Eliminar CAPA?"
                message="Esta acción no se puede deshacer."
                iconEmoji="🗑️"
            />`,
    },
    {
        name: 'ConfinedSpacePage.tsx',
        confirmPattern: null, // uses confirm multiple times
        stateDecl: `const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });`,
        importLine: `import ConfirmModal from '../components/ConfirmModal';`,
        afterImport: `import ConfinedSpacePdf from '../components/ConfinedSpacePdf';`,
        confirmModalJSX: `
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, payload: null })}
                onConfirm={() => {
                    if (confirmModal.payload) savePermits(permits.filter((p: any) => p.id !== confirmModal.payload));
                    setConfirmModal({ isOpen: false, payload: null });
                }}
                title="¿Eliminar permiso?"
                message="Esta acción no se puede deshacer."
                iconEmoji="🗑️"
            />`,
    },
    {
        name: 'EnvironmentalPage.tsx',
        confirmPattern: /if \(confirm\(['"].*?['"]\)\)\s*save\(measurements\.filter\(\(m: any\) => m\.id !== id\)\);/,
        confirmReplacement: `setConfirmModal({ isOpen: true, payload: id });`,
        stateDecl: `const [confirmModal, setConfirmModal] = useState({ isOpen: false, payload: null as any });`,
        executeDelete: `const executeDelete = () => {
        if (confirmModal.payload) save(measurements.filter((m: any) => m.id !== confirmModal.payload));
        setConfirmModal({ isOpen: false, payload: null });
    };`,
        importLine: `import ConfirmModal from '../components/ConfirmModal';`,
        afterImport: `import EnvironmentalPdf from '../components/EnvironmentalPdf';`,
        confirmModalJSX: `
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ isOpen: false, payload: null })}
                onConfirm={executeDelete}
                title="¿Eliminar registro?"
                message="Esta acción no se puede deshacer."
                iconEmoji="🗑️"
            />`,
    },
];

FILES.forEach(cfg => {
    const origPath = path.join(__dirname, 'src', 'pages', cfg.name + '.orig');
    const destPath = path.join(__dirname, 'src', 'pages', cfg.name);

    if (!fs.existsSync(origPath)) {
        console.log('No orig found for', cfg.name);
        return;
    }

    let content = fs.readFileSync(origPath, 'utf-8');

    // 1. Add ConfirmModal import after the specified import line
    if (!content.includes('import ConfirmModal')) {
        content = content.replace(
            cfg.afterImport,
            cfg.afterImport + '\nimport ConfirmModal from \'../components/ConfirmModal\';'
        );
    }

    // 2. Replace confirm() calls
    if (cfg.name === 'ConfinedSpacePage.tsx') {
        // Multiple confirm() calls — replace all with setConfirmModal
        content = content.replace(
            /if \(confirm\(['"].*?['"]\)\)\s*savePermits\(permits\.filter\(\(p: any\) => p\.id !== id\)\);/g,
            `setConfirmModal({ isOpen: true, payload: id });`
        );
        content = content.replace(
            /if \(confirm\(['"].*?['"]\)\)\s*savePermits\(permits\.filter\(\(p: any\) => p\.id !== id\)\)/g,
            `setConfirmModal({ isOpen: true, payload: id })`
        );
    } else if (cfg.confirmPattern && cfg.confirmReplacement) {
        content = content.replace(cfg.confirmPattern, cfg.confirmReplacement);
    }

    // 3. Add state declaration after first useState line
    if (cfg.stateDecl && !content.includes('confirmModal')) {
        // Find the last useState in the component setup area
        const lastUseState = content.lastIndexOf('useState(');
        const lineEnd = content.indexOf('\n', lastUseState);
        content = content.slice(0, lineEnd + 1) + '    ' + cfg.stateDecl + '\n' + content.slice(lineEnd + 1);
    }

    // 4. Add executeDelete function after del function if needed
    if (cfg.executeDelete && !content.includes('executeDelete')) {
        // Find the del = () line and add after it
        const delIdx = content.indexOf('const del = ');
        if (delIdx !== -1) {
            const delLineEnd = content.indexOf('\n', delIdx);
            content = content.slice(0, delLineEnd + 1) + '    ' + cfg.executeDelete + '\n' + content.slice(delLineEnd + 1);
        }
    }

    // 5. Add ConfirmModal JSX before the last closing </div> of the return
    if (cfg.confirmModalJSX && !content.includes('isOpen={confirmModal.isOpen}')) {
        // Find the last </div> before the closing ); of the return
        const lastDiv = content.lastIndexOf('        </div>');
        if (lastDiv !== -1) {
            const insertPoint = lastDiv + '        </div>'.length;
            content = content.slice(0, insertPoint) + '\n' + cfg.confirmModalJSX + content.slice(insertPoint);
        }
    }

    fs.writeFileSync(destPath, content, 'utf-8');
    console.log('Fixed:', cfg.name);
});

// Cleanup .orig files
FILES.forEach(cfg => {
    const origPath = path.join(__dirname, 'src', 'pages', cfg.name + '.orig');
    if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
});

console.log('Done!');
