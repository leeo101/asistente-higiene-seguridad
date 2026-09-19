import type { RiskAgent, WorkerExposure, RiskAgentCategory, RARStats } from '../types/rar';

/**
 * Catálogo Oficial de Agentes de Riesgo de la Superintendencia de Riesgos del Trabajo
 * Decreto 658/96 (Enfermedades Profesionales), Decreto 1167/03,
 * Resolución S.R.T. N° 37/10 (Exámenes Médicos en Salud) y
 * Resolución S.R.T. N° 81/19 (Vigilancia y Registro de Sustancias y Agentes Cancerígenos)
 */
export const SRT_RISK_AGENTS_CATALOG: RiskAgent[] = [
  // ── 1. AGENTES FÍSICOS (80000) ──────────────────────────────────────────
  {
    codigo: '80001',
    nombre: 'Ruido (> 85 dBA continuo o picos > 135 dB)',
    categoria: 'Físico',
    criterioExposicion: 'Exposición diaria a dosis > 100% o nivel sonoro continuo equivalente > 85 dBA sin atenuación.',
    estudiosRequeridos: ['Audiometría tonal liminar bianual / anual', 'Examen clínico otorrinolaringológico'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Auditivo (Hipoacusia perceptiva)'
  },
  {
    codigo: '80002',
    nombre: 'Radiaciones Ionizantes (Rayos X, Gamma, Partículas)',
    categoria: 'Físico',
    criterioExposicion: 'Operadores de equipos radiológicos, gammagrafía industrial o medicina nuclear.',
    estudiosRequeridos: ['Hemograma completo con recuento plaquetario', 'Dosimetría personal mensual', 'Examen clínico general'],
    esCancerigeno: true, // Res. SRT 81/19
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Hematopoyético y Células Germinales'
  },
  {
    codigo: '80003',
    nombre: 'Radiaciones No Ionizantes (UV, Infrarrojo, Láser)',
    categoria: 'Físico',
    criterioExposicion: 'Soldadura eléctrica al arco, oxicorte, hornos de fundición o exposición a radiación UV artificial intensa.',
    estudiosRequeridos: ['Examen oftalmológico (agudeza visual, fondo de ojo, biomicroscopía)', 'Examen dermatológico'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Ocular y Tegumentario'
  },
  {
    codigo: '80004',
    nombre: 'Vibraciones Mano-Brazo (Herramientas vibratorias)',
    categoria: 'Físico',
    criterioExposicion: 'Uso continuado de amoladoras, martillos neumáticos, rotopercutoras o motosierras.',
    estudiosRequeridos: ['Examen osteoarticular y vascular periférico', 'Test de Allen / Maniobras de Raynaud'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Vascular y Osteoarticular periférico'
  },
  {
    codigo: '80005',
    nombre: 'Vibraciones de Cuerpo Entero (Vehículos y Maquinaria)',
    categoria: 'Físico',
    criterioExposicion: 'Conductores de autoelevadores, tractores, camiones fuera de ruta o maquinaria vial.',
    estudiosRequeridos: ['Radiografía de columna lumbosacra frente y perfil', 'Examen neurológico y osteoarticular'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Columna vertebral lumbosacra'
  },
  {
    codigo: '80006',
    nombre: 'Calor y Estrés Térmico (Índice TGBH elevado)',
    categoria: 'Físico',
    criterioExposicion: 'Trabajos en fundiciones, calderas, hornos cerámicos o intemperie extrema sin aclimatación.',
    estudiosRequeridos: ['Examen cardiovascular con electrocardiograma', 'Ionograma plasmático y función renal (Urea, Creatinina)'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Cardiovascular y Renal'
  },
  {
    codigo: '80007',
    nombre: 'Frío Extremo (Cámaras frigoríficas y congelados)',
    categoria: 'Físico',
    criterioExposicion: 'Operarios de cámaras de congelados a temperaturas < 0°C con permanencia prolongada.',
    estudiosRequeridos: ['Examen respiratorio y cardiovascular', 'Examen clínico de extremidades y circulación periférica'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Respiratorio y Vascular periférico'
  },
  {
    codigo: '80008',
    nombre: 'Presión Superior a la Atmosférica Estándar (Hiperbárica)',
    categoria: 'Físico',
    criterioExposicion: 'Trabajos de buceo profesional o cajones de aire comprimido.',
    estudiosRequeridos: ['Radiografía de huesos largos y tórax', 'Audiometría e impedanciometría', 'Espirometría computarizada'],
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Osteoarticular y Auditivo'
  },

  // ── 2. AGENTES QUÍMICOS (40000) ──────────────────────────────────────────
  {
    codigo: '40001',
    nombre: 'Humos Metálicos de Soldadura (Hierro, Manganeso, Cinc)',
    categoria: 'Químico',
    criterioExposicion: 'Soldadura manual o semiautomática (MIG, MAG, TIG, electrodo) sin extracción localizada.',
    estudiosRequeridos: ['Radiografía de tórax frente con técnica OIT', 'Espirometría computarizada', 'Examen clínico respiratorio'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Respiratorio (Siderosis, Fisiología Pulmonar)'
  },
  {
    codigo: '40002',
    nombre: 'Solventes Orgánicos Aromáticos (Benceno, Tolueno, Xileno)',
    categoria: 'Químico',
    criterioExposicion: 'Pintura a soplete, desengrase industrial de piezas mecánicas, adhesivos y tintas.',
    estudiosRequeridos: [
      'Hepatograma completo (TGO, TGP, FAL, Bilirrubina)',
      'Hemograma completo con recuento de plaquetas',
      'Metabolitos urinarios (Ácido hipúrico / metilhipúrico / S-fenilmercaptúrico)'
    ],
    esCancerigeno: true, // Res. SRT 81/19 (Benceno)
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Hematopoyético y Hepático'
  },
  {
    codigo: '40003',
    nombre: 'Polvos Minerales / Sílice Libre Cristalina (Cuarzo)',
    categoria: 'Químico',
    criterioExposicion: 'Arenado, mampostería, corte de hormigón/piedra, canteras, fundición y marmolerías.',
    estudiosRequeridos: ['Radiografía de tórax con lectura OIT oficial', 'Espirometría computarizada anual'],
    esCancerigeno: true, // Res. SRT 81/19
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Respiratorio (Silicosis pulmonar)'
  },
  {
    codigo: '40004',
    nombre: 'Nieblas y Vapores de Ácidos / Álcalis Fuertes',
    categoria: 'Químico',
    criterioExposicion: 'Baños galvánicos, decapado ácido, fabricación y carga de acumuladores eléctricos.',
    estudiosRequeridos: ['Examen estomatológico (erosión dental)', 'Examen otorrinolaringológico y espirometría'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Respiratorio superior y Dental'
  },
  {
    codigo: '40005',
    nombre: 'Plaguicidas / Agroquímicos (Organofosforados, Carbamatos)',
    categoria: 'Químico',
    criterioExposicion: 'Preparación, mezcla, dosificación y pulverización de fitosanitarios en explotaciones agrarias.',
    estudiosRequeridos: [
      'Dosaje de colinesterasa plasmática y eritrocitaria (pre-campaña y post-campaña)',
      'Hepatograma completo y función renal'
    ],
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Sistema Nervioso Autónomo y Hepático'
  },
  {
    codigo: '40006',
    nombre: 'Aceites Minerales y Fluidos de Corte (Taladrinas)',
    categoria: 'Químico',
    criterioExposicion: 'Mecanizado en tornos, fresadoras, centros de mecanizado o rectificadoras con fluidos refrigerantes.',
    estudiosRequeridos: ['Examen dermatológico completo (dermatitis de contacto / queratosis)', 'Examen respiratorio'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Tegumentario y Respiratorio'
  },
  {
    codigo: '40010',
    nombre: 'Asbesto / Amianto en todas sus formas (Crisotilo, Amosita)',
    categoria: 'Químico',
    criterioExposicion: 'Remoción de aislaciones térmicas antiguas, demolición de estructuras o mantenimiento de cañerías históricas.',
    estudiosRequeridos: ['Radiografía de tórax OIT con placa testigo', 'Espirometría computarizada y tomografía de alta resolución'],
    esCancerigeno: true, // Res. SRT 81/19
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Respiratorio (Asbestosis / Mesotelioma pleural)'
  },
  {
    codigo: '40040',
    nombre: 'Cromo Hexavalente y sus Compuestos (Cromo VI)',
    categoria: 'Químico',
    criterioExposicion: 'Cromado electrolítico, curtido de pieles, pigmentos antioxidantes o soldadura de aceros inoxidables.',
    estudiosRequeridos: ['Examen de tabique nasal (perforaciones)', 'Dosaje de cromo en orina', 'Espirometría'],
    esCancerigeno: true, // Res. SRT 81/19
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Respiratorio y Dérmico'
  },
  {
    codigo: '40085',
    nombre: 'Plomo Inorgánico y sus Compuestos',
    categoria: 'Químico',
    criterioExposicion: 'Fabricación y reciclado de baterías, fundición de plomo, fabricación de municiones.',
    estudiosRequeridos: ['Plumbemia (Plomo en sangre)', 'Ácido Delta-Aminolevulínico urinario (ALA-U)', 'Hemograma'],
    frecuenciaExamen: 'Semestral',
    sistemaAfectado: 'Hematopoyético, Nervioso y Renal'
  },
  {
    codigo: '40114',
    nombre: 'Polvo de Madera Dura (Roble, Haya, Cedro)',
    categoria: 'Químico',
    criterioExposicion: 'Corte, lijado y maquinado de maderas duras en aserraderos o carpinterías industriales sin extracción.',
    estudiosRequeridos: ['Examen otorrinolaringológico con rinoscopía anterior', 'Espirometría computarizada'],
    esCancerigeno: true, // Res. SRT 81/19
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Fosas Nasales y Senos Paranasales'
  },

  // ── 3. AGENTES BIOLÓGICOS (60000) ────────────────────────────────────────
  {
    codigo: '60001',
    nombre: 'Virus de la Hepatitis B, Hepatitis C y VIH',
    categoria: 'Biológico',
    criterioExposicion: 'Personal de salud asistencial, odontología, laboratorios y recolección de residuos patogénicos.',
    estudiosRequeridos: ['Serología específica para Hepatitis B (HBsAg, Anti-HBs)', 'Control estricto del carnet de vacunación oficial'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Inmunológico y Hepático'
  },
  {
    codigo: '60002',
    nombre: 'Bacterias y Zoonosis (Brucella, Tétanos, Leptospira)',
    categoria: 'Biológico',
    criterioExposicion: 'Frigoríficos, faena vacuna/porcina, tambos, veterinarias, alcantarillado urbano o tareas rurales.',
    estudiosRequeridos: ['Serología de Huddleson / Brucelosis', 'Control antitetánico vigente', 'Examen clínico infeccioso'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Sistémico e Infeccioso'
  },

  // ── 4. AGENTES ERGONÓMICOS (90000) ───────────────────────────────────────
  {
    codigo: '90001',
    nombre: 'Posiciones Forzadas y Gestos Repetitivos (Extremidad Superior)',
    categoria: 'Ergonómico',
    criterioExposicion: 'Ciclos repetitivos de trabajo (< 30 seg) o flexo-extensión forzada de muñeca/codo/hombro > 50% de la jornada.',
    estudiosRequeridos: ['Examen clínico osteoarticular específico', 'Pruebas de provocación neural (Tinel, Phalen, Finkelstein)'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Osteomioarticular (Túnel Carpiano, Tendinitis)'
  },
  {
    codigo: '90002',
    nombre: 'Sobrecarga Postural por Bipedestación Prolongada',
    categoria: 'Ergonómico',
    criterioExposicion: 'Trabajo de pie durante más del 70% de la jornada efectiva sin asiento alternado ni apoyo postural.',
    estudiosRequeridos: ['Examen vascular periférico de miembros inferiores (varices, edemas)', 'Examen ortopédico de pies'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Vascular periférico de miembros inferiores'
  },
  {
    codigo: '90003',
    nombre: 'Sobreesfuerzo por Levantamiento Manual de Cargas',
    categoria: 'Ergonómico',
    criterioExposicion: 'Manipulación manual frecuente o repetida de cargas con peso > 25 kg en varones o > 15 kg en mujeres.',
    estudiosRequeridos: ['Examen de columna vertebral lumbosacra con maniobra de Lasègue', 'Evaluación de rangos de movilidad'],
    frecuenciaExamen: 'Anual',
    sistemaAfectado: 'Columna vertebral y discos lumbosacros'
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

/**
 * Validador oficial de CUIL argentino (módulo 11)
 * Formatos válidos: '20-12345678-9' o '20123456789'
 */
export function validateCuilFormat(cuil: string): { isValid: boolean; message?: string } {
  if (!cuil || cuil.trim() === '') {
    return { isValid: false, message: 'El CUIL no puede estar vacío.' };
  }

  const clean = cuil.replace(/[-\s]/g, '');
  if (!/^\d{11}$/.test(clean)) {
    return { isValid: false, message: 'Debe contener 11 dígitos numéricos (ej: 20-35894120-7).' };
  }

  const prefix = clean.substring(0, 2);
  const validPrefixes = ['20', '23', '24', '27', '30', '33', '34'];
  if (!validPrefixes.includes(prefix)) {
    return { isValid: false, message: `Prefijo inválido (${prefix}). Debe iniciar con 20, 23, 24, 27, 30, 33 o 34.` };
  }

  // Algoritmo de Módulo 11
  const multipliers = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * multipliers[i];
  }

  const mod = sum % 11;
  let calculatedVerif = 11 - mod;
  if (calculatedVerif === 11) calculatedVerif = 0;
  if (calculatedVerif === 10) calculatedVerif = 9;

  const actualVerif = parseInt(clean[10], 10);
  if (calculatedVerif !== actualVerif) {
    return { isValid: false, message: `Dígito verificador incorrecto (esperado: ${calculatedVerif}, ingresado: ${actualVerif}).` };
  }

  return { isValid: true };
}

/**
 * Obtiene la lista consolidada de estudios médicos periódicos obligatorios
 * según los códigos de agentes de riesgo asignados a un operario (Res. SRT 37/10)
 */
export function getRecommendedMedicalExams(agentesCodigos: string[]): string[] {
  const exams = new Set<string>();
  (agentesCodigos || []).forEach(code => {
    const ag = getAgentByCode(code);
    if (ag && ag.estudiosRequeridos) {
      ag.estudiosRequeridos.forEach(est => exams.add(est));
    }
  });
  return Array.from(exams);
}

/**
 * Cálculo de estadísticas analíticas de la nómina de trabajadores expuestos
 */
export function calculateRARStats(trabajadores: WorkerExposure[]): RARStats {
  const total = trabajadores.length;
  let expuestos = 0;
  let conCancerigenos = 0;
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
      let hasCancer = false;
      uniqueCodes.forEach(code => {
        agenteCounts[code] = (agenteCounts[code] || 0) + 1;
        const agent = getAgentByCode(code);
        if (agent) {
          catCounts[agent.categoria] = (catCounts[agent.categoria] || 0) + 1;
          if (agent.esCancerigeno) {
            hasCancer = true;
          }
        }
      });
      if (hasCancer) {
        conCancerigenos++;
      }
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
    topAgentes,
    trabajadoresConCancerigenos: conCancerigenos
  };
}

