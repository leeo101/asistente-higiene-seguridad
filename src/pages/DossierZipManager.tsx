import React, { useState, useEffect } from 'react';
import {
  Archive, Download, CheckCircle2,
  Building, Shield, FileText, Check,
  Folder, Sparkles, FolderArchive, Layers,
  Clock, ShieldAlert, AlertTriangle, ArrowRight, HardHat,
  Info, Lock
} from 'lucide-react';
import { useCompany } from '../contexts/CompanyContext';
import PremiumHeader from '../components/PremiumHeader';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';
import {
  generateDossierZipArchive,
  DossierGenerationProgress
} from '../utils/dossierZipGenerator';

interface HistoricalDossier {
  id: string;
  date: string;
  auditType: string;
  sectionsCount: number;
  fileName: string;
}

const STORAGE_DOSSIER_KEY = 'hys_dossier_history';

export default function DossierZipManager(): React.ReactElement | null {
  const { activeCompany } = useCompany();

  // Opciones de auditoría
  const [selectedAuditProfile, setSelectedAuditProfile] = useState<string>('art');

  // Datos de la empresa
  const [companyName, setCompanyName] = useState('');
  const [companyCuit, setCompanyCuit] = useState('');
  const [companyAddress, setCompanyAddress] = useState('Parque Industrial, Buenos Aires');
  const [inspectorName, setInspectorName] = useState('Lic. en Higiene y Seguridad');
  const [inspectorReg, setInspectorReg] = useState('Mat. Ley 19.587');

  // Secciones seleccionadas para incluir en el ZIP
  const [sections, setSections] = useState<Record<string, boolean>>({
    programas: true,
    mediciones: true,
    equipos: true,
    permisos: true,
    personal: true
  });

  // Estado de generación
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<DossierGenerationProgress | null>(null);

  // Historial de descargas
  const [history, setHistory] = useState<HistoricalDossier[]>([]);

  useEffect(() => {
    if (activeCompany) {
      setCompanyName(activeCompany.name || 'Establecimiento Industrial S.A.');
      setCompanyCuit(activeCompany.cuit || '30-71234567-8');
      if (activeCompany.address) setCompanyAddress(activeCompany.address);
    } else {
      setCompanyName('Establecimiento Industrial S.A.');
      setCompanyCuit('30-71234567-8');
    }

    try {
      const stored = localStorage.getItem(STORAGE_DOSSIER_KEY);
      if (stored) {
        setHistory(JSON.parse(stored));
      }
    } catch {
      // Ignorar error de parsing
    }
  }, [activeCompany]);

  // Aplicar perfiles de auditoría preconfigurados
  const handleSelectAuditProfile = (profile: string) => {
    setSelectedAuditProfile(profile);
    if (profile === 'art') {
      setSections({
        programas: true,
        mediciones: true,
        equipos: true,
        permisos: false,
        personal: true
      });
      toast.success('Perfil ART aplicado: Mediciones, Equipos, EPP y Matriz Legal');
    } else if (profile === 'bomberos') {
      setSections({
        programas: false,
        mediciones: true,
        equipos: false,
        permisos: true,
        personal: false
      });
      toast.success('Perfil Bomberos / Habilitación aplicado: Carga de Fuego y PAT');
    } else if (profile === 'iso') {
      setSections({
        programas: true,
        mediciones: true,
        equipos: true,
        permisos: true,
        personal: true
      });
      toast.success('Perfil ISO 45001 aplicado: Auditoría integral completa (100%)');
    } else if (profile === 'srt') {
      setSections({
        programas: true,
        mediciones: true,
        equipos: true,
        permisos: true,
        personal: true
      });
      toast.success('Perfil SRT / Ministerio aplicado: Paquete documental completo');
    }
  };

  const toggleSection = (key: string) => {
    setSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const activeSectionsCount = Object.values(sections).filter(Boolean).length;

  const handleGenerateZip = async () => {
    if (activeSectionsCount === 0) {
      toast.error('Seleccione al menos una sección para compilar el archivo ZIP');
      return;
    }

    setIsGenerating(true);
    setProgress({ currentStep: 'Preparando documentos y estructuras...', percentage: 0, completed: false });

    try {
      const auditLabel =
        selectedAuditProfile === 'art'
          ? 'Auditoría Periódica de ART (Ley 24.557)'
          : selectedAuditProfile === 'bomberos'
          ? 'Inspección Municipal y Habilitación de Bomberos'
          : selectedAuditProfile === 'iso'
          ? 'Auditoría de Certificación ISO 45001'
          : 'Inspección Oficial SRT / Ministerio de Trabajo';

      await generateDossierZipArchive(
        companyName,
        companyCuit,
        companyAddress,
        sections,
        auditLabel,
        p => setProgress(p)
      );

      // Guardar en historial
      const newHistoryItem: HistoricalDossier = {
        id: `dos-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        auditType: auditLabel,
        sectionsCount: activeSectionsCount,
        fileName: `Dossier_Inspeccion_HyS_${companyName.replace(/[^a-zA-Z0-9]/g, '_')}.zip`
      };

      const updatedHistory = [newHistoryItem, ...history.slice(0, 9)];
      setHistory(updatedHistory);
      localStorage.setItem(STORAGE_DOSSIER_KEY, JSON.stringify(updatedHistory));

      toast.success('¡Dossier ZIP compilado y descargado exitosamente!');
    } catch (error) {
      console.error('Error generando dossier ZIP:', error);
      toast.error('Ocurrió un error al compilar el archivo ZIP');
    } finally {
      setIsGenerating(false);
      setProgress(null);
    }
  };

  return (
    <AnimatedPage>
      <div className="max-w-7xl mx-auto space-y-6 pb-16">
        {/* Encabezado Premium */}
        <PremiumHeader
          title="Dossier de Inspección & Legajo Único HyS"
          subtitle="Consolidador integral multidocumental en formato ZIP: compila en un solo clic todos los protocolos oficiales, peritajes mecánicos, mediciones y habilitaciones organizados por carpetas para auditorías de ART, Municipios o la SRT."
          badge="LEGAJO ÚNICO EN ZIP"
          icon={<FolderArchive className="w-7 h-7 text-indigo-400" />}
        />

        {/* Perfiles de Auditoría Rápida */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Perfiles de Auditoría e Inspección
              </h3>
              <p className="text-xs text-slate-400">
                Seleccione el destinatario para preconfigurar automáticamente las carpetas y exigencias legales
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {
                id: 'art',
                title: 'Auditoría ART',
                sub: 'Res. SRT 960/15, 299/11 y Mediciones Anuales',
                badge: 'Ley 24.557',
                color: 'border-indigo-500/40 bg-indigo-500/10 text-indigo-400'
              },
              {
                id: 'bomberos',
                title: 'Bomberos / Municipal',
                sub: 'Carga de Fuego, Extintores y Puesta a Tierra',
                badge: 'Dec. 351/79',
                color: 'border-orange-500/40 bg-orange-500/10 text-orange-400'
              },
              {
                id: 'iso',
                title: 'ISO 45001 / Corporativo',
                sub: 'Matriz Legal, PTS, CAPA y Control de Cambios',
                badge: 'ISO 45001',
                color: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
              },
              {
                id: 'srt',
                title: 'SRT / Ministerio',
                sub: 'Inspección Pericial Completa y Relevamientos',
                badge: 'Ley 19.587',
                color: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
              }
            ].map(profile => (
              <div
                key={profile.id}
                onClick={() => handleSelectAuditProfile(profile.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedAuditProfile === profile.id
                    ? `${profile.color} shadow-lg shadow-black/40`
                    : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider bg-slate-900 border border-slate-800 text-slate-300">
                    {profile.badge}
                  </span>
                  {selectedAuditProfile === profile.id && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                </div>
                <h4 className="font-bold text-white text-sm">{profile.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-snug">{profile.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Sección de Configuración de Datos del Establecimiento */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-400" />
              Datos del Establecimiento
            </h3>
            <p className="text-xs text-slate-400">
              Esta información encabezará el acta de entrega y la carátula pericial del ZIP.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Razón Social de la Empresa</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">CUIT / Identificación Tributaria</label>
                <input
                  type="text"
                  value={companyCuit}
                  onChange={e => setCompanyCuit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Ubicación / Planta Industrial</label>
                <input
                  type="text"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-800">
                <label className="block text-slate-400 mb-1">Profesional HyS Firmante</label>
                <input
                  type="text"
                  value={inspectorName}
                  onChange={e => setInspectorName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Matrícula Profesional Habilitante</label>
                <input
                  type="text"
                  value={inspectorReg}
                  onChange={e => setInspectorReg(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Selector de Carpetas y Estructura del ZIP */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold text-white text-base flex items-center gap-2">
                    <Folder className="w-5 h-5 text-amber-400" />
                    Estructura de Carpetas a Empaquetar
                  </h3>
                  <p className="text-xs text-slate-400">
                    Seleccione los módulos que formarán parte del archivo ZIP ({activeSectionsCount} de 5 seleccionados)
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'programas',
                    folder: '01_Programas_y_Matriz_Legal/',
                    title: 'Programas de Gestión y Matriz Legal',
                    desc: 'Matriz ISO 45001 & Ley 19.587, Procedimientos de Trabajo Seguro (PTS/SOP) y RGRL Anual.',
                    icon: '📜'
                  },
                  {
                    key: 'mediciones',
                    folder: '02_Protocolos_Mediciones_Dec351/',
                    title: 'Protocolos Oficiales de Medición (Dec. 351/79)',
                    desc: 'Ventilación y Renovaciones (Anexo III), Puesta a Tierra (Res. 900), Iluminación (Res. 84) y Carga de Fuego.',
                    icon: '💨'
                  },
                  {
                    key: 'equipos',
                    folder: '03_Equipos_y_Maquinarias_Criticas/',
                    title: 'Maquinarias y Equipos Críticos',
                    desc: 'Autoelevadores Res. SRT 960/15 (Carnets Anexo I y Pre-op) e Inspección de Racks y Estanterías IRAM 38500.',
                    icon: '🚜'
                  },
                  {
                    key: 'permisos',
                    folder: '04_Permisos_Alto_Riesgo_y_ATS/',
                    title: 'Permisos de Trabajo de Alto Riesgo y ATS',
                    desc: 'Permisos PTAR (Altura, Caliente NFPA 51B, Espacios Confinados PTSEC, LOTO) y Análisis de Trabajo Seguro.',
                    icon: '🛡️'
                  },
                  {
                    key: 'personal',
                    folder: '05_Personal_Capacitacion_y_EPP/',
                    title: 'Personal, Capacitaciones y Difusión',
                    desc: 'Constancias de Entrega de EPP Res. SRT 299/11, Charlas de 5 Minutos y Planillas de Notificación con Firma.',
                    icon: '👷'
                  }
                ].map(sec => (
                  <div
                    key={sec.key}
                    onClick={() => toggleSection(sec.key)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                      sections[sec.key]
                        ? 'bg-slate-800/80 border-indigo-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800/80 text-slate-400 opacity-60'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0 mt-0.5">{sec.icon}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-indigo-400 font-bold">{sec.folder}</span>
                          <span className="font-bold text-xs">{sec.title}</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{sec.desc}</p>
                      </div>
                    </div>
                    <div className="shrink-0 pt-0.5">
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${
                          sections[sec.key]
                            ? 'bg-indigo-600 border-indigo-500 text-white'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {sections[sec.key] && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progreso y Botón de Descarga ZIP */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {isGenerating && progress && (
                <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-indigo-300">{progress.currentStep}</span>
                    <span className="font-mono font-bold text-indigo-400">{progress.percentage}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-500 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${progress.percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <button
                onClick={handleGenerateZip}
                disabled={isGenerating || activeSectionsCount === 0}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Archive className="w-5 h-5" />
                {isGenerating
                  ? 'Compilando y Comprimiendo Archivo ZIP...'
                  : `Generar y Descargar Dossier ZIP (${activeSectionsCount} Carpetas)`}
              </button>
            </div>
          </div>
        </div>

        {/* Vista previa de cómo lo recibe el auditor */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-indigo-400" />
              Estructura Final del Paquete ZIP (Árbol de Directorios)
            </h3>
            <span className="text-xs text-slate-400">Listo para descomprimir por auditores de ART o la SRT</span>
          </div>

          <div className="bg-slate-950/90 border border-slate-800/80 rounded-2xl p-5 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed">
            <p className="text-indigo-400 font-bold mb-2">
              📦 Dossier_Inspeccion_HyS_{companyName.replace(/[^a-zA-Z0-9]/g, '_')}_{new Date().toISOString().split('T')[0]}.zip
            </p>
            <p className="text-amber-300 ml-4">├── 📄 00_INDICE_Y_ACTA_DEL_DOSSIER.pdf (Carátula pericial oficial)</p>
            {sections['programas'] && (
              <>
                <p className="text-indigo-300 ml-4">├── 📁 01_Programas_y_Matriz_Legal/</p>
                <p className="text-slate-400 ml-8">│   ├── 📄 Matriz_Cumplimiento_Legal_ISO45001.pdf</p>
                <p className="text-slate-400 ml-8">│   └── 📄 LEAME_PROCEDIMIENTOS.txt</p>
              </>
            )}
            {sections['mediciones'] && (
              <>
                <p className="text-indigo-300 ml-4">├── 📁 02_Protocolos_Mediciones_Dec351/</p>
                <p className="text-slate-400 ml-8">│   ├── 📄 Protocolo_Ventilacion_Dec351_Cap11.pdf</p>
                <p className="text-slate-400 ml-8">│   └── 📄 RESUMEN_CALIBRACION_INSTRUMENTAL.txt</p>
              </>
            )}
            {sections['equipos'] && (
              <>
                <p className="text-indigo-300 ml-4">├── 📁 03_Equipos_y_Maquinarias_Criticas/</p>
                <p className="text-slate-400 ml-8">│   ├── 📄 Registro_Autoelevadores_Res_SRT_960_15.pdf</p>
                <p className="text-slate-400 ml-8">│   └── 📄 Informe_Inspeccion_Racks_IRAM38500.pdf</p>
              </>
            )}
            {sections['permisos'] && (
              <>
                <p className="text-indigo-300 ml-4">├── 📁 04_Permisos_Alto_Riesgo_y_ATS/</p>
                <p className="text-slate-400 ml-8">│   └── 📄 REGISTRO_PERMISOS_VALIDADOS.txt</p>
              </>
            )}
            {sections['personal'] && (
              <>
                <p className="text-indigo-300 ml-4">└── 📁 05_Personal_Capacitacion_y_EPP/</p>
                <p className="text-slate-400 ml-8">    └── 📄 PLANILLA_RES_SRT_299_11.txt</p>
              </>
            )}
          </div>
        </div>

        {/* Historial de Dossiers Generados */}
        {history.length > 0 && (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 space-y-4">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Historial de Dossiers Generados en este Equipo
            </h4>

            <div className="divide-y divide-slate-800 text-xs">
              {history.map(item => (
                <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white">{item.auditType}</span>
                    <p className="text-[11px] text-slate-400">
                      Emitido el: {item.date} — {item.sectionsCount} secciones compiladas ({item.fileName})
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px] font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Descargado
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
