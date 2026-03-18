const fs = require('fs');
const path = require('path');

const updates = [
    {
        file: 'CAPAManager.jsx',
        key: 'ehs_capa_db',
        state: 'capas',
        set: 'setCapas'
    },
    {
        file: 'LOTOManager.jsx',
        key: 'loto_procedures_db',
        state: 'procedures',
        set: 'setProcedures'
    },
    {
        file: 'EnvironmentalMonitor.jsx',
        key: 'environmental_measurements_db',
        state: 'measurements',
        set: 'setMeasurements'
    },
    {
        file: 'ConfinedSpace.jsx',
        key: 'confined_space_permits',
        state: 'permits',
        set: 'setPermits'
    },
    {
        file: 'WorkingAtHeight.jsx',
        key: 'working_at_height_permits',
        state: 'permits',
        set: 'setPermits'
    },
    {
        file: 'NoiseAssessment.jsx',
        key: 'noise_assessments_db',
        state: 'measurements',
        set: 'setMeasurements'
    }
];

const srcDir = path.join(__dirname, 'src', 'pages');

updates.forEach(({ file, key, state, set }) => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file} no encontrado`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Buscar el useEffect original y reemplazarlo
    const oldPattern = new RegExp(`useEffect\\(\\(\\) => \\{\\s*const saved = localStorage\\.getItem\\('${key}'\\);\\s*if \\(saved\\) \\{\\s*${set}\\(JSON\\.parse\\(saved\\)\\);\\s*\\}\\s*\\}, \\[\\]\\);`, 'g');
    
    const newEffect = `useEffect(() => {
        const loadData = () => {
            const saved = localStorage.getItem('${key}');
            if (saved) {
                ${set}(JSON.parse(saved));
            }
        };
        
        loadData();
        
        const handleStorageChange = (e) => {
            if (e.key === '${key}') {
                loadData();
            }
        };
        
        window.addEventListener('storage', handleStorageChange);
        
        const params = new URLSearchParams(window.location.search);
        if (params.get('created')) {
            loadData();
            window.history.replaceState({}, document.title, window.location.pathname);
        }
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);`;
    
    if (oldPattern.test(content)) {
        content = content.replace(oldPattern, newEffect);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} actualizado`);
    } else {
        console.log(`⚠️ ${file} - no se encontró el patrón (puede estar ya actualizado o tener estructura diferente)`);
    }
});

console.log('\n✅ Proceso completado');
