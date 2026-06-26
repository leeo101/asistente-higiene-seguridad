import React from 'react';
import { ArrowLeft, Printer, Leaf, MapPin, Calendar, Clock, AlertTriangle, Droplets, Wind, Trash2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function EnvironmentalIncidentPdf({ report, onBack, isHeadless = false }: {report: any;onBack?: any;isHeadless?: boolean;}): React.ReactElement | null {

  const getSeverityStyle = (sev: any) => {
    if (sev === 'Leve') return { color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe', borderTop: '#3b82f6', label: 'LEVE' };
    if (sev === 'Moderado') return { color: '#f59e0b', bg: '#fffbeb', border: '#fde68a', borderTop: '#f59e0b', label: 'MODERADO' };
    if (sev === 'Grave') return { color: '#ef4444', bg: '#fef2f2', border: '#fca5a5', borderTop: '#ef4444', label: 'GRAVE' };
    if (sev === 'Crítico') return { color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', borderTop: '#991b1b', label: 'CRÍTICO' };
    return { color: '#475569', bg: '#f8fafc', border: '#e2e8f0', borderTop: '#64748b', label: sev || 'N/A' };
  };

  const sev = getSeverityStyle(report?.severity);

  // Get signatures
  let actSignature: string | null = report?.professionalSignature || null;
  let actStamp: string | null = report?.professionalStamp || null;
  let actName: string | null = report?.professionalName || null;
  let actLic: string | null = report?.professionalLicense || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  return (
    <div className="container pb-[3rem] min-h-[100vh] flex flex-col">
            {!isHeadless &&
      <div className="no-print flex items-center justify-space-between mb-[1.5rem] flex-wrap gap-[1rem]">
                    <div className="flex items-center gap-[1rem]">
                        <button onClick={onBack} className="p-[0.5rem] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] cursor-pointer rounded-[50%] text-[var(--color-text)]">
                            <ArrowLeft size={20} />
                        </button>
                        <h1 className="m-[0] text-[1.5rem] font-[800]">Reporte de Incidente Ambiental</h1>
                    </div>
                    <button onClick={() => window.print()} className="btn-primary m-[0] flex items-center gap-[0.5rem]">
                        <Printer size={18} /> Imprimir / PDF
                    </button>
                </div>
      }

            <div className="flex-[1] flex justify-center">
                <div
          id="pdf-content"
          className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)] rounded-[8px] box-sizing-[border-box] text-[9pt] font-family-[Helvetica,_Arial,_sans-serif]"
          style={{





            borderTop: `12px solid ${sev.borderTop}`
          }}>
          
                    <style type="text/css" media="print">
                        {`
                            @page { size: A4 portrait; margin: 10mm; }
                            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                            .no-print { display: none !important; }
                            .print-area {
                                box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                                width: 100% !important; max-width: none !important;
                                border-top: 12px solid ${sev.borderTop} !important;
                                border-radius: 0 !important; min-height: auto !important;
                            }
                        `}
                    </style>

                    {/* Header */}
                    <div className="flex flex-row justify-space-between items-start border-bottom-[3px_solid_#e2e8f0] pb-[1.2rem] mb-[1.5rem] w-[100%]">
                        <div className="flex-[1] text-left">
                            <p className="m-[0] font-[800] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.08em]">Sistema de Gestión Ambiental</p>
                            <p style={{ color: sev.color }} className="m-[0] font-[900] text-[0.8rem] uppercase">
                                ⚠ IMPACTO {sev.label}
                            </p>
                        </div>

                        <div className="flex-[2] flex flex-col items-center justify-center text-center">
                            <h1 className="m-[0] font-[900] text-[1.7rem] letter-spacing-[-0.02em] uppercase line-height-[1] text-[#0f172a]">REPORTE DE INCIDENTE</h1>
                            <h2 className="m-[0.1rem_0_0] font-[900] text-[1.1rem] uppercase line-height-[1] text-[#334155]">AMBIENTAL (ISO 14001)</h2>
                            <div className="flex gap-[1rem] mt-[0.5rem] text-[#64748b] text-[0.75rem] font-[600]">
                                <span className="flex items-center gap-[0.2rem]"><Calendar size={12} /> {report?.date ? new Date(report.date).toLocaleDateString('es-AR') : 'S/F'}</span>
                                <span className="flex items-center gap-[0.2rem]"><Clock size={12} /> {report?.time || 'S/H'}</span>
                                <span className="flex items-center gap-[0.2rem]"><MapPin size={12} /> {report?.location || 'S/U'}</span>
                            </div>
                        </div>

                        <div className="flex-[1] flex justify-end items-start">
                            <CompanyLogo style={{ maxWidth: '110px', maxHeight: '45px' }} />
                        </div>
                    </div>

                    {/* ID y Estado */}
                    <div className="flex justify-space-between mb-[1.5rem] bg-[#f8fafc] p-[0.5rem_1rem] rounded-[6px] border-[1px_solid_#e2e8f0]">
                        <div className="font-[800] text-[#0f172a] text-[0.85rem]">ID: {report?.id || 'NO-GENERADO'}</div>
                        <div className="font-[800] text-[#0f172a] text-[0.85rem]">
                            Estado: <span style={{ color: report?.status === 'Cerrado' ? '#10b981' : report?.status === 'En Investigación' ? '#f59e0b' : '#3b82f6' }}>{report?.status?.toUpperCase() || 'REPORTADO'}</span>
                        </div>
                    </div>

                    {/* Clasificación */}
                    <div className="mb-[1.5rem]">
                        <h3 className="m-[0_0_0.5rem_0] text-[#0f172a] border-bottom-[1px_solid_#cbd5e1] pb-[0.25rem] text-[0.95rem] font-[800] flex items-center gap-[0.35rem]">
                            <Leaf size={14} color="#3b82f6" /> TIPO Y CLASIFICACIÓN
                        </h3>
                        <div className="grid grid-template-columns-[1fr_1fr] gap-[0.5rem]">
                            <p className="m-[0]"><strong>Tipo de Incidente:</strong> {report?.type || '-'}</p>
                            <p className="m-[0]"><strong>Área / Sector:</strong> {report?.area || '-'}</p>
                            <p className="m-[0]"><strong>Sustancia/Agente involucrado:</strong> {report?.agent || '-'}</p>
                            <p className="m-[0]"><strong>Volumen/Cantidad estimada:</strong> {report?.volume || '-'}</p>
                        </div>
                    </div>

                    {/* Descripción */}
                    <div className="mb-[1.5rem]">
                        <h3 className="m-[0_0_0.5rem_0] text-[#0f172a] border-bottom-[1px_solid_#cbd5e1] pb-[0.25rem] text-[0.95rem] font-[800] flex items-center gap-[0.35rem]">
                            <AlertTriangle size={14} color="#f59e0b" /> DESCRIPCIÓN DEL EVENTO
                        </h3>
                        <div className="bg-[#f8fafc] p-[0.75rem] rounded-[4px] border-[1px_solid_#e2e8f0] min-h-[60px]">
                            <p className="m-[0] white-space-[pre-wrap] line-height-[1.5] text-[#334155]">
                                {report?.description || 'Sin descripción detallada.'}
                            </p>
                        </div>
                    </div>

                    {/* Acciones Inmediatas */}
                    <div className="mb-[1.5rem]">
                        <h3 className="m-[0_0_0.5rem_0] text-[#0f172a] border-bottom-[1px_solid_#cbd5e1] pb-[0.25rem] text-[0.95rem] font-[800] flex items-center gap-[0.35rem]">
                            <Droplets size={14} color="#10b981" /> ACCIONES INMEDIATAS Y CONTENCIÓN
                        </h3>
                        <div className="bg-[#f8fafc] p-[0.75rem] rounded-[4px] border-[1px_solid_#e2e8f0] min-h-[50px]">
                            <p className="m-[0] white-space-[pre-wrap] line-height-[1.5] text-[#334155]">
                                {report?.immediateActions || 'No se registraron acciones inmediatas.'}
                            </p>
                        </div>
                    </div>

                    {/* Medio Afectado */}
                    <div className="mb-[1.5rem]">
                        <h3 className="m-[0_0_0.5rem_0] text-[#0f172a] border-bottom-[1px_solid_#cbd5e1] pb-[0.25rem] text-[0.95rem] font-[800] flex items-center gap-[0.35rem]">
                            <Wind size={14} color="#8b5cf6" /> MEDIO AMBIENTE AFECTADO
                        </h3>
                        <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[0.5rem]">
                            {['Aire', 'Agua (Superficial/Subterránea)', 'Suelo', 'Flora/Fauna'].map((medio) =>
              <div key={medio} className="flex items-center gap-[0.35rem]">
                                    <div style={{ background: report?.affectedMedia?.includes(medio) ? '#3b82f6' : '#fff' }} className="w-[12px] h-[12px] border-[1px_solid_#94a3b8] rounded-[2px] flex items-center justify-center">
                                        {report?.affectedMedia?.includes(medio) && <div className="w-[6px] h-[6px] bg-[#fff] rounded-[1px]" />}
                                    </div>
                                    <span className="text-[0.8rem] text-[#475569]">{medio}</span>
                                </div>
              )}
                        </div>
                    </div>

                    {/* Evidencia Fotográfica */}
                    {report?.photos && report.photos.length > 0 &&
          <div className="mb-[1.5rem] page-break-inside-[avoid]">
                            <h3 className="m-[0_0_0.5rem_0] text-[#0f172a] border-bottom-[1px_solid_#cbd5e1] pb-[0.25rem] text-[0.95rem] font-[800]">EVIDENCIA FOTOGRÁFICA</h3>
                            <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.5rem]">
                                {report.photos.map((photo: string, i: number) =>
              <div key={i} className="aspect-ratio-[4/3] bg-[#f1f5f9] rounded-[4px] overflow-[hidden] border-[1px_solid_#e2e8f0]">
                                        <img src={photo} alt={`Evidencia ${i + 1}`} className="w-[100%] h-[100%] object-fit-[cover]" />
                                    </div>
              )}
                            </div>
                        </div>
          }

                    {/* CAPA Reference */}
                    {report?.capaId &&
          <div className="mb-[1.5rem] bg-[#eff6ff] border-[1px_dashed_#3b82f6] p-[0.75rem] rounded-[4px]">
                            <p className="m-[0] text-[#1e40af] font-[700] text-[0.85rem]">
                                🔗 Vinculado a Acción Correctiva/Preventiva (CAPA): {report.capaId}
                            </p>
                        </div>
          }

                    <div className="mt-[2rem] page-break-inside-[avoid]">
                        <PdfSignatures
              data={{
                professionalSignature: actSignature,
                professionalStamp: actStamp,
                professionalName: actName,
                professionalLicense: actLic,
                showSignatures: { operator: false, supervisor: false }
              }}
              box1={null}
              box3={null} />
            
                    </div>
                    
                    <PdfBrandingFooter />
                </div>
            </div>
        </div>);

}