export type Language = 'es' | 'en' | 'pt';

export interface Translations {
  [key: string]: {
    es: string;
    en: string;
    pt: string;
  };
}

export const dictionary: Translations = {
  // Navigation & Core
  'app.name': {
    es: 'Asistente de Higiene y Seguridad',
    en: 'EHS Assistant & Safety Suite',
    pt: 'Assistente de Higiene e Segurança'
  },
  'app.tagline': {
    es: 'Plataforma Inteligente de Gestión de Seguridad Laboral y Medio Ambiente',
    en: 'Intelligent Occupational Safety & Environmental Platform',
    pt: 'Plataforma Inteligente de Gestão de Segurança e Meio Ambiente'
  },
  'nav.home': { es: 'Inicio', en: 'Home', pt: 'Início' },
  'nav.dashboard': { es: 'Panel KPI', en: 'Dashboard', pt: 'Painel KPI' },
  'nav.ats': { es: 'ATS / JSA', en: 'JSA / ATS', pt: 'APR / ATS' },
  'nav.extinguishers': { es: 'Extintores & Fuego', en: 'Fire & Extinguishers', pt: 'Extintores e Fogo' },
  'nav.permits': { es: 'Permisos de Trabajo', en: 'Work Permits', pt: 'Permissões de Trabalho' },
  'nav.audits': { es: 'Auditorías EHS', en: 'EHS Audits', pt: 'Auditorias EHS' },
  'nav.trust': { es: 'Seguridad & Trust Enterprise', en: 'Enterprise Trust & Security', pt: 'Segurança & Trust Enterprise' },
  'nav.asset_scanner': { es: 'Escáner QR / NFC Activos', en: 'Asset QR / NFC Scanner', pt: 'Escáner QR / NFC Ativos' },
  'nav.voice_dictation': { es: 'Dictado por Voz', en: 'Voice Dictation', pt: 'Ditado por Voz' },
  'nav.settings': { es: 'Configuración', en: 'Settings', pt: 'Configurações' },
  
  // Actions & General Buttons
  'btn.save': { es: 'Guardar', en: 'Save', pt: 'Salvar' },
  'btn.cancel': { es: 'Cancelar', en: 'Cancel', pt: 'Cancelar' },
  'btn.export_pdf': { es: 'Exportar PDF', en: 'Export PDF', pt: 'Exportar PDF' },
  'btn.export_excel': { es: 'Exportar Excel', en: 'Export Excel', pt: 'Exportar Excel' },
  'btn.scan_qr': { es: 'Escanear QR', en: 'Scan QR', pt: 'Escanear QR' },
  'btn.voice_input': { es: 'Dictar por Voz', en: 'Voice Dictation', pt: 'Ditar por Voz' },
  'btn.search': { es: 'Buscar', en: 'Search', pt: 'Buscar' },
  'btn.filter': { es: 'Filtrar', en: 'Filter', pt: 'Filtrar' },
  
  // Statuses
  'status.online': { es: 'En Línea', en: 'Online', pt: 'Online' },
  'status.offline': { es: 'Modo Offline', en: 'Offline Mode', pt: 'Modo Offline' },
  'status.syncing': { es: 'Sincronizando...', en: 'Syncing...', pt: 'Sincronizando...' },
  'status.pending_sync': { es: 'Pendientes de envío', en: 'Pending sync', pt: 'Pendentes de envio' },
  
  // Frameworks
  'framework.iso45001': { es: 'ISO 45001:2018 (Seguridad Laboral)', en: 'ISO 45001:2018 (OH&S)', pt: 'ISO 45001:2018 (Segurança Ocupacional)' },
  'framework.iso14001': { es: 'ISO 14001:2015 (Medio Ambiente)', en: 'ISO 14001:2015 (Environment)', pt: 'ISO 14001:2015 (Meio Ambiente)' },
  'framework.osha': { es: 'OSHA 1910 / 1926 (EE.UU.)', en: 'OSHA 1910 / 1926 (USA)', pt: 'OSHA 1910 / 1926 (EUA)' },
  'framework.stps': { es: 'STPS / NOMs (México)', en: 'STPS / NOMs (Mexico)', pt: 'STPS / NOMs (México)' },
  'framework.nr': { es: 'NR-01 a NR-38 (Brasil)', en: 'NR-01 to NR-38 (Brazil)', pt: 'NR-01 a NR-38 (Brasil)' }
};

export function getTranslation(key: string, lang: Language = 'es'): string {
  if (dictionary[key] && dictionary[key][lang]) {
    return dictionary[key][lang];
  }
  return dictionary[key]?.es || key;
}
