import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import CompanyLogo from '../components/CompanyLogo';
import Breadcrumbs from '../components/Breadcrumbs';
import { ArrowLeft, CheckCircle2, AlertCircle, ClipboardCheck, ChevronRight, Shield } from 'lucide-react';

export default function Checklist(): React.ReactElement | null {
  const navigate = useNavigate();
  const categories = [
  { id: 'extintores', name: 'Extintores y Protección', icon: '🔥', color: '#ef4444' },
  { id: 'electrico', name: 'Riesgo Eléctrico', icon: '⚡', color: '#f59e0b' },
  { id: 'epp', name: 'Elementos de Protección Personal', icon: '🦺', color: '#0052CC' },
  { id: 'orden', name: 'Orden y Limpieza', icon: '🧹', color: '#10b981' },
  { id: 'senyalizacion', name: 'Señalización y Evacuación', icon: '🚦', color: '#8b5cf6' }];


  const items: Record<string, {id: string;text: string;}[]> = {
    extintores: [
    { id: 'e1', text: 'Extintores con carga vigente y señalizados' },
    { id: 'e2', text: 'Acceso libre a los equipos de lucha contra fuego' }],

    electrico: [
    { id: 'L1', text: 'Tableros eléctricos cerrados y señalizados' },
    { id: 'L2', text: 'Puesta a tierra comprobable en equipos' }],

    epp: [
    { id: 'p1', text: 'Personal utiliza calzado y casco de seguridad' },
    { id: 'p2', text: 'Entrega de EPP registrada y firmada' }],

    orden: [
    { id: 'o1', text: 'Pasillos y pasarelas libres de obstáculos' },
    { id: 'o2', text: 'Residuos segregados en recipientes adecuados' }],

    senyalizacion: [
    { id: 's1', text: 'Salidas de emergencia demarcadas claramente' },
    { id: 's2', text: 'Planos de evacuación visibles y actualizados' }]

  };

  const flatItems = Object.values(items).flat();
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('Control de Inspección');
  const [isEditingTitle, setIsEditingTitle] = useState(false);

  const updateTitleInStorage = (newTitle: string) => {
    const current = localStorage.getItem('current_inspection');
    if (current) {
      try {
        const inspection = JSON.parse(current);
        inspection.title = newTitle;
        inspection.type = newTitle;
        localStorage.setItem('current_inspection', JSON.stringify(inspection));
      } catch (e) {
        console.error('Error saving title:', e);
      }
    }
  };

  // Load responses on mount
  useEffect(() => {
    const current = localStorage.getItem('current_inspection');
    if (current) {
      const inspection = JSON.parse(current);
      if (inspection.title || inspection.type) {
        setTitle(inspection.title || inspection.type);
      }
      if (inspection.responses) {
        setResponses(inspection.responses);
      }
    }
  }, []);

  // Helper to save current state to localStorage with defensive merging
  const saveToLocalStorage = (updatedResponses: Record<string, string>) => {
    const current = localStorage.getItem('current_inspection');
    let inspection: any = {};
    if (current) {
      try {
        inspection = JSON.parse(current);
      } catch (e) {
        console.error('[Checklist] Error parsing current_inspection from localStorage:', e);
        inspection = {} as any;
      }
    }
    inspection.responses = updatedResponses;
    localStorage.setItem('current_inspection', JSON.stringify(inspection));
    console.log('[Checklist] Saved responses. Total responses:', Object.keys(updatedResponses).length);
  };

  const handleToggle = (itemId: string, status: string) => {
    setResponses((prev) => {
      const updated = { ...prev, [itemId]: status };
      saveToLocalStorage(updated);
      return updated;
    });
  };

  const handleRecordFinding = (itemId: string, catName: string) => {
    // Automatically mark as fail when recording a finding
    const updated = { ...responses, [itemId]: 'fail' };
    setResponses(updated);
    saveToLocalStorage(updated);
    navigate('/observation', { state: { itemId, category: catName } });
  };

  const answered = Object.keys(responses).length;
  const total = flatItems.length;
  const progress = Math.round(answered / total * 100);

  const okCount = Object.values(responses).filter((v) => v === 'ok').length;
  const failCount = Object.values(responses).filter((v) => v === 'fail').length;

  return (
    <div className="container pt-[5rem] pb-[6rem] max-w-[720]">
            <Breadcrumbs />

            {/* ═══ Premium Header ═══ */}
            <div className="mb-[1.5rem] p-[1.5rem_2rem] bg-[linear-gradient(135deg,_#0052CC_0%,_#003d99_50%,_#001a66_100%)] rounded-[24] flex justify-space-between items-center flex-wrap gap-[1rem] box-shadow-[0_10px_40px_rgba(0,82,204,0.35),_0_0_80px_rgba(0,82,204,0.1)] relative overflow-[hidden]">






        
                {/* Background glows */}
                <div style={{ top: -40, right: -40 }} className="absolute w-[180] h-[180] bg-[radial-gradient(circle,_rgba(0,197,255,0.2)_0%,_transparent_70%)] pointer-events-[none]" />
                <div style={{ bottom: -30, left: -30 }} className="absolute w-[120] h-[120] bg-[radial-gradient(circle,_rgba(255,255,255,0.06)_0%,_transparent_70%)] pointer-events-[none]" />

                <div className="flex items-center gap-[1rem] relative z-[1]">
                    <></>
                    <div className="w-[56] h-[56] bg-[rgba(255,255,255,0.15)] backdrop-filter-[blur(12px)] rounded-[16] flex items-center justify-center border-[1px_solid_rgba(255,255,255,0.2)] box-shadow-[0_8px_32px_rgba(0,0,0,0.15)]">






            
                        <ClipboardCheck size={30} color="#fff" strokeWidth={2.5} />
                    </div>
                    <div className="flex-[1] min-width-[200px]">
                        {isEditingTitle ?
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                setIsEditingTitle(false);
                updateTitleInStorage(title);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsEditingTitle(false);
                  updateTitleInStorage(title);
                }
              }}
              autoFocus className="m-[0] text-[1.5rem] font-[900] text-[#fff] bg-[rgba(255,255,255,0.2)] border-[1px_solid_rgba(255,255,255,0.4)] rounded-[8px] p-[0_0.5rem] outline-[none] letter-spacing-[-0.5px] w-[100%] box-sizing-[border-box]" /> :








            <h1
              onClick={() => setIsEditingTitle(true)}






              title="Click para editar el título" className="m-[0] text-[1.5rem] font-[900] text-[#fff] letter-spacing-[-0.5px] cursor-text border-bottom-[1px_dashed_rgba(255,255,255,0.4)] inline-block">
              
                                {title}
                            </h1>
            }
                        <p className="m-[0] text-[rgba(255,255,255,0.7)] text-[0.8rem] font-[600] letter-spacing-[0.3px] mt-[0.2rem]">
                            Relevamiento de condiciones de seguridad
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-[0.75rem] relative z-[1]">
                    <button
            onClick={() => navigate('/risk', { state: { fromInspection: true } })} className="p-[0.55rem_1rem] bg-[rgba(255,255,255,0.15)] text-[#fff] border-[1px_solid_rgba(255,255,255,0.25)] rounded-[12] cursor-pointer flex items-center gap-[0.4rem] font-[700] text-[0.82rem] backdrop-filter-[blur(8px)] transition-[all_0.2s]">










            
                        <AlertCircle size={14} /> IPER
                    </button>
                    <CompanyLogo className="h-[36px] w-[auto] max-w-[110px] object-fit-[contain] filter-[brightness(0)_invert(1)] opacity-[0.85]" />
                </div>
            </div>

            {/* ═══ Stats Row ═══ */}
            <div className="grid grid-template-columns-[repeat(3,_1fr)] gap-[0.75rem] mb-[1.5rem]">
                {[
        { label: 'Completados', value: answered, color: '#0052CC', bg: 'rgba(0,82,204,0.08)' },
        { label: 'Conformes ✓', value: okCount, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
        { label: 'Hallazgos ⚠', value: failCount, color: '#ef4444', bg: 'rgba(239,68,68,0.08)' }].
        map((stat) =>
        <div key={stat.label} className="toolbox-stat-card p-[1rem] text-center">
                        <div style={{ color: stat.color }} className="text-[1.6rem] font-[900] line-height-[1]">{stat.value}</div>
                        <div className="text-[0.7rem] font-[700] text-[var(--color-text-muted)] mt-[0.3rem] uppercase letter-spacing-[0.5px]">{stat.label}</div>
                    </div>
        )}
            </div>

            {/* ═══ Progress Bar ═══ */}
            <div className="toolbox-glass-section p-[1.5rem] mb-[1.5rem]">
                <div className="flex justify-space-between items-center mb-[0.75rem]">
                    <span className="font-[800] text-[0.85rem] text-[var(--color-text)] uppercase letter-spacing-[0.5px]">
                        Progreso del Relevamiento
                    </span>
                    <span className="text-[1.1rem] font-[900] bg-[linear-gradient(135deg,_#0052CC,_#0077ff)] webkit-background-clip-[text] webkit-text-fill-color-[transparent]">



            
                        {progress}%
                    </span>
                </div>
                <div className="h-[10] bg-[var(--color-border)] rounded-[8] overflow-[hidden] relative">
                    <div style={{
            width: `${progress}%`,
            background: progress === 100 ?
            'linear-gradient(90deg, #10b981, #059669)' :
            'linear-gradient(90deg, #0052CC, #0077ff, #00c5ff)',


            boxShadow: progress > 0 ? '0 0 12px rgba(0,119,255,0.4)' : 'none'
          }} className="h-[100%] transition-[width_0.5s_cubic-bezier(0.4,_0,_0.2,_1)] rounded-[8]" />
                </div>
                <div className="mt-[0.5rem] flex justify-space-between text-[0.72rem] text-[var(--color-text-muted)] font-[600]">
                    <span>{answered} de {total} puntos relevados</span>
                    {progress === 100 && <span className="text-[#10b981] font-[800]">✓ Completo</span>}
                </div>
            </div>

            {/* ═══ Category Sections ═══ */}
            {categories.map((cat) => {
        const catItems = items[cat.id] || [];
        const catAnswered = catItems.filter((i) => responses[i.id]).length;
        const catDone = catAnswered === catItems.length;

        return (
          <div key={cat.id} className="mb-[1.25rem]">
                        {/* Category Header */}
                        <div className="flex items-center gap-[0.6rem] mb-[0.6rem] p-[0_0.25rem]">


              
                            <span className="text-[1.2rem]">{cat.icon}</span>
                            <span style={{
                color: cat.color

              }} className="text-[0.78rem] font-[900] uppercase letter-spacing-[1px] flex-[1]">{cat.name}</span>
                            {catDone &&
              <span className="text-[0.65rem] font-[800] text-[#10b981] bg-[rgba(16,185,129,0.1)] border-[1px_solid_rgba(16,185,129,0.3)] p-[2px_8px] rounded-[20]">



                ✓ Completado</span>
              }
                            <span className="text-[0.72rem] text-[var(--color-text-muted)] font-[700]">
                                {catAnswered}/{catItems.length}
                            </span>
                        </div>

                        {/* Items Card */}
                        <div className="toolbox-glass-section p-[0] overflow-[hidden]">
                            {catItems.map((item, idx) => {
                const status = responses[item.id];
                const isOk = status === 'ok';
                const isFail = status === 'fail';

                return (
                  <div
                    key={item.id}
                    style={{

                      borderBottom: idx < catItems.length - 1 ? '1px solid var(--color-border)' : 'none',

                      background: isFail ? 'rgba(239,68,68,0.04)' : isOk ? 'rgba(16,185,129,0.02)' : 'transparent'

                    }} className="p-[1.1rem_1.25rem] flex items-center gap-[1rem] transition-[background_0.25s_ease]">
                    
                                        {/* Item number badge */}
                                        <div style={{


                      background: isFail ? 'rgba(239,68,68,0.12)' : isOk ? 'rgba(16,185,129,0.12)' : 'var(--color-background)',
                      border: `1px solid ${isFail ? 'rgba(239,68,68,0.3)' : isOk ? 'rgba(16,185,129,0.3)' : 'var(--color-border)'}`,

                      color: isFail ? '#ef4444' : isOk ? '#10b981' : 'var(--color-text-muted)'

                    }} className="w-[28] h-[28] rounded-[8] flex-shrink-[0] flex items-center justify-center text-[0.65rem] font-[900] transition-[all_0.25s]">
                                            {idx + 1}
                                        </div>

                                        {/* Item text */}
                                        <div style={{

                      fontWeight: isFail ? 700 : 500,
                      color: isFail ? '#ef4444' : isOk ? 'var(--color-text-muted)' : 'var(--color-text)'

                    }} className="flex-[1] text-[0.9rem] line-height-[1.5] transition-[color_0.2s]">
                                            {item.text}
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-[0.5rem] flex-shrink-[0]">
                                            {/* OK button */}
                                            <button
                        onClick={() => handleToggle(item.id, 'ok')}
                        title="Cumple"
                        style={{

                          background: isOk ?
                          'linear-gradient(135deg, #10b981, #059669)' :
                          'var(--color-background)',
                          border: `2px solid ${isOk ? '#10b981' : 'var(--color-border)'}`,
                          color: isOk ? '#fff' : 'var(--color-text-muted)',



                          boxShadow: isOk ? '0 4px 14px rgba(16,185,129,0.35)' : 'none',
                          transform: isOk ? 'scale(1.05)' : 'scale(1)'
                        }} className="w-[44] h-[44] rounded-[12] flex items-center justify-center cursor-pointer transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)]">
                        
                                                <CheckCircle2 size={20} />
                                            </button>

                                            {/* FAIL / Finding button */}
                                            <button
                        onClick={() => handleRecordFinding(item.id, cat.name)}
                        title="Registrar Hallazgo / No Conformidad"
                        style={{

                          background: isFail ?
                          'linear-gradient(135deg, #ef4444, #dc2626)' :
                          'var(--color-background)',
                          border: `2px solid ${isFail ? '#ef4444' : 'var(--color-border)'}`,
                          color: isFail ? '#fff' : 'var(--color-text-muted)',



                          boxShadow: isFail ? '0 4px 14px rgba(239,68,68,0.35)' : 'none',
                          transform: isFail ? 'scale(1.05)' : 'scale(1)'
                        }} className="w-[44] h-[44] rounded-[12] flex items-center justify-center cursor-pointer transition-[all_0.2s_cubic-bezier(0.4,_0,_0.2,_1)]">
                        
                                                <AlertCircle size={20} />
                                            </button>
                                        </div>
                                    </div>);

              })}
                        </div>
                    </div>);

      })}

            {/* ═══ Finish Button ═══ */}
            <div className="mt-6">
                <button
          onClick={() => navigate('/report')}
          style={{

            background: progress === 100 ?
            'linear-gradient(135deg, #10b981, #059669)' :
            'linear-gradient(135deg, #0052CC, #0077ff)',



            boxShadow: progress === 100 ?
            '0 8px 30px rgba(16,185,129,0.4)' :
            '0 8px 30px rgba(0,82,204,0.4)'


          }} className="w-[100%] p-[1.1rem_2rem] text-[#fff] border-none rounded-[16] font-[900] text-[1rem] cursor-pointer flex items-center justify-center gap-[0.75rem] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)] letter-spacing-[0.5px]">
          
                    <Shield size={22} />
                    {progress === 100 ? 'Generar Reporte Final' : `Continuar al Reporte (${progress}% completado)`}
                    <ChevronRight size={20} />
                </button>
                {progress < 100 &&
        <p className="text-center mt-[0.6rem] text-[0.78rem] text-[var(--color-text-muted)] font-[600]">
                        Podés generar el reporte en cualquier momento
                    </p>
        }
            </div>
        </div>);

}