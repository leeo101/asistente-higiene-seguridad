export const countryList = [
    { code: 'argentina', name: 'Argentina', flag: '🇦🇷', regionsLabel: 'Provincias' },
    { code: 'chile', name: 'Chile', flag: '🇨🇱', regionsLabel: 'Regiones' },
    { code: 'bolivia', name: 'Bolivia', flag: '🇧🇴', regionsLabel: 'Departamentos' },
    { code: 'paraguay', name: 'Paraguay', flag: '🇵🇾', regionsLabel: 'Departamentos' },
    { code: 'uruguay', name: 'Uruguay', flag: '🇺🇾', regionsLabel: 'Departamentos' }
];

export const regionalData = {
    argentina: [
        'Buenos Aires', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos', 
        'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 
        'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
        'Santiago del Estero', 'Tierra del Fuego', 'Tucumán', 'CABA'
    ],
    chile: [
        'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama', 'Coquimbo', 'Valparaíso',
        'Metropolitana', "O'Higgins", 'Maule', 'Ñuble', 'Biobío', 'Araucanía', 'Los Ríos',
        'Los Lagos', 'Aysén', 'Magallanes'
    ],
    bolivia: [
        'La Paz', 'Santa Cruz', 'Cochabamba', 'Oruro', 'Potosí', 'Tarija', 'Chuquisaca', 'Beni', 'Pando'
    ],
    paraguay: [
        'Asunción', 'Concepción', 'San Pedro', 'Cordillera', 'Guairá', 'Caaguazú', 'Caazapá',
        'Itapúa', 'Misiones', 'Paraguarí', 'Alto Paraná', 'Central', 'Ñeembucú', 'Amambay',
        'Canindeyú', 'Presidente Hayes', 'Boquerón', 'Alto Paraguay'
    ],
    uruguay: [
        'Montevideo', 'Canelones', 'Maldonado', 'Rocha', 'Treinta y Tres', 'Cerro Largo', 
        'Rivera', 'Artigas', 'Salto', 'Paysandú', 'Río Negro', 'Soriano', 'Colonia', 
        'San José', 'Flores', 'Florida', 'Durazno', 'Lavalleja', 'Tacuarembó'
    ]
};

// Mapa de Municipios Capitales por Provincia (Argentina)
export const municipalData = {
    argentina: {
        'Buenos Aires': ['La Plata', 'Bahía Blanca', 'Mar del Plata'],
        'Catamarca': ['San Fernando del Valle'],
        'Chaco': ['Resistencia'],
        'Chubut': ['Rawson', 'Comodoro Rivadavia'],
        'Córdoba': ['Córdoba Capital', 'Río Cuarto'],
        'Corrientes': ['Corrientes'],
        'Entre Ríos': ['Paraná'],
        'Formosa': ['Formosa'],
        'Jujuy': ['San Salvador de Jujuy'],
        'La Pampa': ['Santa Rosa'],
        'La Rioja': ['La Rioja'],
        'Mendoza': ['Mendoza', 'San Rafael'],
        'Misiones': ['Posadas'],
        'Neuquén': ['Neuquén'],
        'Río Negro': ['Viedma', 'Bariloche'],
        'Salta': ['Salta'],
        'San Juan': ['Capital', 'Chimbas', 'Santa Lucía', 'Rivadavia', 'Rawson'],
        'San Luis': ['San Luis'],
        'Santa Cruz': ['Río Gallegos'],
        'Santa Fe': ['Santa Fe Capital', 'Rosario'],
        'Santiago del Estero': ['Santiago del Estero'],
        'Tierra del Fuego': ['Ushuaia', 'Río Grande'],
        'Tucumán': ['San Miguel de Tucumán'],
        'CABA': ['CABA']
    }
};

export const legislationData = {
    argentina: [
        // --- LEYES NACIONALES (Ámbito: national) ---
        {
            id: 'ley-19587',
            title: 'Ley 19.587',
            subtitle: 'Higiene y Seguridad en el Trabajo',
            description: 'Ley fundamental que establece los principios generales de prevención en Argentina.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/17612/norma.htm',
            category: 'Ley Nacional',
            level: 'national'
        },
        {
            id: 'dec-351',
            title: 'Decreto 351/79',
            subtitle: 'Reglamentación General Ley 19.587',
            description: 'Reglamento principal para actividades industriales, comerciales y de servicios.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/32030/texact.htm',
            category: 'Decreto Reglamentario',
            level: 'national'
        },
        {
            id: 'ley-24557',
            title: 'Ley 24.557',
            subtitle: 'Ley de Riesgos del Trabajo (LRT)',
            description: 'Sistema de prevención y reparación de accidentes de trabajo y enfermedades profesionales.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/27971/texact.htm',
            category: 'Riesgos del Trabajo',
            level: 'national'
        },
        {
            id: 'dec-911',
            title: 'Decreto 911/96',
            subtitle: 'HyS en la Industria de la Construcción',
            description: 'Reglamento específico para la seguridad en obras y construcción.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/35000-39999/37402/norma.htm',
            category: 'Construcción',
            level: 'national'
        },
        {
            id: 'dec-617',
            title: 'Decreto 617/97',
            subtitle: 'HyS en la Actividad Agraria',
            description: 'Reglamentación específica para riesgos en el campo y agricultura.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/40000-44999/44342/norma.htm',
            category: 'Agro',
            level: 'national'
        },
        {
            id: 'dec-249',
            title: 'Decreto 249/07',
            subtitle: 'HyS en la Actividad Minera',
            description: 'Reglamento integral de seguridad e higiene para todas las etapas de minería.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/125000-129999/126131/norma.htm',
            category: 'Minería',
            level: 'national'
        },

        // --- CABA ---
        {
            id: 'ley-5920-caba',
            title: 'Ley 5.920',
            subtitle: 'Sistema de Autoprotección',
            description: 'Obligación de implementar sistemas de prevención y evacuación en CABA.',
            url: 'https://boletinoficial.buenosaires.gob.ar/',
            category: 'Seguridad',
            level: 'regional',
            region: 'CABA'
        },
        {
            id: 'ley-154-caba',
            title: 'Ley 154',
            subtitle: 'Gestión de Residuos Patogénicos',
            description: 'Regula la generación, transporte y disposición de residuos en la Ciudad.',
            url: 'https://www.buenosaires.gob.ar/',
            category: 'Ambiental',
            level: 'regional',
            region: 'CABA'
        },

        // --- BUENOS AIRES (PBA) ---
        {
            id: 'ley-15105-ba',
            title: 'Ley 15.105',
            subtitle: 'PBA - Colegio de Profesionales HyS',
            description: 'Ley de colegiación obligatoria para el ejercicio en la Provincia.',
            url: 'https://normas.gba.gob.ar/documentos/BA/L/15105',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Buenos Aires'
        },
        {
            id: 'ley-11459-ba',
            title: 'Ley 11.459',
            subtitle: 'PBA - Radicación Industrial',
            description: 'Clasificación de industrias y certificados de aptitud ambiental.',
            url: 'https://normas.gba.gob.ar/documentos/BA/L/11459',
            category: 'Industrial',
            level: 'regional',
            region: 'Buenos Aires'
        },
        {
            id: 'ley-14226-ba',
            title: 'Ley 14.226',
            subtitle: 'PBA - Comités Mixtos',
            description: 'Creación de Comisiones de Salud y Seguridad en el Empleo Público.',
            url: 'https://normas.gba.gob.ar/documentos/BA/L/14226',
            category: 'Salud Laboral',
            level: 'regional',
            region: 'Buenos Aires'
        },

        // --- MENDOZA ---
        {
            id: 'ley-9071-mza',
            title: 'Ley 9.071',
            subtitle: 'Mendoza - Colegio Profesional',
            description: 'Regula el ejercicio de la profesión y la matrícula en Mendoza.',
            url: 'https://cophisema.com.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Mendoza'
        },
        {
            id: 'ley-4974-mza',
            title: 'Ley 4.974',
            subtitle: 'Mendoza - Policía del Trabajo',
            description: 'Crea y asigna facultades de inspección a la Subsecretaría de Trabajo.',
            url: 'https://www.mendoza.gov.ar/trabajo/',
            category: 'Institucional',
            level: 'regional',
            region: 'Mendoza'
        },
        {
            id: 'dec-249-mza',
            title: 'Dec. 249/07 (Adhesión)',
            subtitle: 'Mendoza - Seguridad Minera',
            description: 'Adhesión y reglamentación del control minero provincial.',
            url: 'https://www.mendoza.gov.ar/mineria/',
            category: 'Minería',
            level: 'regional',
            region: 'Mendoza'
        },

        // --- CÓRDOBA ---
        {
            id: 'ley-10666-cba',
            title: 'Ley 10.666',
            subtitle: 'Córdoba - Colegio COPHISEC',
            description: 'Ley de creación del Colegio Profesional en la provincia de Córdoba.',
            url: 'https://cophisec.org.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Córdoba'
        },
        {
            id: 'dec-1547-cba',
            title: 'Dec. 1.547/14',
            subtitle: 'Córdoba - Registro Huellas Ambientales',
            description: 'Gestión y control de impacto en zonas industriales cordobesas.',
            url: 'https://www.cba.gov.ar/',
            category: 'Ambiental',
            level: 'regional',
            region: 'Córdoba'
        },

        // --- SANTA FE ---
        {
            id: 'ley-13907-sf',
            title: 'Ley 13.907',
            subtitle: 'Santa Fe - Colegio Profesional',
            description: 'Marco legal para el ejercicio y matrícula profesional en Santa Fe.',
            url: 'https://cpdhys.com.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Santa Fe'
        },
        {
            id: 'ley-12913-sf',
            title: 'Ley 12.913',
            subtitle: 'Santa Fe - Comités Mixtos',
            description: 'Ley pionera de Comités de Salud y Seguridad en el Trabajo.',
            url: 'https://www.santafe.gob.ar/',
            category: 'Salud Laboral',
            level: 'regional',
            region: 'Santa Fe'
        },

        // --- NEUQUÉN ---
        {
            id: 'ley-3238-nqn',
            title: 'Ley 3.238',
            subtitle: 'Neuquén - Colegio Profesional',
            description: 'Regula el ejercicio de licenciados y técnicos en Neuquén.',
            url: 'https://www.legislaturaneuquen.gob.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Neuquén'
        },
        {
            id: 'ley-1631-nqn',
            title: 'Ley 1.631/85',
            subtitle: 'Neuquén - Hidrocarburos',
            description: 'Seguridad y protección en instalaciones petroleras neuquinas.',
            url: 'https://www.legislaturaneuquen.gob.ar/',
            category: 'Petróleo',
            level: 'regional',
            region: 'Neuquén'
        },

        // --- CHUBUT ---
        {
            id: 'ley-x-70-cht',
            title: 'Ley X-70',
            subtitle: 'Chubut - Higiene y Seguridad',
            description: 'Normas de adhesión y control provincial de seguridad laboral.',
            url: 'https://www.legischubut.gov.ar/',
            category: 'Seguridad',
            level: 'regional',
            region: 'Chubut'
        },
        {
            id: 'ley-xvii-102-cht',
            title: 'Ley XVII-102',
            subtitle: 'Chubut - Gestión del Petróleo',
            description: 'Regulaciones de seguridad en yacimientos de la Cuenca del Golfo.',
            url: 'https://www.legischubut.gov.ar/',
            category: 'Petróleo',
            level: 'regional',
            region: 'Chubut'
        },

        // --- TUCUMÁN ---
        {
            id: 'ley-9176-tuc',
            title: 'Ley 9.176',
            subtitle: 'Tucumán - Colegio Profesional',
            description: 'Colegio de Licenciados y Técnicos en HyS de Tucumán.',
            url: 'https://colegiohys.com.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Tucumán'
        },
        {
            id: 'ley-6136-tuc',
            title: 'Ley 6.136',
            subtitle: 'Tucumán - Industria Sucroalcoholera',
            description: 'Normas de seguridad específicas para ingenios y destilerías.',
            url: 'https://www.legislaturatuc.gob.ar/',
            category: 'Agroindustria',
            level: 'regional',
            region: 'Tucumán'
        },

        // --- SALTA ---
        {
            id: 'ley-8163-sla',
            title: 'Ley 8.163',
            subtitle: 'Salta - Colegio Profesional',
            description: 'Matriculación y ética profesional en la provincia de Salta.',
            url: 'https://colegiohyssalta.com.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'Salta'
        },
        {
            id: 'ley-7070-sla',
            title: 'Ley 7.070',
            subtitle: 'Salta - Protección Ambiental',
            description: 'Seguridad en el manejo de agentes químicos y ambientales en Salta.',
            url: 'https://www.salta.gob.ar/',
            category: 'Ambiental',
            level: 'regional',
            region: 'Salta'
        },

        // --- SAN JUAN (Sigue completa) ---
        {
            id: 'ley-1509-a-sj',
            title: 'Ley 1.509-A',
            subtitle: 'San Juan - Colegio Profesional',
            description: 'Regula el ejercicio profesional en San Juan.',
            url: 'https://diputadossanjuan.gob.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'San Juan'
        },
        {
            id: 'ley-1025-a-sj',
            title: 'Ley 1.025-A',
            subtitle: 'San Juan - Adhesión Nac.',
            description: 'Ley de adhesión a normativas nacionales de seguridad e higiene.',
            url: 'https://diputadossanjuan.gob.ar/',
            category: 'Seguridad',
            level: 'regional',
            region: 'San Juan'
        },

        // --- RESTO DE PROVINCIAS (Colegiación) ---
        { id: 'ley-5632-cat', title: 'Ley 5.632', subtitle: 'Catamarca - Colegio Profesional', description: 'Ley de ejercicio profesional en Catamarca.', url: '#', category: 'Colegio', level: 'regional', region: 'Catamarca' },
        { id: 'ley-3250-g-cha', title: 'Ley 3.250-G', subtitle: 'Chaco - Colegio Profesional', description: 'Ley de ejercicio profesional en Chaco.', url: '#', category: 'Colegio', level: 'regional', region: 'Chaco' },
        { id: 'ley-6551-cor', title: 'Ley 6.551', subtitle: 'Corrientes - Colegio Profesional', description: 'Ley de ejercicio profesional en Corrientes.', url: '#', category: 'Colegio', level: 'regional', region: 'Corrientes' },
        { id: 'ley-10826-er', title: 'Ley 10.826', subtitle: 'Entre Ríos - Colegio Profesional', description: 'Ley de ejercicio profesional en Entre Ríos.', url: '#', category: 'Colegio', level: 'regional', region: 'Entre Ríos' },
        { id: 'ley-1638-fma', title: 'Ley 1.638', subtitle: 'Formosa - Colegio Profesional', description: 'Ley de ejercicio profesional en Formosa.', url: '#', category: 'Colegio', level: 'regional', region: 'Formosa' },
        { id: 'ley-6155-juy', title: 'Ley 6.155', subtitle: 'Jujuy - Colegio Profesional', description: 'Ley de ejercicio profesional en Jujuy.', url: '#', category: 'Colegio', level: 'regional', region: 'Jujuy' },
        { id: 'ley-3243-lpa', title: 'Ley 3.243', subtitle: 'La Pampa - Colegio Profesional', description: 'Ley de ejercicio profesional en La Pampa.', url: '#', category: 'Colegio', level: 'regional', region: 'La Pampa' },
        { id: 'ley-10274-lrj', title: 'Ley 10.274', subtitle: 'La Rioja - Colegio Profesional', description: 'Ley de ejercicio profesional en La Rioja.', url: '#', category: 'Colegio', level: 'regional', region: 'La Rioja' },
        { id: 'ley-i-165-mis', title: 'Ley I-165', subtitle: 'Misiones - Colegio Profesional', description: 'Ley de ejercicio profesional en Misiones.', url: '#', category: 'Colegio', level: 'regional', region: 'Misiones' },
        { id: 'ley-5412-rn', title: 'Ley 5.412', subtitle: 'Río Negro - Colegio Profesional', description: 'Ley de ejercicio profesional en Río Negro.', url: '#', category: 'Colegio', level: 'regional', region: 'Río Negro' },
        { id: 'ley-xiv-1042-sl', title: 'Ley XIV-1042', subtitle: 'San Luis - Colegio Profesional', description: 'Ley de ejercicio profesional en San Luis.', url: '#', category: 'Colegio', level: 'regional', region: 'San Luis' },
        { id: 'ley-3666-sc', title: 'Ley 3.666', subtitle: 'Santa Cruz - Colegio Profesional', description: 'Ley de ejercicio profesional en Santa Cruz.', url: '#', category: 'Colegio', level: 'regional', region: 'Santa Cruz' },
        { id: 'ley-7307-sde', title: 'Ley 7.307', subtitle: 'Sgo. del Estero - Colegio Profesional', description: 'Ley de ejercicio profesional en Santiago del Estero.', url: '#', category: 'Colegio', level: 'regional', region: 'Santiago del Estero' },
        { id: 'ley-1343-tdf', title: 'Ley 1.343', subtitle: 'Tierra del Fuego - Colegio Profesional', description: 'Ley de ejercicio profesional en Tierra del Fuego.', url: '#', category: 'Colegio', level: 'regional', region: 'Tierra del Fuego' },

        // --- MUNICIPALES (Capitales) ---
        { id: 'ord-mza-cap', title: 'Ord. Mendoza', subtitle: 'Mendoza Cap. - Seguridad', description: 'Habilitación y seguridad estructural de locales.', url: '#', category: 'Municipal', level: 'municipal', region: 'Mendoza', municipality: 'Mendoza' },
        { id: 'ord-cba-cap', title: 'Ord. 12052', subtitle: 'Córdoba Cap. - Incendio', description: 'Normas de prevención de incendios en el ejido urbano.', url: '#', category: 'Municipal', level: 'municipal', region: 'Córdoba', municipality: 'Córdoba Capital' },
        { id: 'ord-ros-cap', title: 'Ord. 7218', subtitle: 'Rosario - Seguridad Pública', description: 'Ordenanza sobre seguridad en espectáculos y locales.', url: '#', category: 'Municipal', level: 'municipal', region: 'Santa Fe', municipality: 'Rosario' },
        { id: 'ord-lp-cap', title: 'Ord. 10666', subtitle: 'La Plata - Habilitación', description: 'Seguridad en industrias y comercios platenses.', url: '#', category: 'Municipal', level: 'municipal', region: 'Buenos Aires', municipality: 'La Plata' },
        { id: 'ord-sj-cap', title: 'Ord. San Juan', subtitle: 'San Juan Cap. - Habilitaciones', description: 'Reglas para locales comerciales en la capital.', url: '#', category: 'Municipal', level: 'municipal', region: 'San Juan', municipality: 'Capital' }
    ],
    chile: [
        {
            id: 'ley-16744-cl',
            title: 'Ley 16.744',
            subtitle: 'Accidentes del Trabajo y Enf. Profesionales',
            description: 'Seguro obligatorio sobre accidentes del trabajo.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=28650',
            category: 'Ley Nacional',
            level: 'national'
        },
        {
            id: 'ds-594-cl',
            title: 'DS 594',
            subtitle: 'Condiciones Sanitarias y Ambientales',
            description: 'Reglamento fundamental de higiene en lugares de trabajo.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=167766',
            category: 'Decreto Supremo',
            level: 'national'
        }
    ],
    bolivia: [
        {
            id: 'dl-16998-bo',
            title: 'DL 16.998',
            subtitle: 'Ley General de Higiene y Seguridad',
            description: 'Ley base de seguridad industrial en Bolivia (Ley 1979).',
            url: 'https://www.ilo.org/dyn/natlex/',
            category: 'Ley General',
            level: 'national'
        }
    ],
    paraguay: [
        {
            id: 'dec-14390-py',
            title: 'Decreto 14.390/92',
            subtitle: 'Reglamento General Técnico de HyS',
            description: 'Seguridad, Higiene y Medicina en el Trabajo en Paraguay.',
            url: 'https://www.bacn.gov.py/',
            category: 'Reglamento',
            level: 'national'
        }
    ],
    uruguay: [
        {
            id: 'ley-5032-uy',
            title: 'Ley 5.032',
            subtitle: 'Prevención de Accidentes del Trabajo',
            description: 'Ley fundamental sobre higiene en Uruguay (Ley 1914).',
            url: 'https://www.impo.com.uy/',
            category: 'Ley Fundamental',
            level: 'national'
        },
        {
            id: 'dec-406-uy',
            title: 'Decreto 406/88',
            subtitle: 'Salud Ocupacional',
            description: 'Reglamentación de higiene para comercio e industria.',
            url: 'https://www.impo.com.uy/',
            category: 'Decreto Reglamentario',
            level: 'national'
        }
    ]
};

export const getCountryNormativa = (country) => {
    const norms = {
        argentina: {
            fire: 'Dec. 351/79 Anexo VII',
            lighting: 'Dec. 351/79 Anexo IV',
            ergo: 'Res. SRT 886/15',
            thermal: 'Res. SRT 295/03',
            general: 'Ley 19.587'
        },
        chile: {
            fire: 'DS 594 Art. 44',
            lighting: 'DS 594 Art. 103',
            ergo: 'Ley 20.949',
            thermal: 'DS 594 Art. 96',
            general: 'Ley 16.744'
        },
        bolivia: {
            fire: 'DL 16998 Art. 83',
            lighting: 'DL 16998 Art. 68',
            ergo: 'DL 16998',
            thermal: 'DL 16998 Art. 54',
            general: 'DL 16998'
        },
        paraguay: {
            fire: 'Dec 14390 Art. 147',
            lighting: 'Dec 14390 Art. 182',
            ergo: 'Dec 14390',
            thermal: 'Dec 14390 Art. 210',
            general: 'Dec 14390'
        },
        uruguay: {
            fire: 'Dec 406/88 Tít. VII',
            lighting: 'Dec 406/88 Tít. IV',
            ergo: 'Dec 406/88',
            thermal: 'Dec 406/88 Tít. V',
            general: 'Dec 406/88'
        }
    };
    return norms[country] || norms.argentina;
};
