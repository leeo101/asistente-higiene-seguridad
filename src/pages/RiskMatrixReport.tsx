

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { ArrowLeft, Printer, Share2, TriangleAlert, X, Copy, Check, Mail, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { getCountryNormativa } from '../data/legislationData';

// ─── Visual Risk Grid (Probability × Impact) ───────────────────────
// Rows: Probability (top = high), Columns: Impact (left = low)
// Colors based on ISO 31000 / standard HyS matrix
const MATRIX_GRID = [
// probability label, [impact colors for: Menor, Crítico, Mayor, Catastrófico]
{ prob: 'Insignif.\nConstante', cells: ['#fef08a', '#fca5a5', '#ef4444', '#dc2626'] },
{ prob: 'Moderado', cells: ['#fef08a', '#fca5a5', '#ef4444', '#dc2626'] },
{ prob: 'Ocasional', cells: ['#86efac', '#fef08a', '#fca5a5', '#ef4444'] },
{ prob: 'Posible', cells: ['#86efac', '#86efac', '#fef08a', '#fca5a5'] },
{ prob: 'Improbable', cells: ['#4ade80', '#86efac', '#86efac', '#fef08a'] }];

const IMPACT_LABELS = ['Menor', 'Crítica', 'Mayor', 'Catastrófico'];

function RiskMatrixGrid() {
  return (
    <div className="mb-[2rem] page-break-inside-[avoid]">
            <h3 className="text-[0.8rem] font-[900] text-[#475569] uppercase letter-spacing-[0.08em] m-[0_0_1rem_0]">
                Tabla de Valoración de Riesgos (Probabilidad × Impacto)
            </h3>
            <div className="flex items-stretch gap-[0]">
                {/* Y-axis label */}
                <div className="writing-mode-[vertical-rl] transform-[rotate(180deg)] text-[0.7rem] font-[800] text-[#64748b] text-center pr-[0.5rem] letter-spacing-[0.1em] uppercase">




          
                    Probabilidad ↑
                </div>

                <div className="flex-[1]">
                    {/* Impact headers */}
                    <div className="grid grid-template-columns-[100px_repeat(4,_1fr)] mb-[2px]">
                        <div />
                        {IMPACT_LABELS.map((l) =>
            <div key={l} className="text-center text-[0.65rem] font-[800] text-[#64748b] uppercase p-[0.3rem_0.2rem]">


              {l}</div>
            )}
                    </div>

                    {/* Matrix rows */}
                    {MATRIX_GRID.map((row, ri) =>
          <div key={ri} className="grid grid-template-columns-[100px_repeat(4,_1fr)] gap-[2px] mb-[2px]">
                            <div className="bg-[#f1f5f9] rounded-[6px_0_0_6px] flex items-center justify-center p-[0.4rem] text-[0.6rem] font-[800] text-[#475569] text-center white-space-[pre-line] line-height-[1.2]">




              
                                {row.prob}
                            </div>
                            {row.cells.map((color, ci) =>
            <div key={ci} style={{
              background: color, borderRadius: ri === 0 && ci === 3 ? '0 6px 0 0' : ri === MATRIX_GRID.length - 1 && ci === 3 ? '0 0 6px 0' : '0'

            }} className="h-[36px]" />
            )}
                        </div>
          )}

                    {/* X-axis label */}
                    <div className="text-center text-[0.7rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.1em] mt-[0.5rem]">
                        Impacto →
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="flex gap-[1rem] mt-[0.8rem] flex-wrap">
                {[
        { color: '#4ade80', label: 'Bajo – Riesgo tolerable' },
        { color: '#86efac', label: 'Bajo-Moderado' },
        { color: '#fef08a', label: 'Moderado – Requiere control' },
        { color: '#fca5a5', label: 'Alto' },
        { color: '#ef4444', label: 'Crítico – Acción inmediata' },
        { color: '#dc2626', label: 'Muy Crítico' }].
        map((l) =>
        <div key={l.label} className="flex items-center gap-[0.4rem]">
                        <div style={{ background: l.color }} className="w-[14px] h-[14px] rounded-[3px] border-[1px_solid_rgba(0,0,0,0.1)]" />
                        <span className="text-[0.65rem] text-[#64748b]">{l.label}</span>
                    </div>
        )}
            </div>
        </div>);

}

// ─── Main Report ────────────────────────────────────────────────────
export default function RiskMatrixReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [matrix, setMatrix] = useState(null);
  const [profile, setProfile] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showSignatures, setShowSignatures] = useState({ operator: true, supervisor: true, professional: true });

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  useEffect(() => {
    const current = localStorage.getItem('current_risk_matrix');
    const prof = localStorage.getItem('personalData');
    const sig = localStorage.getItem('signatureStampData');
    if (current) setMatrix(JSON.parse(current));
    if (prof) setProfile(JSON.parse(prof));
    if (sig) setSignature(JSON.parse(sig));
  }, []);

  if (!matrix) return <div className="container">Cargando...</div>;

  const getRiskLevel = (p, s) => {
    const v = p * s;
    if (v <= 4) return { label: 'BAJO', color: '#16a34a', bg: '#dcfce7' };
    if (v <= 9) return { label: 'MODERADO', color: '#ca8a04', bg: '#fef9c3' };
    return { label: 'CRÍTICO', color: '#dc2626', bg: '#fee2e2' };
  };

  const handlePrint = () => requirePro(() => window.print());

  return (
    <div className="container max-w-[1100px]">
            <ShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        title={`Matriz de Riesgos – ${matrix.name}`}
        text={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${matrix.name}\n📍 Ubicación: ${matrix.location || '-'}\n📅 Fecha: ${matrix.date}\n👷 Responsable: ${profile?.name || matrix.responsable}\n\n✅ Riesgos evaluados: ${matrix.rows?.length || 0}\n\nGenerado con Asistente H&S`}
        rawMessage={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${matrix.name}\n📍 Ubicación: ${matrix.location || '-'}\n📅 Fecha: ${matrix.date}\n👷 Responsable: ${profile?.name || matrix.responsable}\n\n✅ Riesgos evaluados: ${matrix.rows?.length || 0}\n\nGenerado con Asistente H&S`}
        elementIdToPrint="pdf-content"
        fileName={`Matriz_Riesgos_${matrix.name.replace(/\s+/g, '_')}.pdf`} />
      

            {/* ─── Action Bar (no-print) ─── */}
            <div className="no-print flex justify-space-between items-center mb-[2rem] bg-[transparent]">


        
                <></>
            </div>

            {/* ─── Printable Report ─── */}
            <div id="pdf-content" className="print-area print:mb-0 print:border-none print:shadow-none bg-[#fff] rounded-[20px] p-[2.5rem] border-[1px_solid_#e2e8f0] box-shadow-[0_4px_24px_rgba(0,0,0,0.04)]">

                {/* Report Header */}
                <div className="grid grid-template-columns-[1fr_2fr_1fr] items-center border-bottom-[4px_solid_#6366f1] pb-[1.5rem] mb-[2rem] w-[100%] gap-[1.5rem]">
                    <div className="text-left">
                        <p className="m-[0] font-[700] text-[0.65rem] uppercase text-[#64748b] letter-spacing-[0.05em]">Sistema de Gestión</p>
                        <p className="m-[0] font-[900] text-[0.75rem] uppercase text-[#1e293b]">Control H&S</p>
                    </div>

                    <div className="text-center">
                        <h2 className="m-[0] text-[1.2rem] font-[900] text-[var(--color-primary)] uppercase letter-spacing-[1px] line-height-[1.2]">
                            Matriz de Valoración de Riesgos
                        </h2>
                        <p className="m-[4px_0_0_0] text-[0.65rem] text-[#64748b] font-[600]">ISO 31000 / Estándar HyS</p>
                    </div>

                    <div className="flex justify-end items-center gap-[15px]">
                         <div className="text-right text-[0.7rem] text-[#64748b]">
                             <div className="font-[800] text-[#1e293b]">ID #{matrix.id?.toString().slice(-6)}</div>
                             <div>{new Date(matrix.date).toLocaleDateString('es-AR')}</div>
                         </div>
                        <CompanyLogo className="h-[40px] w-[auto] max-w-[120px] object-fit-[contain]" />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">
                    <div className="flex flex-col gap-[8px]">
                        <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">PROYECTO:</span> <span className="font-[800] text-[0.9rem]">{matrix.name}</span></div>
                        <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">UBICACIÓN:</span> <span className="font-[800] text-[0.9rem]">{matrix.location || '-'}</span></div>
                    </div>
                    <div className="flex flex-col gap-[8px]">
                         <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">RESPONSABLE:</span> <span className="font-[800] text-[0.9rem]">{profile?.name || matrix.responsable}</span></div>
                         <div><span className="text-[0.7rem] text-[#64748b] font-[700] uppercase">NORMATIVA:</span> <span className="font-[800] text-[0.9rem]">{countryNorms.general}</span></div>
                    </div>
                </div>

                {/* ─── Visual Risk Grid ─── */}
                <RiskMatrixGrid />

                {/* ─── Data Table ─── */}
                <div className="overflow-x-[auto] mb-[2.5rem]">
                    <table className="w-[100%] border-collapse-[collapse] text-[0.75rem]">
                        <thead>
                            <tr className="bg-[#f8fafc]">
                                {['#', 'Tarea / Proceso', 'Tipo', 'Peligro / Riesgo', 'Efecto Probable', 'Exp.', 'P', 'S', 'P×S', 'Nivel', 'Medidas de Control'].map((h) =>
                <th key={h} style={{ textAlign: h === '#' || h === 'P' || h === 'S' || h === 'P×S' || h === 'Exp.' ? 'center' : 'left' }} className="border-[1px_solid_#e2e8f0] p-[0.6rem_0.8rem] font-[800] text-[#475569] uppercase text-[0.65rem] letter-spacing-[0.05em]">
                                        {h}
                                    </th>
                )}
                            </tr>
                        </thead>
                        <tbody>
                            {matrix.rows.map((row, i) => {
                const lv = getRiskLevel(row.probability, row.severity);
                return (
                  <tr key={i} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] text-center font-[800] text-[#94a3b8]">{i + 1}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] word-break-[break-word] overflow-wrap-[anywhere]">{row.task}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] word-break-[break-word] overflow-wrap-[anywhere]">{row.hazardType}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] word-break-[break-word] overflow-wrap-[anywhere]">{row.hazard}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] word-break-[break-word] overflow-wrap-[anywhere]">{row.probableEffect}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] text-center">{row.exposedCount}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] text-center font-[800]">{row.probability}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] text-center font-[800]">{row.severity}</td>
                                        <td style={{ color: lv.color, background: lv.bg }} className="border-[1px_solid_#e2e8f0] p-[0.6rem] text-center font-[900]">{row.probability * row.severity}</td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.4rem] text-center">
                                            <span style={{ background: lv.bg, color: lv.color, border: `1px solid ${lv.color}40` }} className="rounded-[12px] p-[0.25rem_0.6rem] font-[900] text-[0.65rem] white-space-[nowrap]">{lv.label}</span>
                                        </td>
                                        <td className="border-[1px_solid_#e2e8f0] p-[0.6rem] word-break-[break-word] overflow-wrap-[anywhere]">{row.controls}</td>
                                    </tr>);

              })}
                        </tbody>
                    </table>
                </div>

                {/* ─── Signature Controls (no-print) ─── */}
                <div className="no-print mt-10 mb-8 p-4 bg-slate-50 border border-slate-200 rounded-xl w-full flex flex-col md:flex-row gap-4 md:gap-8 justify-center items-center text-xs font-bold text-slate-700">
                    <div className="text-center">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-4 flex-wrap justify-center">
                        {['operator', 'supervisor', 'professional'].map((key) =>
            <label key={key} className="flex items-center gap-2 cursor-pointer">
                                <input type="checkbox" checked={showSignatures[key]} onChange={(e) => setShowSignatures((s) => ({ ...s, [key]: e.target.checked }))} className="w-4 h-4 accent-indigo-600" />
                                {key === 'operator' ? 'Operador' : key === 'supervisor' ? 'Supervisor' : 'Profesional'}
                            </label>
            )}
                    </div>
                </div>

                {/* ─── Signatures ─── */}
                <PdfSignatures
          data={{
            ...matrix,
            professionalSignature: signature?.signature,
            professionalStamp: signature?.stamp,
            professionalName: profile?.name || matrix.responsable,
            professionalLicense: profile?.license
          }}
          box1={showSignatures.operator ? {
            title: 'OPERADOR',
            subtitle: 'Aclaración y Firma',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box3={showSignatures.supervisor ? {
            title: 'SUPERVISOR',
            subtitle: 'Aclaración y Firma',
            signatureUrl: null,
            isProfessional: false
          } : null}
          box2={showSignatures.professional ? undefined : null} />
        
                <PdfBrandingFooter />
            </div>
            {/* Floating Action Buttons */}
            <div className="no-print floating-action-bar">
                <button onClick={() => toast.success('Este reporte ya se encuentra guardado en tu historial.')} className="btn-floating-action bg-[#36B37E] text-[white]">
                    <CheckCircle2 size={18} /> GUARDADO
                </button>
                <button onClick={() => requirePro(() => setShowShare(true))} className="btn-floating-action bg-[#0052CC] text-[white]">
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button onClick={handlePrint} className="btn-floating-action bg-[#FF8B00] text-[white]">
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>
        </div>);

}