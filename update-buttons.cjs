const fs = require('fs');
const path = require('path');

const updates = [
    { file: 'CAPAManager.jsx', from: /onClick=\(\) => setShowAddModal\(true\)/g, to: "onClick={() => navigate('/capa-create')}" },
    { file: 'LOTOManager.jsx', from: /onClick=\(\) => setShowAddModal\(true\)/g, to: "onClick={() => navigate('/loto-create')}" },
    { file: 'EnvironmentalMonitor.jsx', from: /onClick=\(\) => setShowAddModal\(true\)/g, to: "onClick={() => navigate('/environmental-create')}" },
    { file: 'ConfinedSpace.jsx', from: /onClick=\(\) => setShowAddModal\(true\)/g, to: "onClick={() => navigate('/confined-space-create')}" },
    { file: 'WorkingAtHeight.jsx', from: /onClick=\(\) => setShowAddModal\(true\)/g, to: "onClick={() => navigate('/working-height-create')}" }
];

const srcDir = path.join(__dirname, 'src', 'pages');

updates.forEach(({ file, from, to }) => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file} no encontrado`);
        return;
    }
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(from, to);
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ ${file} actualizado`);
});

console.log('\n✅ Todos los botones actualizados');
