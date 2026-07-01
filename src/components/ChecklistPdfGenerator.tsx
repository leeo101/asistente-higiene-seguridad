import React from 'react';
import { ClipboardCheck, Check, X, AlertTriangle, Calendar, MapPin, User, Building2, Hash, Activity } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

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
      className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[8mm_12mm] bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[8pt] font-family-[Helvetica,_Arial,_sans-serif]"
      style={{ borderTop: `8px solid ${globalRiskColor}` }}
    >
      <style type="text/css" media="print">
        {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
            .no-print { display: none !important; }
            .print-area {
                box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                width: 100% !important; max-width: none !important;
                border-top: 8px solid \${globalRiskColor} !important;
                border-radius: 0 !important; min-height: 0 !important; height: auto !important;
            }
            .page-break-before { page-break-before: always; break-before: page; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
        }`}
      </style>

      {/* Header Tripartito */}
      <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[0.8rem] mb-[1rem] w-[100%]">
        <div className="flex-[1] text-left">
          <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión HSE</p>
          <p style={{ color: globalRiskColor }} className="m-[0] font-[900] text-[0.8rem] uppercase">Doc. Inspección de Seguridad</p>
        </div>

        <div className="flex-[2] flex flex-col items-center justify-center text-center">
          <h1 className="m-[0] font-[900] text-[1.8rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">
            {checklistData.checklistTitle || 'CHECK LIST'}
          </h1>
          <hr style={{ borderTop: `4px solid ${globalRiskColor}` }} className="mt-[0.5rem] w-[60px] border-0 rounded-[2px]" />
          
          <div style={{ backgroundColor: globalRiskColor }} className="mt-[0.6rem] text-[white] p-[0.25rem_0.8rem] rounded-[12px] text-[0.65rem] font-[800] letter-spacing-[0.1em] box-shadow-[0_2px_8px_rgba(0,0,0,0.15)]">
            {globalRiskLabel}
          </div>
        </div>

        <div className="flex-[1] text-right flex flex-col items-end gap-[0.4rem]">
          <CompanyLogo className="h-[38px] w-[auto] object-fit-[contain] max-w-[120px]" />
          {inspInfo.serial && (
            <div className="text-right">
              <div className="text-[0.55rem] font-[900] text-[#94a3b8] uppercase letter-spacing-[0.1em]">DOC N°</div>
              <div className="font-[900] text-[1rem] text-slate-800 dark:text-slate-200">{inspInfo.serial}</div>
            </div>
          )}
        </div>
      </div>

      {/* Datos del Relevamiento */}
      <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] w-[100%]">
        <div className="flex bg-slate-50 dark:bg-slate-800/50 border-bottom-[1px_solid_#cbd5e1]">
          <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Building2 size={12} /> CLIENTE / EMPRESA</span>
            <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{compInfo.name || '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> ÁREA / UBICACIÓN</span>
            <div className="font-[700] text-[0.8rem] text-slate-700 dark:text-slate-300 mt-[0.2rem]">{compInfo.cuit || '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><MapPin size={12} /> UBICACIÓN / OBRA</span>
            <div className="font-[700] text-[0.8rem] text-slate-700 dark:text-slate-300 mt-[0.2rem]">{compInfo.location || '-'}</div>
          </div>
        </div>
        <div className="flex bg-white dark:bg-slate-800 border-bottom-[1px_solid_#cbd5e1]">
          {!hasTools && !hasHeavy && !hasVehicles && !hasPermits && !hasExtinguishers ? (
            <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><ClipboardCheck size={12} /> {hasPermits ? "SECTOR / ÁREA" : "EQUIPO / ÁREA REVISADA"}</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.item || checklistData.equipo || '-'}</div>
            </div>
          ) : (
            <div className="flex-[2] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><AlertTriangle size={12} /> EQUIPO / LUGAR DE INSP.</span>
              <div className="font-[700] text-[0.8rem] text-slate-700 dark:text-slate-300 mt-[0.2rem]">{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
            </div>
          )}
          <div className="flex-[1] p-[0.4rem_0.6rem] border-right-[1px_solid_#cbd5e1]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Calendar size={12} /> FECHA DE REVISIÓN</span>
            <div className="font-[700] text-[0.8rem] text-slate-700 dark:text-slate-300 mt-[0.2rem]">{inspInfo.date ? new Date(inspInfo.date + 'T12:00:00Z').toLocaleDateString('es-AR') : '-'}</div>
          </div>
          <div className="flex-[1] p-[0.4rem_0.6rem]">
            <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><User size={12} /> INSPECTOR</span>
            <div className="font-[700] text-[0.8rem] text-slate-700 dark:text-slate-300 mt-[0.2rem]">{compInfo.inspector || '-'}</div>
          </div>
        </div>
        
        {hasVehicles && (
          <div className="flex bg-slate-50 dark:bg-slate-800/50 border-bottom-[1px_solid_#cbd5e1]">
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
          <div className="flex bg-slate-50 dark:bg-slate-800/50 border-bottom-[1px_solid_#cbd5e1]">
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
          <div className="flex bg-slate-50 dark:bg-slate-800/50 border-bottom-[1px_solid_#cbd5e1]">
            <div className="flex-[1] p-[0.4rem_0.6rem]">
              <span className="text-[0.55rem] font-[800] text-[#64748b] uppercase flex items-center gap-[0.3rem]"><Hash size={12} /> {hasExtinguishers ? "CHAPA / NÚMERO" : "Nº IDENTIFICACIÓN (SERIAL)"}</span>
              <div className="font-[800] text-[0.85rem] text-[#0f172a] mt-[0.2rem]">{inspInfo.serial || '-'}</div>
            </div>
          </div>
        )}

        {hasPermits && (
          <div className="flex bg-slate-50 dark:bg-slate-800/50 border-bottom-[1px_solid_#cbd5e1]">
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

      {/* Resumen Estadístico */}
      <div className="flex gap-[0.8rem] mb-[1.2rem]">
        <div className="flex-[1] bg-[linear-gradient(135deg,_#f0fdf4_0%,_#dcfce7_100%)] border-[1px_solid_#86efac] rounded-[10px] p-[0.8rem] text-center box-shadow-[0_4px_12px_rgba(34,197,94,0.1)]">
          <div className="text-[0.6rem] font-[900] text-[#166534] uppercase letter-spacing-[0.05em] mb-[0.3rem] flex items-center justify-center gap-[0.2rem]"><Check size={12}/> CUMPLE</div>
          <div className="text-[1.8rem] font-[900] text-[#15803d] line-height-[1]">{okCount}</div>
          <div className="mt-[0.4rem] bg-[#16a34a] text-[#fff] p-[0.15rem_0.6rem] rounded-[12px] text-[0.7rem] font-[900] inline-block box-shadow-[0_2px_4px_rgba(22,163,74,0.3)]">{okPercent}%</div>
        </div>
        <div className="flex-[1] bg-[linear-gradient(135deg,_#fef2f2_0%,_#fee2e2_100%)] border-[1px_solid_#fca5a5] rounded-[10px] p-[0.8rem] text-center box-shadow-[0_4px_12px_rgba(239,68,68,0.1)]">
          <div className="text-[0.6rem] font-[900] text-[#991b1b] uppercase letter-spacing-[0.05em] mb-[0.3rem] flex items-center justify-center gap-[0.2rem]"><X size={12}/> NO CUMPLE</div>
          <div className="text-[1.8rem] font-[900] text-[#b91c1c] line-height-[1]">{failCount}</div>
          <div className="mt-[0.4rem] bg-[#dc2626] text-[#fff] p-[0.15rem_0.6rem] rounded-[12px] text-[0.7rem] font-[900] inline-block box-shadow-[0_2px_4px_rgba(220,38,38,0.3)]">{failPercent}%</div>
        </div>
        <div className="flex-[1] bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] border-[1px_solid_#cbd5e1] rounded-[10px] p-[0.8rem] text-center box-shadow-[0_4px_12px_rgba(100,116,139,0.1)]">
          <div className="text-[0.6rem] font-[900] text-[#475569] uppercase letter-spacing-[0.05em] mb-[0.3rem] flex items-center justify-center gap-[0.2rem]"><Activity size={12}/> N / A</div>
          <div className="text-[1.8rem] font-[900] text-[#475569] line-height-[1]">{naCount}</div>
          <div className="mt-[0.4rem] bg-[#64748b] text-[#fff] p-[0.15rem_0.6rem] rounded-[12px] text-[0.7rem] font-[900] inline-block box-shadow-[0_2px_4px_rgba(100,116,139,0.3)]">{naPercent}%</div>
        </div>
      </div>
      
      {/* EPPs Requeridos */}
      {epps.length > 0 && (
        <div className="avoid-break border-[1px_solid_#cbd5e1] rounded-[6px] mb-[0.8rem] p-[0.6rem_0.8rem] bg-slate-50 dark:bg-slate-800/50">
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
          <div key={section.id} className="border-[1px_solid_#cbd5e1] rounded-[8px] mb-[1rem] avoid-break overflow-hidden box-shadow-[0_2px_10px_rgba(0,0,0,0.03)]">
            <div className="bg-[linear-gradient(90deg,_#1e293b_0%,_#334155_100%)] p-[0.5rem_0.8rem] flex justify-space-between items-center border-bottom-[2px_solid_#0f172a]">
              <h3 className="m-[0] font-[900] text-[0.8rem] text-[#fff] uppercase letter-spacing-[0.05em] flex items-center gap-[0.4rem]">
                <ClipboardCheck size={14} className="text-blue-400" />
                {section.title}
              </h3>
              {sectionFails.length > 0 ? (
                <span className="p-[0.15rem_0.6rem] bg-[#ef4444] text-[#fff] rounded-[12px] text-[0.55rem] font-[900] box-shadow-[0_2px_4px_rgba(239,68,68,0.3)]">
                  ⚠ {sectionFails.length} NO CONFORME{sectionFails.length > 1 ? 'S' : ''}
                </span>
              ) : (
                <span className="p-[0.15rem_0.6rem] bg-[#22c55e] text-[#fff] rounded-[12px] text-[0.55rem] font-[900] box-shadow-[0_2px_4px_rgba(34,197,94,0.3)]">
                  ✓ SIN DESVÍOS
                </span>
              )}
            </div>

            <div>
              {section.items.map((item: any, idx: number) => {
                const isFail = item.status === 'FAIL' || item.status === 'NC' || item.value === 'NO' || item.estado === 'NO';
                const isOk = item.status === 'OK' || item.status === 'CUMPLE' || item.value === 'SI' || item.estado === 'SI';
                return (
                  <div key={idx} className="avoid-break" style={{
                    borderBottom: idx === section.items.length - 1 ? 'none' : '1px solid #f1f5f9',
                    backgroundColor: isFail ? '#fef2f2' : (idx % 2 === 0 ? '#ffffff' : '#f8fafc')
                  }}>
                    {/* Fila principal: número | texto | estado */}
                    <div className="flex items-stretch">
                      <div className="w-[26px] flex-shrink-[0] p-[0.4rem_0.2rem] flex justify-center items-center border-right-[1px_solid_#e2e8f0]">
                        <span className="bg-[#e2e8f0] text-[#64748b] w-[16px] h-[16px] flex items-center justify-center rounded-[4px] text-[0.55rem] font-[900]">
                          {idx + 1}
                        </span>
                      </div>

                      <div style={{ color: isFail ? '#7f1d1d' : '#334155' }} className="flex-[1] p-[0.4rem_0.6rem] flex items-center font-[600] text-[0.75rem]">
                        {item.text || item.pregunta || item.check}
                      </div>

                      <div className="w-[60px] flex-shrink-[0] flex items-center justify-center p-[0.4rem] border-left-[1px_solid_#e2e8f0]">
                        {isOk ? (
                          <span className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-[0.15rem_0.4rem] rounded-[4px] font-[900] text-[0.6rem]">C</span>
                        ) : isFail ? (
                          <span className="bg-[#fecaca] text-red-600 dark:text-red-400 p-[0.15rem_0.4rem] rounded-[4px] font-[900] text-[0.6rem]">NC</span>
                        ) : (
                          <span className="bg-[#f1f5f9] text-[#94a3b8] p-[0.15rem_0.4rem] rounded-[4px] font-[900] text-[0.6rem]">N/A</span>
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
                              <img key={pIdx} src={photo} alt={`Evidencia ${pIdx + 1}`} className="w-[40px] h-[40px] object-fit-[cover] rounded-[4px] border-[1px_solid_#cbd5e1]" />
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
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] avoid-break">
          <div className="bg-[#334155] text-[#fff] p-[0.4rem_0.8rem] text-[0.6rem] font-[900] uppercase letter-spacing-[0.05em]">
            OBSERVACIONES Y COMENTARIOS DEL INSPECTOR
          </div>
          <div className="p-[0.8rem] text-[0.75rem] text-slate-700 dark:text-slate-300 font-[600] white-space-[pre-wrap] line-height-[1.4] bg-slate-50 dark:bg-slate-800/50">
            {obs}
          </div>
        </div>
      )}

      {/* Plan de Acción */}
      {actionPlan.length > 0 && (
        <div className="border border-amber-300 dark:border-amber-700 rounded-[6px] mb-[1rem] avoid-break">
          <div className="bg-amber-500 hover:bg-amber-600 p-[0.4rem_0.8rem] text-[#ffffff] font-[900] text-[0.65rem] uppercase letter-spacing-[0.05em]">
            🎯 PLAN DE ACCIÓN CORRECTIVA — {actionPlan.length} ACCIÓN{actionPlan.length > 1 ? 'ES' : ''}
          </div>
          <div className="p-[0.8rem] flex flex-wrap gap-[0.6rem] bg-[#fffbeb]">
            {actionPlan.map((action: any, idx: number) => (
              <div key={action.id} className="avoid-break flex-[1_1_260px] min-width-[260px] bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-[6px] p-[0.6rem] page-break-inside-[avoid]">
                <div className="flex gap-[0.4rem] items-start">
                  <span className="bg-amber-500 hover:bg-amber-600 text-[#fff] min-width-[16px] h-[16px] rounded-[50%] flex items-center justify-center text-[0.55rem] font-[900]">{idx + 1}</span>
                  <div className="flex-[1]">
                    <p className="m-[0_0_0.2rem_0] font-[800] text-[0.7rem] text-slate-800 dark:text-slate-200">{action.action}</p>
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
        <div className="border-[1px_solid_#cbd5e1] rounded-[6px] mb-[1rem] avoid-break">
          <div className="bg-blue-500 hover:bg-blue-600 text-[#fff] p-[0.4rem_0.8rem] text-[0.6rem] font-[900] uppercase letter-spacing-[0.05em]">
            EVIDENCIA FOTOGRÁFICA
          </div>
          <div className="p-[0.8rem] flex gap-[1rem] justify-center bg-slate-50 dark:bg-slate-800/50">
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
        <div className="avoid-break border border-blue-200 dark:border-blue-800 rounded-[6px] p-[0.6rem_1rem] mb-[1rem] bg-blue-50 dark:bg-blue-900/20 flex items-center gap-[0.8rem] page-break-inside-[avoid]">
          <Calendar size={18} color="#2563eb" />
          <div>
            <p className="m-[0] font-[900] text-[0.65rem] text-[#1e3a8a] uppercase">PRÓXIMA REVISIÓN PROGRAMADA</p>
            <p className="m-[0.1rem_0_0] text-[0.85rem] font-[800] text-[#1e40af]">{new Date(nextReview).toLocaleDateString('es-AR')}</p>
          </div>
        </div>
      )}

      {/* Normativa aplicable */}
      {selectedNorms.length > 0 && (
        <div className="border-[1px_solid_#d8b4fe] rounded-[6px] mb-[1rem] avoid-break">
          <div className="bg-[#7c3aed] p-[0.6rem_1rem] text-[#fff] font-[900] text-[0.75rem] uppercase letter-spacing-[0.05em]">
            📚 NORMATIVA LEGAL APLICABLE
          </div>
          <div className="p-[0.8rem] flex flex-wrap gap-[0.5rem] bg-[#faf5ff]">
            {selectedNorms.map((normId: string) => {
              const norm = availableNorms.find((n: any) => n.id === normId);
              if (!norm) return null;
              return (
                <div key={normId} className="flex-[1_1_260px] flex items-center gap-[0.5rem] bg-white dark:bg-slate-800 p-[0.5rem_0.7rem] rounded-[6px] border-[1px_solid_#e9d5ff]">
                  <span className="w-[16px] h-[16px] bg-[#7c3aed] text-[#fff] rounded-[50%] flex items-center justify-center text-[0.55rem] font-[900] flex-shrink-[0]">✓</span>
                  <span className="text-[0.75rem] font-[700] text-slate-800 dark:text-slate-200">{norm.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Firmas */}
      <div className="avoid-break">
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