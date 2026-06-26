import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Save, Activity, ShieldAlert, AlertCircle, Printer, Share2 } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import { usePaywall } from '../hooks/usePaywall';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import ShareModal from '../components/ShareModal';
import RiskAssessmentPdfGenerator from '../components/RiskAssessmentPdfGenerator';
import toast from 'react-hot-toast';

// SVG Animated Gauge
const Gauge = ({ score, color }: any) => {

  const maxScore = 9;
  const percentage = Math.min(100, Math.max(0, score / maxScore * 100));

  // SVG parameters
  const cx = 120;
  const cy = 120;
  const radius = 100;
  const strokeWidth = 18;

  // Circumference of half circle = pi * r
  const dashArray = Math.PI * radius;
  // Dash offset = dashArray - (dashArray * percentage / 100)
  const dashOffset = dashArray - dashArray * percentage / 100;

  return (
    <div className="relative w-[240px] h-[150px] m-[0_auto] flex flex-col items-center">
            <svg width="240" height="130" viewBox="0 0 240 130" className="overflow-[visible]">
                {/* Background Arc */}
                <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
          strokeLinecap="round" />
        
                {/* Active Arc */}
                <path
          d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset} className="transition-[stroke-dashoffset_1s_cubic-bezier(0.4,_0,_0.2,_1),_stroke_0.5s_ease]" />



        
            </svg>
            <div className="absolute bottom-[0] left-[50%] transform-[translateX(-50%)] text-center w-[100%]">






        
                <div style={{



          color: color


        }} className="text-[3.5rem] line-height-[1] font-[900] transition-[color_0.5s_ease] text-shadow-[0_2px_10px_rgba(0,0,0,0.05)]">
                    {score}
                </div>
            </div>
        </div>);

};

export default function RiskAssessment(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { syncCollection } = useSync();

  const editData = location.state?.editData;
  useDocumentTitle(editData ? 'Editar Evaluación de Riesgo' : 'Evaluación de Riesgo');

  // Project Data State
  const [projectData, setProjectData] = useState({
    id: '',
    name: '',
    location: '',
    date: new Date().toISOString().split('T')[0]
  });

  const [probability, setProbability] = useState(1);
  const [severity, setSeverity] = useState(1);
  const [riskLevel, setRiskLevel] = useState({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.', bg: '#d1fae5' });
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    // Init from editData
    if (location.state?.editData) {
      const data = location.state.editData;
      setProjectData({
        id: data.id,
        name: data.name || '',
        location: data.location || '',
        date: data.date || data.createdAt?.split('T')[0] || new Date().toISOString().split('T')[0]
      });
      setProbability(data.probability || 1);
      setSeverity(data.severity || 1);
    }
  }, [location.state]);

  useEffect(() => {
    const score = probability * severity;
    if (score <= 2) {
      setRiskLevel({ label: 'Bajo', color: '#10b981', action: 'Riesgo aceptable. No requiere medidas adicionales.', bg: 'rgba(16, 185, 129, 0.1)' });
    } else if (score <= 4) {
      setRiskLevel({ label: 'Moderado', color: '#f59e0b', action: 'Requiere seguimiento. Implementar medidas de control administrativas.', bg: 'rgba(245, 158, 11, 0.1)' });
    } else if (score <= 6) {
      setRiskLevel({ label: 'Alto', color: '#f97316', action: 'Riesgo importante. Requiere medidas de ingeniería inmediatas.', bg: 'rgba(249, 115, 22, 0.1)' });
    } else {
      setRiskLevel({ label: 'Crítico', color: '#ef4444', action: 'PELIGRO INMINENTE. Detener la tarea hasta mitigar el riesgo.', bg: 'rgba(239, 68, 68, 0.1)' });
    }
  }, [probability, severity]);

  const handleSave = async () => {
    if (!projectData.name) {
      toast.error('Ingresá el nombre o descripción de la tarea.');
      return;
    }

    const entryId = projectData.id || Date.now().toString();
    const entry = {
      id: entryId,
      name: projectData.name,
      location: projectData.location,
      date: projectData.date,
      probability,
      severity,
      score: probability * severity,
      riskLabel: riskLevel.label,
      createdAt: new Date().toISOString()
    };

    const history = JSON.parse(localStorage.getItem('risk_assessment_history') || '[]');

    let updated;
    if (projectData.id) {
      // Update existing
      updated = history.map((h: any) => h.id === entryId ? { ...h, ...entry } : h);
    } else {
      // Add new
      updated = [entry, ...history];
    }

    await syncCollection('risk_assessment_history', updated);
    localStorage.setItem('risk_assessment_history', JSON.stringify(updated));
    toast.success('Evaluación de riesgo guardada con éxito');

    // Actualizar projectData con el nuevo ID si es necesario para el PDF
    if (!projectData.id) {
      setProjectData((prev) => ({ ...prev, id: entryId }));
    }

    // Si viene de una inspección, volver atrás para no perder el flujo
    if (location.state?.fromInspection) {
      navigate(-1);
    } else {
      // Navigate to history instead of /observation
      navigate('/risk-assessment-history');
    }
  };

  const handlePrint = () => requirePro(() => window.print());

  const probabilityOptions = [
  { value: 1, label: 'Remota', desc: 'Poco probable' },
  { value: 2, label: 'Ocasional', desc: 'Puede ocurrir' },
  { value: 3, label: 'Frecuente', desc: 'Ocurre seguido' }];


  const severityOptions = [
  { value: 1, label: 'Leve', desc: 'Lesión menor' },
  { value: 2, label: 'Grave', desc: 'Incapacidad' },
  { value: 3, label: 'Fatal', desc: 'Daño extremo' }];




  return (
    <div className="container max-w-[850px] pb-[8rem]">
            <ShareModal
        isOpen={showShareModal}
        open={showShareModal}
        onClose={() => setShowShareModal(false)}
        title={`IPER - ${projectData.name || ''}`}
        text={`🛡️ Evaluación de Riesgo (IPER)\n📝 Tarea: ${projectData.name}\n📍 Ubicación: ${projectData.location || '-'}\n📅 Fecha: ${projectData.date}\n⚠️ Resultado: ${probability * severity} (${riskLevel.label})`}
        rawMessage={`🛡️ Evaluación de Riesgo (IPER)\n📝 Tarea: ${projectData.name}\n📍 Ubicación: ${projectData.location || '-'}\n📅 Fecha: ${projectData.date}\n⚠️ Resultado: ${probability * severity} (${riskLevel.label})`}
        elementIdToPrint="pdf-content" />
      

            <div className="absolute left-[0] opacity-[0.01] top-[-9999px] pointer-events-[none]">
                <RiskAssessmentPdfGenerator assessmentData={{
          ...projectData,
          probability,
          severity,
          score: probability * severity,
          riskLabel: riskLevel.label
        }} />
            </div>

            {/* Floating Action Bar */}
            <div className="no-print floating-action-bar">
                <button onClick={(e) => {e.preventDefault();requirePro(() => handleSave());}}
        className="btn-floating-action bg-[#36B37E] text-[#ffffff]">

          
                    <Save size={18} /> GUARDAR
                </button>
                <button
          onClick={() => requirePro(() => setShowShareModal(true))}
          className="btn-floating-action bg-[#0052CC] text-[#ffffff]">

          
                    <Share2 size={18} /> COMPARTIR
                </button>
                <button
          onClick={handlePrint}
          className="btn-floating-action bg-[#FF8B00] text-[#ffffff]">

          
                    <Printer size={18} /> IMPRIMIR PDF
                </button>
            </div>

            {/* Header */}
            <div className="flex items-center gap-[1rem] mb-[1.5rem]">
                <></>
                <div>
                    <h1 className="m-[0] text-[1.8rem] font-[800]">
                        {editData ? 'Editar Matriz de Riesgo' : 'Evaluación de Riesgo'}
                    </h1>
                    <p className="m-[0] text-[0.95rem] text-[var(--color-text-muted)] font-[500]">Matriz IPER: Probabilidad × Severidad</p>
                </div>
            </div>

            {/* ─── PROJECT DATA ─── */}
            <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(220px,_1fr))] gap-[1rem] mb-[2rem]">


        
                {[
        { label: 'TAREA / ACTIVIDAD', key: 'name', placeholder: 'Ej: Trabajo en altura' },
        { label: 'UBICACIÓN / ÁREA', key: 'location', placeholder: 'Ej: Sector principal' }].
        map((f) =>
        <div key={f.key} className="bg-[var(--color-surface)] rounded-[14px] p-[1.2rem] border-[1px_solid_var(--color-border)] box-shadow-[0_2px_8px_rgba(0,0,0,0.05)]">


          
                        <label className="text-[0.65rem] font-[900] text-[#ef4444] uppercase letter-spacing-[0.1em] block mb-[0.5rem]">
                            {f.label}
                        </label>
                        <input
            type="text" value={(projectData as any)[f.key]}
            onChange={(e) => setProjectData({ ...projectData, [f.key]: e.target.value })}
            placeholder={f.placeholder} className="m-[0] border-none bg-[transparent] font-[700] text-[0.95rem] text-[var(--color-text)] outline-[none] w-[100%]" />

          
                    </div>
        )}
            </div>

            {/* Main Score Card */}
            <div className="card text-center mb-[2rem] bg-[linear-gradient(145deg,_var(--color-surface),_var(--color-surface-hover))] border-[1px_solid_var(--color-border)] box-shadow-[0_8px_30px_-5px_rgba(0,0,0,0.05)] rounded-[20px] p-[2.5rem_1.5rem_2rem_1.5rem]">







        
                <Gauge score={probability * severity} color={riskLevel.color} />
                <div className="mt-[1.5rem] flex flex-col items-center gap-[0.5rem]">
                    <div style={{



            background: riskLevel.bg,
            color: riskLevel.color,





            border: `1px solid ${riskLevel.color}40`
          }} className="inline-block p-[0.5rem_1.5rem] rounded-[999px] font-[800] text-[1.3rem] letter-spacing-[0.5px] uppercase transition-[all_0.4s_ease]">
                        Nivel {riskLevel.label}
                    </div>
                </div>
            </div>

            {/* Selectors Grid */}
            <div className="grid-2-cols gap-[1.5rem] mb-[2rem]">
                {/* Probability Segment */}
                <div className="card m-[0] rounded-[20px] border-[1px_solid_var(--color-border)] p-[1.5rem]">
                    <h3 className="mt-[0] mb-[1.5rem] flex items-center gap-[0.75rem] text-[1.2rem] font-[700]">
                        <div className="p-[0.4rem] bg-[rgba(37,_99,_235,_0.1)] rounded-[8px]">
                            <Activity size={20} color="var(--color-primary)" />
                        </div>
                        Probabilidad
                    </h3>
                    <div className="flex flex-col gap-3">
                        {probabilityOptions.map((opt) =>
            <div
              key={opt.value}
              onClick={() => setProbability(opt.value)}
              style={{


                border: `2px solid ${probability === opt.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                background: probability === opt.value ? 'rgba(37, 99, 235, 0.03)' : 'var(--color-surface)',





                boxShadow: probability === opt.value ? '0 4px 12px rgba(37, 99, 235, 0.1)' : 'none',
                transform: probability === opt.value ? 'translateY(-2px)' : 'none'
              }} className="p-[1rem] rounded-[12px] cursor-pointer transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)] flex justify-space-between items-center">
              
                                <div>
                                    <div style={{ color: probability === opt.value ? 'var(--color-primary)' : 'var(--color-text)' }} className="font-[700] text-[1.05rem] transition-[color_0.2s]">
                                        {opt.label}
                                    </div>
                                    <div className="text-[0.85rem] text-[var(--color-text-muted)] mt-[0.2rem]">
                                        {opt.desc}
                                    </div>
                                </div>
                                <div style={{


                background: probability === opt.value ? 'var(--color-primary)' : 'var(--color-background)',
                color: probability === opt.value ? 'white' : 'var(--color-text-muted)',



                border: probability === opt.value ? 'none' : '1px solid var(--color-border)'
              }} className="w-[32px] h-[32px] rounded-[50%] flex items-center justify-center font-[800] text-[0.9rem] transition-[all_0.2s_ease]">
                                    {opt.value}
                                </div>
                            </div>
            )}
                    </div>
                </div>

                {/* Severity Segment */}
                <div className="card m-[0] rounded-[20px] border-[1px_solid_var(--color-border)] p-[1.5rem]">
                    <h3 className="mt-[0] mb-[1.5rem] flex items-center gap-[0.75rem] text-[1.2rem] font-[700]">
                        <div className="p-[0.4rem] bg-[rgba(239,_68,_68,_0.1)] rounded-[8px]">
                            <ShieldAlert size={20} color="var(--color-danger)" />
                        </div>
                        Severidad
                    </h3>
                    <div className="flex flex-col gap-3">
                        {severityOptions.map((opt) =>
            <div
              key={opt.value}
              onClick={() => setSeverity(opt.value)}
              style={{


                border: `2px solid ${severity === opt.value ? 'var(--color-danger)' : 'var(--color-border)'}`,
                background: severity === opt.value ? 'rgba(239, 68, 68, 0.03)' : 'var(--color-surface)',





                boxShadow: severity === opt.value ? '0 4px 12px rgba(239, 68, 68, 0.15)' : 'none',
                transform: severity === opt.value ? 'translateY(-2px)' : 'none'
              }} className="p-[1rem] rounded-[12px] cursor-pointer transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)] flex justify-space-between items-center">
              
                                <div>
                                    <div style={{ color: severity === opt.value ? 'var(--color-danger)' : 'var(--color-text)' }} className="font-[700] text-[1.05rem] transition-[color_0.2s]">
                                        {opt.label}
                                    </div>
                                    <div className="text-[0.85rem] text-[var(--color-text-muted)] mt-[0.2rem]">
                                        {opt.desc}
                                    </div>
                                </div>
                                <div style={{


                background: severity === opt.value ? 'var(--color-danger)' : 'var(--color-background)',
                color: severity === opt.value ? 'white' : 'var(--color-text-muted)',



                border: severity === opt.value ? 'none' : '1px solid var(--color-border)'
              }} className="w-[32px] h-[32px] rounded-[50%] flex items-center justify-center font-[800] text-[0.9rem] transition-[all_0.2s_ease]">
                                    {opt.value}
                                </div>
                            </div>
            )}
                    </div>
                </div>
            </div>

            {/* Action Box */}
            <div className="card border-[1px_solid_var(--color-border)] rounded-[16px] p-[1.5rem] transition-[all_0.4s_cubic-bezier(0.4,_0,_0.2,_1)] mb-[2.5rem] box-shadow-[0_4px_15px_rgba(0,0,0,0.03)]" style={{

        borderLeft: `8px solid ${riskLevel.color}`,
        background: riskLevel.bg





      }}>
                <div className="flex gap-[1.25rem] items-start">
                    <div className="bg-[var(--color-surface)] rounded-[50%] p-[0.5rem] box-shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                        <AlertCircle size={28} color={riskLevel.color} />
                    </div>
                    <div className="pt-[0.2rem]">
                        <h4 style={{ color: riskLevel.color }} className="m-[0_0_0.5rem_0] text-[1.15rem] font-[800]">Acción Recomendada</h4>
                        <p className="m-[0] text-[0.95rem] line-height-[1.6] text-[var(--color-text)] font-[500]">{riskLevel.action}</p>
                    </div>
                </div>
            </div>

            {/* Footer Button */}
            <button
        onClick={(e) => {e.preventDefault();requirePro(() => handleSave());}}
        className="btn-primary flex items-center justify-center gap-[0.75rem] p-[1.2rem] text-[1.1rem] rounded-[16px] box-shadow-[0_8px_25px_rgba(239,_68,_68,_0.3)] bg-[linear-gradient(135deg,_#ef4444,_#dc2626)] border-none font-[700] w-[100%]">














        
                <Save size={22} /> Guardar Evaluación
            </button>
        </div>);

}