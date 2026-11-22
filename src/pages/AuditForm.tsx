import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Save,
  ClipboardCheck,
  Shield,
  AlertTriangle,
  Clock,
  CheckCircle2,
  User,
  MapPin,
  Calendar,
  FileText,
  Eye,
  Printer,
  Share2,
  Pencil,
  Award,
  X,
  Plus,
  Trash2,
  Sparkles,
  Building2,
  Layers,
  CheckSquare,
  Filter
} from 'lucide-react';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { toast } from 'react-hot-toast';
import { safeGetLocalStorage } from '../utils/storageHelper';
import ShareModal from '../components/ShareModal';
import AuditPdf from '../components/AuditPdf';
import { printElementAsDocument } from '../utils/pdfHelper';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar
} from '../components/module';
import { usePaywall } from '../hooks/usePaywall';
import SignatureCanvas from '../components/SignatureCanvas';
import PdfSignatures from '../components/PdfSignatures';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { getSavedProfessionalData } from '../utils/jsPdfSignatureHelper';
import { DEFAULT_PROFESSION } from '../data/professionOptions';

const AUDIT_TYPES = [
  { id: 'internal', name: 'Auditoría Interna SGSST', icon: '📋' },
  { id: 'compliance', name: 'Cumplimiento Legal SRT', icon: '⚖️' },
  { id: 'external', name: 'Auditoría Externa / ART', icon: '🏢' },
  { id: 'certification', name: 'Auditoría de Certificación', icon: '📜' },
  { id: 'surveillance', name: 'Auditoría de Seguimiento', icon: '👁️' },
  { id: 'supplier', name: 'Auditoría a Contratista / Proveedor', icon: '🤝' },
  { id: 'environmental', name: 'Auditoría Ambiental (ISO 14001)', icon: '🌱' }
];

const AUDIT_STANDARDS = [
  'Ley 19.587 / Dec. 351/79 y Resoluciones SRT',
  'ISO 45001:2018 (Seguridad y Salud en el Trabajo)',
  'ISO 45001:2018 + Ley 19.587 / Dec. 351/79 (Integrada)',
  'Decreto 911/96 (Industria de la Construcción)',
  'ISO 14001:2015 / Ley 24.051 (Gestión Ambiental)',
  'Trinorma Integrada (ISO 45001 / ISO 14001 / ISO 9001)',
  'Res. SRT 463/09 (Relevamiento General de Riesgos Laborales - RGRL)'
];

const AUDIT_STATUS_OPTIONS = [
  { id: 'planned', label: '📅 Planificada' },
  { id: 'in_progress', label: '⏳ En Curso' },
  { id: 'completed', label: '✅ Completada / Cerrada' },
  { id: 'draft', label: '📝 Borrador' }
];

const SEVERITY_OPTIONS = [
  { id: 'critical', label: '🔴 Crítico (Riesgo Grave / Inminente)', color: '#dc2626' },
  { id: 'major', label: '🟠 Mayor (Incumplimiento Legal / Normativo)', color: '#ea580c' },
  { id: 'minor', label: '🟡 Menor (Desvío Puntual / Parcial)', color: '#ca8a04' },
  { id: 'observation', label: '🔵 Observación / Oportunidad de Mejora', color: '#2563eb' }
];

export interface AuditChecklistItem {
  id: string | number;
  category?: string;
  question: string;
  legal: string;
  status: 'si' | 'no' | 'na';
  observation: string;
  severity?: 'critical' | 'major' | 'minor' | 'observation';
  correctiveAction?: string;
  responsible?: string;
  dueDate?: string;
}

// Bancos de preguntas completos por plantilla profesional
const CHECKLIST_TEMPLATES: Record<
  string,
  {
    name: string;
    shortName: string;
    badge: string;
    standard: string;
    defaultObjective: string;
    defaultScope: string;
    items: Omit<AuditChecklistItem, 'status' | 'observation'>[];
  }
> = {
  srt_integral: {
    name: '⚖️ Integral SRT Argentina (Ley 19.587 / Dec. 351/79)',
    shortName: '⚖️ Ley 19.587 / SRT',
    badge: '24 Puntos • 7 Bloques',
    standard: 'Ley 19.587 / Dec. 351/79 y Resoluciones SRT',
    defaultObjective:
      'Verificar en planta el grado de cumplimiento técnico-legal en materia de Higiene y Seguridad en el Trabajo conforme a la Ley Nacional N° 19.587, su Decreto Reglamentario N° 351/79 y Resoluciones vigentes de la Superintendencia de Riesgos del Trabajo (SRT).',
    defaultScope:
      'Inspección ocular en sectores operativos, depósitos, instalaciones eléctricas, medios de evacuación y control documental del legajo técnico de Higiene y Seguridad.',
    items: [
      {
        id: 'SRT-1.1',
        category: '1. Gestión Legal y ART',
        legal: 'Ley 19.587 / Dec. 1338/96',
        question: '¿El establecimiento cuenta con Servicio de Higiene y Seguridad con asignación de horas profesionales vigentes y legajo técnico actualizado?',
        correctiveAction: 'Designar responsable de Higiene y Seguridad matriculado y actualizar legajo técnico.'
      },
      {
        id: 'SRT-1.2',
        category: '1. Gestión Legal y ART',
        legal: 'Res. SRT 463/09 y Res. 45/2026',
        question: '¿Se encuentra presentado y vigente el Relevamiento General de Riesgos Laborales (RGRL) y la Declaración Jurada anual ante la ART?',
        correctiveAction: 'Actualizar y presentar el formulario RGRL y plan de regularización en ventanilla electrónica de la ART.'
      },
      {
        id: 'SRT-1.3',
        category: '1. Gestión Legal y ART',
        legal: 'Res. SRT 37/10',
        question: '¿Se presentó la Nómina de Personal Expuesto (RAR) para la realización de los exámenes médicos periódicos obligatorios?',
        correctiveAction: 'Confeccionar y remitir el Relevamiento de Agentes de Riesgo (RAR) actualizado a la ART.'
      },
      {
        id: 'SRT-1.4',
        category: '1. Gestión Legal y ART',
        legal: 'Res. SRT 70/97 / Ley 16.600',
        question: '¿Se exhibe en lugar visible el Afiche informativo de la ART con teléfonos de emergencia y se cuenta con Seguro de Vida Obligatorio vigente?',
        correctiveAction: 'Colocar cartel oficial de ART en ingreso/comedor y archivar póliza vigente de Seguro de Vida Obligatorio.'
      },
      {
        id: 'SRT-2.1',
        category: '2. Elementos de Protección Personal (EPP)',
        legal: 'Res. SRT 299/11',
        question: '¿Se registra la entrega de Elementos de Protección Personal y Ropa de Trabajo en la planilla oficial firmada por cada trabajador?',
        correctiveAction: 'Completar y hacer firmar las planillas individuales de entrega de EPP según el Anexo de la Res. SRT 299/11.'
      },
      {
        id: 'SRT-2.2',
        category: '2. Elementos de Protección Personal (EPP)',
        legal: 'Res. SIyC 18/25 / IRAM',
        question: '¿Todos los EPP entregados poseen certificación vigente (IRAM/UL) y marcado AR con trazabilidad verificable?',
        correctiveAction: 'Reemplazar los EPP sin certificación por elementos homologados con sello IRAM / Marcado AR.'
      },
      {
        id: 'SRT-2.3',
        category: '2. Elementos de Protección Personal (EPP)',
        legal: 'Dec. 351/79 Cap. 19',
        question: '¿Se verifica en planta el uso efectivo, correcto estado de conservación y reposición oportuna de los EPP acordes al riesgo del puesto?',
        correctiveAction: 'Reforzar supervisión operativa en planta y reponer EPP desgastados o dañados.'
      },
      {
        id: 'SRT-3.1',
        category: '3. Riesgo Eléctrico y Puesta a Tierra',
        legal: 'Res. SRT 900/15',
        question: '¿Cuenta con Protocolo Oficial de Medición de Puesta a Tierra y Continuidad de las Masas vigente (antigüedad menor a 12 meses)?',
        correctiveAction: 'Ejecutar medición anual de puesta a tierra y continuidad con instrumento calibrado bajo protocolo Res. SRT 900/15.'
      },
      {
        id: 'SRT-3.2',
        category: '3. Riesgo Eléctrico y Puesta a Tierra',
        legal: 'Dec. 351/79 Anexo VI / AEA 90364',
        question: '¿Todos los circuitos cuentan con interruptor diferencial (disyuntor ≤ 30 mA) e interruptor termomagnético operativos y con prueba mensual?',
        correctiveAction: 'Instalar/reemplazar protecciones diferenciales de 30 mA en todos los circuitos terminales.'
      },
      {
        id: 'SRT-3.3',
        category: '3. Riesgo Eléctrico y Puesta a Tierra',
        legal: 'Dec. 351/79 Anexo VI',
        question: '¿Los tableros eléctricos poseen gabinete estanco, contratapa ciega cubre-bornes, señalización de riesgo eléctrico, llave y diagrama unifilar?',
        correctiveAction: 'Instalar contratapa aislante cubre-bornes, identificar circuitos y colocar pictograma de riesgo eléctrico.'
      },
      {
        id: 'SRT-3.4',
        category: '3. Riesgo Eléctrico y Puesta a Tierra',
        legal: 'Dec. 351/79 Anexo VI Pto. 3',
        question: '¿Se aplica procedimiento de Bloqueo y Etiquetado (LOTO) con candado y tarjeta personal antes de intervenir equipos o tableros?',
        correctiveAction: 'Proveer kit de bloqueo LOTO y exigir consignación y verificación de energía cero antes de mantenimiento.'
      },
      {
        id: 'SRT-4.1',
        category: '4. Protección Contra Incendios y Evacuación',
        legal: 'Dec. 351/79 Cap. 18 Anexo VII',
        question: '¿El establecimiento cuenta con Estudio de Carga de Fuego actualizado que determine el potencial extintor requerido por sector?',
        correctiveAction: 'Confeccionar Estudio de Carga de Fuego firmado por profesional habilitado conforme Anexo VII.'
      },
      {
        id: 'SRT-4.2',
        category: '4. Protección Contra Incendios y Evacuación',
        legal: 'Dec. 351/79 Cap. 18 / IRAM 3517-2',
        question: '¿Los extintores poseen carga y prueba hidráulica vigente, oblea reglamentaria, chapa baliza, altura adecuada y acceso libre de obstáculos?',
        correctiveAction: 'Recargar extintores vencidos, despejar obstrucciones y colocar chapa baliza reglamentaria.'
      },
      {
        id: 'SRT-4.3',
        category: '4. Protección Contra Incendios y Evacuación',
        legal: 'Dec. 351/79 Art. 172',
        question: '¿Las vías de escape y salidas de emergencia están señalizadas, despejadas, abren en sentido de evacuación y poseen iluminación de emergencia autónoma?',
        correctiveAction: 'Liberar pasillos de evacuación, verificar luminarias autónomas de emergencia y señalización fotoluminiscente.'
      },
      {
        id: 'SRT-4.4',
        category: '4. Protección Contra Incendios y Evacuación',
        legal: 'Dec. 351/79 Art. 187',
        question: '¿Se cuenta con Plan de Evacuación documentado, roles de brigada asignados y registro de simulacro de evacuación realizado en el último año?',
        correctiveAction: 'Realizar simulacro anual de evacuación y labrar acta con tiempos de respuesta y oportunidades de mejora.'
      },
      {
        id: 'SRT-5.1',
        category: '5. Higiene Industrial y Ergonomía',
        legal: 'Res. SRT 84/12',
        question: '¿Cuenta con Protocolo Oficial de Medición de Iluminación vigente (< 12 meses) y los niveles en lux cumplen con el Decreto 351/79 Anexo IV?',
        correctiveAction: 'Realizar protocolo anual Res. SRT 84/12 y adecuar luminarias en puestos con nivel deficitario.'
      },
      {
        id: 'SRT-5.2',
        category: '5. Higiene Industrial y Ergonomía',
        legal: 'Res. SRT 85/12',
        question: '¿Cuenta con Protocolo Oficial de Medición de Nivel Sonoro Continuo Equivalente vigente (< 12 meses) con valores ≤ 85 dBA o programa de conservación auditiva?',
        correctiveAction: 'Ejecutar medición de ruido Res. SRT 85/12 e implementar controles de ingeniería y protección auditiva.'
      },
      {
        id: 'SRT-5.3',
        category: '5. Higiene Industrial y Ergonomía',
        legal: 'Res. SRT 886/15 / Res. 295/03',
        question: '¿Se encuentra implementado el Programa de Ergonomía Integrado (Planillas 1, 2, 3 y 4 de la Res. SRT 886/15) en los puestos operativos?',
        correctiveAction: 'Relevar puestos de trabajo mediante las Planillas 1 y 2 de la Res. SRT 886/15 y definir mejoras ergonómicas.'
      },
      {
        id: 'SRT-5.4',
        category: '5. Higiene Industrial y Ergonomía',
        legal: 'Dec. 351/79 Art. 57 y 58',
        question: '¿Se realizaron los análisis bacteriológicos (semestral) y físico-químicos (anual) del agua de consumo humano con resultado apto?',
        correctiveAction: 'Tomar muestras de agua con laboratorio habilitado para análisis físico-químico y bacteriológico.'
      },
      {
        id: 'SRT-6.1',
        category: '6. Máquinas, Autoelevadores e Izaje',
        legal: 'Dec. 351/79 Cap. 15',
        question: '¿Todas las máquinas y herramientas cuentan con resguardos fijos/móviles en poleas, correas, engranajes y parada de emergencia tipo golpe de puño?',
        correctiveAction: 'Instalar protecciones mecánicas fijas o enclavadas en partes rotativas y puntos de atrapamiento.'
      },
      {
        id: 'SRT-6.2',
        category: '6. Máquinas, Autoelevadores e Izaje',
        legal: 'Res. SRT 960/15',
        question: '¿Los autoelevadores cuentan con checklist diario pre-uso, alarma de retroceso, cinturón, matafuego, certificación técnica anual y operadores habilitados?',
        correctiveAction: 'Completar checklist diario pre-operacional, capacitar/habilitar operadores y verificar dispositivos de seguridad Res. 960/15.'
      },
      {
        id: 'SRT-6.3',
        category: '6. Máquinas, Autoelevadores e Izaje',
        legal: 'Dec. 351/79 Cap. 15 y 16',
        question: '¿Los aparatos sometidos a presión (compresores/calderas) y equipos de izaje (aparejos, eslingas, ganchos con traba) poseen inspección y ensayos vigentes?',
        correctiveAction: 'Realizar inspección técnica y ensayos no destructivos/prueba hidráulica en compresores y elementos de izaje.'
      },
      {
        id: 'SRT-7.1',
        category: '7. Químicos, Capacitación y Salud Ocupacional',
        legal: 'Res. SRT 801/15 (SGA)',
        question: '¿Todos los productos químicos cuentan con rotulado SGA (Sistema Globalmente Armonizado), Fichas de Datos de Seguridad (FDS) en español y bateas de contención?',
        correctiveAction: 'Rotular envases y trasvases según SGA (Res. SRT 801/15), disponibilizar FDS en sector e instalar batea de contención.'
      },
      {
        id: 'SRT-7.2',
        category: '7. Químicos, Capacitación y Salud Ocupacional',
        legal: 'Dec. 351/79 Cap. 21 / Res. SRT 28/2026',
        question: '¿Se cumple el Plan Anual de Capacitación firmado por los trabajadores, incluyendo primeros auxilios, riesgos específicos y factores psicosociales?',
        correctiveAction: 'Dictar las capacitaciones pendientes del cronograma anual y registrar constancias firmadas.'
      }
    ]
  },

  iso_45001: {
    name: '🌐 Norma ISO 45001:2018 Completa (Cláusulas 4 a 10)',
    shortName: '🌐 ISO 45001:2018',
    badge: '22 Puntos • Cláusulas 4-10',
    standard: 'ISO 45001:2018 (Seguridad y Salud en el Trabajo)',
    defaultObjective:
      'Evaluar la conformidad, implementación eficaz y mantenimiento del Sistema de Gestión de la Seguridad y Salud en el Trabajo (SGSST) con respecto a los requisitos de la norma internacional ISO 45001:2018 y directrices de auditoría ISO 19011.',
    defaultScope:
      'Todos los procesos estratégicos, operativos y de soporte comprendidos dentro del alcance del Sistema de Gestión de SST de la organización.',
    items: [
      { id: 'ISO-4.1', category: 'Cláusula 4: Contexto de la Organización', legal: 'ISO 45001 Cl. 4.1', question: '¿Se han determinado y actualizado las cuestiones internas y externas pertinentes para el propósito del SGSST?' },
      { id: 'ISO-4.2', category: 'Cláusula 4: Contexto de la Organización', legal: 'ISO 45001 Cl. 4.2', question: '¿Se han identificado las necesidades y expectativas de los trabajadores y otras partes interesadas y cuáles son requisitos legales?' },
      { id: 'ISO-4.3', category: 'Cláusula 4: Contexto de la Organización', legal: 'ISO 45001 Cl. 4.3 / 4.4', question: '¿El alcance del SGSST está documentado y se han establecido los procesos necesarios y sus interacciones?' },
      { id: 'ISO-5.1', category: 'Cláusula 5: Liderazgo y Participación', legal: 'ISO 45001 Cl. 5.1', question: '¿La Alta Dirección demuestra liderazgo y compromiso asumiendo la rendición de cuentas por la prevención de lesiones y deterioro de la salud?' },
      { id: 'ISO-5.2', category: 'Cláusula 5: Liderazgo y Participación', legal: 'ISO 45001 Cl. 5.2', question: '¿Existe una Política de SST aprobada, comunicada y disponible que incluya el compromiso de eliminar peligros y reducir riesgos?' },
      { id: 'ISO-5.3', category: 'Cláusula 5: Liderazgo y Participación', legal: 'ISO 45001 Cl. 5.3', question: '¿Se han asignado y comunicado los roles, responsabilidades y autoridades dentro del SGSST en todos los niveles?' },
      { id: 'ISO-5.4', category: 'Cláusula 5: Liderazgo y Participación', legal: 'ISO 45001 Cl. 5.4', question: '¿Existen mecanismos activos de consulta y participación de los trabajadores no directivos en la identificación de peligros y toma de decisiones?' },
      { id: 'ISO-6.1.2', category: 'Cláusula 6: Planificación', legal: 'ISO 45001 Cl. 6.1.2', question: '¿La matriz IPER (Identificación de Peligros y Evaluación de Riesgos) contempla actividades rutinarias, no rutinarias, emergencias y factores humanos?' },
      { id: 'ISO-6.1.3', category: 'Cláusula 6: Planificación', legal: 'ISO 45001 Cl. 6.1.3', question: '¿Existe una Matriz de Requisitos Legales y Otros Requisitos actualizada y accesible?' },
      { id: 'ISO-6.2', category: 'Cláusula 6: Planificación', legal: 'ISO 45001 Cl. 6.2', question: '¿Se han establecido objetivos de SST medibles, con metas, recursos, responsables, plazos e indicadores de seguimiento?' },
      { id: 'ISO-7.2', category: 'Cláusula 7: Apoyo', legal: 'ISO 45001 Cl. 7.1 / 7.2', question: '¿Se asegura y documenta la competencia del personal en base a educación, formación o experiencia para tareas con impacto en SST?' },
      { id: 'ISO-7.3', category: 'Cláusula 7: Apoyo', legal: 'ISO 45001 Cl. 7.3 / 7.4', question: '¿Los trabajadores tienen toma de conciencia sobre la política, peligros y su derecho a retirarse de situaciones de peligro inminente?' },
      { id: 'ISO-7.5', category: 'Cláusula 7: Apoyo', legal: 'ISO 45001 Cl. 7.5', question: '¿La información documentada del SGSST está controlada en cuanto a versión, aprobación, disponibilidad y retención?' },
      { id: 'ISO-8.1.2', category: 'Cláusula 8: Operación', legal: 'ISO 45001 Cl. 8.1.1 / 8.1.2', question: '¿Se aplican controles operacionales siguiendo estrictamente la Jerarquía de Controles (Eliminación, Sustitución, Ingeniería, Administrativos, EPP)?' },
      { id: 'ISO-8.1.3', category: 'Cláusula 8: Operación', legal: 'ISO 45001 Cl. 8.1.3', question: '¿Se aplica un procedimiento de Gestión del Cambio (MOC) antes de introducir nuevos equipos, sustancias, procesos o cambios organizacionales?' },
      { id: 'ISO-8.1.4', category: 'Cláusula 8: Operación', legal: 'ISO 45001 Cl. 8.1.4', question: '¿Se controlan las compras y se verifica el cumplimiento de criterios de SST en contratistas y procesos contratados externamente?' },
      { id: 'ISO-8.2', category: 'Cláusula 8: Operación', legal: 'ISO 45001 Cl. 8.2', question: '¿Se mantienen planes de preparación y respuesta ante emergencias y se realizan pruebas periódicas (simulacros) evaluando su eficacia?' },
      { id: 'ISO-9.1', category: 'Cláusula 9: Evaluación del Desempeño', legal: 'ISO 45001 Cl. 9.1.1 / 9.1.2', question: '¿Se realiza seguimiento y medición del desempeño de SST (indicadores reactivos y proactivos), calibración de equipos y evaluación de cumplimiento legal?' },
      { id: 'ISO-9.2', category: 'Cláusula 9: Evaluación del Desempeño', legal: 'ISO 45001 Cl. 9.2', question: '¿Se ejecuta el programa anual de auditorías internas con auditores objetivos e imparciales y se comunican sus resultados?' },
      { id: 'ISO-9.3', category: 'Cláusula 9: Evaluación del Desempeño', legal: 'ISO 45001 Cl. 9.3', question: '¿La Alta Dirección realiza la Revisión por la Dirección a intervalos planificados con todas las entradas y salidas requeridas por la norma?' },
      { id: 'ISO-10.2', category: 'Cláusula 10: Mejora', legal: 'ISO 45001 Cl. 10.2', question: '¿Se investigan los incidentes y no conformidades determinando la causa raíz (5 Porqués / Ishikawa) y verificando la eficacia de las acciones correctivas?' },
      { id: 'ISO-10.3', category: 'Cláusula 10: Mejora', legal: 'ISO 45001 Cl. 10.3', question: '¿Se evidencian acciones concretas de mejora continua que eleven la cultura preventiva y el desempeño del SGSST?' }
    ]
  },

  construccion_911: {
    name: '🏗️ Obras en Construcción (Decreto 911/96 y Res. SRT)',
    shortName: '🏗️ Obras Dec. 911/96',
    badge: '16 Puntos • Obra',
    standard: 'Decreto 911/96 (Industria de la Construcción)',
    defaultObjective:
      'Auditar las condiciones de Higiene y Seguridad en obra conforme al Decreto N° 911/96 y Resoluciones SRT N° 231/96, 51/97, 35/98 y 319/99, verificando protecciones colectivas, trabajo en altura, excavaciones e instalaciones provisorias.',
    defaultScope:
      'Frentes de obra activos, obradores, tableros eléctricos de obra, andamios, excavaciones y legajo técnico en obrador.',
    items: [
      { id: 'OBR-1', category: '1. Legajo Técnico y Documentación de Obra', legal: 'Res. SRT 51/97 / 35/98', question: '¿Se encuentra en obra el Programa de Seguridad Único aprobado por la ART y el Aviso de Inicio de Obra vigente?' },
      { id: 'OBR-2', category: '1. Legajo Técnico y Documentación de Obra', legal: 'Dec. 911/96 Art. 20 / Res. 231/96', question: '¿Se encuentra actualizado el Legajo Técnico en obra con visitas del profesional de HyS, certificados de cobertura ART con cláusula de no repetición y entregas de EPP?' },
      { id: 'OBR-3', category: '2. Infraestructura y Servicios de Obra', legal: 'Res. SRT 231/96 Art. 1', question: '¿La obra cuenta con baños y vestuarios higiénicos, comedor adecuado, provisión de agua potable y botiquín de primeros auxilios?' },
      { id: 'OBR-4', category: '2. Infraestructura y Servicios de Obra', legal: 'Dec. 911/96 Cap. 5', question: '¿La circulación peatonal y vehicular en obra está señalizada, ordenada, libre de escombros y con clavos/hierros expuestos protegidos (capuchones)?' },
      { id: 'OBR-5', category: '3. Protecciones Colectivas y Trabajo en Altura', legal: 'Dec. 911/96 Art. 52 y 218', question: '¿Todos los bordes de losa, huecos de ascensor, aberturas y desniveles poseen barandas rígidas reglamentarias (1 m de alto, travesaño a 0,50 m y rodapié de 15 cm)?' },
      { id: 'OBR-6', category: '3. Protecciones Colectivas y Trabajo en Altura', legal: 'Dec. 911/96 Art. 54', question: '¿En trabajos con riesgo de caída superior a 2 metros los operarios utilizan arnés de cuerpo completo certificado amarrado a línea de vida o punto fijo independiente?' },
      { id: 'OBR-7', category: '4. Andamios, Silletas y Escaleras', legal: 'Dec. 911/96 Art. 221-232', question: '¿Los andamios poseen plataforma completa de mín. 60 cm trabada, barandas perimetrales, rodapié, arriostramiento a estructura y tarjeta de habilitación verde?' },
      { id: 'OBR-8', category: '4. Andamios, Silletas y Escaleras', legal: 'Dec. 911/96 Art. 210', question: '¿Las escaleras de mano poseen zapatas antideslizantes, sobrepasan 1 m el punto de apoyo superior y se encuentran amarradas?' },
      { id: 'OBR-9', category: '5. Excavaciones, Submuraciones y Demoliciones', legal: 'Dec. 911/96 Art. 147 / Res. 503/14', question: '¿Las excavaciones de más de 1,20 m cuentan con estudio de suelo, entibamiento/talud seguro, vallado perimetral y escaleras de escape cada 15 m?' },
      { id: 'OBR-10', category: '5. Excavaciones, Submuraciones y Demoliciones', legal: 'Res. SRT 503/14', question: '¿Se verificó la ausencia e interferencia de instalaciones subterráneas (gas, electricidad, agua) previo al inicio de la excavación y el acopio está a más de 2 m del borde?' },
      { id: 'OBR-11', category: '6. Instalación Eléctrica Provisoria de Obra', legal: 'Dec. 911/96 Art. 86-88', question: '¿El tablero principal y los tableros seccionales de obra son estancos (IP54), poseen disyuntor diferencial de 30 mA, llave térmica y puesta a tierra medida?' },
      { id: 'OBR-12', category: '6. Instalación Eléctrica Provisoria de Obra', legal: 'Dec. 911/96 Art. 89', question: '¿Los cables eléctricos en obra son tipo taller envainados sin empalmes precarios, tendidos de forma aérea (>2,40 m) o protegidos contra el paso de vehículos y humedad?' },
      { id: 'OBR-13', category: '7. Máquinas, Hormigoneras, Grúas e Izaje', legal: 'Dec. 911/96 Art. 189 y 265', question: '¿La sierra circular, hormigonera y herramientas eléctricas portátiles poseen carcasa protectora de hoja/poleas y doble aislación o puesta a tierra?' },
      { id: 'OBR-14', category: '7. Máquinas, Hormigoneras, Grúas e Izaje', legal: 'Dec. 911/96 Cap. 11', question: '¿Los equipos de izaje (grúas, guinches, eslingas, grilletes) cuentan con tabla de carga visible, gancho con pestillo de seguridad y zona de izaje vallada?' },
      { id: 'OBR-15', category: '8. EPP y Capacitación en Obra', legal: 'Dec. 911/96 Cap. 6 / Res. 299/11', question: '¿Todo el personal en obra utiliza casco, calzado de seguridad con puntera, protección ocular/auditiva y chaleco reflectivo?' },
      { id: 'OBR-16', category: '8. EPP y Capacitación en Obra', legal: 'Dec. 911/96 Cap. 3', question: '¿Se dictan y registran las charlas diarias de 5 minutos (Toolbox Talk) y la inducción de ingreso a todo trabajador nuevo o subcontratista?' }
    ]
  },

  ambiental_14001: {
    name: '🌱 Auditoría Ambiental (ISO 14001:2015 / Ley 24.051)',
    shortName: '🌱 Ambiental ISO 14001',
    badge: '14 Puntos • Medio Ambiente',
    standard: 'ISO 14001:2015 / Ley 24.051 (Gestión Ambiental)',
    defaultObjective:
      'Evaluar el desempeño ambiental del establecimiento, la gestión integral de residuos peligrosos/especiales, efluentes líquidos, emisiones gaseosas y la preparación ante contingencias ambientales según ISO 14001:2015 y Ley N° 24.051.',
    defaultScope:
      'Depósito transitorio de residuos peligrosos, planta de tratamiento de efluentes, almacén de sustancias químicas, conductos de emisión y documentación ambiental.',
    items: [
      { id: 'AMB-1', category: '1. Gestión y Permisos Ambientales', legal: 'ISO 14001 Cl. 6.1.2 / Ley 25.675', question: '¿El establecimiento cuenta con Matriz de Aspectos e Impactos Ambientales (MAIA) actualizada para condiciones normales, anormales y de emergencia?' },
      { id: 'AMB-2', category: '1. Gestión y Permisos Ambientales', legal: 'Ley 24.051 / Normativa Provincial', question: '¿Se encuentra vigente el Certificado de Aptitud Ambiental y la inscripción como Generador de Residuos Peligrosos / Especiales?' },
      { id: 'AMB-3', category: '2. Gestión de Residuos Peligrosos e Industriales', legal: 'Ley 24.051 / Dec. 831/93', question: '¿Existe segregación en origen de residuos (domiciliarios, reciclables, peligrosos/especiales) en contenedores diferenciados y rotulados por corriente (Y)?' },
      { id: 'AMB-4', category: '2. Gestión de Residuos Peligrosos e Industriales', legal: 'Ley 24.051', question: '¿El depósito transitorio de residuos peligrosos es techado, cerrado, ventilado, con piso impermeable, batea/pendiente de contención de derrames y acceso restringido?' },
      { id: 'AMB-5', category: '2. Gestión de Residuos Peligrosos e Industriales', legal: 'Ley 24.051 Art. 12', question: '¿Se archivan todos los Manifiestos de Transporte y los Certificados de Tratamiento y Disposición Final emitidos por operadores habilitados?' },
      { id: 'AMB-6', category: '3. Efluentes Líquidos y Emisiones Gaseosas', legal: 'Dec. 674/89 / Autoridad del Agua', question: '¿Los efluentes líquidos industriales pasan por planta de tratamiento/cámara decantadora y cuentan con cámara toma-muestras accesible y aforo?' },
      { id: 'AMB-7', category: '3. Efluentes Líquidos y Emisiones Gaseosas', legal: 'Normativa Ambiental Vigente', question: '¿Se realizan los monitoreos periódicos de calidad de efluentes líquidos y emisiones gaseosas por conducto con protocolo de laboratorio habilitado dentro de los límites de vuelco?' },
      { id: 'AMB-8', category: '4. Almacenamiento Químico y Prevención de Derrames', legal: 'ISO 14001 Cl. 8.1 / Res. 801/15', question: '¿Los tambores, IBC y tanques de combustibles/químicos cuentan con batea de contención secundaria con capacidad ≥ 110% del envase de mayor volumen?' },
      { id: 'AMB-9', category: '4. Almacenamiento Químico y Prevención de Derrames', legal: 'ISO 14001 Cl. 8.1', question: '¿Se respeta la matriz de compatibilidad química en el almacenamiento y no existen drenajes pluviales abiertos conectados a zonas con riesgo de derrame?' },
      { id: 'AMB-10', category: '5. Respuesta ante Contingencias Ambientales', legal: 'ISO 14001 Cl. 8.2', question: '¿Existen Kits Antiderrame completos (paños/almohadillas absorbentes, turba/sepiolita, pala antichispa, bolsas amarillas/rojas y EPP) cerca de las áreas críticas?' },
      { id: 'AMB-11', category: '5. Respuesta ante Contingencias Ambientales', legal: 'ISO 14001 Cl. 8.2', question: '¿Se cuenta con ducha de emergencia y lavaojos operativos a menos de 10 segundos de alcance en las zonas de manipulación de químicos?' },
      { id: 'AMB-12', category: '5. Respuesta ante Contingencias Ambientales', legal: 'ISO 14001 Cl. 8.2', question: '¿Se ha realizado al menos un simulacro anual de derrame químico / contingencia ambiental con evaluación de respuesta?' },
      { id: 'AMB-13', category: '6. Uso Sostenible de Recursos y Ruido Ambiental', legal: 'ISO 14001 Cl. 9.1 / IRAM 4062', question: '¿Se monitorea el nivel de ruido ambiental hacia linderos (IRAM 4062) y se llevan indicadores de consumo de agua, energía y generación de residuos?' },
      { id: 'AMB-14', category: '6. Uso Sostenible de Recursos y Ruido Ambiental', legal: 'ISO 14001 Cl. 7.2 / 7.3', question: '¿El personal operativo recibió capacitación ambiental en segregación de residuos y actuación ante derrames?' }
    ]
  },

  operativa_pts: {
    name: '🏭 Seguridad Operativa, Trabajos Críticos y 5S',
    shortName: '🏭 Planta / PTS / 5S',
    badge: '14 Puntos • Planta / PTS',
    standard: 'ISO 45001:2018 + Ley 19.587 / Dec. 351/79 (Integrada)',
    defaultObjective:
      'Verificar el control operativo en tareas críticas (Trabajos en Caliente, Espacios Confinados, Altura, LOTO e Izaje), almacenamiento en racks y estándares de Orden y Limpieza (5S) en planta.',
    defaultScope:
      'Naves industriales, talleres de mantenimiento, almacenes de racks, sectores de intervención de contratistas y permisos de trabajo activos.',
    items: [
      { id: 'OPE-1', category: '1. Permisos de Trabajo Seguro (PTS) y ATS', legal: 'ISO 45001 Cl. 8.1 / Procedimiento PTS', question: '¿Toda tarea no rutinaria o de alto riesgo cuenta con Análisis de Trabajo Seguro (ATS) y Permiso de Trabajo firmado en el puesto antes de iniciar?' },
      { id: 'OPE-2', category: '1. Permisos de Trabajo Seguro (PTS) y ATS', legal: 'Dec. 351/79 Cap. 18 / NFPA 51B', question: '¿En Trabajos en Caliente (soldadura/amolado) se despejan inflamables en radio de 11 m, se colocan mantas ignífugas, extintor en sitio y guardia de cenizas por 30-60 min?' },
      { id: 'OPE-3', category: '2. Espacios Confinados y Atmósferas Peligrosas', legal: 'IRAM 3625 / OSHA 1910.146', question: '¿Antes y durante el ingreso a espacios confinados se mide y registra atmósfera con detector multigas calibrado (O2: 19.5%-23.5%, LEL < 10%, CO y H2S)?' },
      { id: 'OPE-4', category: '2. Espacios Confinados y Atmósferas Peligrosas', legal: 'IRAM 3625', question: '¿En espacios confinados se dispone de vigía permanente en el exterior, ventilación forzada, arnés con línea de rescate y trípode/sistema de extracción?' },
      { id: 'OPE-5', category: '3. Bloqueo y Etiquetado de Energías (LOTO)', legal: 'OSHA 1910.147 / Dec. 351/79', question: '¿Se identifican y bloquean todas las fuentes de energía (eléctrica, neumática, hidráulica, térmica, gravitacional) con candado individual y prueba de energía cero?' },
      { id: 'OPE-6', category: '4. Trabajo en Altura e Izaje Crítico', legal: 'Dec. 351/79 / IRAM 3622', question: '¿En trabajos en altura (>1,80 / 2 m) se inspeccionan arneses, cabos de vida con amortiguador y plataformas elevadoras (PEMP/tijera) antes del uso?' },
      { id: 'OPE-7', category: '4. Trabajo en Altura e Izaje Crítico', legal: 'ASME B30 / Dec. 351/79', question: '¿Las maniobras de izaje cuentan con eslingas/cadenas sin daños visibles, ganchos con seguro funcional y prohibición estricta de tránsito bajo carga suspendida?' },
      { id: 'OPE-8', category: '5. Almacenamiento, Racks y Movimiento de Cargas', legal: 'IRAM-ISO / EN 15635 / Res. 960/15', question: '¿Las estanterías metálicas (racks) poseen cartel de carga máxima admisible por nivel, protectores de puntales, anclaje al piso y ausencia de vigas/columnas deformadas?' },
      { id: 'OPE-9', category: '5. Almacenamiento, Racks y Movimiento de Cargas', legal: 'Dec. 351/79 Art. 42', question: '¿Los pallets están en buen estado, la mercadería estibada de forma estable/filmada y se respeta la separación entre peatones y autoelevadores?' },
      { id: 'OPE-10', category: '6. Orden, Limpieza (5S) y Condiciones Edilicias', legal: 'Dec. 351/79 Art. 42-45', question: '¿Los pisos de planta están limpios, sin manchas de aceite/grasa, con pasillos peatonales demarcados en amarillo y libres de obstrucciones?' },
      { id: 'OPE-11', category: '6. Orden, Limpieza (5S) y Condiciones Edilicias', legal: 'Dec. 351/79 Cap. 12', question: '¿Las herramientas manuales y eléctricas se almacenan ordenadas en tableros/pañol y los cables o mangueras no cruzan zonas de paso generando riesgo de tropiezo?' },
      { id: 'OPE-12', category: '7. Control de Contratistas y Emergencias', legal: 'ISO 45001 Cl. 8.1.4', question: '¿Las empresas contratistas en planta presentaron cobertura ART vigente, cláusula de no repetición, nómina, inducción de seguridad y entrega de EPP?' },
      { id: 'OPE-13', category: '7. Control de Contratistas y Emergencias', legal: 'Dec. 351/79 Cap. 18', question: '¿Los pulsadores de alarma, detectores de humo, hidrantes, botiquines y desfibrilador (DEA) están señalizados, accesibles y con revisión mensual al día?' },
      { id: 'OPE-14', category: '7. Control de Contratistas y Emergencias', legal: 'ISO 45001 Cl. 10.2', question: '¿Se reportan e investigan los cuasi-accidentes (Near Miss) y tarjetas STOP detectadas durante la operación?' }
    ]
  }
};

const ISO_CHECKLIST_BASE: Record<string, Omit<AuditChecklistItem, 'status' | 'observation'>[]> = {
  context: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-4.')),
  leadership: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-5.')),
  planning: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-6.')),
  support: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-7.')),
  operation: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-8.')),
  performance: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-9.')),
  improvement: CHECKLIST_TEMPLATES.iso_45001.items.filter((i) => String(i.id).startsWith('ISO-10.'))
};

// Estilos de alto contraste para los botones Conforme / Desvío / N/A (visibles en modo claro y oscuro)
const getStatusButtonStyles = (status: 'si' | 'no' | 'na', isSelected: boolean): React.CSSProperties => {
  if (!isSelected) {
    if (status === 'si') {
      return {
        backgroundColor: 'rgba(16, 185, 129, 0.08)',
        color: '#059669',
        border: '1.5px solid rgba(16, 185, 129, 0.35)',
        fontWeight: 800
      };
    }
    if (status === 'no') {
      return {
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        color: '#dc2626',
        border: '1.5px solid rgba(239, 68, 68, 0.35)',
        fontWeight: 800
      };
    }
    return {
      backgroundColor: 'rgba(100, 116, 139, 0.1)',
      color: 'var(--color-text)',
      border: '1.5px solid var(--color-border)',
      fontWeight: 800
    };
  }

  switch (status) {
    case 'si':
      return {
        backgroundColor: '#059669',
        color: '#ffffff',
        border: '1.5px solid #047857',
        boxShadow: '0 3px 10px rgba(5, 150, 105, 0.35)',
        fontWeight: 900
      };
    case 'no':
      return {
        backgroundColor: '#dc2626',
        color: '#ffffff',
        border: '1.5px solid #b91c1c',
        boxShadow: '0 3px 10px rgba(220, 38, 38, 0.35)',
        fontWeight: 900
      };
    case 'na':
    default:
      return {
        backgroundColor: '#475569',
        color: '#ffffff',
        border: '1.5px solid #334155',
        boxShadow: '0 2px 6px rgba(71, 85, 105, 0.3)',
        fontWeight: 900
      };
  }
};

export default function AuditForm(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [, setIsPrinting] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>('srt_integral');
  const [statusFilter, setStatusFilter] = useState<'all' | 'si' | 'no' | 'na'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddCustomItem, setShowAddCustomItem] = useState(false);
  const [customItem, setCustomItem] = useState({
    category: 'Verificación Específica de Planta',
    legal: 'Ley 19.587 / ISO 45001',
    question: '',
    correctiveAction: ''
  });

  const handleDirectPrint = async () => {
    setIsPrinting(true);
    const toastId = toast.loading('Preparando informe oficial de auditoría...');
    try {
      await new Promise((r) => setTimeout(r, 400));
      const element = document.getElementById('pdf-content');
      if (!element) throw new Error('Elemento de impresión no encontrado');
      await printElementAsDocument('pdf-content', `Auditoria - ${audit.title || 'EHS'}`, false);
      toast.dismiss(toastId);
    } catch (err) {
      console.error('[AuditForm] Error al imprimir:', err);
      toast.dismiss(toastId);
      window.print();
    } finally {
      setIsPrinting(false);
    }
  };

  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  const [professional, setProfessional] = useState(() => {
    const pro = getSavedProfessionalData();
    return {
      name: pro.name,
      license: pro.license,
      profession: pro.profession || DEFAULT_PROFESSION,
      signature: pro.signature,
      stamp: pro.stamp
    };
  });

  useDocumentTitle(isEdit ? 'Editar Auditoría EHS' : 'Nueva Auditoría EHS');

  const [audit, setAudit] = useState(() => {
    const pro = getSavedProfessionalData();
    return {
      id: `AUD-${Date.now()}`,
      createdAt: new Date().toISOString(),
      title: '',
      facilityName: '',
      cuit: '',
      auditType: 'internal',
      standard: 'Ley 19.587 / Dec. 351/79 y Resoluciones SRT',
      status: 'in_progress',
      auditor: pro.name || '',
      leadAuditor: pro.name || '',
      license: pro.license || '',
      auditorRole: pro.profession || DEFAULT_PROFESSION,
      auditedPerson: '',
      auditTeam: '',
      date: new Date().toISOString().split('T')[0],
      scheduledDate: new Date().toISOString().split('T')[0],
      duration: '1 jornada (8 hs)',
      location: '',
      department: '',
      objective: CHECKLIST_TEMPLATES.srt_integral.defaultObjective,
      scope: CHECKLIST_TEMPLATES.srt_integral.defaultScope,
      checklist: [] as AuditChecklistItem[],
      closingMeeting: {
        date: new Date().toISOString().split('T')[0],
        participants: '',
        strengths: '',
        conclusions: ''
      },
      signature: pro.signature || '',
      operatorSignature: '',
      supervisorSignature: '',
      showSignatures: {
        operator: true,
        supervisor: true,
        professional: true
      }
    };
  });

  const checklistKpis = useMemo(() => {
    const list = audit.checklist || [];
    const si = list.filter((i) => i.status === 'si').length;
    const no = list.filter((i) => i.status === 'no').length;
    const na = list.filter((i) => i.status === 'na').length;
    const critical = list.filter((i) => i.status === 'no' && i.severity === 'critical').length;
    const major = list.filter((i) => i.status === 'no' && (i.severity === 'major' || !i.severity)).length;
    const evalCount = si + no;
    const percent = evalCount > 0 ? Math.round((si / evalCount) * 100) : 100;
    return { si, no, na, critical, major, evalCount, percent, total: list.length };
  }, [audit.checklist]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    (audit.checklist || []).forEach((item) => {
      if (item.category) set.add(item.category);
    });
    return Array.from(set);
  }, [audit.checklist]);

  useEffect(() => {
    const syncProfileData = () => {
      const pro = getSavedProfessionalData();
      setProfessional({
        name: pro.name,
        license: pro.license,
        profession: pro.profession || DEFAULT_PROFESSION,
        signature: pro.signature,
        stamp: pro.stamp
      });
      setAudit((prev) => ({
        ...prev,
        auditor: prev.auditor || pro.name || '',
        leadAuditor: prev.leadAuditor || pro.name || '',
        license: prev.license || pro.license || '',
        auditorRole: pro.profession || DEFAULT_PROFESSION,
        signature: prev.signature || pro.signature || ''
      }));
    };

    syncProfileData();
    window.addEventListener('storage', syncProfileData);
    window.addEventListener('signatureStampUpdated', syncProfileData);
    return () => {
      window.removeEventListener('storage', syncProfileData);
      window.removeEventListener('signatureStampUpdated', syncProfileData);
    };
  }, []);

  const applyTemplate = (templateKey: string, mode: 'replace' | 'append' = 'replace') => {
    const tpl = CHECKLIST_TEMPLATES[templateKey];
    if (!tpl) return;

    const mappedItems: AuditChecklistItem[] = tpl.items.map((item) => ({
      ...item,
      status: 'na',
      observation: '',
      severity: 'major',
      correctiveAction: item.correctiveAction || '',
      responsible: '',
      dueDate: ''
    }));

    setSelectedTemplateKey(templateKey);
    setCategoryFilter('all');

    if (mode === 'append') {
      const existingIds = new Set(audit.checklist.map((i) => String(i.id)));
      const newOnes = mappedItems.filter((i) => !existingIds.has(String(i.id)));
      setAudit((prev) => ({
        ...prev,
        checklist: [...prev.checklist, ...newOnes]
      }));
      toast.success(`Se sumaron ${newOnes.length} puntos adicionales al checklist.`);
    } else {
      setAudit((prev) => ({
        ...prev,
        standard: tpl.standard,
        objective: tpl.defaultObjective,
        scope: tpl.defaultScope,
        checklist: mappedItems
      }));
      toast.success(`Plantilla "${tpl.shortName}" cargada (${mappedItems.length} puntos).`);
    }
  };

  useEffect(() => {
    if (location.state?.editData) {
      const editData = location.state.editData;
      setAudit((prev) => ({
        ...prev,
        ...editData,
        auditor: editData.auditor || editData.leadAuditor || prev.auditor,
        leadAuditor: editData.leadAuditor || editData.auditor || prev.leadAuditor,
        date: editData.date || editData.scheduledDate || prev.date,
        scheduledDate: editData.scheduledDate || editData.date || prev.scheduledDate,
        standard: editData.standard || prev.standard,
        status: editData.status || 'in_progress',
        closingMeeting: {
          date: editData.closingMeeting?.date || editData.date || new Date().toISOString().split('T')[0],
          participants: editData.closingMeeting?.participants || '',
          strengths: editData.closingMeeting?.strengths || '',
          conclusions: editData.closingMeeting?.conclusions || editData.conclusion || ''
        },
        operatorSignature: editData.operatorSignature || '',
        supervisorSignature: editData.supervisorSignature || '',
        signature: editData.signature || prev.signature || '',
        showSignatures: editData.showSignatures || { operator: true, supervisor: true, professional: true }
      }));
      if (editData.showSignatures) {
        setShowSignatures(editData.showSignatures);
      }
      setIsEdit(true);
    } else if (location.state?.selectedAreas) {
      const newChecklist: AuditChecklistItem[] = [];
      location.state.selectedAreas.forEach((areaId: string) => {
        const items = ISO_CHECKLIST_BASE[areaId] || [];
        items.forEach((item) => {
          newChecklist.push({
            ...item,
            status: 'na',
            observation: '',
            severity: 'major',
            correctiveAction: item.correctiveAction || '',
            responsible: '',
            dueDate: ''
          });
        });
      });
      setAudit((prev) => ({ ...prev, checklist: newChecklist }));
    } else if (!isEdit && audit.checklist.length === 0) {
      const tpl = CHECKLIST_TEMPLATES.srt_integral;
      setAudit((prev) => ({
        ...prev,
        standard: tpl.standard,
        objective: tpl.defaultObjective,
        scope: tpl.defaultScope,
        checklist: tpl.items.map((item) => ({
          ...item,
          status: 'na',
          observation: '',
          severity: 'major',
          correctiveAction: item.correctiveAction || '',
          responsible: '',
          dueDate: ''
        }))
      }));
    }
  }, [location.state]);

  useEffect(() => {
    window.scrollTo(0, 0);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleAddCustomChecklistItem = () => {
    if (!customItem.question.trim()) {
      toast.error('Escribí la pregunta o requisito a auditar.');
      return;
    }
    const newItem: AuditChecklistItem = {
      id: `CUST-${Date.now().toString().slice(-4)}`,
      category: customItem.category.trim() || 'Verificación Específica de Planta',
      legal: customItem.legal.trim() || 'Ley 19.587 / ISO 45001',
      question: customItem.question.trim(),
      status: 'na',
      observation: '',
      severity: 'major',
      correctiveAction: customItem.correctiveAction.trim(),
      responsible: '',
      dueDate: ''
    };
    setAudit((prev) => ({
      ...prev,
      checklist: [...prev.checklist, newItem]
    }));
    setCustomItem({
      category: customItem.category,
      legal: customItem.legal,
      question: '',
      correctiveAction: ''
    });
    setShowAddCustomItem(false);
    toast.success('Punto de auditoría agregado al checklist.');
  };

  const handleMarkPendingAsConform = () => {
    const updated = audit.checklist.map((item) =>
      item.status === 'na' ? { ...item, status: 'si' as const } : item
    );
    setAudit((prev) => ({ ...prev, checklist: updated }));
    toast.success('Los ítems pendientes (N/A) fueron marcados como CONFORME.');
  };

  const handleAutoGenerateConclusion = () => {
    const { si, no, na, percent, critical, major, total } = checklistKpis;
    const conformItems = audit.checklist.filter((i) => i.status === 'si');
    const nonConformItems = audit.checklist.filter((i) => i.status === 'no');

    let strengthsText = '';
    if (conformItems.length > 0) {
      const topLegalRefs = Array.from(new Set(conformItems.slice(0, 6).map((i) => i.legal))).join(', ');
      strengthsText = `Se constató el cumplimiento satisfactorio de ${si} requisitos verificados (${percent}% de efectividad sobre los puntos aplicables), destacándose la conformidad en relación con ${topLegalRefs}. Se evidencia predisposición del personal y supervisión del sector "${audit.department || audit.location || 'auditado'}" durante el relevamiento en campo.`;
    } else {
      strengthsText =
        'Se destaca la colaboración del personal responsable del sector durante el recorrido técnico y la apertura para la revisión documental.';
    }

    let conclusionText = '';
    const placeName = audit.facilityName
      ? `del establecimiento "${audit.facilityName}" (${audit.location || 'Sede Operativa'})`
      : `del sector "${audit.location || 'auditado'}"`;

    if (no === 0 && si > 0) {
      conclusionText = `DICTAMEN TÉCNICO FAVORABLE (${percent}% DE CUMPLIMIENTO): Habiéndose evaluado un total de ${total} puntos bajo el marco de referencia "${audit.standard}" (${si} conformidades, 0 desvíos y ${na} no aplicables), se dictamina que las condiciones operativas y documentales ${placeName} resultan CONFORMES a las exigencias legales y técnicas vigentes. Se recomienda mantener la frecuencia de controles preventivos y capacitaciones periódicas para asegurar la mejora continua del Sistema de Gestión EHS.`;
    } else if (no > 0) {
      const ncDetails = nonConformItems
        .map(
          (nc, idx) =>
            `${idx + 1}) [${nc.legal}] ${nc.question}${nc.observation ? ` (Evidencia: ${nc.observation})` : ''}${
              nc.correctiveAction ? ` -> Acción requerida: ${nc.correctiveAction}` : ''
            }`
        )
        .join('\n');

      const dictamenLevel =
        critical > 0 || percent < 65
          ? 'DICTAMEN CONDICIONADO CON ACCIÓN INMEDIATA REQUERIDA'
          : 'DICTAMEN CON OBSERVACIONES Y PLAN DE ADECUACIÓN';

      conclusionText = `${dictamenLevel} (${percent}% DE CUMPLIMIENTO GLOBAL): Sobre un total de ${
        si + no
      } requisitos aplicables evaluados bajo "${audit.standard}", se registraron ${si} conformidades y ${no} desvíos / no conformidades (${critical} críticos y ${major} mayores).\n\nDetalle de hallazgos que requieren tratamiento correctivo:\n${ncDetails}\n\nEl responsable del establecimiento/sector deberá ejecutar las acciones correctivas indicadas dentro de los plazos establecidos y remitir evidencia de cierre al Servicio de Higiene y Seguridad para su verificación.`;
    } else {
      conclusionText = `En el marco de la auditoría realizada ${placeName} bajo "${audit.standard}", se deja constancia del relevamiento efectuado en planta. Se recomienda completar la calificación de cada punto aplicable del checklist para emitir el porcentaje definitivo de cumplimiento.`;
    }

    setAudit((prev) => ({
      ...prev,
      closingMeeting: {
        ...prev.closingMeeting,
        date: prev.closingMeeting.date || prev.date,
        participants:
          prev.closingMeeting.participants ||
          [prev.auditor, prev.auditedPerson].filter(Boolean).join(', '),
        strengths: strengthsText,
        conclusions: conclusionText
      }
    }));

    toast.success('Dictamen técnico y fortalezas redactados automáticamente.');
  };

  const handleSave = () => {
    const newErrors: string[] = [];
    if (!audit.title.trim()) newErrors.push('title');
    if (!audit.date) newErrors.push('date');
    if (!audit.auditor.trim()) newErrors.push('auditor');
    setErrors(newErrors);
    if (newErrors.length > 0) {
      toast.error('Por favor completá los campos obligatorios (*): Título, Fecha y Auditor.');
      return;
    }

    const saved = safeGetLocalStorage<any[]>('ehs_audits_db', []);
    const auditId = isEdit ? audit.id : `AUD-${Date.now()}`;

    const computedStatus =
      audit.status ||
      (audit.closingMeeting?.conclusions?.trim() && checklistKpis.evalCount > 0
        ? 'completed'
        : checklistKpis.evalCount > 0
        ? 'in_progress'
        : 'planned');

    const normalizedAudit = {
      ...audit,
      id: auditId,
      auditor: audit.auditor.trim(),
      leadAuditor: audit.auditor.trim(),
      date: audit.date,
      scheduledDate: audit.date,
      status: computedStatus,
      complianceRate: checklistKpis.percent,
      conformities: checklistKpis.si,
      nonConformities: checklistKpis.no,
      showSignatures,
      updatedAt: new Date().toISOString()
    };

    let updated;
    if (isEdit) {
      updated = saved.map((a: any) => (a.id === audit.id ? normalizedAudit : a));
      toast.success('Auditoría actualizada correctamente');
    } else {
      updated = [{ ...normalizedAudit, createdAt: new Date().toISOString() }, ...saved];
      toast.success('Auditoría guardada con éxito');
    }

    localStorage.setItem('ehs_audits_db', JSON.stringify(updated));

    try {
      const existingFindings = safeGetLocalStorage<any[]>('ehs_audit_findings_db', []);
      const otherFindings = existingFindings.filter(
        (f: any) => f.auditId !== auditId || !f.checklistItemId
      );
      const deviationFindings = (normalizedAudit.checklist || [])
        .filter((item) => item.status === 'no')
        .map((item) => {
          const prevMatch = existingFindings.find(
            (f: any) => f.auditId === auditId && f.checklistItemId === item.id
          );
          return {
            id: prevMatch?.id || `FIND-${auditId}-${item.id}`,
            auditId,
            checklistItemId: item.id,
            title: `[${item.legal}] ${item.question}`,
            description:
              item.observation ||
              item.correctiveAction ||
              'Desvío detectado durante auditoría técnica en planta.',
            correctiveAction: item.correctiveAction || '',
            severity: item.severity || 'major',
            responsible: item.responsible || normalizedAudit.auditedPerson || '',
            dueDate: item.dueDate || '',
            status: prevMatch?.status || 'open',
            createdAt: prevMatch?.createdAt || new Date().toISOString()
          };
        });

      localStorage.setItem(
        'ehs_audit_findings_db',
        JSON.stringify([...deviationFindings, ...otherFindings])
      );
    } catch (e) {
      console.warn('No se pudieron sincronizar hallazgos automáticos:', e);
    }

    navigate('/audit');
  };

  // Estilo común para etiquetas con contraste alto en modo claro y oscuro
  const fieldLabelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    marginBottom: '6px',
    fontSize: '0.76rem',
    fontWeight: 800,
    textTransform: 'uppercase',
    letterSpacing: '0.3px',
    color: 'var(--color-text)'
  };

  return (
    <>
      <ModuleFormLayout>
        <ModuleFormToolbar
          title={isEdit ? 'Editar Auditoría EHS' : 'Nueva Auditoría EHS'}
          subtitle={
            isEdit
              ? 'Actualice el relevamiento técnico, desvíos, plan de acción y dictamen de la auditoría.'
              : 'Relevamiento técnico-legal integral según Ley 19.587, Dec. 351/79, Dec. 911/96, ISO 45001:2018 e ISO 14001.'
          }
          icon={<Shield />}
          onBack={() => navigate('/audit')}
        />

        <ModuleFormDocument>
          {/* 1. DATOS GENERALES Y ALCANCE DE LA AUDITORÍA */}
          <ModuleFormSection title="1. Datos Generales y Alcance de la Auditoría" icon={<FileText />}>
            <div className="flex flex-col gap-4 w-full">
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                  gap: isMobile ? '0.9rem' : '1.1rem',
                  backgroundColor: 'var(--color-background)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '1rem',
                  padding: isMobile ? '1rem' : '1.35rem'
                }}
              >
                {/* Título */}
                <div style={isMobile ? {} : { gridColumn: 'span 2' }}>
                  <label style={fieldLabelStyle}>
                    <FileText size={14} color="#2563eb" /> Título de la Auditoría *
                  </label>
                  <input
                    type="text"
                    className={`module-form-input ${
                      errors.includes('title') ? 'border-red-500' : ''
                    }`}
                    style={{
                      padding: '10px 14px',
                      margin: 0,
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                    value={audit.title}
                    onChange={(e) => {
                      setAudit({ ...audit, title: e.target.value });
                      if (errors.includes('title')) setErrors(errors.filter((err) => err !== 'title'));
                    }}
                    placeholder="Ej: Auditoría Integral Trimestral de Higiene y Seguridad - Planta Principal"
                  />
                </div>

                {/* Estado */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Clock size={14} color="#d97706" /> Estado de la Auditoría
                  </label>
                  <select
                    value={audit.status}
                    onChange={(e) => setAudit({ ...audit, status: e.target.value })}
                    className="module-form-input"
                    style={{
                      padding: '10px 14px',
                      margin: 0,
                      height: '42px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {AUDIT_STATUS_OPTIONS.map((st) => (
                      <option key={st.id} value={st.id}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Empresa / Establecimiento */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Building2 size={14} color="#4f46e5" /> Empresa / Establecimiento
                  </label>
                  <input
                    type="text"
                    value={audit.facilityName}
                    onChange={(e) => setAudit({ ...audit, facilityName: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Industrias Metalúrgicas S.A."
                  />
                </div>

                {/* CUIT */}
                <div>
                  <label style={fieldLabelStyle}>
                    <FileText size={14} color="#64748b" /> CUIT / Identificación
                  </label>
                  <input
                    type="text"
                    value={audit.cuit}
                    onChange={(e) => setAudit({ ...audit, cuit: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: 30-71234567-9"
                  />
                </div>

                {/* Ubicación / Planta */}
                <div>
                  <label style={fieldLabelStyle}>
                    <MapPin size={14} color="#e11d48" /> Ubicación / Planta / Obra
                  </label>
                  <input
                    type="text"
                    value={audit.location}
                    onChange={(e) => setAudit({ ...audit, location: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Parque Industrial Norte - Nave 2"
                  />
                </div>

                {/* Sector / Proceso */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Layers size={14} color="#7c3aed" /> Sector / Área / Proceso
                  </label>
                  <input
                    type="text"
                    value={audit.department}
                    onChange={(e) => setAudit({ ...audit, department: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Producción, Mantenimiento y Depósito"
                  />
                </div>

                {/* Tipo de Auditoría */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Shield size={14} color="#059669" /> Tipo de Auditoría
                  </label>
                  <select
                    value={audit.auditType}
                    onChange={(e) => setAudit({ ...audit, auditType: e.target.value })}
                    className="module-form-input"
                    style={{
                      padding: '10px 14px',
                      margin: 0,
                      height: '42px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {AUDIT_TYPES.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.icon} {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Norma / Marco de Referencia */}
                <div>
                  <label style={fieldLabelStyle}>
                    <ClipboardCheck size={14} color="#2563eb" /> Norma / Marco Legal
                  </label>
                  <select
                    value={audit.standard}
                    onChange={(e) => setAudit({ ...audit, standard: e.target.value })}
                    className="module-form-input"
                    style={{
                      padding: '10px 14px',
                      margin: 0,
                      height: '42px',
                      width: '100%',
                      boxSizing: 'border-box'
                    }}
                  >
                    {AUDIT_STANDARDS.map((std) => (
                      <option key={std} value={std}>
                        {std}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Fecha */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Calendar size={14} color="#0284c7" /> Fecha de Auditoría *
                  </label>
                  <input
                    type="date"
                    value={audit.date}
                    onChange={(e) => {
                      setAudit({ ...audit, date: e.target.value, scheduledDate: e.target.value });
                      if (errors.includes('date')) setErrors(errors.filter((err) => err !== 'date'));
                    }}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                {/* Duración */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Clock size={14} color="#0284c7" /> Duración / Jornada
                  </label>
                  <input
                    type="text"
                    value={audit.duration}
                    onChange={(e) => setAudit({ ...audit, duration: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: 1 jornada (8 hs)"
                  />
                </div>

                {/* Auditor Líder */}
                <div>
                  <label style={fieldLabelStyle}>
                    <User size={14} color="#d97706" /> Auditor Líder Actuante *
                  </label>
                  <input
                    type="text"
                    value={audit.auditor}
                    onChange={(e) => {
                      setAudit({ ...audit, auditor: e.target.value, leadAuditor: e.target.value });
                      if (errors.includes('auditor')) setErrors(errors.filter((err) => err !== 'auditor'));
                    }}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Nombre y Apellido del Auditor"
                  />
                </div>

                {/* Matrícula */}
                <div>
                  <label style={fieldLabelStyle}>
                    <Award size={14} color="#d97706" /> Matrícula Profesional
                  </label>
                  <input
                    type="text"
                    value={audit.license}
                    onChange={(e) => setAudit({ ...audit, license: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Mat. COPIME / CPIC N°..."
                  />
                </div>

                {/* Persona Auditada / Responsable del Sector */}
                <div>
                  <label style={fieldLabelStyle}>
                    <User size={14} color="#059669" /> Responsable Auditado
                  </label>
                  <input
                    type="text"
                    value={audit.auditedPerson}
                    onChange={(e) => setAudit({ ...audit, auditedPerson: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Ing. Juan Pérez (Jefe de Planta)"
                  />
                </div>

                {/* Equipo Auditor / Acompañantes */}
                <div>
                  <label style={fieldLabelStyle}>
                    <User size={14} color="#2563eb" /> Equipo / Participantes
                  </label>
                  <input
                    type="text"
                    value={audit.auditTeam}
                    onChange={(e) => setAudit({ ...audit, auditTeam: e.target.value })}
                    className="module-form-input"
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    placeholder="Ej: Comité Mixto HyS / Mantenimiento"
                  />
                </div>
              </div>

              {/* Objetivo y Alcance */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}
              >
                <div>
                  <label style={fieldLabelStyle}>Objetivo de la Auditoría</label>
                  <textarea
                    className="module-form-input"
                    style={{ width: '100%', boxSizing: 'border-box', margin: 0 }}
                    rows={3}
                    value={audit.objective}
                    onChange={(e) => setAudit({ ...audit, objective: e.target.value })}
                    placeholder="Describa el propósito técnico y legal de esta auditoría..."
                  />
                </div>

                <div>
                  <label style={fieldLabelStyle}>Alcance, Criterios y Metodología</label>
                  <textarea
                    className="module-form-input"
                    style={{ width: '100%', boxSizing: 'border-box', margin: 0 }}
                    rows={3}
                    value={audit.scope}
                    onChange={(e) => setAudit({ ...audit, scope: e.target.value })}
                    placeholder="Sectores alcanzados, entrevistas realizadas, verificación documental e inspección en campo..."
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* 2. CHECKLIST DE RELEVAMIENTO TÉCNICO-LEGAL E ISO (ALTO CONTRASTE + RESPONSIVO) */}
          <ModuleFormSection title="2. Checklist de Relevamiento Técnico-Legal e ISO" icon={<ClipboardCheck />}>
            {/* Panel de Plantillas Oficiales con alto contraste */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '1rem',
                padding: isMobile ? '0.95rem' : '1.25rem',
                marginBottom: '1.1rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      letterSpacing: '0.4px',
                      color: '#2563eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Sparkles size={15} color="#2563eb" /> Plantillas Oficiales de Auditoría (Carga Rápida)
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text)',
                      opacity: 0.85,
                      margin: '3px 0 0 0',
                      fontWeight: 500
                    }}
                  >
                    Elegí una plantilla normativa para cargar su banco de preguntas o sumarla al checklist actual.
                  </p>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? '1fr 1fr' : 'auto auto',
                    gap: '0.5rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleMarkPendingAsConform}
                    style={{
                      margin: 0,
                      padding: '0.55rem 0.85rem',
                      borderRadius: '0.65rem',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      backgroundColor: '#059669',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)'
                    }}
                  >
                    ✓ Todo Conforme
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomItem(!showAddCustomItem)}
                    style={{
                      margin: 0,
                      padding: '0.55rem 0.85rem',
                      borderRadius: '0.65rem',
                      fontSize: '0.76rem',
                      fontWeight: 800,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px',
                      boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)'
                    }}
                  >
                    <Plus size={14} /> Agregar Punto
                  </button>
                </div>
              </div>

              {/* Grilla de Plantillas */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile
                    ? '1fr'
                    : 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '0.65rem'
                }}
              >
                {Object.entries(CHECKLIST_TEMPLATES).map(([key, tpl]) => {
                  const isSelected = selectedTemplateKey === key;
                  return (
                    <div
                      key={key}
                      style={{
                        backgroundColor: isSelected
                          ? 'rgba(37, 99, 235, 0.1)'
                          : 'var(--color-surface)',
                        border: isSelected
                          ? '2px solid #2563eb'
                          : '1px solid var(--color-border)',
                        borderRadius: '0.85rem',
                        padding: '0.85rem',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.65rem'
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '0.82rem',
                            fontWeight: 900,
                            color: 'var(--color-text)',
                            lineHeight: 1.35
                          }}
                        >
                          {tpl.name}
                        </div>
                        <span
                          style={{
                            display: 'inline-block',
                            marginTop: '6px',
                            padding: '2px 9px',
                            borderRadius: '999px',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            backgroundColor: isSelected ? '#2563eb' : 'rgba(37, 99, 235, 0.12)',
                            color: isSelected ? '#ffffff' : '#2563eb'
                          }}
                        >
                          {tpl.badge}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.45rem' }}>
                        <button
                          type="button"
                          onClick={() => applyTemplate(key, 'replace')}
                          style={{
                            margin: 0,
                            flex: 1,
                            padding: '0.48rem 0.6rem',
                            borderRadius: '0.55rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor: '#2563eb',
                            color: '#ffffff',
                            border: 'none',
                            cursor: 'pointer'
                          }}
                        >
                          Cargar Plantilla
                        </button>
                        <button
                          type="button"
                          onClick={() => applyTemplate(key, 'append')}
                          title="Sumar estos puntos al checklist actual"
                          style={{
                            margin: 0,
                            padding: '0.48rem 0.65rem',
                            borderRadius: '0.55rem',
                            fontSize: '0.74rem',
                            fontWeight: 800,
                            backgroundColor: 'var(--color-background)',
                            color: 'var(--color-text)',
                            border: '1.5px solid var(--color-border)',
                            cursor: 'pointer'
                          }}
                        >
                          + Sumar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario para agregar ítem personalizado */}
              {showAddCustomItem && (
                <div
                  style={{
                    marginTop: '1rem',
                    padding: isMobile ? '0.9rem' : '1.15rem',
                    borderRadius: '0.85rem',
                    backgroundColor: 'var(--color-surface)',
                    border: '2px solid #2563eb'
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: '#2563eb',
                      marginBottom: '0.75rem'
                    }}
                  >
                    + Nuevo Punto de Auditoría Personalizado
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                      gap: '0.75rem',
                      marginBottom: '0.75rem'
                    }}
                  >
                    <div>
                      <label style={fieldLabelStyle}>Categoría / Bloque</label>
                      <input
                        type="text"
                        value={customItem.category}
                        onChange={(e) => setCustomItem({ ...customItem, category: e.target.value })}
                        className="module-form-input"
                        style={{ padding: '8px 12px', margin: 0, fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                        placeholder="Ej: 8. Verificación Específica de Planta"
                      />
                    </div>
                    <div>
                      <label style={fieldLabelStyle}>Norma / Artículo Legal</label>
                      <input
                        type="text"
                        value={customItem.legal}
                        onChange={(e) => setCustomItem({ ...customItem, legal: e.target.value })}
                        className="module-form-input"
                        style={{ padding: '8px 12px', margin: 0, fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                        placeholder="Ej: Dec. 351/79 Art. 105 / ISO 45001 8.1"
                      />
                    </div>
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={fieldLabelStyle}>Pregunta / Requisito a Auditar *</label>
                    <input
                      type="text"
                      value={customItem.question}
                      onChange={(e) => setCustomItem({ ...customItem, question: e.target.value })}
                      className="module-form-input"
                      style={{ padding: '8px 12px', margin: 0, fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="Ej: ¿Se verifica el funcionamiento del sistema de extracción localizada?"
                    />
                  </div>
                  <div style={{ marginBottom: '0.85rem' }}>
                    <label style={fieldLabelStyle}>Acción Correctiva Sugerida</label>
                    <input
                      type="text"
                      value={customItem.correctiveAction}
                      onChange={(e) => setCustomItem({ ...customItem, correctiveAction: e.target.value })}
                      className="module-form-input"
                      style={{ padding: '8px 12px', margin: 0, fontSize: '13px', width: '100%', boxSizing: 'border-box' }}
                      placeholder="Ej: Realizar limpieza de conductos y medición de velocidad de captura."
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomItem(false)}
                      style={{
                        margin: 0,
                        padding: '0.5rem 0.9rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        border: '1px solid var(--color-border)',
                        cursor: 'pointer'
                      }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomChecklistItem}
                      style={{
                        margin: 0,
                        padding: '0.5rem 1rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.76rem',
                        fontWeight: 800,
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        cursor: 'pointer'
                      }}
                    >
                      Guardar Punto
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Barra de KPIs y Filtros con Contraste Garantizado */}
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '1rem',
                padding: isMobile ? '0.85rem' : '1rem 1.2rem',
                marginBottom: '1rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckSquare size={17} color="#2563eb" />
                    <span
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)'
                      }}
                    >
                      Progreso: {checklistKpis.evalCount}/{checklistKpis.total} evaluados
                    </span>
                  </div>
                  <span
                    style={{
                      padding: '4px 12px',
                      borderRadius: '999px',
                      fontSize: '0.76rem',
                      fontWeight: 900,
                      backgroundColor:
                        checklistKpis.percent >= 80
                          ? '#059669'
                          : checklistKpis.percent >= 60
                          ? '#d97706'
                          : '#dc2626',
                      color: '#ffffff'
                    }}
                  >
                    {checklistKpis.percent}% Cumplimiento
                  </span>
                </div>

                {/* Botones de Filtro por Estado */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, auto)',
                    gap: '0.45rem'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setStatusFilter('all')}
                    style={{
                      margin: 0,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: statusFilter === 'all' ? '#2563eb' : 'var(--color-surface)',
                      color: statusFilter === 'all' ? '#ffffff' : 'var(--color-text)',
                      border: statusFilter === 'all' ? '1.5px solid #1d4ed8' : '1.5px solid var(--color-border)'
                    }}
                  >
                    Todos ({checklistKpis.total})
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('si')}
                    style={{
                      margin: 0,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: statusFilter === 'si' ? '#059669' : 'rgba(16, 185, 129, 0.12)',
                      color: statusFilter === 'si' ? '#ffffff' : '#059669',
                      border: '1.5px solid #059669'
                    }}
                  >
                    ✓ {checklistKpis.si} Conformes
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('no')}
                    style={{
                      margin: 0,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: statusFilter === 'no' ? '#dc2626' : 'rgba(239, 68, 68, 0.12)',
                      color: statusFilter === 'no' ? '#ffffff' : '#dc2626',
                      border: '1.5px solid #dc2626'
                    }}
                  >
                    ✗ {checklistKpis.no} Desvíos
                  </button>

                  <button
                    type="button"
                    onClick={() => setStatusFilter('na')}
                    style={{
                      margin: 0,
                      padding: '0.45rem 0.75rem',
                      borderRadius: '0.6rem',
                      fontSize: '0.74rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      backgroundColor: statusFilter === 'na' ? '#475569' : 'var(--color-surface)',
                      color: statusFilter === 'na' ? '#ffffff' : 'var(--color-text)',
                      border: '1.5px solid var(--color-border)'
                    }}
                  >
                    • {checklistKpis.na} N/A
                  </button>
                </div>
              </div>

              {/* Filtro por Categoría / Bloque */}
              {categories.length > 1 && (
                <div
                  className="scrollbar-none"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    overflowX: 'auto',
                    paddingTop: '0.75rem',
                    marginTop: '0.75rem',
                    borderTop: '1px solid var(--color-border)'
                  }}
                >
                  <Filter size={14} color="#2563eb" style={{ flexShrink: 0 }} />
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('all')}
                    style={{
                      margin: 0,
                      padding: '0.38rem 0.75rem',
                      borderRadius: '0.55rem',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      cursor: 'pointer',
                      backgroundColor: categoryFilter === 'all' ? '#2563eb' : 'var(--color-surface)',
                      color: categoryFilter === 'all' ? '#ffffff' : 'var(--color-text)',
                      border: categoryFilter === 'all' ? '1.5px solid #1d4ed8' : '1px solid var(--color-border)'
                    }}
                  >
                    Todos los Bloques ({categories.length})
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategoryFilter(cat)}
                      style={{
                        margin: 0,
                        padding: '0.38rem 0.75rem',
                        borderRadius: '0.55rem',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        backgroundColor: categoryFilter === cat ? '#2563eb' : 'var(--color-surface)',
                        color: categoryFilter === cat ? '#ffffff' : 'var(--color-text)',
                        border: categoryFilter === cat ? '1.5px solid #1d4ed8' : '1px solid var(--color-border)'
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Lista de Puntos del Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {audit.checklist.map((item, idx) => {
                if (statusFilter !== 'all' && item.status !== statusFilter) return null;
                if (categoryFilter !== 'all' && item.category !== categoryFilter) return null;

                const prevItem = idx > 0 ? audit.checklist[idx - 1] : null;
                const showCategoryHeader =
                  item.category &&
                  (categoryFilter !== 'all' || !prevItem || prevItem.category !== item.category);

                const accentColor =
                  item.status === 'si'
                    ? '#059669'
                    : item.status === 'no'
                    ? '#dc2626'
                    : '#64748b';

                return (
                  <React.Fragment key={item.id}>
                    {showCategoryHeader && (
                      <div
                        style={{
                          marginTop: '0.4rem',
                          padding: '0.6rem 0.95rem',
                          borderRadius: '0.75rem',
                          backgroundColor: '#1e3a8a',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: '0 2px 6px rgba(30, 58, 138, 0.2)'
                        }}
                      >
                        <span
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            letterSpacing: '0.4px',
                            color: '#ffffff'
                          }}
                        >
                          {item.category}
                        </span>
                      </div>
                    )}

                    <div
                      style={{
                        backgroundColor: 'var(--color-surface)',
                        border: `1.5px solid ${
                          item.status === 'no'
                            ? '#ef4444'
                            : item.status === 'si'
                            ? 'rgba(16, 185, 129, 0.5)'
                            : 'var(--color-border)'
                        }`,
                        borderLeft: `6px solid ${accentColor}`,
                        borderRadius: '0.95rem',
                        padding: isMobile ? '0.95rem' : '1.15rem 1.25rem',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)'
                      }}
                    >
                      {/* Cabecera del Ítem: Norma Legal + Estado + Botón Eliminar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                          marginBottom: '0.55rem'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              padding: '3px 10px',
                              borderRadius: '999px',
                              fontSize: '0.7rem',
                              fontWeight: 900,
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              border: '1px solid #93c5fd',
                              textTransform: 'uppercase'
                            }}
                          >
                            {item.legal}
                          </span>

                          {item.status === 'si' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                backgroundColor: '#d1fae5',
                                color: '#065f46',
                                border: '1px solid #6ee7b7',
                                textTransform: 'uppercase'
                              }}
                            >
                              <CheckCircle2 size={12} color="#059669" /> Conforme
                            </span>
                          )}

                          {item.status === 'no' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 10px',
                                borderRadius: '999px',
                                fontSize: '0.7rem',
                                fontWeight: 900,
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                textTransform: 'uppercase'
                              }}
                            >
                              <AlertTriangle size={12} color="#dc2626" /> Desvío Detectado
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          title="Quitar este punto del checklist"
                          onClick={() => {
                            setAudit((prev) => ({
                              ...prev,
                              checklist: prev.checklist.filter((_, i) => i !== idx)
                            }));
                          }}
                          style={{
                            margin: 0,
                            padding: '4px 8px',
                            borderRadius: '0.45rem',
                            backgroundColor: 'transparent',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.25)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Pregunta + Botonera Conforme / Desvío / N/A */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: isMobile ? 'column' : 'row',
                          alignItems: isMobile ? 'stretch' : 'center',
                          justifyContent: 'space-between',
                          gap: '0.85rem',
                          marginBottom: '0.75rem'
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            fontSize: isMobile ? '0.92rem' : '0.96rem',
                            fontWeight: 800,
                            color: 'var(--color-text)',
                            lineHeight: 1.45
                          }}
                        >
                          {item.question}
                        </div>

                        {/* Botones de Calificación con Alto Contraste y 100% Responsivos */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '0.4rem',
                            minWidth: isMobile ? '100%' : '295px',
                            flexShrink: 0
                          }}
                        >
                          {(['si', 'no', 'na'] as const).map((status) => {
                            const isSelected = item.status === status;
                            const btnStyle = getStatusButtonStyles(status, isSelected);
                            return (
                              <button
                                key={status}
                                type="button"
                                onClick={() => {
                                  const newChecklist = [...audit.checklist];
                                  newChecklist[idx] = {
                                    ...newChecklist[idx],
                                    status,
                                    severity: newChecklist[idx].severity || 'major'
                                  };
                                  setAudit({ ...audit, checklist: newChecklist });
                                }}
                                style={{
                                  margin: 0,
                                  padding: isMobile ? '0.55rem 0.35rem' : '0.48rem 0.65rem',
                                  borderRadius: '0.6rem',
                                  fontSize: isMobile ? '0.73rem' : '0.75rem',
                                  cursor: 'pointer',
                                  textTransform: 'uppercase',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  whiteSpace: 'nowrap',
                                  transition: 'all 0.15s ease',
                                  ...btnStyle
                                }}
                              >
                                {status === 'si' && '✓ Conforme'}
                                {status === 'no' && '✗ Desvío'}
                                {status === 'na' && '• N/A'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Campo de Observación / Evidencia */}
                      <div style={{ width: '100%' }}>
                        <input
                          type="text"
                          style={{
                            padding: '9px 13px',
                            margin: 0,
                            width: '100%',
                            boxSizing: 'border-box',
                            fontSize: '0.83rem',
                            fontWeight: 600,
                            borderRadius: '0.65rem',
                            backgroundColor:
                              item.status === 'no'
                                ? 'rgba(254, 226, 226, 0.35)'
                                : 'var(--color-background)',
                            color: 'var(--color-text)',
                            border:
                              item.status === 'no'
                                ? '1.5px solid #ef4444'
                                : '1px solid var(--color-border)'
                          }}
                          value={item.observation}
                          onChange={(e) => {
                            const newChecklist = [...audit.checklist];
                            newChecklist[idx] = {
                              ...newChecklist[idx],
                              observation: e.target.value
                            };
                            setAudit({ ...audit, checklist: newChecklist });
                          }}
                          placeholder={
                            item.status === 'no'
                              ? 'Describa la evidencia del desvío detectado (sector, equipo, condición observada)...'
                              : 'Observación o evidencia verificada en campo (opcional)...'
                          }
                        />
                      </div>

                      {/* Panel de Plan de Acción Correctiva (CAPA) cuando es DESVÍO */}
                      {item.status === 'no' && (
                        <div
                          style={{
                            marginTop: '0.75rem',
                            padding: isMobile ? '0.85rem' : '1rem',
                            borderRadius: '0.75rem',
                            backgroundColor: 'rgba(239, 68, 68, 0.07)',
                            border: '1.5px solid rgba(239, 68, 68, 0.4)',
                            display: 'grid',
                            gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
                            gap: '0.75rem'
                          }}
                        >
                          <div>
                            <label
                              style={{
                                ...fieldLabelStyle,
                                color: '#dc2626',
                                fontSize: '0.7rem',
                                marginBottom: '4px'
                              }}
                            >
                              Severidad del Hallazgo
                            </label>
                            <select
                              value={item.severity || 'major'}
                              onChange={(e) => {
                                const newChecklist = [...audit.checklist];
                                newChecklist[idx] = {
                                  ...newChecklist[idx],
                                  severity: e.target.value as any
                                };
                                setAudit({ ...audit, checklist: newChecklist });
                              }}
                              className="module-form-input"
                              style={{
                                padding: '7px 10px',
                                margin: 0,
                                fontSize: '0.8rem',
                                height: '38px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            >
                              {SEVERITY_OPTIONS.map((sev) => (
                                <option key={sev.id} value={sev.id}>
                                  {sev.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label
                              style={{
                                ...fieldLabelStyle,
                                color: '#dc2626',
                                fontSize: '0.7rem',
                                marginBottom: '4px'
                              }}
                            >
                              Responsable de Acción
                            </label>
                            <input
                              type="text"
                              value={item.responsible || ''}
                              onChange={(e) => {
                                const newChecklist = [...audit.checklist];
                                newChecklist[idx] = {
                                  ...newChecklist[idx],
                                  responsible: e.target.value
                                };
                                setAudit({ ...audit, checklist: newChecklist });
                              }}
                              className="module-form-input"
                              style={{
                                padding: '7px 10px',
                                margin: 0,
                                fontSize: '0.8rem',
                                height: '38px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                              placeholder="Ej: Jefe de Mantenimiento / RRHH"
                            />
                          </div>

                          <div>
                            <label
                              style={{
                                ...fieldLabelStyle,
                                color: '#dc2626',
                                fontSize: '0.7rem',
                                marginBottom: '4px'
                              }}
                            >
                              Plazo / Fecha Compromiso
                            </label>
                            <input
                              type="date"
                              value={item.dueDate || ''}
                              onChange={(e) => {
                                const newChecklist = [...audit.checklist];
                                newChecklist[idx] = {
                                  ...newChecklist[idx],
                                  dueDate: e.target.value
                                };
                                setAudit({ ...audit, checklist: newChecklist });
                              }}
                              className="module-form-input"
                              style={{
                                padding: '7px 10px',
                                margin: 0,
                                fontSize: '0.8rem',
                                height: '38px',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                            />
                          </div>

                          <div style={isMobile ? {} : { gridColumn: 'span 3' }}>
                            <label
                              style={{
                                ...fieldLabelStyle,
                                color: '#dc2626',
                                fontSize: '0.7rem',
                                marginBottom: '4px'
                              }}
                            >
                              Acción Correctiva / Medida Técnica Requerida
                            </label>
                            <input
                              type="text"
                              value={item.correctiveAction || ''}
                              onChange={(e) => {
                                const newChecklist = [...audit.checklist];
                                newChecklist[idx] = {
                                  ...newChecklist[idx],
                                  correctiveAction: e.target.value
                                };
                                setAudit({ ...audit, checklist: newChecklist });
                              }}
                              className="module-form-input"
                              style={{
                                padding: '8px 12px',
                                margin: 0,
                                fontSize: '0.82rem',
                                width: '100%',
                                boxSizing: 'border-box'
                              }}
                              placeholder="Indique la medida correctiva técnica o documental a implementar..."
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </ModuleFormSection>

          {/* 3. MINUTA DE CIERRE Y DICTAMEN TÉCNICO */}
          <ModuleFormSection title="3. Minuta de Reunión de Cierre y Dictamen Técnico" icon={<Clock />}>
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '1rem',
                padding: isMobile ? '1rem' : '1.35rem'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: isMobile ? 'column' : 'row',
                  alignItems: isMobile ? 'stretch' : 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  marginBottom: '1rem',
                  paddingBottom: '0.85rem',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '0.82rem',
                      fontWeight: 900,
                      textTransform: 'uppercase',
                      color: '#2563eb'
                    }}
                  >
                    Síntesis Ejecutiva y Conclusión del Auditor
                  </div>
                  <p
                    style={{
                      fontSize: '0.78rem',
                      color: 'var(--color-text)',
                      opacity: 0.85,
                      margin: '3px 0 0 0'
                    }}
                  >
                    Redactá manualmente o generá el dictamen técnico formal automáticamente según los resultados del checklist.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAutoGenerateConclusion}
                  style={{
                    margin: 0,
                    padding: '0.65rem 1rem',
                    borderRadius: '0.75rem',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}
                >
                  <Sparkles size={15} /> Generar Dictamen Automático
                </button>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                  gap: '1rem'
                }}
              >
                <div>
                  <label style={fieldLabelStyle}>
                    <User size={14} color="#2563eb" /> Participantes en la Reunión de Cierre
                  </label>
                  <input
                    type="text"
                    value={audit.closingMeeting.participants}
                    onChange={(e) =>
                      setAudit({
                        ...audit,
                        closingMeeting: { ...audit.closingMeeting, participants: e.target.value }
                      })
                    }
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    className="module-form-input"
                    placeholder="Nombres y cargos de los presentes en el cierre"
                  />
                </div>
                <div>
                  <label style={fieldLabelStyle}>
                    <Calendar size={14} color="#0284c7" /> Fecha de Reunión de Cierre
                  </label>
                  <input
                    type="date"
                    value={audit.closingMeeting.date}
                    onChange={(e) =>
                      setAudit({
                        ...audit,
                        closingMeeting: { ...audit.closingMeeting, date: e.target.value }
                      })
                    }
                    style={{ padding: '10px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    className="module-form-input"
                  />
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <label style={fieldLabelStyle}>
                    <CheckCircle2 size={14} color="#059669" /> Fortalezas y Aspectos Positivos Destacados
                  </label>
                  <textarea
                    value={audit.closingMeeting.strengths || ''}
                    onChange={(e) =>
                      setAudit({
                        ...audit,
                        closingMeeting: { ...audit.closingMeeting, strengths: e.target.value }
                      })
                    }
                    style={{ padding: '12px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    className="module-form-input"
                    rows={2}
                    placeholder="Buenas prácticas observadas, compromiso operativo, mejoras respecto a auditorías previas..."
                  />
                </div>
                <div style={{ gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                  <label style={fieldLabelStyle}>
                    <Award size={14} color="#d97706" /> Conclusiones Generales y Dictamen Técnico del Auditor
                  </label>
                  <textarea
                    value={audit.closingMeeting.conclusions}
                    onChange={(e) =>
                      setAudit({
                        ...audit,
                        closingMeeting: { ...audit.closingMeeting, conclusions: e.target.value }
                      })
                    }
                    style={{ padding: '12px 14px', margin: 0, width: '100%', boxSizing: 'border-box' }}
                    className="module-form-input"
                    rows={5}
                    placeholder="Dictamen técnico de cumplimiento, síntesis de hallazgos críticos y plazos de adecuación..."
                  />
                </div>
              </div>
            </div>
          </ModuleFormSection>

          {/* 4. FIRMAS Y AUTORIZACIONES */}
          <ModuleFormSection title="4. Firmas y Autorizaciones EHS" icon={<Pencil />}>
            <div
              style={{
                backgroundColor: 'var(--color-background)',
                border: '1.5px solid var(--color-border)',
                borderRadius: '1rem',
                padding: isMobile ? '1rem' : '1.5rem'
              }}
            >
              {/* Custom visual switches */}
              <div
                className="no-print"
                style={{
                  marginBottom: '1.5rem',
                  padding: isMobile ? '0.9rem' : '1.2rem',
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.85rem'
                }}
              >
                <div
                  style={{
                    color: 'var(--color-text)',
                    fontWeight: 900,
                    fontSize: '0.8rem',
                    textTransform: 'uppercase'
                  }}
                >
                  INCLUIR FIRMAS EN EL DOCUMENTO:
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: '0.6rem',
                    flexWrap: 'wrap',
                    justifyContent: 'center',
                    width: '100%'
                  }}
                >
                  {[
                    { id: 'operator', label: 'Persona Auditada / Responsable' },
                    {
                      id: 'professional',
                      label: audit.auditorRole || 'Profesional de Higiene y Seguridad'
                    },
                    { id: 'supervisor', label: 'Supervisión / Dirección' }
                  ].map((sig) => {
                    const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
                    return (
                      <label
                        key={sig.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          userSelect: 'none',
                          padding: '0.5rem 0.95rem',
                          borderRadius: '999px',
                          fontWeight: 800,
                          fontSize: '0.76rem',
                          border: isChecked ? '1.5px solid #2563eb' : '1.5px solid var(--color-border)',
                          backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-background)',
                          color: isChecked ? '#2563eb' : 'var(--color-text)'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))
                          }
                          className="hidden"
                        />
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '4px',
                            border: isChecked ? '2px solid #2563eb' : '2px solid #64748b',
                            backgroundColor: isChecked ? '#2563eb' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {isChecked && <CheckCircle2 size={12} color="white" />}
                        </div>
                        <span>{sig.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* On-Sheet Visual Preview of PDF signature blocks */}
              <div style={{ marginBottom: '1.5rem' }}>
                <PdfSignatures
                  data={{
                    ...audit,
                    professionalSignature: professional.signature,
                    professionalName: professional.name,
                    professionalLicense: audit.license || professional.license,
                    professionalStamp: professional.stamp
                  }}
                  box1={
                    showSignatures.operator
                      ? {
                          title: 'PERSONA AUDITADA / RESPONSABLE',
                          subtitle: (audit.auditedPerson || 'Firma de Conformidad').toUpperCase(),
                          signatureUrl: audit.operatorSignature || null,
                          isProfessional: false
                        }
                      : null
                  }
                  box2={
                    showSignatures.professional
                      ? {
                          title: (
                            audit.auditorRole || 'PROFESIONAL DE HIGIENE Y SEGURIDAD'
                          ).toUpperCase(),
                          subtitle: (
                            audit.auditor ||
                            professional.name ||
                            'Firma y Sello'
                          ).toUpperCase(),
                          signatureUrl: audit.signature || professional.signature || null,
                          stampUrl: professional.stamp || null,
                          isProfessional: true,
                          license: audit.license || professional.license
                        }
                      : null
                  }
                  box3={
                    showSignatures.supervisor
                      ? {
                          title: 'SUPERVISIÓN / DIRECCIÓN',
                          subtitle: 'Aprobación de Informe',
                          signatureUrl: audit.supervisorSignature || null,
                          isProfessional: false
                        }
                      : null
                  }
                />

                <PdfBrandingFooter />
              </div>

              {/* Interactive Signature Drawing Pads */}
              <div
                className="no-print"
                style={{
                  marginTop: '1.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--color-border)',
                  display: 'grid',
                  gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1rem'
                }}
              >
                {showSignatures.operator && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.85rem',
                      padding: '1rem'
                    }}
                  >
                    <SignatureCanvas
                      onSave={(sig) =>
                        setAudit((prev) => ({ ...prev, operatorSignature: sig || '' }))
                      }
                      initialImage={audit.operatorSignature}
                      label={`Firma de ${audit.auditedPerson || 'Persona Auditada / Responsable'}`}
                    />
                  </div>
                )}

                {showSignatures.professional && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.85rem',
                      padding: '1rem'
                    }}
                  >
                    <SignatureCanvas
                      onSave={(sig) => setAudit((prev) => ({ ...prev, signature: sig || '' }))}
                      initialImage={audit.signature}
                      label={`Firma de ${audit.auditorRole || 'Profesional de Higiene y Seguridad'}`}
                    />
                  </div>
                )}

                {showSignatures.supervisor && (
                  <div
                    style={{
                      backgroundColor: 'var(--color-surface)',
                      border: '1px solid var(--color-border)',
                      borderRadius: '0.85rem',
                      padding: '1rem'
                    }}
                  >
                    <SignatureCanvas
                      onSave={(sig) =>
                        setAudit((prev) => ({ ...prev, supervisorSignature: sig || '' }))
                      }
                      initialImage={audit.supervisorSignature}
                      label="Firma de Supervisión / Dirección"
                    />
                  </div>
                )}
              </div>
            </div>
          </ModuleFormSection>
        </ModuleFormDocument>

        <ModuleActionBar
          actions={[
            {
              id: 'save',
              label: isMobile ? 'GUARDAR' : 'GUARDAR AUDITORÍA',
              icon: <Save size={18} />,
              variant: 'primary',
              onClick: () => requirePro(handleSave)
            },
            {
              id: 'preview',
              label: isMobile ? 'PREVIA' : 'PREVISUALIZAR A4',
              icon: <Eye size={18} />,
              variant: 'info',
              onClick: () => setShowPreviewModal(true)
            },
            {
              id: 'print',
              label: isMobile ? 'IMPRIMIR' : 'IMPRIMIR PDF',
              icon: <Printer size={18} />,
              variant: 'warning',
              onClick: () => requirePro(handleDirectPrint)
            },
            {
              id: 'share',
              label: 'COMPARTIR',
              icon: <Share2 size={18} />,
              variant: 'secondary',
              onClick: () => requirePro(() => setShowShareModal(true))
            }
          ]}
        />
      </ModuleFormLayout>

      {/* Modal de Previsualización A4 en Vivo (Responsivo para Celular y Desktop) */}
      {showPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[960px] h-[94vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-700/80 bg-slate-800/95 select-none gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl shrink-0">
                  <ClipboardCheck size={18} />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm sm:text-lg font-bold text-white leading-tight truncate m-0">
                    Vista Previa del Informe Oficial de Auditoría
                  </h2>
                  <p className="text-[11px] text-slate-400 m-0 truncate">
                    Formato A4 Oficial • Ley 19.587 / ISO 45001:2018
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setShowPreviewModal(false);
                    handleDirectPrint();
                  }}
                  style={{ margin: 0 }}
                  className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs font-extrabold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg cursor-pointer border-none"
                >
                  <Printer size={15} /> <span>Imprimir / PDF</span>
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  style={{ margin: 0 }}
                  className="p-2 text-slate-300 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer bg-transparent border-none"
                  title="Cerrar vista previa"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto p-2 sm:p-6 bg-slate-950/80 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-x-auto border border-slate-300">
                <AuditPdf
                  data={{
                    ...audit,
                    showSignatures,
                    createdAt: audit.createdAt || new Date().toISOString()
                  }}
                  customId="pdf-preview-audit"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        elementIdToPrint="pdf-content"
        title="Reporte de Auditoría"
        rawMessage={`Reporte de Auditoría: ${audit.title}`}
        text={`Reporte de Auditoría: ${audit.title}`}
        fileName={`Auditoria_${audit.title || 'Sin_Nombre'}.pdf`}
      />

      <div className="ats-pdf-offscreen" id="pdf-content">
        <AuditPdf
          data={{
            ...audit,
            showSignatures,
            createdAt: audit.createdAt || new Date().toISOString()
          }}
        />
      </div>
    </>
  );
}
