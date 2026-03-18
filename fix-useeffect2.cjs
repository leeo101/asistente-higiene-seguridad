const fs = require('fs');
const path = require('path');

const updates = [
    {
        file: 'EnvironmentalMonitor.jsx',
        key: 'environmental_measurements_db',
        set: 'setMeasurements',
        old: `useEffect(() => {
        const savedMeasurements = localStorage.getItem('environmental_measurements_db');
        if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements));
    }, []);`
    },
    {
        file: 'ConfinedSpace.jsx',
        key: 'confined_space_permits',
        set: 'setPermits',
        old: `useEffect(() => {
        const savedPermits = localStorage.getItem('confined_space_permits');
        if (savedPermits) setPermits(JSON.parse(savedPermits));
    }, []);`
    },
    {
        file: 'WorkingAtHeight.jsx',
        key: 'working_at_height_permits',
        set: 'setPermits',
        old: `useEffect(() => {
        const savedPermits = localStorage.getItem('working_at_height_permits');
        if (savedPermits) setPermits(JSON.parse(savedPermits));
    }, []);`
    },
    {
        file: 'NoiseAssessment.jsx',
        key: 'noise_assessments_db',
        set: 'setMeasurements',
        old: `useEffect(() => {
        const savedMeasurements = localStorage.getItem('noise_assessments_db');
        if (savedMeasurements) setMeasurements(JSON.parse(savedMeasurements));
    }, []);`
    }
];

const srcDir = path.join(__dirname, 'src', 'pages');

updates.forEach(({ file, key, set, old }) => {
    const filePath = path.join(srcDir, file);
    if (!fs.existsSync(filePath)) {
        console.log(`❌ ${file} no encontrado`);
        return;
    }
    
    let content = fs.readFileSync(filePath, 'utf8');
    
    const newEffect = `useEffect(() => {
        const loadData = () => {
            const saved = localStorage.getItem('${key}');
            if (saved) ${set}(JSON.parse(saved));
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
    
    if (content.includes(old)) {
        content = content.replace(old, newEffect);
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${file} actualizado`);
    } else {
        console.log(`⚠️ ${file} - patrón no encontrado exacto, buscando alternativa...`);
        // Try to find and replace any useEffect with localStorage.getItem for this key
        const altPattern = new RegExp(`useEffect\\(\\(\\) => \\{[\\s\\S]*?localStorage\\.getItem\\('${key}'\\)[\\s\\S]*?\\}, \\[\\]\\);`);
        if (altPattern.test(content)) {
            content = content.replace(altPattern, newEffect);
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`✅ ${file} actualizado (patrón alternativo)`);
        } else {
            console.log(`❌ ${file} - no se pudo encontrar el useEffect`);
        }
    }
});

console.log('\n✅ Proceso completado');
