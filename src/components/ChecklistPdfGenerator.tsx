import React from 'react';
import { ClipboardCheck, Check, X, AlertTriangle, Calendar, MapPin, User, Building2, Hash, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

const ALL_NORMS_MAP: Record<string, string> = {
  ley19587: 'Ley 19.587 - Higiene y Seguridad en el Trabajo',
  dec351: 'Decreto 351/79 - Reglamento General de H&S',
  ley24557: 'Ley 24.557 - Riesgos del Trabajo (LRT)',
  dec911: 'Decreto 911/96 - Industria de la Construcción',
  dec1338: 'Decreto 1338/96 - Servicios de H&S',
  res905: 'Res. SRT 905/15 - Funciones Servicios H&S',
  res886: 'Res. SRT 886/15 - Protocolo de Ergonomía',
  res85_84: 'Res. SRT 85/12 y 84/12 - Protocolos Ruido/Iluminación',
  res481: 'Res. SRT 481/16 - Estiba y Desestiba',
  res299: 'Res. SRT 299/11 - Trabajo en Altura / EPP',
  res295: 'Res. SRT 295/03 - Espacios Confinados',
  res101: 'Res. SRT 101/17 - Soldadura',
  res594: 'Res. SRT 594/15 - Agentes Químicos',
  res_srt_45_2026: 'Res. SRT 45/2026 - Declaración Jurada de Riesgos',
  res_srt_28_2026: 'Res. SRT 28/2026 - Riesgos Psicosociales',
  res_srt_8_2026: 'Res. SRT 8/2026 - Protocolo de Salud Mental',
  res_srt_7_2026: 'Res. SRT 7/2026 - Valoración del Daño Corporal',
  res_srt_30_2023: 'Res. SRT 30/23 - Estrés por Calor',
  res_siyc_18_25: 'Res. SIyC 18/25 - Certificación y Marcado AR en EPP',
  iso45001: 'ISO 45001:2018 - Sistema de Gestión SST',
  iso14001: 'ISO 14001 - Gestión Ambiental',
  iso9001: 'ISO 9001 - Gestión de Calidad',
  nfpa10: 'NFPA 10 - Extintores Portátiles',
  nfpa30: 'NFPA 30 - Líquidos Inflamables',
  nfpa70e: 'NFPA 70E - Seguridad Eléctrica',
  nfpa101: 'NFPA 101 - Código de Seguridad Humana',
  oshact: 'OSHA Act - Seguridad y Salud Ocupacional',
  ansi_z89: 'ANSI Z89.1 - Protección de cabeza',
  ansi_z87: 'ANSI Z87.1 - Protección ocular'
};

export default function ChecklistPdfGenerator({
  checklistData,
  showSignatures = { operator: true, supervisor: true, professional: true },
  isHeadless = false,
  pdfElementId = 'pdf-content'
}: {
  checklistData: any;
  showSignatures?: {operator: boolean;supervisor: boolean;professional: boolean;};
  isHeadless?: boolean;
  pdfElementId?: string;
}): React.ReactElement | null {
  if (!checklistData) return null;

  const fullData = checklistData;
  let sections = fullData.activeSections;
  if (!sections) {
    let legacyItems = fullData.items || fullData.checks || [];
    if (!Array.isArray(legacyItems) && typeof legacyItems === 'object') {
      legacyItems = Object.values(legacyItems);
    }
    if (legacyItems.length > 0) {
      sections = [{
        id: 'legacy',
        title: 'PUNTOS DE INSPECCIÓN',
        isMandatory: false,
        items: legacyItems
      }];
    } else {
      sections = [];
    }
  }
  // Fallback to root properties if companyInfo/inspectionInfo are missing (e.g. old summary data)
  const compInfo = fullData.companyInfo || { name: fullData.empresa, responsable: fullData.responsable };
  const inspInfo = fullData.inspectionInfo || { item: fullData.equipo, serial: fullData.serial, date: fullData.fecha?.split('T')[0] };
  const obs = fullData.observations || '';
  const actionPlan = fullData.actionPlan || [];
  const nextReview = fullData.nextReview || '';
  const selectedNorms = fullData.selectedNorms || [];
  const availableNorms = fullData.availableNorms || [];
  const epps = fullData.epps || [];
  const fotos = fullData.fotos || [];

  // Firmas desde localStorage (fallback pro)
  let actSignature = fullData.professionalSignature || null;
  let actName = fullData.professionalName || null;
  let actLic = fullData.professionalLicense || null;
  let actStamp = fullData.professionalStamp || null;

  if (!actSignature) {
    try {
      const lsPersonal = localStorage.getItem('personalData');
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  // Calcular estadísticas
  let totalItems = 0, okCount = 0, failCount = 0, naCount = 0;
  sections.forEach((section) => {
    section.items.forEach((item) => {
      totalItems++;
      if (item.status === 'OK') okCount++;
      else if (item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO') failCount++;
      else if (item.status === 'NA') naCount++;
    });
  });
  const okPercent = totalItems > 0 ? Math.round((okCount / totalItems) * 100) : 0;
  const failPercent = totalItems > 0 ? Math.round((failCount / totalItems) * 100) : 0;
  const naPercent = totalItems > 0 ? Math.round((naCount / totalItems) * 100) : 0;
  
  const hasCritical = failCount > 0;
  const hasObs = obs || actionPlan.length > 0;
  
  const globalRiskColor = hasCritical ? '#dc2626' : (hasObs ? '#d97706' : '#16a34a');
  const globalRiskBg = hasCritical ? '#fef2f2' : (hasObs ? '#fffbeb' : '#f0fdf4');
  const globalRiskLabel = hasCritical ? `⚠ ${failCount} NO CONFORMIDAD${failCount > 1 ? 'ES' : ''}` : (hasObs ? 'APROBADO CON OBS.' : 'APROBADO SIN DESVÍOS');

  const activeIds = sections.map((s: any) => s.id);
  const hasTools = activeIds.some((id: string) => ['manual_tools', 'electric_tools', 'circular_saw', 'grinder'].includes(id));
  const hasVehicles = activeIds.includes('autoelevadores');
  const hasPermits = activeIds.some((id: string) => ['espacios_confinados', 'trabajos_caliente', 'trabajos_altura'].includes(id));
  const hasHeavy = activeIds.some((id: string) => ['scaffolding', 'izaje_gruas'].includes(id));
  const hasExtinguishers = activeIds.includes('extintores_checklist');

  return (
    <div
      id={pdfElementId}
      className="pdf-container print-area w-[100%] max-w-[210mm] min-h-0 h-auto p-[8mm_12mm] bg-white text-slate-800 box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[8pt] font-family-[Helvetica,_Arial,_sans-serif]"
      style={{ borderTop: `8px solid ${globalRiskColor}`, color: '#0f172a' }}
    >
      <style type="text/css" media="print">
        {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; color: #0f172a !important; background: #ffffff !important; }
            .no-print { display: none !important; }
            .print-area {
                box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                width: 100% !important; max-width: none !important;
                border-top: 8px solid ${globalRiskColor} !important;
                border-radius: 0 !important; min-height: 0 !important; height: auto !important;
                color: #0f172a !important; background: #ffffff !important;
            }
            .page-break-before { page-break-before: always; break-before: page; }
            .avoid-break, .avoid-break-strictly, .break-inside-avoid {
                page-break-inside: avoid !important;
                break-inside: avoid !important;
            }
        `}
      </style>

      {/* Header Tripartito */}
      <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[0.8rem] mb-[1rem] w-[100%]">
        <div className="flex-[1] text-left">
          <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
          <p style={{ color: globalRiskColor }} className="m-[0] font-[900] text-[0.8rem] uppercase">Doc. Inspección de Seguridad</p>
        </div>

        <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.6rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1.1, color: '#0f172a', textAlign: 'center' }}>
            {checklistData.checklistTitle || 'CHECK LIST'}
          </h1>
          <hr style={{ borderTop: `4px solid ${globalRiskColor}`, margin: '0.4rem auto 0 auto', width: '60px', border: 0, borderRadius: '2px' }} />
          
          <div style={{ backgroundColor: globalRiskColor, margin: '0.5rem auto 0 auto', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#ffffff', padding: '0.25rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.1em', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', textAlign: 'center' }}>
            {globalRiskLabel}
          </div>
        </div>

        <div className="flex-[1] text-right flex flex-col items-end gap-[0.4rem]">
          <CompanyLogo style={{ maxHeight: '38px', maxWidth: '120px', objectFit: 'contain' }} />
          {inspInfo.serial && (
            <div className="text-right">
              <div className="text-[0.55rem] font-[900] text-[#94a3b8] uppercase letter-spacing-[0.1em]">DOC N°</div>
              <div className="font-[900] text-[1rem] text-[#0f172a]">{inspInfo.serial}</div>
            </div>
          )}
        </div>
      </div>

      {/* Datos del Relevamiento */}
      <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] w-[100%] overflow-hidden bg-white avoid-break avoid-break-strictly break-inside-avoid">
        <div className="flex bg-slate-50 border-bottom-[1px_solid_#cbd5e1]">
          <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={12} /> CLIENTE / EMPRESA</span>
            <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{compInfo.name || '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> ÁREA / UBICACIÓN</span>
            <div className="font-[700] text-[0.8rem] text-[#334155] mt-[0.2rem]">{compInfo.cuit || '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> UBICACIÓN / OBRA</span>
            <div className="font-[700] text-[0.8rem] text-[#334155] mt-[0.2rem]">{compInfo.location || '-'}</div>
          </div>
        </div>
        <div className="flex bg-white border-bottom-[1px_solid_#cbd5e1]">
          {!hasTools && !hasHeavy && !hasVehicles && !hasPermits && !hasExtinguishers ? (
            <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><ClipboardCheck size={12} /> {hasPermits ? "SECTOR / ÁREA" : "EQUIPO / ÁREA REVISADA"}</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.item || checklistData.equipo || '-'}</div>
            </div>
          ) : (
            <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><AlertTriangle size={12} /> EQUIPO / LUGAR DE INSP.</span>
              <div className="font-[700] text-[0.8rem] text-[#334155] mt-[0.2rem]">{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
            </div>
          )}
          <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA DE REVISIÓN</span>
            <div className="font-[700] text-[0.8rem] text-[#334155] mt-[0.2rem]">{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> INSPECTOR</span>
            <div className="font-[700] text-[0.8rem] text-[#334155] mt-[0.2rem]">{compInfo.inspector || '-'}</div>
          </div>
        </div>
        
        {hasVehicles && (
          <div className="flex bg-slate-50 border-bottom-[1px_solid_#cbd5e1]">
            <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><ClipboardCheck size={12} /> MARCA / MODELO</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.marca || '-'}</div>
            </div>
            <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Hash size={12} /> DOMINIO (PATENTE)</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.patente || '-'}</div>
            </div>
            <div className="flex-[1] p-[0.4rem_0.6rem]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Activity size={12} /> HORÓMETRO / KM</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.horometro || '-'}</div>
            </div>
          </div>
        )}

        {(hasTools || hasHeavy) && !hasVehicles && (
          <div className="flex bg-slate-50 border-bottom-[1px_solid_#cbd5e1]">
            <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><ClipboardCheck size={12} /> MARCA / MODELO</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.marca || '-'}</div>
            </div>
            <div className="flex-[1] p-[0.4rem_0.6rem]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Hash size={12} /> {hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"}</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.serial || '-'}</div>
            </div>
          </div>
        )}

        {!hasTools && !hasHeavy && !hasVehicles && !hasPermits && (
          <div className="flex bg-slate-50 border-bottom-[1px_solid_#cbd5e1]">
            <div className="flex-[1] p-[0.4rem_0.6rem]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Hash size={12} /> {hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"}</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.serial || '-'}</div>
            </div>
          </div>
        )}

        {hasPermits && (
          <div className="flex bg-slate-50 border-bottom-[1px_solid_#cbd5e1]">
            <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><ClipboardCheck size={12} /> Nº PERMISO DE TRABAJO (PT)</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{compInfo.address || '-'}</div>
            </div>
            <div className="flex-[1] p-[0.4rem_0.6rem]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> RESPONSABLE EMPRESA</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.responsableArea || '-'}</div>
            </div>
          </div>
        )}
      </div>

      {/* Resumen Estadístico - KPI cards */}
      <div style={{ display: 'table', tableLayout: 'fixed', width: '100%', marginBottom: '1rem', breakInside: 'avoid', pageBreakInside: 'avoid', borderSpacing: '0.7rem 0', borderCollapse: 'separate', boxSizing: 'border-box' }}>
        <div style={{ display: 'table-row' }}>
          {/* CUMPLE */}
          <div style={{ display: 'table-cell', width: '33.33%', background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', border: '1px solid #86efac', borderRadius: '10px', padding: '0.6rem 0.4rem', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginBottom: '4px', lineHeight: '1.2' }}>
              <Check size={11} style={{ color: '#166534', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              <span style={{ display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' }}>CUMPLE</span>
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#15803d', height: '1.8rem', lineHeight: '1.8rem', margin: '0 auto' }}>
              {okCount}
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '6px' }}>
              <span style={{ backgroundColor: '#16a34a', color: '#ffffff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block', textAlign: 'center', minWidth: '48px', lineHeight: '16px', margin: '0 auto' }}>{okPercent}%</span>
            </div>
          </div>

          {/* NO CUMPLE */}
          <div style={{ display: 'table-cell', width: '33.33%', background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)', border: '1px solid #fca5a5', borderRadius: '10px', padding: '0.6rem 0.4rem', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginBottom: '4px', lineHeight: '1.2' }}>
              <X size={11} style={{ color: '#991b1b', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              <span style={{ display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#991b1b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>NO CUMPLE</span>
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#b91c1c', height: '1.8rem', lineHeight: '1.8rem', margin: '0 auto' }}>
              {failCount}
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '6px' }}>
              <span style={{ backgroundColor: '#dc2626', color: '#ffffff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block', textAlign: 'center', minWidth: '48px', lineHeight: '16px', margin: '0 auto' }}>{failPercent}%</span>
            </div>
          </div>

          {/* N/A */}
          <div style={{ display: 'table-cell', width: '33.33%', background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', border: '1px solid #cbd5e1', borderRadius: '10px', padding: '0.6rem 0.4rem', textAlign: 'center', verticalAlign: 'middle', boxSizing: 'border-box' }}>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginBottom: '4px', lineHeight: '1.2' }}>
              <Activity size={11} style={{ color: '#475569', display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
              <span style={{ display: 'inline-block', verticalAlign: 'middle', textAlign: 'center', fontSize: '0.6rem', fontWeight: 900, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>N / A</span>
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', fontSize: '1.5rem', fontWeight: 900, color: '#475569', height: '1.8rem', lineHeight: '1.8rem', margin: '0 auto' }}>
              {naCount}
            </div>
            <div style={{ display: 'block', width: '100%', textAlign: 'center', marginTop: '6px' }}>
              <span style={{ backgroundColor: '#64748b', color: '#ffffff', padding: '2px 10px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900, display: 'inline-block', textAlign: 'center', minWidth: '48px', lineHeight: '16px', margin: '0 auto' }}>{naPercent}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* EPPs Requeridos */}
      {epps.length > 0 && (
        <div className="avoid-break avoid-break-strictly break-inside-avoid border-[1px_solid_#cbd5e1] rounded-[6px] mb-[0.8rem] p-[0.6rem_0.8rem] bg-slate-50">
          <div className="text-[0.65rem] font-[900] uppercase text-[#0f172a] mb-[0.4rem]">
            EPPs Obligatorios / Seleccionados
          </div>
          <div className="flex flex-wrap gap-[4px]">
            {epps.map((epp: string, idx: number) => (
              <div key={idx} className="bg-blue-50 border border-blue-200 text-blue-800 text-[6.5pt] font-[700] px-[6px] py-[2px] rounded-[4px] uppercase">
                {epp}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secciones del Checklist */}
      {sections.map((section: any, sectionIdx: number) => {
        const sectionFails = section.items.filter((item: any) => item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO');
        return (
          <div key={section.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-[1px_solid_#cbd5e1] rounded-[8px] mb-[1rem] avoid-break avoid-break-strictly break-inside-avoid overflow-hidden box-shadow-[0_2px_10px_rgba(0,0,0,0.03)] bg-white">
            <div style={{ background: 'linear-gradient(90deg, #1e3a8a 0%, #2563eb 100%)', borderBottom: '2px solid #1e40af', display: 'flex', alignItems: 'center', padding: '0.22rem 0.7rem', minHeight: '28px' }}>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '0.9rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '0.35rem', flex: 1, textAlign: 'left' }}>
                <ClipboardCheck size={12} style={{ color: '#93c5fd', flexShrink: 0 }} />
                {section.title}
              </h3>
              {sectionFails.length > 0 ? (
                <span style={{ padding: '2px 7px', backgroundColor: '#ef4444', color: '#fff', borderRadius: '10px', fontSize: '0.5rem', fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem' }}>
                  ⚠ {sectionFails.length} NC{sectionFails.length > 1 ? 's' : ''}
                </span>
              ) : (
                <span style={{ padding: '2px 7px', backgroundColor: '#22c55e', color: '#fff', borderRadius: '10px', fontSize: '0.5rem', fontWeight: 900, whiteSpace: 'nowrap', flexShrink: 0, marginLeft: '0.5rem' }}>
                  ✓ SIN DESVÍOS
                </span>
              )}
            </div>

            <div>
              {section.items.map((item: any, idx: number) => {
                const isFail = item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO';
                const isOk = item.status === 'OK' || item.status === 'CUMPLE' || item.value === 'SI' || item.estado === 'SI';
                return (
                  <div key={idx} className="avoid-break avoid-break-strictly break-inside-avoid" style={{
                    borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: isFail ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc')
                  }}>
                      {/* Fila principal: número | texto | estado */}
                      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: '32px' }}>
                        <div style={{ width: '28px', flexShrink: 0, padding: '0.3rem 0.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: '1px solid #e2e8f0' }}>
                          <div style={{ backgroundColor: '#e2e8f0', color: '#475569', width: '18px', height: '18px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', lineHeight: 1 }}>
                            {idx + 1}
                          </div>
                        </div>

                        <div style={{ color: isFail ? '#7f1d1d' : '#0f172a', fontWeight: 700, flex: 1, padding: '0.4rem 0.6rem', display: 'flex', alignItems: 'center', fontSize: '0.75rem' }}>
                          {item.text || item.pregunta || item.check}
                        </div>

                        {/* Badges con estilos inline explícitos - centrado garantizado */}
                        <div style={{ width: '60px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0.4rem', borderLeft: '1px solid #e2e8f0' }}>
                          {isOk ? (
                            <div style={{ backgroundColor: '#dcfce7', color: '#15803d', border: '1px solid #86efac', fontWeight: 900, fontSize: '8pt', padding: '2px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: '28px', height: '20px' }}>C</div>
                          ) : isFail ? (
                            <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', fontWeight: 900, fontSize: '8pt', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: '28px', height: '20px' }}>NC</div>
                          ) : (
                            <div style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1', fontWeight: 900, fontSize: '8pt', padding: '2px 6px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center', minWidth: '28px', height: '20px' }}>N/A</div>
                          )}
                        </div>
                      </div>

                    {/* Observación e imágenes del ítem */}
                    {(item.observation || (item.photos && item.photos.length > 0)) && (
                      <div style={{ backgroundColor: isFail ? '#fef9f9' : '#f8fafc' }} className="p-[0.2rem_0.6rem_0.4rem_2rem] border-top-[1px_dashed_#e2e8f0]">
                        {item.observation && (
                          <p style={{ color: isFail ? '#991b1b' : '#475569' }} className="m-[0_0_0.2rem_0] text-[0.65rem] font-style-[italic] font-[600]">
                            📝 {item.observation}
                          </p>
                        )}
                        {item.photos && item.photos.length > 0 && (
                          <div className="flex gap-[0.3rem] flex-wrap mt-[0.2rem]">
                            {item.photos.map((photo: string, pIdx: number) => (
                              <img key={pIdx} src={photo} alt={`Evidencia ${pIdx + 1}`} className="w-[40px] h-[40px] object-cover rounded-[4px] border-[1px_solid_#cbd5e1]" style={{ width: '40px', height: '40px', objectFit: 'cover' }} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Observaciones Generales */}
      {obs && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] avoid-break avoid-break-strictly break-inside-avoid overflow-hidden bg-white">
          <div className="bg-[#334155] text-[#fff] p-[0.4rem_0.8rem] text-[0.6rem] font-[900] uppercase letter-spacing-[0.05em]">
            OBSERVACIONES Y COMENTARIOS DEL INSPECTOR
          </div>
          <div className="p-[0.8rem] text-[0.75rem] text-[#0f172a] font-[600] white-space-[pre-wrap] line-height-[1.4] bg-slate-50">
            {obs}
          </div>
        </div>
      )}

      {/* Plan de Acción */}
      {actionPlan.length > 0 && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border border-amber-300 rounded-[6px] mb-[1rem] avoid-break avoid-break-strictly break-inside-avoid overflow-hidden">
          <div className="bg-amber-500 p-[0.4rem_0.8rem] text-[#ffffff] font-[900] text-[0.65rem] uppercase letter-spacing-[0.05em]">
            🎯 PLAN DE ACCIÓN CORRECTIVA — {actionPlan.length} ACCIÓN{actionPlan.length > 1 ? 'ES' : ''}
          </div>
          <div className="p-[0.8rem] flex flex-wrap gap-[0.6rem] bg-[#fffbeb]">
            {actionPlan.map((action: any, idx: number) => (
              <div key={action.id} style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break avoid-break-strictly break-inside-avoid flex-[1_1_260px] min-width-[260px] bg-white border border-amber-300 rounded-[6px] p-[0.6rem]">
                <div className="flex gap-[0.4rem] items-start">
                  <span className="bg-amber-500 text-[#fff] min-width-[16px] h-[16px] rounded-[50%] flex items-center justify-center text-[0.55rem] font-[900]">{idx + 1}</span>
                  <div className="flex-[1]">
                    <p className="m-[0_0_0.2rem_0] font-[800] text-[0.7rem] text-[#0f172a]">{action.action}</p>
                    <div className="flex flex-wrap gap-[0.3rem] text-[0.6rem] text-[#64748b] font-[700]">
                      {action.responsible && <span>👤 {action.responsible}</span>}
                      {action.dueDate && <span>📅 {new Date(action.dueDate).toLocaleDateString('es-AR')}</span>}
                      <span style={{ color: action.priority === 'critico' ? '#dc2626' : action.priority === 'alto' ? '#ea580c' : '#ca8a04' }} className="font-[900]">
                        🔥 {action.priority?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Evidencia Fotográfica (Global) */}
      {fotos.length > 0 && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] avoid-break avoid-break-strictly break-inside-avoid overflow-hidden bg-white">
          <div className="bg-blue-600 text-[#fff] p-[0.4rem_0.8rem] text-[0.6rem] font-[900] uppercase letter-spacing-[0.05em]">
            EVIDENCIA FOTOGRÁFICA
          </div>
          <div className="p-[0.8rem] flex gap-[1rem] justify-center bg-slate-50">
            {fotos.map((foto: string, index: number) => (
              <div key={index} className="flex-[1] max-w-[200px] aspect-square rounded-[8px] overflow-hidden border-[1px_solid_#cbd5e1] box-shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                <img src={foto} alt={`Evidencia ${index + 1}`} className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Próxima Revisión */}
      {nextReview && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="avoid-break avoid-break-strictly break-inside-avoid border border-blue-200 rounded-[6px] p-[0.6rem_1rem] mb-[1rem] bg-blue-50 flex items-center gap-[0.8rem]">
          <Calendar size={18} color="#2563eb" />
          <div>
            <p className="m-[0] font-[900] text-[0.65rem] text-[#1e3a8a] uppercase">PRÓXIMA REVISIÓN PROGRAMADA</p>
            <p className="m-[0.1rem_0_0] text-[0.85rem] font-[800] text-[#1e40af]">{new Date(nextReview).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
      )}

      {/* Normativa aplicable con texto visible y evita salto de página */}
      {selectedNorms.length > 0 && (
        <div style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }} className="border-[1px_solid_#d8b4fe] rounded-[6px] mb-[1rem] avoid-break avoid-break-strictly break-inside-avoid overflow-hidden bg-white">
          <div style={{ background: 'linear-gradient(90deg, #6b21a8 0%, #9333ea 100%)', color: '#ffffff' }} className="p-[0.6rem_1rem] font-[900] text-[0.75rem] uppercase letter-spacing-[0.05em]">
            📚 NORMATIVA LEGAL APLICABLE
          </div>
          <div style={{ backgroundColor: '#faf5ff', padding: '0.8rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
            {selectedNorms.map((normId: string) => {
              const norm = availableNorms.find((n: any) => n.id === normId);
              const normName = norm?.name || ALL_NORMS_MAP[normId] || normId;
              return (
                <div key={normId} style={{ backgroundColor: '#ffffff', border: '1px solid #d8b4fe', flex: '1 1 260px', display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.7rem', borderRadius: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                  <div style={{ backgroundColor: '#9333ea', color: '#ffffff', width: '18px', height: '18px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 900, flexShrink: 0, lineHeight: 1 }}>✓</div>
                  <span style={{ color: '#0f172a', fontWeight: 800, fontSize: '8.5pt' }}>{normName}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Firmas sin cortes de página - clase pdf-signatures-wrapper para detección de html2pdf */}
      <div
        className="pdf-signatures-wrapper avoid-break avoid-break-strictly break-inside-avoid"
        style={{ breakInside: 'avoid', pageBreakInside: 'avoid', display: 'block', width: '100%' }}
      >
        <PdfSignatures
          data={fullData}
          box1={fullData.showSignatures?.operator ? {
            title: 'RESPONSABLE / OPERADOR',
            subtitle: 'Control Operativo',
            signatureUrl: fullData.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={fullData.showSignatures?.professional ? {
            title: 'PROFESIONAL / INSTRUCTOR',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: fullData.signature || actSignature || null,
            stampUrl: fullData.professionalStamp || actStamp || null,
            isProfessional: true,
            license: fullData.professionalLicense || actLic || null
          } : null}
          box3={fullData.showSignatures?.supervisor ? {
            title: 'SUPERVISIÓN / VERIFICADOR',
            subtitle: 'Cierre de Inspección',
            signatureUrl: fullData.supervisorSignature || null,
            isProfessional: false
          } : null}
        />
      </div>

      <PdfBrandingFooter />
    </div>
  );
}