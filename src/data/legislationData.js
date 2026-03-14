export const legislationData = {
    argentina: [
        {
            id: 'ley-19587',
            title: 'Ley 19.587',
            description: 'Ley Higiene y Seguridad en el Trabajo. Marco fundamental en Argentina.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/15000-19999/17612/norma.htm',
            category: 'Ley Nacional'
        },
        {
            id: 'dec-351',
            title: 'Decreto 351/79',
            description: 'Reglamentación general de la Ley 19.587 para establecimientos industriales.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/30000-34999/32030/texact.htm',
            category: 'Decreto Reglamentario'
        },
        {
            id: 'dec-911',
            title: 'Decreto 911/96',
            description: 'Reglamento de Higiene y Seguridad para la Industria de la Construcción.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/35000-39999/37408/texact.htm',
            category: 'Construcción'
        },
        {
            id: 'ley-24557',
            title: 'Ley 24.557',
            description: 'Ley de Riesgos del Trabajo (LRT). Sistema de aseguramiento y prevención.',
            url: 'https://servicios.infoleg.gob.ar/infolegInternet/anexos/25000-29999/27971/texact.htm',
            category: 'Riesgos del Trabajo'
        },
        {
            id: 'res-srt-299',
            title: 'Res. SRT 299/11',
            description: 'Formulario de entrega de Elementos de Protección Personal (EPP).',
            url: 'http://servicios.infoleg.gob.ar/infolegInternet/anexos/180000-184999/183177/norma.htm',
            category: 'Resolución SRT'
        }
    ],
    chile: [
        {
            id: 'ley-16744',
            title: 'Ley 16.744',
            description: 'Establece normas sobre accidentes del trabajo y enfermedades profesionales.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=28650',
            category: 'Ley Fundamental'
        },
        {
            id: 'ds-594',
            title: 'DS 594',
            description: 'Reglamento sobre condiciones sanitarias y ambientales básicas en los lugares de trabajo.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=167766',
            category: 'Decreto Supremo'
        },
        {
            id: 'ds-40',
            title: 'DS 40',
            description: 'Reglamento sobre prevención de riesgos profesionales y el derecho a saber (ODI).',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=3516',
            category: 'Decreto Supremo'
        },
        {
            id: 'ds-76',
            title: 'DS 76',
            description: 'Reglamento para la aplicación del artículo 66 bis de la Ley N° 16.744 (Subcontratación).',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=256793',
            category: 'Decreto Supremo'
        },
        {
            id: 'ley-20123',
            title: 'Ley 20.123',
            description: 'Regula trabajo en régimen de subcontratación y el funcionamiento de empresas de servicios transitorios.',
            url: 'https://www.bcn.cl/leychile/navegar?idNorma=254060',
            category: 'Ley Nacional'
        }
    ],
    bolivia: [
        {
            id: 'dl-16998',
            title: 'Decreto Ley 16.998',
            description: 'Ley General de Higiene, Seguridad Ocupacional y Bienestar.',
            url: 'https://www.ilo.org/dyn/natlex/docs/ELECTRONIC/13274/91404/F1041151603/BOL13274.pdf',
            category: 'Ley General'
        },
        {
            id: 'ley-vigente-bo',
            title: 'Normas de Seguridad Industrial',
            description: 'Compendio de normas técnicas para la prevención de riesgos en Bolivia.',
            url: 'https://www.minedu.gob.bo/',
            category: 'Normativa Técnica'
        }
    ],
    paraguay: [
        {
            id: 'dec-14390',
            title: 'Decreto 14.390/92',
            description: 'Reglamento General Técnico de Seguridad, Higiene y Medicina en el Trabajo.',
            url: 'https://www.bacn.gov.py/leyes-paraguayas/8381/decreto-n-14390',
            category: 'Reglamento General'
        },
        {
            id: 'ley-5804',
            title: 'Ley 5804/17',
            description: 'Establece el Sistema Nacional de Prevención de Riesgos Laborales.',
            url: 'https://www.bacn.gov.py/leyes-paraguayas/5267/ley-n-5804',
            category: 'Ley Nacional'
        }
    ],
    uruguay: [
        {
            id: 'ley-5032',
            title: 'Ley 5.032',
            description: 'Ley fundamental sobre la prevención de accidentes de trabajo.',
            url: 'https://www.impo.com.uy/bases/leyes/5032-1914',
            category: 'Ley Fundamental'
        },
        {
            id: 'dec-406',
            title: 'Decreto 406/88',
            description: 'Reglamentación sobre Seguridad, Higiene y Salud Ocupacional.',
            url: 'https://www.impo.com.uy/bases/decretos/406-1988',
            category: 'Decreto Reglamentario'
        },
        {
            id: 'dec-125',
            title: 'Decreto 125/014',
            description: 'Condiciones de seguridad en la industria de la construcción.',
            url: 'https://www.impo.com.uy/bases/decretos/125-2014',
            category: 'Construcción'
        }
    ]
};

export const countryList = [
    { code: 'argentina', name: 'Argentina', flag: '🇦🇷' },
    { code: 'chile', name: 'Chile', flag: '🇨🇱' },
    { code: 'bolivia', name: 'Bolivia', flag: '🇧🇴' },
    { code: 'paraguay', name: 'Paraguay', flag: '🇵🇾' },
    { code: 'uruguay', name: 'Uruguay', flag: '🇺🇾' }
];

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
