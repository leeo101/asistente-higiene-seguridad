import type { RiskAgent, WorkerExposure, RiskAgentCategory } from '../types/rar';

/**
 * Catálogo Oficial de Agentes de Riesgo de la Superintendencia de Riesgos del Trabajo
 * Decreto 658/96 (Enfermedades Profesionales) y Resolución S.R.T. N° 37/10
 */
export const SRT_RISK_AGENTS_CATALOG: RiskAgent[] = [
  // ── 1. AGENTES FÍSICOS (80000) ──────────────────────────────────────────
  {
    codigo: '80001',
    nombre: 'Ruido (> 85 dBA continuo o picos > 135 dB)',
    categoria: 'Físico',
    criterioExposicion: 'Exposición diaria a dosis > 100% o nivel sonoro continuo equivalente > 85 dBA.',
    estudiosRequeridos: ['Audiometría tonal bianual / anual', 'Examen clínico otorrinolaringológico']
  },
  {
    codigo: '80002',
    nombre: 'Radiaciones Ionizantes (Rayos X, Gamma)',
    categoria: 'Físico',
    criterioExposicion: 'Operadores de equipos radiológicos o gammagrafía industrial.',
    estudiosRequeridos: ['Hemograma completo con recuento plaquetario', 'Dosimetría personal', 'Examen clínico']
  },
  {
    codigo: '80003',
    nombre: 'Radiaciones No Ionizantes (UV, Infrarrojo, Láser)',
    categoria: 'Físico',
    criterioExposicion: 'Soldadura eléctrica al arco, oxicorte, hornos de fundición o láser.',
    estudiosRequeridos: ['Examen oftalmológico (agudeza visual, fondo de ojo)', 'Examen dermatológico']
  },
  {
    codigo: '80004',
    nombre: 'Vibraciones Mano-Brazo (Herramientas vibratorias)',
    categoria: 'Físico',
    criterioExposicion: 'Uso continuado de amoladoras, martillos neumáticos o motosierras.',
    estudiosRequeridos: ['Examen osteoarticular y vascular periférico', 'Test de Allen / Raynaud']
  },
  {
    codigo: '80005',
    nombre: 'Vibraciones de Cuerpo Entero (Vehículos y Maquinaria)',
    categoria: 'Físico',
    criterioExposicion: 'Conductores de autoelevadores, tractores, camiones fuera de ruta.',
    estudiosRequeridos: ['Radiografía de columna lumbosacra', 'Examen osteoarticular']
  },
  {
    codigo: '80006',
    nombre: 'Calor y Estrés Térmico (Índice WBGT elevado)',
    categoria: 'Físico',
    criterioExposicion: 'Trabajos en fundiciones, calderas, hornos o intemperie extrema.',
    estudiosRequeridos: ['Examen cardiovascular', 'Ionograma plasmático', 'Función renal']
  },
  {
    codigo: '80007',
    nombre: 'Frío Extremo (Cámaras frigoríficas)',
    categoria: 'Físico',
    criterioExposicion: 'Operarios de cámaras de congelados a temperaturas < 0°C.',
    estudiosRequeridos: ['Examen respiratorio y cardiovascular', 'Examen de extremidades']
  },

  // ── 2. AGENTES QUÍMICOS (40000) ──────────────────────────────────────────
  {
    codigo: '40001',
    nombre: 'Humos Metálicos de Soldadura (Hierro, Manganeso)',
    categoria: 'Químico',
    criterioExposicion: 'Soldadura manual o semiautomática sin extracción localizada.',
    estudiosRequeridos: ['Espirometría / Radiografía de tórax', 'Dosaje de metales en orina/sangre']
  },
  {
    codigo: '40002',
    nombre: 'Solventes Orgánicos (Tolueno, Xileno, Benceno)',
    categoria: 'Químico',
    criterioExposicion: 'Pintura a soplete, desengrase de piezas mecánicas, adhesivos.',
    estudiosRequeridos: ['Hepatograma completo', 'Hemograma', 'Metabolitos urinarios (ác. hipúrico / metilhipúrico)']
  },
  {
    codigo: '40003',
    nombre: 'Polvos Minerales / Sílice Libre Cristalina',
    categoria: 'Químico',
    criterioExposicion: 'Arenado, mampostería, corte de hormigón, canteras y marmolerías.',
    estudiosRequeridos: ['Radiografía de tórax con lectura OIT', 'Espirometría computarizada']
  },
  {
    codigo: '40004',
    nombre: 'Nieblas y Vapores de Ácidos / Álcalis Fuertes',
    categoria: 'Químico',
    criterioExposicion: 'Baños galvánicos, decapado, fabricación de acumuladores/baterías.',
    estudiosRequeridos: ['Examen odontológico y de vías respiratorias superiores', 'Espirometría']
  },
  {
    codigo: '40005',
    nombre: 'Plaguicidas / Agroquímicos (Fitosanitarios)',
    categoria: 'Químico',
    criterioExposicion: 'Preparación, mezcla y aplicación de pesticidas en campo.',
    estudiosRequeridos: ['Dosaje de colinesterasa plasmática y eritrocitaria', 'Función hepática']
  },
  {
    codigo: '40006',
    nombre: 'Aceites Minerales y Fluidos de Corte (Taladrina)',
    categoria: 'Químico',
    criterioExposicion: 'Mecanizado en tornos, fresadoras o rectificadoras con refrigerante.',
    estudiosRequeridos: ['Examen dermatológico para dermatitis de contacto']
  },

  // ── 3. AGENTES BIOLÓGICOS (60000) ────────────────────────────────────────
  {
    codigo: '60001',
    nombre: 'Virus de la Hepatitis B, Hepatitis C y VIH',
    categoria: 'Biológico',
    criterioExposicion: 'Personal de salud, enfermería, recolección de residuos patogénicos.',
    estudiosRequeridos: ['Serologías específicas', 'Control del esquema de vacunación oficial']
  },
  {
    codigo: '60002',
    nombre: 'Bacterias y Zoonosis (Brucella, Tétanos, Leptospira)',
    categoria: 'Biológico',
    criterioExposicion: 'Frigoríficos, faena, veterinarias, tareas rurales o de alcantarillado.',
    estudiosRequeridos: ['Serología de Huddleson / Brucelosis', 'Control antitetánico']
  },

  // ── 4. AGENTES ERGONÓMICOS (90000) ───────────────────────────────────────
  {
    codigo: '90001',
    nombre: 'Posiciones Forzadas y Gestos Repetitivos (Extremidad Superior)',
    categoria: 'Ergonómico',
    criterioExposicion: 'Ciclos repetitivos de trabajo (< 30 seg) o flexo-extensión de muñeca/hombro.',
    estudiosRequeridos: ['Examen clínico osteoarticular específico', 'Pruebas de Phalen y Tinel']
  },
  {
    codigo: '90002',
    nombre: 'Sobrecarga Postural por Bipedestación Prolongada',
    categoria: 'Ergonómico',
    criterioExposicion: 'Trabajo de pie durante más del 70% de la jornada sin asiento alternado.',
    estudiosRequeridos: ['Examen vascular periférico de miembros inferiores (varices)']
  },
  {
    codigo: '90003',
    nombre: 'Sobreesfuerzo por Levantamiento Manual de Cargas',
    categoria: 'Ergonómico',
    criterioExposicion: 'Manipulación frecuente de cargas pesadas (> 25 kg en varones, > 15 kg en mujeres).',
    estudiosRequeridos: ['Examen de columna vertebral lumbosacra', 'Maniobra de Lasègue']
  }
];

export interface JobPositionPreset {
  puesto: string;
  sector: string;
  agentesSugeridos: string[];
  horasDefault: number;
}

export const JOB_POSITION_PRESETS: JobPositionPreset[] = [
  {
    puesto: 'Soldador / Armador Metálico',
    sector: 'Taller de Soldadura',
    agentesSugeridos: ['80001', '80003', '40001', '90001'],
    horasDefault: 8
  },
  {
    puesto: 'Operario de Pintura / Soplete',
    sector: 'Cabina de Pintura',
    agentesSugeridos: ['40002', '90001'],
    horasDefault: 6
  },
  {
    puesto: 'Conductor de Autoelevador',
    sector: 'Logística / Almacén',
    agentesSugeridos: ['80001', '80005'],
    horasDefault: 8
  },
  {
    puesto: 'Operario de Mecanizado / Tornero',
    sector: 'Mecanizado',
    agentesSugeridos: ['80001', '40006', '90001'],
    horasDefault: 8
  },
  {
    puesto: 'Operario de Depósito / Picking',
    sector: 'Expedición',
    agentesSugeridos: ['90002', '90003'],
    horasDefault: 8
  },
  {
    puesto: 'Operario de Calderas / Sala Térmica',
    sector: 'Servicios Centrales',
    agentesSugeridos: ['80001', '80006'],
    horasDefault: 8
  },
  {
    puesto: 'Aplicador de Fitosanitarios',
    sector: 'Campo / Agro',
    agentesSugeridos: ['40005'],
    horasDefault: 6
  },
  {
    puesto: 'Personal Administrativo / Oficina',
    sector: 'Administración',
    agentesSugeridos: [],
    horasDefault: 8
  }
];

export function getAgentByCode(codigo: string): RiskAgent | undefined {
  return SRT_RISK_AGENTS_CATALOG.find(a => a.codigo === codigo);
}

export interface RARStats {
  totalTrabajadores: number;
  trabajadoresExpuestos: number;
  trabajadoresNoExpuestos: number;
  porcentajeExpuestos: number;
  conteoPorCategoria: Record<RiskAgentCategory, number>;
  topAgentes: Array<{ codigo: string; nombre: string; cantidad: number }>;
}

export function calculateRARStats(trabajadores: WorkerExposure[]): RARStats {
  const total = trabajadores.length;
  let expuestos = 0;
  const agenteCounts: Record<string, number> = {};
  const catCounts: Record<RiskAgentCategory, number> = {
    Físico: 0,
    Químico: 0,
    Biológico: 0,
    Ergonómico: 0
  };

  trabajadores.forEach(w => {
    const uniqueCodes = Array.from(new Set(w.agentesCodigos || []));
    if (uniqueCodes.length > 0) {
      expuestos++;
      uniqueCodes.forEach(code => {
        agenteCounts[code] = (agenteCounts[code] || 0) + 1;
        const agent = getAgentByCode(code);
        if (agent) {
          catCounts[agent.categoria] = (catCounts[agent.categoria] || 0) + 1;
        }
      });
    }
  });

  const topAgentes = Object.entries(agenteCounts)
    .map(([code, count]) => {
      const ag = getAgentByCode(code);
      return {
        codigo: code,
        nombre: ag?.nombre || `Agente ${code}`,
        cantidad: count
      };
    })
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const porcentaje = total > 0 ? Math.round((expuestos / total) * 100) : 0;

  return {
    totalTrabajadores: total,
    trabajadoresExpuestos: expuestos,
    trabajadoresNoExpuestos: total - expuestos,
    porcentajeExpuestos: porcentaje,
    conteoPorCategoria: catCounts,
    topAgentes
  };
}
