import { API_BASE_URL } from '../config';
import { auth } from '../firebase';

export interface AtsTaskStep {
  paso: string;
  riesgo: string;
  control: string;
  nivelRiesgo: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  normativa: string;
}

export interface AtsAiResult {
  steps: AtsTaskStep[];
  suggestedEpps: string[];
}

export interface ChecklistAiResult {
  title: string;
  category: string;
  items: string[];
}

export interface StopCardAiResult {
  type: 'Acto Inseguro' | 'Condición Insegura';
  location?: string;
  suggestedAction: string;
  potentialRisk: 'Bajo' | 'Medio' | 'Alto' | 'Crítico';
  probableCause: string;
}

/**
 * Genera pasos, riesgos, controles preventivos y EPP para un Análisis de Trabajo Seguro (ATS)
 */
export async function generateAtsStepsWithAi(taskTitle: string): Promise<AtsAiResult> {
  const cleanTitle = taskTitle.trim();
  if (!cleanTitle) {
    throw new Error('El título de la tarea no puede estar vacío');
  }

  // 1. Intento con API Backend
  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/ai-ats-generator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ taskTitle: cleanTitle })
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          steps: data.map((item: any, idx: number) => ({
            paso: item.paso || item.step || `Paso ${idx + 1}`,
            riesgo: item.riesgo || item.hazard || 'Riesgo general de la tarea',
            control: item.control || item.prevention || 'Uso de EPP y supervisión constante',
            nivelRiesgo: (item.nivelRiesgo || item.riskLevel || 'Medio') as any,
            normativa: item.normativa || 'Dec. 351/79 / ISO 45001'
          })),
          suggestedEpps: extractSuggestedEpps(cleanTitle)
        };
      }
    }
  } catch (err) {
    console.warn('[AI Assistant] Backend no disponible, usando motor inteligente local:', err);
  }

  // 2. Motor inteligente local de respaldo según palabras clave normativas
  return generateLocalAtsFallback(cleanTitle);
}

/**
 * Genera una lista de verificación específica para un equipo, máquina o sector
 */
export async function generateChecklistWithAi(subject: string): Promise<ChecklistAiResult> {
  const cleanSubject = subject.trim();
  if (!cleanSubject) {
    throw new Error('Debe especificar el equipo o sector a inspeccionar');
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        message: `Genera una lista de verificación (checklist) de 7 a 9 puntos clave de seguridad técnica para inspeccionar: "${cleanSubject}". Responde estrictamente un JSON en formato { "title": "${cleanSubject}", "category": "Sector", "items": ["punto 1", "punto 2", ...] }`
      })
    });

    if (res.ok) {
      const data = await res.json();
      if (data?.items && Array.isArray(data.items)) {
        return {
          title: data.title || cleanSubject,
          category: data.category || 'Inspección de Seguridad',
          items: data.items
        };
      }
    }
  } catch (err) {
    console.warn('[AI Assistant Checklist] Usando motor local de respaldo:', err);
  }

  return generateLocalChecklistFallback(cleanSubject);
}

/**
 * Analiza una observación de campo y sugiere tipo, causa y acción inmediata
 */
export async function analyzeStopCardWithAi(description: string): Promise<StopCardAiResult> {
  const cleanDesc = description.trim();
  if (!cleanDesc) {
    throw new Error('La descripción no puede estar vacía');
  }

  try {
    const token = await auth.currentUser?.getIdToken();
    const res = await fetch(`${API_BASE_URL}/api/ai-stopcard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ transcript: cleanDesc })
    });

    if (res.ok) {
      const parsed = await res.json();
      return {
        type: parsed.type === 'Acto Inseguro' ? 'Acto Inseguro' : 'Condición Insegura',
        location: parsed.location || '',
        suggestedAction: parsed.actionTaken || 'Corregir inmediatamente y notificar al supervisor',
        potentialRisk: (parsed.potentialRisk || 'Medio') as any,
        probableCause: parsed.probableCause || 'Falta de percepción del riesgo o de inspección previa'
      };
    }
  } catch (err) {
    console.warn('[AI Assistant StopCard] Usando motor local de respaldo:', err);
  }

  return generateLocalStopCardFallback(cleanDesc);
}

// -------------------------------------------------------------
// MOTORES INTELIGENTES LOCALES DE RESPALDO (OFFLINE & FAST RESCUE)
// -------------------------------------------------------------

function extractSuggestedEpps(text: string): string[] {
  const lower = text.toLowerCase();
  const epps = ['Casco de seguridad con barbijo', 'Calzado de seguridad con puntera de acero', 'Lentes de seguridad con protección lateral'];

  if (lower.includes('altura') || lower.includes('techo') || lower.includes('andamio') || lower.includes('escala')) {
    epps.push('Arnés de cuerpo completo clase A (IRAM 3622)', 'Doble cabo de vida con amortiguador de impacto');
  }
  if (lower.includes('sold') || lower.includes('amol') || lower.includes('corte') || lower.includes('chispa')) {
    epps.push('Máscara fotosensible o careta de soldar', 'Guantes de descarne manga larga', 'Delantal y polainas de cuero descarne', 'Protector auditivo de copa');
  }
  if (lower.includes('quimic') || lower.includes('pint') || lower.includes('solvente') || lower.includes('acido')) {
    epps.push('Semimáscara con filtros para vapores orgánicos/gases', 'Guantes de nitrilo reforzados', 'Antiparras estancas para salpicaduras químicas');
  }
  if (lower.includes('electr') || lower.includes('tension') || lower.includes('tablero') || lower.includes('cable')) {
    epps.push('Guantes dieléctricos según tensión de servicio', 'Calzado 100% dieléctrico sin partes metálicas', 'Careta contra arco eléctrico (Arc Flash)');
  }
  if (lower.includes('ruido') || lower.includes('sala de maquinas') || lower.includes('compresor')) {
    epps.push('Protectores auditivos de inserción o copa (NRR >= 25 dB)');
  }

  return Array.from(new Set(epps));
}

function generateLocalAtsFallback(taskTitle: string): AtsAiResult {
  const lower = taskTitle.toLowerCase();

  if (lower.includes('amol') || lower.includes('corte') || lower.includes('disco')) {
    return {
      steps: [
        {
          paso: 'Inspección pre-operacional de amoladora, cable, enchufe y gatillo hombre-muerto',
          riesgo: 'Contacto eléctrico directo o indirecto, accionamiento accidental',
          control: 'Verificar aislación de cable clase II, disyuntor en línea y gatillo operativo',
          nivelRiesgo: 'Alto',
          normativa: 'Dec. 351/79 Anexo VI'
        },
        {
          paso: 'Verificación del resguardo mecánico (guarda cubriendo 50%) y ajuste de disco con llave original',
          riesgo: 'Estallido de disco por velocidad excesiva o desalineación',
          control: 'Controlar RPM máximas del disco vs equipo; prohibido retirar resguardo de protección',
          nivelRiesgo: 'Crítico',
          normativa: 'Dec. 351/79 Art. 110'
        },
        {
          paso: 'Delimitación de la zona de chispas y despeje de materiales inflamables en 10 metros a la redonda',
          riesgo: 'Incendio o explosión por proyección de partículas incandescentes',
          control: 'Colocación de mantas ignífugas, biombos y extintor ABC de 5 kg al pie del puesto',
          nivelRiesgo: 'Alto',
          normativa: 'Dec. 351/79 Cap. 18 / NFPA 51B'
        },
        {
          paso: 'Ejecución del amolado/corte adoptando postura estable y sujetando la herramienta con ambas manos',
          riesgo: 'Rebote (kick-back), atrapamiento de extremidades o proyección de virutas oculares',
          control: 'Uso obligatorio de pantalla facial completa sobre lentes de seguridad y guantes de descarne',
          nivelRiesgo: 'Alto',
          normativa: 'Res. SRT 299/11'
        },
        {
          paso: 'Detención del equipo, desconexión del tomacorriente y orden/limpieza del sector',
          riesgo: 'Cortes involuntarios mientras el disco desacelera o tropiezos con cables tendidos',
          control: 'Aguardar detención total antes de apoyar sobre banco; enrollar cableado en canalizaciones',
          nivelRiesgo: 'Bajo',
          normativa: 'Dec. 351/79 Art. 42'
        }
      ],
      suggestedEpps: extractSuggestedEpps(taskTitle)
    };
  }

  if (lower.includes('altura') || lower.includes('techo') || lower.includes('andamio') || lower.includes('pintura en altura')) {
    return {
      steps: [
        {
          paso: 'Inspección del arnés de cuerpo completo, cabos de vida y punto de anclaje certificado (22 kN)',
          riesgo: 'Falla o rotura de elementos de detención de caídas por desgaste o envejecimiento',
          control: 'Control visual de costuras, hebillas, etiquetas de trazabilidad y fecha de vencimiento',
          nivelRiesgo: 'Crítico',
          normativa: 'Res. SRT 61/23 / IRAM 3622'
        },
        {
          paso: 'Delimitación perimetral inferior y señalización de zona de exclusión por caída de objetos',
          riesgo: 'Golpes a terceros o transeúntes por desprendimiento de herramientas o materiales',
          control: 'Vallado con cinta de peligro a 5 m de radio y cartelería de advertencia de trabajos en altura',
          nivelRiesgo: 'Alto',
          normativa: 'Dec. 911/96 Art. 21'
        },
        {
          paso: 'Ascenso por escalera marinera o estructura manteniendo los 3 puntos de apoyo y línea de vida',
          riesgo: 'Caída de altura durante la fase de transición o acceso a la plataforma de trabajo',
          control: 'Uso de arrestador de caídas (salvacorrientes) o doble cabo con mosquetones de 55 mm alternados',
          nivelRiesgo: 'Crítico',
          normativa: 'Res. SRT 61/23 Art. 8'
        },
        {
          paso: 'Posicionamiento en plataforma de trabajo, amarre a línea de vida independiente y amarre de herramientas',
          riesgo: 'Pérdida de equilibrio, caída a distinto nivel o caída de herramientas pesadas',
          control: 'Anclaje dorsal siempre por encima del nivel de la cabeza; lanyard de retención para herramientas',
          nivelRiesgo: 'Crítico',
          normativa: 'Dec. 911/96 Art. 54'
        },
        {
          paso: 'Descenso controlado, retiro de señalización y acopio de arneses en lugar seco y ventilado',
          riesgo: 'Fatiga física, degradación prematura del textil del arnés por exposición solar o humedad',
          control: 'Descenso sin prisa, registro en planilla de control de EPP y almacenamiento adecuado',
          nivelRiesgo: 'Bajo',
          normativa: 'Res. SRT 299/11'
        }
      ],
      suggestedEpps: extractSuggestedEpps(taskTitle)
    };
  }

  // Plantilla general profesional para cualquier otra tarea técnica
  return {
    steps: [
      {
        paso: `Planificación y delimitación previa del área de trabajo para la tarea: "${taskTitle}"`,
        riesgo: 'Interferencia con otras operaciones, ingreso de personas no autorizadas al sector',
        control: 'Señalización de seguridad, comunicación a supervisión y charla de 5 minutos previa',
        nivelRiesgo: 'Medio',
        normativa: 'Ley 19.587 / ISO 45001'
      },
      {
        paso: 'Inspección de herramientas manuales, equipos de trabajo y conexiones auxiliares',
        riesgo: 'Uso de herramientas en mal estado, mangos fisurados o cables defectuosos',
        control: 'Verificación según checklist pre-uso; retirar de servicio cualquier equipo observado',
        nivelRiesgo: 'Medio',
        normativa: 'Dec. 351/79 Cap. 15'
      },
      {
        paso: 'Verificación y colocación de los Elementos de Protección Personal (EPP) específicos',
        riesgo: 'Exposición a proyecciones, golpes, ruido o sustancias agresivas sin protección',
        control: 'Uso obligatorio de EPP certificado conforme a Res. SRT 299/11 adecuado al riesgo',
        nivelRiesgo: 'Alto',
        normativa: 'Res. SRT 299/11'
      },
      {
        paso: 'Ejecución operativa de la actividad manteniendo posturas ergonómicas y concentración',
        riesgo: 'Sobreesfuerzos, atrapamientos, golpes por objetos móviles o caídas al mismo nivel',
        control: 'Trabajar a ritmo seguro, no anular protecciones de máquinas y mantener el piso despejado',
        nivelRiesgo: 'Alto',
        normativa: 'Res. SRT 886/15'
      },
      {
        paso: 'Finalización de la tarea, ordenamiento de herramientas, limpieza y disposición de residuos',
        riesgo: 'Tropiezos, resbalones, contaminación ambiental o riesgos remanentes para el turno siguiente',
        control: 'Clasificación de residuos según tipo, verificación del estado final del área y cierre del permiso',
        nivelRiesgo: 'Bajo',
        normativa: 'Dec. 351/79 Art. 42 / Ley 24.051'
      }
    ],
    suggestedEpps: extractSuggestedEpps(taskTitle)
  };
}

function generateLocalChecklistFallback(subject: string): ChecklistAiResult {
  const lower = subject.toLowerCase();
  
  if (lower.includes('compresor') || lower.includes('aire')) {
    return {
      title: `Inspección de ${subject}`,
      category: 'Equipos a Presión',
      items: [
        'Válvula de seguridad calibrada, con precinto intacto y palanca de prueba libre',
        'Manómetro con cuadrante legible, sin rotura y calibración vigente',
        'Presostato de corte automático por presión operativa verificado',
        'Protección / resguardo enrejado completo en correas y poleas de transmisión',
        'Purgador automático o manual de condensado funcionando y sin obstrucciones',
        'Filtro de aire de admisión limpio y carcasa firmemente ajustada',
        'Sin pérdidas visibles de aire en cañerías, acoples ni juntas',
        'Puesta a tierra del motor eléctrico conectada y verificada (< 10 Ω)'
      ]
    };
  }

  if (lower.includes('grúa') || lower.includes('puente') || lower.includes('izaje') || lower.includes('guinche')) {
    return {
      title: `Inspección de ${subject}`,
      category: 'Aparatos de Izaje (ASME B30 / Dec. 351)',
      items: [
        'Gancho de izaje con traba de seguridad operativa y sin deformaciones visibles',
        'Cable de acero sin hilos cortados, cocas, aplastamientos ni corrosión',
        'Freno electromecánico de izaje y traslación responden de inmediato con carga',
        'Final de carrera superior e inferior de elevación verificado operativamente',
        'Botonera de mando o control remoto con pulsador de parada de emergencia (seta roja)',
        'Cartelería de Carga Máxima Admisible (SWL) visible en ambos lados de la viga',
        'Alarma acústica y baliza luminosa de traslación activadas durante el movimiento',
        'Pestillos y grilletes con pasadores de seguridad y capacidad legible'
      ]
    };
  }

  return {
    title: `Inspección de Seguridad: ${subject}`,
    category: 'Inspección General',
    items: [
      'Estructura general limpia, sin deformaciones ni corrosión visible',
      'Protecciones, resguardos y carcasas colocadas y firmemente atornilladas',
      'Cableado eléctrico sin empalmes precarios, canalizado y con ficha normalizada',
      'Paradas de emergencia y comandos de encendido/apagado fácilmente accesibles',
      'Cartelería de seguridad, advertencia de riesgos y EPP obligatorio visible',
      'Área circundante limpia, seca, libre de aceites y sin obstáculos de tránsito',
      'Sin ruidos anómalos, vibraciones excesivas ni calentamiento anormal durante la marcha',
      'Extintor adecuado y botiquín de primeros auxilios accesibles en las inmediaciones'
    ]
  };
}

function generateLocalStopCardFallback(description: string): StopCardAiResult {
  const lower = description.toLowerCase();
  const isAct = lower.includes('operario') || lower.includes('trabajador') || lower.includes('no usaba') || lower.includes('sin casco') || lower.includes('sin arnes') || lower.includes('corriendo') || lower.includes('anulo');
  
  let potentialRisk: StopCardAiResult['potentialRisk'] = 'Medio';
  if (lower.includes('altura') || lower.includes('alta tension') || lower.includes('confinado') || lower.includes('fuego') || lower.includes('quimico toxico')) {
    potentialRisk = 'Crítico';
  } else if (lower.includes('cable pelado') || lower.includes('sin guarda') || lower.includes('aceite') || lower.includes('obstruye')) {
    potentialRisk = 'Alto';
  }

  return {
    type: isAct ? 'Acto Inseguro' : 'Condición Insegura',
    location: 'Sector de Operaciones',
    suggestedAction: isAct
      ? 'Detener la maniobra inmediatamente, dialogar amablemente con el trabajador concientizando sobre el riesgo y verificar uso de EPP antes de reanudar.'
      : 'Señalizar y delimitar la zona de riesgo, notificar al área de mantenimiento para su reparación inmediata y verificar antes de liberar.',
    potentialRisk,
    probableCause: isAct ? 'Falta de percepción del riesgo o exceso de confianza' : 'Desgaste por uso continuo o falta de mantenimiento preventivo'
  };
}
