import { TriangleAlert, CheckCircle2 } from 'lucide-react';
import PdfBrandingFooter from './PdfBrandingFooter';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import React from 'react';

interface Observation {
  itemId?: string;
  category?: string;
  description?: string;
  severity?: string;
  photo?: string;
}

interface ReportData {
  name?: string;
  date?: string | number | Date;
  location?: string;
  responses?: Record<string, string>;
  observations?: Observation[];
  [key: string]: any;
}

interface ReportPdfGeneratorProps {
  initialData?: ReportData | null;
}

export default function ReportPdfGenerator({ initialData }: ReportPdfGeneratorProps) {
  if (!initialData) return null;

  const findings = initialData.observations || [];
  const findingCount = findings.length;


  return (
    <div className="w-[100%] flex justify-center">
            <div
        id="pdf-content"
        className="pdf-container print-area border-none shadow-none w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important;
                            margin: 0 !important;
                            padding: 5mm !important;
                            width: 100% !important;
                            max-width: none !important;
                            border: none !important;
                            border-radius: 0 !important;
                        }
                        .company-logo {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                            color-adjust: exact !important;
                        }
                    `}
                </style>

                {/* Header Section */}
                <div className="flex justify-space-between items-start border-bottom-[3px_solid_#3b82f6] pb-[1.5rem] mb-[2rem]">
                    <div className="flex-[1]">
                        <div className="flex items-center gap-[0.8rem] mb-[0.5rem]">
                            <h2 className="m-[0] text-[1.5rem] text-[#3b82f6] font-[900]">ASISTENTE H&S</h2>
                        </div>
                        <h1 className="m-[0] text-[1.1rem] font-[800] text-[#0f172a]">INFORME TÉCNICO DE INSPECCIÓN</h1>
                        <p className="m-[0] text-[0.85rem] text-[#64748b]">Protocolo de Relevamiento General de Riesgos</p>
                    </div>
                    <div className="flex flex-col items-end gap-[0.5rem]">
                        <CompanyLogo className="h-[45px] w-[auto] object-fit-[contain] max-w-[140px]" />






            
                        <div className="text-right text-[0.85rem]">
                            <p className="m-[0_0_0.2rem_0]"><strong>Fecha:</strong> {initialData.date ? new Date(initialData.date).toLocaleDateString() : '-'}</p>
                            <p className="m-[0_0_0.2rem_0]"><strong>Referencia:</strong> {initialData.name || '-'}</p>
                            <p className="m-[0]"><strong>Ubicación:</strong> {initialData.location || '-'}</p>
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="flex gap-[1rem] mb-[2rem]">
                    <div className="flex-[1] p-[1rem] text-center bg-[#f1f5f9] border-[1.5px_solid_#e2e8f0] rounded-[12px]">
                        <div className="text-[1.4rem] font-[900] text-[#1e293b]">{findingCount}</div>
                        <div className="text-[0.65rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.5px]">Hallazgos</div>
                    </div>
                    <div className="flex-[1] p-[1rem] text-center bg-[#f1f5f9] border-[1.5px_solid_#e2e8f0] rounded-[12px]">
                        <div className="text-[1.4rem] font-[900] text-[#1e293b]">
                            {(() => {
                const categories = [
                { items: ['e1', 'e2'] },
                { items: ['L1', 'L2'] },
                { items: ['p1', 'p2'] },
                { items: ['o1', 'o2'] },
                { items: ['s1', 's2'] }];

                const allItems = categories.flatMap((c) => c.items);
                const total = allItems.length;
                const okCount = allItems.filter((id) => initialData.responses?.[id] === 'ok').length;
                return Math.round(okCount / total * 100) || 0;
              })()}%
                        </div>
                        <div className="text-[0.65rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.5px]">Cumplimiento</div>
                    </div>
                    <div className="flex-[2] p-[1rem] bg-[#f1f5f9] border-[1.5px_solid_#e2e8f0] rounded-[12px] flex flex-col justify-center">
                        <div className="text-[0.65rem] font-[800] text-[#64748b] mb-[0.2rem]">ESTADO GENERAL</div>
                        <div style={{ color: findingCount > 0 ? '#dc2626' : '#16a34a' }} className="text-[1rem] font-[900]">
                            {findingCount > 0 ? '⚠️ SE REQUIERAN ACCIONES' : '✅ CONDICIONES ÓPTIMAS'}
                        </div>
                    </div>
                </div>

                {/* Checklist Summary Section */}
                <h3 className="text-[1rem] font-[900] mb-[1rem] flex items-center gap-[0.5rem] text-[#1e293b]">
                    📈 Resumen de Inspección por Áreas
                </h3>
                <div className="grid grid-template-columns-[repeat(2,_1fr)] gap-[0.8rem] mb-[2.5rem]">
                    {[
          { name: 'Extintores y Protección', items: ['e1', 'e2'] },
          { name: 'Riesgo Eléctrico', items: ['L1', 'L2'] },
          { name: 'EPP', items: ['p1', 'p2'] },
          { name: 'Orden y Limpieza', items: ['o1', 'o2'] },
          { name: 'Señalización y Evacuación', items: ['s1', 's2'] }].
          map((cat, idx) => {
            const total = cat.items.length;
            const ok = cat.items.filter((id) => initialData.responses?.[id] === 'ok').length;
            const fail = cat.items.filter((id) => {
              const isResponseFail = initialData.responses?.[id] === 'fail';
              const hasObservation = initialData.observations?.some((o) => o.itemId === id);
              return isResponseFail || hasObservation;
            }).length;
            const percent = Math.round(ok / total * 100) || 0;

            return (
              <div key={idx} className="p-[0.8rem] bg-[#f8fafc] rounded-[10px] border-[1px_solid_#e2e8f0]">
                                <div className="text-[0.75rem] font-[800] text-[#334155] mb-[0.5rem]">{cat.name}</div>
                                <div className="flex items-center gap-[0.5rem] mb-[0.4rem]">
                                    <div className="flex-[1] h-[6px] bg-[#e2e8f0] rounded-[3px]">
                                        <div style={{ width: `${percent}%`, background: percent === 100 ? '#16a34a' : '#3b82f6' }} className="h-[100%]"></div>
                                    </div>
                                    <span className="text-[0.7rem] font-[900]">{percent}%</span>
                                </div>
                                <div className="text-[0.65rem] font-[800] flex justify-space-between">
                                    <span className="text-[#16a34a]">✓ {ok} OK</span>
                                    <span style={{ color: fail > 0 ? '#dc2626' : '#64748b' }}>{fail > 0 ? '✕' : ''} {fail} Fallos</span>
                                </div>
                            </div>);

          })}
                </div>

                {/* Findings Table */}
                <h3 className="text-[1.1rem] font-[800] mb-[1rem] flex items-center gap-[0.5rem] text-[#1e293b]">
                    <TriangleAlert size={20} color="#f59e0b" /> Detalle de Hallazgos y No Conformidades
                </h3>

                {findings.length > 0 ?
        <div className="mb-[2.5rem]">
                        <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] text-[0.85rem]">
                            <thead>
                                <tr className="avoid-break break-inside-[avoid] bg-[#f1f5f9]">
                                    <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">#</th>
                                    <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">Categoría / Item</th>
                                    <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">Descripción del Hallazgo</th>
                                    <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-center text-[#475569]">Severidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {findings.map((obs, i) =>
              <tr className="avoid-break" key={i} style={{}}>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] font-[700] text-[#64748b]">{i + 1}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.8rem]">
                                            <div className="font-[800] text-[#0f172a]">{obs.category}</div>
                                        </td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] word-break-[break-word] overflow-wrap-[anywhere] white-space-[pre-wrap]">
                                            {obs.description}
                                        </td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-center">
                                            <span style={{

                    background: obs.severity === 'Crítica' ? '#fee2e2' : '#fef9c3',
                    color: obs.severity === 'Crítica' ? '#dc2626' : '#ca8a04',
                    border: `1px solid ${obs.severity === 'Crítica' ? '#fca5a5' : '#fde047'}`
                  }} className="text-[0.7rem] font-[900] p-[0.2rem_0.5rem] rounded-[12px]">
                                                {obs.severity?.toUpperCase()}
                                            </span>
                                        </td>
                                    </tr>
              )}
                            </tbody>
                        </table>

                        {/* Evidence Photos placed below to avoid table breakout issues */}
                        <div className="mt-[2rem] flex gap-[1rem] flex-wrap">
                            {findings.map((obs, i) => obs.photo &&
            <div key={`photo-${i}`} className="w-[45%] border-[1px_solid_#e2e8f0] p-[0.5rem] rounded-[8px]">
                                    <div className="text-[0.7rem] font-[800] text-[#64748b] mb-[0.5rem]">EVIDENCIA #{i + 1}</div>
                                    <img src={obs.photo} alt={`Evidencia ${i + 1}`} className="w-[100%] h-[auto] rounded-[4px]" />
                                </div>
            )}
                        </div>
                    </div> :

        <div className="p-[2rem] text-center bg-[#f0fdf4] border-[1px_solid_#bbf7d0] text-[#166534] mb-[2rem] rounded-[8px]">
                        <CheckCircle2 size={32} className="mb-[0.5rem] opacity-[0.7] m-[0_auto]" />
                        <p className="m-[0] font-[700]">No se detectaron hallazgos durante la inspección.</p>
                        <p className="m-[0.3rem_0_0_0] text-[0.85rem]">El sector cumple con las condiciones mínimas de seguridad.</p>
                    </div>
        }

                {/* Signatures Section */}
                <PdfSignatures data={initialData} />

                <PdfBrandingFooter />
            </div>
        </div>);

}