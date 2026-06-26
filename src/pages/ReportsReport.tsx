import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, Download, CheckCircle2, Info, Building2, User, HelpCircle, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ShareModal from '../components/ShareModal';
import CompanyLogo from '../components/CompanyLogo';
import PdfSignatures from '../components/PdfSignatures';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import PdfBrandingFooter from '../components/PdfBrandingFooter';
import { getCountryNormativa } from '../data/legislationData';

export default function ReportsReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [report, setReport] = useState(null);
  const [profile, setProfile] = useState(null);
  const [signature, setSignature] = useState(null);
  const [showShare, setShowShare] = useState(false);
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  useEffect(() => {
    const current = localStorage.getItem('current_report');
    const prof = localStorage.getItem('personalData');
    const sig = localStorage.getItem('signatureStampData');

    if (current) {
      const parsed = JSON.parse(current);
      setReport(parsed);
      if (parsed.showSignatures) {
        setShowSignatures(parsed.showSignatures);
      }
    }
    if (prof) setProfile(JSON.parse(prof));
    if (sig) setSignature(JSON.parse(sig));
  }, []);

  if (!report) return <div className="container">Cargando...</div>;

  const handlePrint = () => requirePro(() => window.print());

  return (
    <div className="container max-w-[1000px]">
            <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Informe – ${report.company || ''}`}
        text={`📋 Informe de Higiene y Seguridad\n🏗️ Empresa: ${report.company}\n📍 Ubicación: ${report.location || '-'}\n📅 Fecha: ${new Date(report.date).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S`}
        rawMessage={`📋 Informe de Higiene y Seguridad\n🏗️ Empresa: ${report.company}\n📍 Ubicación: ${report.location || '-'}\n📅 Fecha: ${new Date(report.date).toLocaleDateString('es-AR')}\n\nGenerado con Asistente H&S`}
        elementIdToPrint="pdf-content"
        fileName={`Informe_${report.company}.pdf`} />
      
            {/* Control Panel - Absolute Print Hide */}
            <div className="no-print flex justify-space-between items-center mb-[2rem]">
                <></>
            </div>

            <div id="pdf-content" className="card report-print p-[3rem] min-h-[29.7cm] h-[auto] pb-[5rem] bg-[#ffffff] text-[#1e293b] box-shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1)] relative">








        
                {/* Header with Professional Info */}
                <div className="flex-col sm:flex-row flex justify-space-between border-bottom-[2px_solid_var(--color-primary)] pb-[2rem] mb-[2.5rem] gap-[1.5rem]">
                    <div className="flex-[1] flex gap-[1.5rem] items-start">
                        <CompanyLogo className="h-[60px] w-[auto] object-fit-[contain]" />
                        <div>
                            <h1 className="m-[0_0_0.5rem_0] text-[var(--color-primary)] text-[2.5rem] font-[900] letter-spacing-[-1px]">INFORME</h1>
                            <p className="m-[0] text-[0.9rem] text-[#475569] uppercase letter-spacing-[1px]">
                                {report.template === 'general' ? 'Informe Técnico' :
                report.template === 'accident' ? 'Registro de Accidente' :
                report.template === 'training' ? 'Capacitación de Personal' :
                report.template === 'rgrl' ? 'RGRL' : 'EPP'}
                            </p>
                        </div>
                    </div>
                    {profile &&
          <div className="md:text-right md:border-t-0 md:border-l border-[#e2e8f0] pt-4 md:pt-0 text-right border-left-[1px_solid_#e2e8f0] pl-[2rem]">
                            <p className="m-[0] font-[700] text-[1.2rem] text-[#1e293b]">{profile.name}</p>
                            <p className="m-[0.2rem_0] text-[0.9rem] text-[#475569]">{profile.profession}</p>
                            {profile.license && <p className="m-[0] text-[0.85rem] text-[#64748b]">Mat: {profile.license}</p>}
                        </div>
          }
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(200px,_1fr))] gap-[1.5rem] mb-[3rem] bg-[#f8fafc] p-[1.5rem] rounded-[8px] border-[1px_solid_#e2e8f0] text-[#1e293b]">
                    <div className="flex items-center gap-[0.8rem]">
                        <Building2 size={20} color="var(--color-primary)" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Empresa</p>
                            <p className="m-[0] font-[600]">{report.company}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[0.8rem]">
                        <MapPin size={20} color="var(--color-primary)" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Ubicación</p>
                            <p className="m-[0] font-[600]">{report.location || 'N/A'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-[0.8rem]">
                        <Calendar size={20} color="var(--color-primary)" />
                        <div>
                            <p className="m-[0] text-[0.75rem] text-[#64748b]">Fecha</p>
                            <p className="m-[0] font-[600]">{new Date(report.date).toLocaleDateString('es-AR')}</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area / Observations */}
                <div className="mb-[1rem] text-[var(--color-primary)] font-[800] text-[0.8rem] letter-spacing-[2px] uppercase">OBSERVACIONES</div>
                <div className="mb-[4rem] white-space-[pre-wrap] word-break-[break-word] overflow-wrap-[anywhere] line-height-[1.6] text-[1.05rem] text-[#1e293b] border-top-[2px_solid_#f1f5f9] pt-[1rem]">
                    {report.content || 'Sin observaciones registradas.'}
                </div>

                {/* Personnel List Table if applicable */}
                {(report.template === 'training' || report.template === 'epp') && report.personnel && report.personnel.length > 0 &&
        <div className="mb-[4rem]">
                        <h4 className="m-[0_0_1rem_0] text-[var(--color-primary)] border-bottom-[1px_solid_#e2e8f0] pb-[0.5rem]">
                            Personal Interviniente / Firmas
                        </h4>
                        <div className="overflow-x-auto w-full">
                            <table className="w-[100%] min-width-[600px] border-collapse-[collapse] text-[0.85rem]">
                                <thead>
                                    <tr className="bg-[#f1f5f9]">
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">Nombre y Apellido</th>
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left text-[#475569]">DNI / CUIL</th>
                                        <th className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-left w-[250px] text-[#475569]">Firma</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.personnel.map((p) =>
                <tr key={p.id}>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-[#1e293b]">{p.name}</td>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] text-[#1e293b]">{p.dni}</td>
                                            <td className="border-[1px_solid_#e2e8f0] p-[0.8rem] h-[65px] vertical-align-[bottom] text-center">
                                                <div className="border-top-[1px_dotted_#000] w-[80%] m-[0_auto] text-[0.7rem] text-[#64748b]">
                                                    Firma del Trabajador
                                                </div>
                                            </td>
                                        </tr>
                )}
                                </tbody>
                            </table>
                        </div>
                    </div>
        }

                {/* Custom visual switches */}
                <div className="no-print mb-8 p-6 bg-[rgba(30,_41,_59,_0.2)] border-[1px_solid_var(--glass-border)] rounded-[var(--radius-xl)] w-[100%] flex flex-col gap-[1.25rem] justify-center items-center mt-[2.5rem]">
                    <div className="text-[var(--color-text)] font-[800] text-[0.85rem] uppercase letter-spacing-[0.5px]">INCLUIR FIRMAS EN EL DOCUMENTO:</div>
                    <div className="flex gap-[1rem] flex-wrap justify-center">
                        {[
            { id: 'operator', label: 'Operador / Empleado' },
            { id: 'supervisor', label: 'Supervisor / Responsable' },
            { id: 'professional', label: 'Profesional HYS' }].
            map((sig) => {
              const isChecked = showSignatures[sig.id as keyof typeof showSignatures];
              return (
                <label
                  key={sig.id}
                  className="flex items-center gap-2 cursor-pointer select-none p-[0.55rem_1.1rem] rounded-[var(--radius-full)] font-[750] text-[0.8rem] transition-[all_0.2s_ease]"
                  style={{


                    border: isChecked ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    background: isChecked ? 'rgba(var(--color-primary-rgb), 0.15)' : 'transparent',
                    color: isChecked ? 'var(--color-primary)' : 'var(--color-text-light)',



                    boxShadow: isChecked ? '0 0 10px rgba(var(--color-primary-rgb), 0.15)' : 'none'
                  }}>
                  
                                    <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) => setShowSignatures((s) => ({ ...s, [sig.id]: e.target.checked }))} className="none" />

                  
                                    <div style={{



                    border: isChecked ? '2px solid var(--color-primary)' : '2px solid var(--color-text-light)',
                    background: isChecked ? 'var(--color-primary)' : 'transparent'




                  }} className="w-[16px] h-[16px] rounded-[4px] flex items-center justify-center transition-[all_0.2s_ease]">
                                        {isChecked && <CheckCircle2 size={12} color="white" />}
                                    </div>
                                    {sig.label}
                                </label>);

            })}
                    </div>
                </div>

                <PdfSignatures
          data={{
            ...report,
            professionalSignature: report.signature || signature?.signature,
            professionalStamp: signature?.stamp,
            professionalName: profile?.name || report.responsable,
            professionalLicense: profile?.license
          }}
          box1={showSignatures.operator ? {
            title: 'OPERADOR',
            subtitle: 'Firma / Aclaración',
            signatureUrl: report.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={showSignatures.supervisor ? {
            title: 'SUPERVISOR',
            subtitle: 'Firma / Aclaración',
            signatureUrl: report.supervisorSignature || null,
            isProfessional: false
          } : null}
          box3={showSignatures.professional ? {
            title: 'PROFESIONAL ACTUANTE',
            subtitle: (profile?.name || report.responsable ? 'Firma y Sello' : 'Firma y Sello').toUpperCase(),
            signatureUrl: report.signature || signature?.signature || null,
            isProfessional: true,
            license: profile?.license
          } : null} />
        

                {/* Footer Legal */}
                <div className="w-[100%] text-center text-[0.7rem] text-[#94a3b8] mt-[3rem] font-style-[italic]">
                    Documento generado por Asistente de Higiene y Seguridad - Conforme a {countryNorms.general}
                </div>
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