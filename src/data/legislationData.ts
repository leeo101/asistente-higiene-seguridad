export const countryList = [
    { code: 'argentina', name: 'Argentina (Ley 19.587 / Dec. 351/79)', shortName: 'Argentina', flag: '🇦🇷', regionsLabel: 'Provincias', mainLaw: 'Ley 19.587 / Dec. 351/79', sub: 'Resoluciones SRT & ART' },
    { code: 'chile', name: 'Chile (Ley 16.744 / DS 594 / DS 44)', shortName: 'Chile', flag: '🇨🇱', regionsLabel: 'Regiones', mainLaw: 'Ley 16.744 / DS 594 / DS 44', sub: 'SUSESO & MINSAL' },
    { code: 'uruguay', name: 'Uruguay (Ley 5.032 / Dec. 406/88)', shortName: 'Uruguay', flag: '🇺🇾', regionsLabel: 'Departamentos', mainLaw: 'Ley 5.032 / Dec. 406/88', sub: 'MTSS / IGTSS & Dec. 125/014' },
    { code: 'paraguay', name: 'Paraguay (Dec. 14.390/92 / Ley 5804)', shortName: 'Paraguay', flag: '🇵🇾', regionsLabel: 'Departamentos', mainLaw: 'Dec. 14.390/92 / Ley 5.804', sub: 'MTESS & IPS' },
    { code: 'bolivia', name: 'Bolivia (DL 16.998 / NTS)', shortName: 'Bolivia', flag: '🇧🇴', regionsLabel: 'Departamentos', mainLaw: 'DL 16.998 / NTS 001-009', sub: 'Ministerio de Trabajo & CNS' },
    { code: 'brasil', name: 'Brasil (NR-01 a NR-38 / CLT)', shortName: 'Brasil', flag: '🇧🇷', regionsLabel: 'Estados', mainLaw: 'NR-01 a NR-38 (MTE)', sub: 'Normas Regulamentadoras' },
    { code: 'mexico', name: 'México (STPS / NOMs)', shortName: 'México', flag: '🇲🇽', regionsLabel: 'Estados', mainLaw: 'STPS / NOM-001 a 037', sub: 'Normatividad Mexicana' },
    { code: 'espana', name: 'España / UE (Ley 31/1995 INSST)', shortName: 'España / UE', flag: '🇪🇸', regionsLabel: 'Comunidades Autónomas', mainLaw: 'Ley 31/1995 LPRL / RD', sub: 'INSST & Directivas UE' },
    { code: 'usa_osha', name: 'EE.UU. / OSHA & NFPA', shortName: 'OSHA (EE.UU.)', flag: '🇺🇸', regionsLabel: 'Estados / Jurisdicciones', mainLaw: 'OSHA 1910 / 1926 & NFPA', sub: 'US Federal Safety Standard' },
    { code: 'iso_global', name: 'ISO / Global (ISO 45001 & 14001)', shortName: 'ISO Global', flag: '🌐', regionsLabel: 'Estándares Internacionales', mainLaw: 'ISO 45001:2018 & 14001', sub: 'Estándar Internacional EHS' }
];

export const regionalData: Record<string, string[]> = {
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
    ],
    brasil: [
        'São Paulo', 'Rio de Janeiro', 'Minas Gerais', 'Rio Grande do Sul', 'Paraná', 'Santa Catarina', 'Bahia', 'Distrito Federal'
    ],
    mexico: [
        'Ciudad de México', 'Nuevo León', 'Jalisco', 'Estado de México', 'Querétaro', 'Guanajuato', 'Puebla', 'Chihuahua'
    ],
    espana: [
        'Madrid', 'Cataluña', 'Andalucía', 'País Vasco', 'Comunidad Valenciana', 'Galicia', 'Castilla y León', 'Aragón'
    ],
    usa_osha: [
        'Federal OSHA', 'Cal/OSHA (California)', 'MIOSHA (Michigan)', 'WA L&I (Washington)', 'NY PESH (New York)', 'Texas'
    ],
    iso_global: [
        'ISO (Organización Internacional de Normalización)', 'OIT / ILO', 'NFPA Internacional', 'IEC / IEEE'
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
        {
            id: 'res-srt-30-2023',
            title: 'Res. SRT 30/2023',
            subtitle: 'Estrés por Calor — Nueva Norma Técnica',
            description: '⚠️ VIGENTE DESDE 2024. Reemplaza el Anexo II del Dec. 351/79 sobre carga térmica. Incorpora criterios ACGIH actualizados, define VLA y VLE, exige apto médico específico para exposición al calor y protocolo de aclimatación de 5 a 14 días. También reemplaza disposiciones de los Dec. 911/96 y 249/07 en esta materia.',
            url: 'https://www.argentina.gob.ar/normativa/nacional/resolución-30-2023-387988/texto',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-7-2024',
            title: 'Res. SRT 7/2024',
            subtitle: 'Prórroga implementación Res. SRT 30/2023',
            description: 'Otorgó una prórroga de 180 días adicionales para la adecuación de los empleadores a los nuevos requisitos de evaluación de estrés por calor establecidos en la Res. 30/2023.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national'
        },
        {
            id: 'res-siyc-18-25',
            title: 'Res. SIyC 18/25',
            subtitle: 'Nuevo Reglamento Técnico para EPP',
            description: '⚠️ VIGENTE DESDE FEBRERO 2025. Deroga la Res. 896/1999. Establece nuevo sistema de certificación de EPP: acepta normas internacionales (ISO, EN, ANSI, NIOSH, NFPA, IEC). Introduce el nuevo Marcado de Conformidad "AR" (sello doble tilde + Código QR de trazabilidad). La Res. SRT 299/2011 sigue rigiendo el uso obligatorio en planta.',
            url: 'https://www.boletinoficial.gob.ar/',
            category: 'Resolución',
            level: 'national',
            isNew: true
        },
        {
            id: 'dec-549-2025',
            title: 'Decreto 549/2025',
            subtitle: 'Nuevo Baremo Laboral — Tabla de Incapacidades',
            description: '⚠️ VIGENTE DESDE AGOSTO 2025. Actualiza la Tabla de Evaluación de Incapacidades Laborales incorporando criterios científicos modernos para la determinación de secuelas incapacitantes en accidentes de trabajo y enfermedades profesionales.',
            url: 'https://www.boletinoficial.gob.ar/',
            category: 'Decreto Reglamentario',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-48-2025',
            title: 'Res. SRT 48/2025',
            subtitle: 'Ecosistema Prevención 4.0',
            description: 'Establece nuevos requisitos para prestadores tecnológicos dentro del ecosistema de gestión de riesgos del trabajo. Apunta a la modernización digital del sistema de prevención laboral y la agilización de procesos administrativos mediante tecnología.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national'
        },
        {
            id: 'res-srt-7-2026',
            title: 'Res. SRT 7/2026',
            subtitle: 'Protocolo Valoración del Daño Corporal',
            description: '⚠️ VIGENTE DESDE ENERO 2026. Aprueba el nuevo Protocolo de Estudios Mínimos para la Valoración del Daño Corporal e Incapacidad. Estandariza la recolección de evidencia médica ante Comisiones Médicas. Deroga la Res. SRT 886/17 y la Res. 3/21.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-15-2026',
            title: 'Res. SRT 15/2026',
            subtitle: 'Actualización Valores Indemnizatorios RIPTE',
            description: '⚠️ VIGENTE DESDE MARZO 2026. Actualiza los valores de compensaciones dinerarias y pisos mínimos indemnizatorios por accidentes de trabajo y enfermedades profesionales (ILP, muerte). Vigente hasta agosto 2026 según índice RIPTE.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },

        
        {
            id: 'res-srt-5-2026',
            title: 'Res. SRT 5/2026',
            subtitle: 'Comisiones Médicas',
            description: '⚠️ VIGENTE DESDE FEB 2026. Nuevos procedimientos y estrategia probatoria ante Comisiones Médicas Jurisdiccionales.',
            url: 'https://www.argentina.gob.ar/srt',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-8-2026',
            title: 'Res. SRT 8/2026',
            subtitle: 'Protocolo de Salud Mental',
            description: '⚠️ VIGENTE DESDE 2026. Nuevo Protocolo de Prestaciones en Salud Mental. Deroga la Res. SRT N° 762/13.',
            url: 'https://www.argentina.gob.ar/srt',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-20-2026',
            title: 'Res. SRT 20/2026',
            subtitle: 'Alta Médica y Formularios',
            description: 'Actualiza referencias normativas en los formularios de Alta Médica y Fin de Tratamiento.',
            url: 'https://www.argentina.gob.ar/srt',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-21-2026',
            title: 'Res. SRT 21/2026',
            subtitle: 'Incumplimientos ART',
            description: 'Establece nuevas metodologías electrónicas para comprobar y juzgar incumplimientos de las ART.',
            url: 'https://www.argentina.gob.ar/srt',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-28-2026',
            title: 'Res. SRT 28/2026',
            subtitle: 'Riesgos Psicosociales en el Trabajo',
            description: '⚠️ VIGENTE DESDE JUNIO 2026. Guía técnica para la evaluación, prevención e intervención frente a riesgos psicosociales (estrés, burnout, acoso laboral) alineada a la norma internacional ISO 45003.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'res-srt-45-2026',
            title: 'Res. SRT 45/2026',
            subtitle: 'Declaración Jurada de Riesgos',
            description: '⚠️ VIGENTE DESDE JULIO 2026. Actualiza el formulario y procedimiento de presentación anual de la Declaración Jurada de Riesgos del Trabajo y de la Ficha Técnica de Empresa ante las ART.',
            url: 'https://www.argentina.gob.ar/srt/normativa',
            category: 'Resolución SRT',
            level: 'national',
            isNew: true
        },
        {
            id: 'ley-27802',
            title: 'Ley 27.802',
            subtitle: 'Modernización Laboral',
            description: 'Promulgada en Marzo 2026. Refuerza exigencias preventivas en el agro y otros rubros.',
            url: 'https://www.boletinoficial.gob.ar/',
            category: 'Ley Nacional',
            level: 'national',
            isNew: true
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

        
        {
            id: 'ley-6912-caba',
            title: 'Ley 6.912',
            subtitle: 'CABA - Colegiación Obligatoria',
            description: '⚠️ VIGENTE DESDE ENE 2026. Establece la colegiatura obligatoria para profesionales de Higiene y Seguridad en CABA.',
            url: 'https://boletinoficial.buenosaires.gob.ar/',
            category: 'Ejercicio Profesional',
            level: 'regional',
            region: 'CABA',
            isNew: true
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
            description: 'Seguro social obligatorio contra riesgos de accidentes del trabajo y enfermedades profesionales en Chile.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=28650',
            category: 'Ley Nacional',
            level: 'national'
        },
        {
            id: 'ds-594-cl',
            title: 'DS 594 MINSAL',
            subtitle: 'Condiciones Sanitarias y Ambientales Básicas',
            description: 'Reglamento fundamental sobre higiene industrial, iluminación, ruido, carga térmica, ventilación, agentes químicos y protección contra incendios en lugares de trabajo.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=167766',
            category: 'Decreto Supremo',
            level: 'national'
        },
        {
            id: 'ds-44-cl',
            title: 'DS 44 MINTRAB',
            subtitle: 'Gestión Preventiva de Riesgos Laborales',
            description: '⚠️ PLENA VIGENCIA 2026. Reemplaza a DS 40 y 54. Exige la implementación del Sistema de Gestión de Seguridad y Salud en el Trabajo (SG-SST), matriz IPER y Comités Paritarios.',
            url: 'https://www.suseso.gob.cl/',
            category: 'Decreto Supremo',
            level: 'national',
            isNew: true
        },
        {
            id: 'ley-20949-cl',
            title: 'Ley 20.949 y TMERT',
            subtitle: 'Manejo Manual de Cargas y Ergonomía',
            description: 'Reduce el peso máximo de carga humana (25 kg hombres / 20 kg mujeres y menores) e integra la Norma Técnica de Trastornos Musculoesqueléticos (TMERT).',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=1094899',
            category: 'Ergonomía',
            level: 'national'
        },
        {
            id: 'prexor-cl',
            title: 'Protocolo PREXOR',
            subtitle: 'Exposición Ocupacional a Ruido (MINSAL)',
            description: 'Protocolo oficial de vigilancia ambiental y de la salud de los trabajadores con exposición ocupacional a ruido.',
            url: 'https://www.minsal.cl/',
            category: 'Protocolo MINSAL',
            level: 'national'
        },
        {
            id: 'circ-3914-suseso',
            title: 'Circular 3.914 SUSESO',
            subtitle: 'Empresas con Lugares Compartidos',
            description: '⚠️ VIGENTE DESDE MARZO 2026. Nuevas medidas de seguridad e información mutua para empresas que comparten un mismo lugar de trabajo.',
            url: 'https://www.suseso.gob.cl/',
            category: 'Circular',
            level: 'national',
            isNew: true
        }
    ],
    bolivia: [
        {
            id: 'dl-16998-bo',
            title: 'DL 16.998',
            subtitle: 'Ley General de Higiene, Seguridad Ocupacional y Bienestar',
            description: 'Ley base de seguridad industrial, salud ocupacional y condiciones de medio ambiente de trabajo en Bolivia.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Ley General',
            level: 'national'
        },
        {
            id: 'nts-001-bo',
            title: 'NTS-001/17',
            subtitle: 'Iluminación en los Lugares de Trabajo',
            description: 'Norma Técnica de Seguridad que establece los niveles mínimos de iluminancia y metodología de medición luxométrica en Bolivia.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Norma Técnica NTS',
            level: 'national'
        },
        {
            id: 'nts-002-bo',
            title: 'NTS-002/17',
            subtitle: 'Ruido Ocupacional',
            description: 'Norma Técnica de Seguridad para la evaluación, medición de dosis de ruido y conservación auditiva.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Norma Técnica NTS',
            level: 'national'
        },
        {
            id: 'nts-003-bo',
            title: 'NTS-003/17',
            subtitle: 'Trabajos en Altura',
            description: 'Condiciones mínimas de seguridad para trabajos realizados a partir de 1,80 metros de altura.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Norma Técnica NTS',
            level: 'national'
        },
        {
            id: 'nts-008-bo',
            title: 'NTS-008/17',
            subtitle: 'Trabajos en Espacios Confinados',
            description: 'Requisitos obligatorios para permisos de entrada, monitoreo atmosférico y vigía en espacios confinados.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Norma Técnica NTS',
            level: 'national'
        },
        {
            id: 'nts-009-bo',
            title: 'NTS-009/18',
            subtitle: 'Programa de Gestión de Seguridad y Salud en el Trabajo (PGSSST)',
            description: 'Regulación para la presentación y aprobación de los Programas de Gestión de Seguridad y Salud en el Trabajo.',
            url: 'https://www.mintrabajo.gob.bo/',
            category: 'Norma Técnica NTS',
            level: 'national',
            isNew: true
        }
    ],
    paraguay: [
        {
            id: 'dec-14390-py',
            title: 'Decreto 14.390/92',
            subtitle: 'Reglamento General Técnico de Seguridad, Higiene y Medicina en el Trabajo',
            description: 'Marco reglamentario integral de prevención de riesgos laborales, incendios, iluminación, ruido, carga térmica, electricidad y EPP en Paraguay.',
            url: 'https://www.bacn.gov.py/',
            category: 'Reglamento Nacional',
            level: 'national'
        },
        {
            id: 'ley-5804-py',
            title: 'Ley 5.804/17',
            subtitle: 'Sistema Nacional de Prevención de Riesgos Laborales',
            description: 'Establece el Sistema Nacional de Prevención de Riesgos Laborales y las obligaciones de gestión preventiva para empleadores en Paraguay.',
            url: 'https://www.bacn.gov.py/',
            category: 'Ley Nacional',
            level: 'national',
            isNew: true
        },
        {
            id: 'ley-213-py',
            title: 'Ley 213/93',
            subtitle: 'Código del Trabajo — Título V Seguridad, Higiene y Comodidad',
            description: 'Disposiciones legales sobre seguridad e higiene en el trabajo, servicios médicos y Comisiones Internas de Prevención de Accidentes (CIPA).',
            url: 'https://www.mtess.gov.py/',
            category: 'Código Laboral',
            level: 'national'
        },
        {
            id: 'res-mtess-py',
            title: 'Res. MTESS 616/14 & 846',
            subtitle: 'Trabajos de Alto Riesgo y Registro de Técnicos en SST',
            description: 'Normativa sobre trabajos en altura, permisos de trabajo e inscripción de profesionales de Seguridad y Salud Ocupacional ante el MTESS.',
            url: 'https://www.mtess.gov.py/',
            category: 'Resolución MTESS',
            level: 'national'
        }
    ],
    uruguay: [
        {
            id: 'ley-5032-uy',
            title: 'Ley 5.032',
            subtitle: 'Prevención de Accidentes del Trabajo',
            description: 'Ley fundamental de responsabilidad preventiva y resguardo de seguridad para los trabajadores en Uruguay.',
            url: 'https://www.impo.com.uy/',
            category: 'Ley Fundamental',
            level: 'national'
        },
        {
            id: 'dec-406-uy',
            title: 'Decreto 406/988',
            subtitle: 'Seguridad, Higiene y Salud Ocupacional (Industria, Comercio y Servicios)',
            description: 'Reglamentación técnica de condiciones edilicias, iluminación, ruido, confort térmico, riesgo eléctrico, maquinaria, incendios y EPP.',
            url: 'https://www.impo.com.uy/bases/decretos/406-1988',
            category: 'Decreto Reglamentario',
            level: 'national'
        },
        {
            id: 'dec-125-014-uy',
            title: 'Decreto 125/014',
            subtitle: 'Seguridad e Higiene en la Industria de la Construcción',
            description: 'Reglamento integral de seguridad en obras de construcción, trabajo en altura, excavaciones, andamios y estudio de seguridad e higiene.',
            url: 'https://www.impo.com.uy/bases/decretos/125-2014',
            category: 'Construcción',
            level: 'national',
            isNew: true
        },
        {
            id: 'dec-291-007-uy',
            title: 'Decreto 291/007 y 127/014',
            subtitle: 'Gestión de Prevención y Servicios de Salud y Seguridad en el Trabajo',
            description: 'Reglamenta el Convenio OIT 155 y 161: comisiones bipartitas de seguridad y obligatoriedad de Servicios de Prevención y Salud en el Trabajo.',
            url: 'https://www.impo.com.uy/',
            category: 'Gestión SST',
            level: 'national'
        },
        {
            id: 'dec-307-009-uy',
            title: 'Decreto 307/009',
            subtitle: 'Protección de la Salud y Seguridad contra Riesgos Químicos',
            description: 'Obligatoriedad de etiquetado SGA/GHS, fichas de datos de seguridad y evaluación de contaminantes químicos.',
            url: 'https://www.impo.com.uy/bases/decretos/307-2009',
            category: 'Riesgo Químico',
            level: 'national'
        }
    ],
    brasil: [
        {
            id: 'nr-01-br',
            title: 'NR-01 (GRO / PGR)',
            subtitle: 'Disposições Gerais e Gerenciamento de Riscos Ocupacionais',
            description: 'Establece el Gerenciamento de Riscos Ocupacionais (GRO) y el Programa de Gerenciamento de Riscos (PGR) obligatorio en Brasil.',
            url: 'https://www.gov.br/trabalho-e-emprego/pt-br/assuntos/inspecao-do-trabalho/seguranca-e-saude-no-trabalho/ctpp-nrs/normas-regulamentadoras-nrs',
            category: 'Norma Regulamentadora',
            level: 'national',
            isNew: true
        },
        {
            id: 'nr-06-br',
            title: 'NR-06 (EPI)',
            subtitle: 'Equipamentos de Proteção Individual e Certificado de Aprovação (CA)',
            description: 'Regula el suministro gratuito, registro de entrega y exigencia de Certificado de Aprovação (CA) para todo EPI.',
            url: 'https://www.gov.br/trabalho-e-emprego/pt-br',
            category: 'Norma Regulamentadora',
            level: 'national'
        },
        {
            id: 'nr-10-br',
            title: 'NR-10',
            subtitle: 'Segurança em Instalações e Serviços em Eletricidade',
            description: 'Requisitos de seguridad eléctrica, puesta a tierra (SPDA/aterramento), bloqueo LOTO y arco eléctrico.',
            url: 'https://www.gov.br/trabalho-e-emprego/pt-br',
            category: 'Norma Regulamentadora',
            level: 'national'
        },
        {
            id: 'nr-15-17-br',
            title: 'NR-15 & NR-17',
            subtitle: 'Atividades Insalubres (Ruído, Calor, Químicos) e Ergonomia (AET)',
            description: 'Límites de tolerancia de higiene ocupacional (junto con NHO Fundacentro) y Análise Ergonômica do Trabalho (AET).',
            url: 'https://www.gov.br/trabalho-e-emprego/pt-br',
            category: 'Higiene y Ergonomía',
            level: 'national'
        },
        {
            id: 'nr-33-35-br',
            title: 'NR-33 & NR-35',
            subtitle: 'Espaços Confinados (PET) e Trabalho em Altura',
            description: 'Permissão de Entrada e Trabalho (PET) en espacios confinados y análisis de riesgo para trabajo en altura (> 2,00 m).',
            url: 'https://www.gov.br/trabalho-e-emprego/pt-br',
            category: 'Tareas Críticas',
            level: 'national'
        }
    ],
    mexico: [
        {
            id: 'rfshmat-mx',
            title: 'LFT & RFSHMAT',
            subtitle: 'Reglamento Federal de Seguridad y Salud en el Trabajo (STPS)',
            description: 'Marco regulatorio federal de la Secretaría del Trabajo y Previsión Social (STPS) para centros de trabajo en México.',
            url: 'https://www.gob.mx/stps',
            category: 'Reglamento Federal',
            level: 'national'
        },
        {
            id: 'nom-002-stps',
            title: 'NOM-002-STPS',
            subtitle: 'Prevención y Protección contra Incendios en los Centros de Trabajo',
            description: 'Clasificación del grado de riesgo de incendio, dotación de extintores, brigadas y simulacros de evacuación.',
            url: 'https://www.gob.mx/stps',
            category: 'NOM-STPS',
            level: 'national'
        },
        {
            id: 'nom-011-025-stps',
            title: 'NOM-011, NOM-015, NOM-022 y NOM-025-STPS',
            subtitle: 'Ruido, Condiciones Térmicas, Electricidad Estática/PAT e Iluminación',
            description: 'Normas Oficiales Mexicanas de higiene industrial y protocolos de medición acreditados.',
            url: 'https://www.gob.mx/stps',
            category: 'NOM-STPS',
            level: 'national'
        },
        {
            id: 'nom-009-033-stps',
            title: 'NOM-009, NOM-017, NOM-033 y NOM-036-STPS',
            subtitle: 'Trabajo en Altura, EPP, Espacios Confinados y Ergonomía',
            description: 'Requisitos de permisos para tareas críticas, selección de EPP y manejo manual de cargas.',
            url: 'https://www.gob.mx/stps',
            category: 'NOM-STPS',
            level: 'national'
        }
    ],
    espana: [
        {
            id: 'ley-31-1995-es',
            title: 'Ley 31/1995 (LPRL)',
            subtitle: 'Ley de Prevención de Riesgos Laborales (España / Directiva Marco UE)',
            description: 'Norma fundamental de prevención de riesgos laborales, evaluación de riesgos, planificación preventiva y vigilancia de la salud.',
            url: 'https://www.insst.es/',
            category: 'Ley Estatal',
            level: 'national'
        },
        {
            id: 'rd-486-1997-es',
            title: 'RD 486/1997 & RD 614/2001',
            subtitle: 'Lugares de Trabajo (Iluminación, Ambiente Térmico) y Riesgo Eléctrico',
            description: 'Reales Decretos sobre condiciones mínimas de seguridad y salud en los lugares de trabajo e instalaciones eléctricas.',
            url: 'https://www.insst.es/',
            category: 'Real Decreto',
            level: 'national'
        },
        {
            id: 'rd-1627-1997-es',
            title: 'RD 1627/1997 & RD 773/1997',
            subtitle: 'Obras de Construcción y Equipos de Protección Individual (EPI)',
            description: 'Estudio y Plan de Seguridad y Salud en obras y utilización de EPI con marcado CE.',
            url: 'https://www.insst.es/',
            category: 'Real Decreto',
            level: 'national'
        }
    ],
    usa_osha: [
        {
            id: 'osha-1910-us',
            title: 'OSHA 29 CFR 1910',
            subtitle: 'Occupational Safety and Health Standards — General Industry',
            description: 'Estándares federales de EE.UU. para industria general: LOTO (1910.147), Espacios Confinados (1910.146), Ruido (1910.95), EPP (1910.132) y HazCom (1910.1200).',
            url: 'https://www.osha.gov/laws-regs',
            category: 'Federal Standard',
            level: 'national'
        },
        {
            id: 'osha-1926-us',
            title: 'OSHA 29 CFR 1926',
            subtitle: 'Safety and Health Regulations for Construction',
            description: 'Estándares de seguridad en construcción: Protección contra caídas (Subpart M), Excavaciones (Subpart P), Andamios y Grúas.',
            url: 'https://www.osha.gov/laws-regs',
            category: 'Construction Standard',
            level: 'national'
        },
        {
            id: 'nfpa-standards-us',
            title: 'NFPA 10, 51B, 70E & 101',
            subtitle: 'National Fire Protection Association Standards',
            description: 'Normas técnicas de extintores portátiles (NFPA 10), trabajo en caliente (NFPA 51B), seguridad eléctrica y arco eléctrico (NFPA 70E) y evacuación (NFPA 101).',
            url: 'https://www.nfpa.org/',
            category: 'NFPA Standard',
            level: 'national'
        }
    ],
    iso_global: [
        {
            id: 'iso-45001-global',
            title: 'ISO 45001:2018',
            subtitle: 'Sistemas de Gestión de la Seguridad y Salud en el Trabajo (SG-SST)',
            description: 'Estándar internacional para la identificación de peligros, evaluación de riesgos, control operacional y mejora continua en SST.',
            url: 'https://www.iso.org/iso-45001-occupational-health-and-safety.html',
            category: 'Estándar ISO',
            level: 'national',
            isNew: true
        },
        {
            id: 'iso-14001-global',
            title: 'ISO 14001:2015',
            subtitle: 'Sistemas de Gestión Ambiental (SGA)',
            description: 'Norma internacional para el control de aspectos e impactos ambientales, efluentes, emisiones y gestión de residuos.',
            url: 'https://www.iso.org/iso-14001-environmental-management.html',
            category: 'Estándar ISO',
            level: 'national'
        },
        {
            id: 'iso-31000-45003-global',
            title: 'ISO 31000:2018 & ISO 45003:2021',
            subtitle: 'Gestión del Riesgo y Salud Psicosocial en el Trabajo',
            description: 'Directrices internacionales para matrices de evaluación de riesgos (IPERC) y prevención de riesgos psicosociales.',
            url: 'https://www.iso.org/',
            category: 'Estándar ISO',
            level: 'national'
        }
    ]
};

export interface CountryNormativa {
    name: string;
    flag: string;
    shortCode: string;
    authority: string;
    general: string;
    decree: string;
    fire: string;
    lighting: string;
    noise: string;
    ergo: string;
    thermal: string;
    thermalOld: string;
    psicosocial: string;
    saludMental: string;
    epp: string;
    height: string;
    confined: string;
    loto: string;
    grounding: string;
    chemical: string;
    construction: string;
    forklifts: string;
    ventilation: string;
    rgrl: string;
    rar: string;
    medical: string;
    waste: string;
    environment: string;
    firstAid: string;
    arcFlash: string;
    racks: string;
    legajos: string;
}

export const normalizeCountryCode = (code?: string | null): string => {
    if (!code) return 'argentina';
    const clean = code.toLowerCase().trim();
    const aliasMap: Record<string, string> = {
        local: 'argentina',
        arg: 'argentina',
        cl: 'chile',
        uy: 'uruguay',
        py: 'paraguay',
        bo: 'bolivia',
        br: 'brasil',
        nr_brasil: 'brasil',
        nr: 'brasil',
        mx: 'mexico',
        stps: 'mexico',
        es: 'espana',
        osha: 'usa_osha',
        usa: 'usa_osha',
        iso45001: 'iso_global',
        iso14001: 'iso_global',
        iso: 'iso_global'
    };
    return aliasMap[clean] || (countryList.some((c) => c.code === clean) ? clean : 'argentina');
};

export const getCountryNormativa = (country?: string | null): CountryNormativa => {
    const code = normalizeCountryCode(country);
    const norms: Record<string, CountryNormativa> = {
        argentina: {
            name: 'Argentina',
            flag: '🇦🇷',
            shortCode: 'ARG',
            authority: 'SRT / ART',
            general: 'Ley 19.587',
            decree: 'Dec. 351/79',
            fire: 'Dec. 351/79 Anexo VII',
            lighting: 'Res. SRT 84/12',
            noise: 'Res. SRT 85/12',
            ergo: 'Res. SRT 886/15',
            thermal: 'Res. SRT 30/23 & 295/03',
            thermalOld: 'Res. SRT 295/03 (derogada)',
            psicosocial: 'Res. SRT 28/2026',
            saludMental: 'Res. SRT 8/2026',
            epp: 'Res. SRT 299/11',
            height: 'Res. SRT 61/23',
            confined: 'Res. SRT 953/10',
            loto: 'Dec. 351/79 & OSHA',
            grounding: 'Res. SRT 900/15',
            chemical: 'Res. 295/03 & 801/15',
            construction: 'Dec. 911/96',
            forklifts: 'Res. SRT 960/15',
            ventilation: 'Dec. 351/79 Anexo III',
            rgrl: 'Res. SRT 463/09',
            rar: 'Res. SRT 37/10 & 81/19',
            medical: 'Res. SRT 37/10',
            waste: 'Ley 24.051',
            environment: 'Ley 25.675',
            firstAid: 'Ley 27.159',
            arcFlash: 'NFPA 70E & Res. 3068/14',
            racks: 'IRAM 38500',
            legajos: 'Dec. 351/79'
        },
        chile: {
            name: 'Chile',
            flag: '🇨🇱',
            shortCode: 'CHL',
            authority: 'SUSESO / MINSAL',
            general: 'Ley 16.744',
            decree: 'DS 594 / DS 44',
            fire: 'DS 594 Art. 44',
            lighting: 'DS 594 Art. 103',
            noise: 'DS 594 / PREXOR',
            ergo: 'Ley 20.949 / TMERT',
            thermal: 'DS 594 Art. 96',
            thermalOld: 'DS 594 Tít. IV',
            psicosocial: 'Protocolo CEAL-SM / SUSESO',
            saludMental: 'Protocolo Vigilancia Psicosocial',
            epp: 'DS 594 Art. 53 / ISP',
            height: 'DS 44 / Guía ISP Altura',
            confined: 'DS 44 / Guía MINSAL',
            loto: 'DS 44 / Regl. SEC',
            grounding: 'RIC N°06 SEC / DS 594',
            chemical: 'DS 594 & DS 43 SGA',
            construction: 'DS 44 / Ley 16.744',
            forklifts: 'DS 594 Art. 43 / Ley 18.290',
            ventilation: 'DS 594 Art. 32 a 35',
            rgrl: 'DS 44 Matriz IPER',
            rar: 'Vigilancia MINSAL / SUSESO',
            medical: 'Ley 16.744 / MINSAL',
            waste: 'DS 148 MINSAL',
            environment: 'Ley 19.300 MMA',
            firstAid: 'Ley 21.156 DEA',
            arcFlash: 'NFPA 70E & RIC SEC',
            racks: 'NCh / EN 15635',
            legajos: 'DS 44 SG-SST'
        },
        uruguay: {
            name: 'Uruguay',
            flag: '🇺🇾',
            shortCode: 'URY',
            authority: 'MTSS / IGTSS / BSE',
            general: 'Ley 5.032',
            decree: 'Dec. 406/88',
            fire: 'Dec. 406/88 Tít. VII',
            lighting: 'Dec. 406/88 Tít. IV',
            noise: 'Dec. 143/012 / Dec. 406/88',
            ergo: 'Dec. 406/88 / Dec. 423',
            thermal: 'Dec. 406/88 Tít. V',
            thermalOld: 'Dec. 406/88',
            psicosocial: 'Comisión Bipartita Dec. 291/007',
            saludMental: 'Ley 19.529 Salud Mental',
            epp: 'Dec. 406/88 Tít. VIII',
            height: 'Dec. 125/014 Cap. VI',
            confined: 'Dec. 406/88 / Dec. 125/014',
            loto: 'Dec. 406/88 Tít. VI',
            grounding: 'Dec. 406/88 / Regl. UTE',
            chemical: 'Dec. 307/009 Químicos',
            construction: 'Dec. 125/014 Construcción',
            forklifts: 'Dec. 406/88 Tít. VI',
            ventilation: 'Dec. 406/88 Tít. IV',
            rgrl: 'Dec. 291/007 Evaluación',
            rar: 'Ordenanza MSP 145/09',
            medical: 'Dec. 127/014 / MSP',
            waste: 'Dec. 182/013 DINAMA',
            environment: 'Ley 17.283 Ambiental',
            firstAid: 'Ley 18.360 DEA',
            arcFlash: 'NFPA 70E & Dec. 406/88',
            racks: 'UNIT / EN 15635',
            legajos: 'Dec. 406/88 & Dec. 125/014'
        },
        paraguay: {
            name: 'Paraguay',
            flag: '🇵🇾',
            shortCode: 'PRY',
            authority: 'MTESS / IPS',
            general: 'Dec. 14.390/92',
            decree: 'Dec. 14.390/92 & Ley 5804',
            fire: 'Dec. 14.390 Art. 147',
            lighting: 'Dec. 14.390 Art. 182',
            noise: 'Dec. 14.390 Art. 217',
            ergo: 'Dec. 14.390 Ergonomía',
            thermal: 'Dec. 14.390 Art. 210',
            thermalOld: 'Dec. 14.390/92',
            psicosocial: 'Ley 5.804/17 Prevención',
            saludMental: 'Ley 5.804/17 Salud Ocup.',
            epp: 'Dec. 14.390 Art. 249',
            height: 'Res. MTESS 616/14 Altura',
            confined: 'Dec. 14.390 Esp. Confinados',
            loto: 'Dec. 14.390 Bloqueo',
            grounding: 'Dec. 14.390 / INTN ANDE',
            chemical: 'Dec. 14.390 Sust. Químicas',
            construction: 'Dec. 14.390 Obras Civiles',
            forklifts: 'Dec. 14.390 Aparatos Elev.',
            ventilation: 'Dec. 14.390 Ventilación',
            rgrl: 'Ley 5.804/17 Evaluación',
            rar: 'Dec. 14.390 Vigilancia',
            medical: 'Ley 213/93 & IPS',
            waste: 'Ley 42/90 & MADES',
            environment: 'Ley 294/93 MADES',
            firstAid: 'Dec. 14.390 Primeros Aux.',
            arcFlash: 'NFPA 70E & Regl. ANDE',
            racks: 'INTN / EN 15635',
            legajos: 'Dec. 14.390/92 MTESS'
        },
        bolivia: {
            name: 'Bolivia',
            flag: '🇧🇴',
            shortCode: 'BOL',
            authority: 'Min. Trabajo / CNS',
            general: 'DL 16.998',
            decree: 'DL 16.998 / NTS',
            fire: 'DL 16.998 Art. 83',
            lighting: 'NTS-001/17 Iluminación',
            noise: 'NTS-002/17 Ruido',
            ergo: 'DL 16.998 Ergonomía',
            thermal: 'DL 16.998 Art. 54',
            thermalOld: 'DL 16.998',
            psicosocial: 'DL 16.998 Bienestar',
            saludMental: 'DL 16.998 Salud Ocup.',
            epp: 'DL 16.998 Art. 372',
            height: 'NTS-003/17 Altura',
            confined: 'NTS-008/17 Confinados',
            loto: 'DL 16.998 Cap. Eléctrico',
            grounding: 'DL 16.998 / NB 777',
            chemical: 'DL 16.998 Sust. Peligrosas',
            construction: 'NTS-009/18 Construcción',
            forklifts: 'DL 16.998 Aparatos',
            ventilation: 'DL 16.998 Art. 61',
            rgrl: 'NTS-009/18 PGSSST',
            rar: 'DL 16.998 Vigilancia',
            medical: 'RM 068/94 Med. Trabajo',
            waste: 'Ley 1333 & Ley 755',
            environment: 'Ley 1333 Medio Ambiente',
            firstAid: 'DL 16.998 Primeros Aux.',
            arcFlash: 'NFPA 70E & NB 777',
            racks: 'IBNORCA / EN 15635',
            legajos: 'NTS-009/18 PGSSST'
        },
        brasil: {
            name: 'Brasil',
            flag: '🇧🇷',
            shortCode: 'BRA',
            authority: 'MTE / SIT / eSocial',
            general: 'NR-01 / CLT',
            decree: 'NR-01 a NR-38',
            fire: 'NR-23 / IT Corpo Bombeiros',
            lighting: 'NHO 11 / NR-17',
            noise: 'NR-15 Anexo 1 / NHO 01',
            ergo: 'NR-17 Ergonomia (AET)',
            thermal: 'NR-15 Anexo 3 / NHO 06',
            thermalOld: 'NR-15',
            psicosocial: 'NR-01 Riscos Psicossociais',
            saludMental: 'NR-07 PCMSO',
            epp: 'NR-06 EPI (CA)',
            height: 'NR-35 Trabalho em Altura',
            confined: 'NR-33 Espaços Confinados',
            loto: 'NR-10 & NR-12 Bloqueio',
            grounding: 'NR-10 & NBR 5419 SPDA',
            chemical: 'NR-15 & NR-26 GHS',
            construction: 'NR-18 Construção Civil',
            forklifts: 'NR-11 Transporte & Mov.',
            ventilation: 'NR-15 & NR-17 Conforto',
            rgrl: 'NR-01 GRO / PGR',
            rar: 'eSocial S-2240 / LTCAT',
            medical: 'NR-07 PCMSO / ASO',
            waste: 'Lei 12.305/10 PNRS',
            environment: 'CONAMA / Lei 6.938',
            firstAid: 'NR-07 Primeiros Socorros',
            arcFlash: 'NR-10 & NFPA 70E',
            racks: 'NBR 15524 / NR-11',
            legajos: 'PGR & LTCAT (NR-01)'
        },
        mexico: {
            name: 'México',
            flag: '🇲🇽',
            shortCode: 'MEX',
            authority: 'STPS / IMSS',
            general: 'LFT / RFSHMAT',
            decree: 'NOM-001 a 037 STPS',
            fire: 'NOM-002-STPS',
            lighting: 'NOM-025-STPS',
            noise: 'NOM-011-STPS',
            ergo: 'NOM-036-1-STPS',
            thermal: 'NOM-015-STPS',
            thermalOld: 'NOM-015-STPS',
            psicosocial: 'NOM-035-STPS',
            saludMental: 'NOM-035-STPS',
            epp: 'NOM-017-STPS',
            height: 'NOM-009-STPS',
            confined: 'NOM-033-STPS',
            loto: 'NOM-004-STPS',
            grounding: 'NOM-022-STPS',
            chemical: 'NOM-010 & NOM-018-STPS',
            construction: 'NOM-031-STPS',
            forklifts: 'NOM-006-STPS',
            ventilation: 'NOM-001-STPS',
            rgrl: 'NOM-030-STPS Diagnóstico',
            rar: 'NOM-030-STPS Vigilancia',
            medical: 'NOM-030-STPS Salud',
            waste: 'LGEEPA / NOM-052-SEMARNAT',
            environment: 'LGEEPA / SEMARNAT',
            firstAid: 'NOM-005 / Guía STPS',
            arcFlash: 'NOM-029-STPS & NFPA 70E',
            racks: 'NOM-006-STPS Estiba',
            legajos: 'NOM-030-STPS'
        },
        espana: {
            name: 'España / UE',
            flag: '🇪🇸',
            shortCode: 'ESP',
            authority: 'INSST / ITSS',
            general: 'Ley 31/1995 LPRL',
            decree: 'RD 39/1997 & RD 486/1997',
            fire: 'RD 513/2017 RIPCI / RSCIEI',
            lighting: 'RD 486/1997 Anexo IV',
            noise: 'RD 286/2006 Ruido',
            ergo: 'RD 487/1997 & RD 488/1997',
            thermal: 'RD 486/1997 Anexo III',
            thermalOld: 'RD 486/1997',
            psicosocial: 'Criterio Técnico ITSS 104/21',
            saludMental: 'Ley 31/1995 Vigilancia',
            epp: 'RD 773/1997 EPI (CE)',
            height: 'RD 2177/2004 Altura',
            confined: 'NTP 223 INSST / RD 486',
            loto: 'RD 614/2001 & RD 1215/1997',
            grounding: 'RD 842/2002 REBT',
            chemical: 'RD 374/2001 & CLP UE',
            construction: 'RD 1627/1997 Obras',
            forklifts: 'RD 1215/1997 / NTP 713',
            ventilation: 'RD 486/1997 / RITE',
            rgrl: 'Ley 31/1995 Art. 16 Eval.',
            rar: 'RD 665/1997 Exposición',
            medical: 'Ley 31/1995 Art. 22 Salud',
            waste: 'Ley 7/2022 Residuos',
            environment: 'Ley 21/2013 Evaluación Amb.',
            firstAid: 'RD 486/1997 Anexo VI',
            arcFlash: 'RD 614/2001 & NFPA 70E',
            racks: 'UNE-EN 15635 / NTP 852',
            legajos: 'Ley 31/1995 Art. 23 Doc.'
        },
        usa_osha: {
            name: 'EE.UU. (OSHA)',
            flag: '🇺🇸',
            shortCode: 'OSHA',
            authority: 'OSHA / NIOSH',
            general: 'OSHA 29 CFR 1910',
            decree: '29 CFR 1910 & 1926',
            fire: 'OSHA 1910.157 / NFPA 10',
            lighting: 'OSHA 1910 / IESNA',
            noise: 'OSHA 1910.95 HCA',
            ergo: 'OSHA / NIOSH Lifting Eq.',
            thermal: 'OSHA / ACGIH WBGT',
            thermalOld: 'NIOSH Heat Standard',
            psicosocial: 'ISO 45003 / NIOSH Total Worker',
            saludMental: 'OSHA Workplace Stress',
            epp: 'OSHA 1910.132 PPE',
            height: 'OSHA 1926.501 Fall Prot.',
            confined: 'OSHA 1910.146 PRCS',
            loto: 'OSHA 1910.147 LOTO',
            grounding: 'OSHA 1910.304 / NEC NFPA 70',
            chemical: 'OSHA 1910.1200 HazCom',
            construction: 'OSHA 29 CFR 1926',
            forklifts: 'OSHA 1910.178 PIT',
            ventilation: 'OSHA 1910.94 / ASHRAE',
            rgrl: 'OSHA Form 300A / JHA',
            rar: 'OSHA Exposure Records',
            medical: 'OSHA 1910.1020 Medical',
            waste: 'EPA RCRA 40 CFR 260',
            environment: 'EPA Clean Air & Water Act',
            firstAid: 'OSHA 1910.151 First Aid/AED',
            arcFlash: 'NFPA 70E / OSHA 1910.333',
            racks: 'ANSI MH16.1 / RMI',
            legajos: 'OSHA Recordkeeping 1904'
        },
        iso_global: {
            name: 'ISO / Global',
            flag: '🌐',
            shortCode: 'ISO',
            authority: 'ISO / OIT',
            general: 'ISO 45001:2018',
            decree: 'ISO 45001 & ISO 14001',
            fire: 'ISO 45001 / NFPA 10',
            lighting: 'ISO 8995-1 (CIE)',
            noise: 'ISO 9612 Acústica',
            ergo: 'ISO 11228-1/2/3',
            thermal: 'ISO 7243 (WBGT)',
            thermalOld: 'ISO 7243',
            psicosocial: 'ISO 45003:2021',
            saludMental: 'ISO 45003:2021',
            epp: 'ISO 45001 Cl. 8.1.2',
            height: 'ISO 10333 Anticaídas',
            confined: 'ISO 45001 Permisos',
            loto: 'ISO 14118 Bloqueo',
            grounding: 'IEC 60364-5-54',
            chemical: 'GHS / SGA Naciones Unidas',
            construction: 'ISO 45001 Obras',
            forklifts: 'ISO 3691-1 Carretillas',
            ventilation: 'ISO 16890 / ASHRAE',
            rgrl: 'ISO 45001 Cl. 6.1.2 IPERC',
            rar: 'OIT C161 Vigilancia',
            medical: 'OIT C161 Salud Ocup.',
            waste: 'ISO 14001:2015 Residuos',
            environment: 'ISO 14001:2015',
            firstAid: 'ISO 45001 Cl. 8.2 Emerg.',
            arcFlash: 'IEC 61482 / NFPA 70E',
            racks: 'EN 15635 / FEM 10.2.04',
            legajos: 'ISO 45001 Cl. 7.5 Doc.'
        }
    };
    return norms[code] || norms.argentina;
};

/**
 * Adapta dinámicamente referencias normativas argentinas en textos, subtítulos o insignias
 * al marco legal del país seleccionado.
 */
export const adaptNormativeText = (text: string, country?: string | null): string => {
    if (!text) return text;
    const code = normalizeCountryCode(country);
    if (code === 'argentina') return text;

    const n = getCountryNormativa(code);
    const replacements: [RegExp, string][] = [
        [/Res\.\s*SRT\s*463\/09,\s*529\/09\s*y\s*74\/10/gi, n.rgrl],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?463\/09/gi, n.rgrl],
        [/Res(?:\.|olución)?\s*SRT\s*37\/10\s*y\s*81\/19/gi, n.rar],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?37\/10/gi, n.medical],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?900\/15/gi, n.grounding],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?84\/12/gi, n.lighting],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?85\/12/gi, n.noise],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?886\/15/gi, n.ergo],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?953\/10/gi, n.confined],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?61\/23/gi, n.height],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?960\/15/gi, n.forklifts],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?299\/11/gi, n.epp],
        [/Res(?:\.|olución)?\s*(?:S\.?R\.?T\.?\s*(?:N°\s*)?)?3068\/14/gi, n.arcFlash],
        [/Res\.\s*295\/03\s*(?:&|y)\s*(?:SRT\s*)?30\/23/gi, n.thermal],
        [/Res\.\s*295\/03\s*(?:Anexo\s*IV\s*)?(?:&|y)\s*(?:SGA\s*)?(?:Res\.\s*)?801\/15/gi, n.chemical],
        [/Res(?:\.|olución)?\s*(?:MTEySS\s*)?295\/03(?:\s*Anexo\s*[I|V|X]+)?/gi, n.thermal],
        [/Res(?:\.|olución)?\s*SRT\s*30\/20?23/gi, n.thermal],
        [/Dec(?:\.|reto)?\s*351\/79\s*Anexo\s*VII/gi, n.fire],
        [/Dec(?:\.|reto)?\s*351\/79\s*(?:Cap\.\s*11\s*y\s*)?Anexo\s*III/gi, n.ventilation],
        [/Dec(?:\.|reto)?\s*351\/79\s*Anexo\s*IV/gi, n.lighting],
        [/Dec(?:\.|reto)?\s*351(?:\/79)?/gi, n.decree],
        [/Dec(?:\.|reto)?\s*911\/96(?:\s*y\s*Res\.\s*SRT\s*51\/97,\s*35\/98)?/gi, n.construction],
        [/Ley\s*(?:Nacional\s*)?19\.?587/gi, n.general],
        [/Ley\s*(?:Nacional\s*)?24\.?051/gi, n.waste],
        [/Ley\s*(?:Nacional\s*)?25\.?675/gi, n.environment],
        [/Ley\s*(?:Nacional\s*)?27\.?159/gi, n.firstAid],
        [/IRAM\s*38500/gi, n.racks],
        [/Protocolos\s*(?:Oficiales\s*)?SRT/gi, `Protocolos ${n.authority}`],
        [/ART\s*\/\s*SRT/gi, n.authority]
    ];

    let result = text;
    for (const [regex, replacement] of replacements) {
        result = result.replace(regex, replacement);
    }
    return result;
};
