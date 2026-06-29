import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

import { ArrowLeft, Plus, Trash2, Save, TriangleAlert, ShieldCheck, Flame, Zap, Leaf, Activity, Brain, Wrench, Share2, Printer } from 'lucide-react';
import { useSync } from '../contexts/SyncContext';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCountryNormativa } from '../data/legislationData';
import {
  ModuleFormLayout,
  ModuleFormToolbar,
  ModuleFormDocument,
  ModuleFormSection,
  ModuleActionBar
} from '../components/module';
const HAZARD_TYPES = [
{ value: '', label: 'Seleccionar...', icon: null, color: 'var(--color-text-muted)' },
{ value: 'Físico', label: 'Físico', icon: <Zap size={12} />, color: '#3b82f6' },
{ value: 'Químico', label: 'Químico', icon: <Flame size={12} />, color: '#f59e0b' },
{ value: 'Biológico', label: 'Biológico', icon: <Leaf size={12} />, color: '#10b981' },
{ value: 'Ergonómico', label: 'Ergonómico', icon: <Activity size={12} />, color: '#8b5cf6' },
{ value: 'Psicosocial', label: 'Psicosocial', icon: <Brain size={12} />, color: '#ec4899' },
{ value: 'Mecánico', label: 'Mecánico', icon: <Wrench size={12} />, color: '#6366f1' },
{ value: 'Eléctrico', label: 'Eléctrico', icon: <Zap size={12} />, color: '#f97316' }];


const PROB_LABELS = ['', 'Baja', 'Media', 'Alta', 'Muy Alta'];
const SEV_LABELS = ['', 'Leve', 'Moderada', 'Grave', 'Crítica'];

const getRiskLevel = (p, s) => {

  const val = p * s;
  if (val <= 4) return { label: 'BAJO', bg: '#dcfce7', color: '#16a34a', border: '#86efac', score: val };
  if (val <= 9) return { label: 'MODERADO', bg: '#fef9c3', color: '#ca8a04', border: '#fde047', score: val };
  return { label: 'CRÍTICO', bg: '#fee2e2', color: '#dc2626', border: '#fca5a5', score: val };
};

const emptyRow = () => {
  return {
    id: Date.now() + Math.random(),
    task: '', hazardType: '', hazard: '', probableEffect: '',
    exposedCount: 1, probability: 1, severity: 1, controls: ''
  };
};

export default function RiskMatrix(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const location = useLocation();
  const { syncCollection } = useSync();
  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';
  const countryNorms = getCountryNormativa(userCountry);

  useDocumentTitle('Matriz de Riesgos');
  const [projectData, setProjectData] = useState({
    name: '', location: '',
    date: new Date().toISOString().split('T')[0],
    responsable: ''
  });
  const [rows, setRows] = useState([emptyRow()]);
  const [showShare, setShowShare] = useState(false);

  useEffect(() => {
    if (location.state?.editData) {
      const data = location.state.editData;
      setProjectData({
        id: data.id,
        name: data.name || '',
        location: data.location || '',
        date: data.date || new Date().toISOString().split('T')[0],
        responsable: data.responsable || ''
      } as any);
      if (data.rows && data.rows.length > 0) {
        setRows(data.rows);
      }
    } else {
      const saved = localStorage.getItem('personalData');
      if (saved) {
        const p = JSON.parse(saved);
        setProjectData((prev) => ({ ...prev, responsable: p.name || '' }));
      }
    }
  }, [location.state]);

  const addRow = () => setRows([...rows, emptyRow()]);
  const removeRow = (id) => {
    setRows(rows.filter((r) => r.id !== id));
  };
  const updateRow = (id, field, value) => setRows(rows.map((r) => r.id === id ? { ...r, [field]: value } : r));

  const handleSave = async () => {
    if (!projectData.name) {toast.error('Ingresá el nombre de la obra / proyecto.');return;}
    const activeRowsToSave = rows.filter((r) => r.task.trim() || r.hazard.trim());
    if (activeRowsToSave.length === 0) {
      toast.error('Agregue al menos una evaluación con contenido.');
      return;
    }
    const entryId = (projectData as any).id || Date.now();
    const entry = { id: entryId, ...projectData, rows: activeRowsToSave, createdAt: new Date().toISOString() };
    const history = JSON.parse(localStorage.getItem('risk_matrix_history') || '[]');

    let updated;
    if ((projectData as any).id) {
      // Update existing
      updated = history.map((h: any) => h.id === entryId ? entry : h);
    } else {
      // Add new
      updated = [entry, ...history];
    }
    await syncCollection('risk_matrix_history', updated);
    localStorage.setItem('current_risk_matrix', JSON.stringify(entry));
    navigate('/risk-matrix-report');
  };

  const activeRows = rows.filter((r) => r.task.trim() || r.hazard.trim() || r.hazardType);

  const summary = {
    bajo: activeRows.filter((r) => getRiskLevel(r.probability, r.severity).label === 'BAJO').length,
    moderado: activeRows.filter((r) => getRiskLevel(r.probability, r.severity).label === 'MODERADO').length,
    critico: activeRows.filter((r) => getRiskLevel(r.probability, r.severity).label === 'CRÍTICO').length,
    total: activeRows.length
  };

  return (
    <ModuleFormLayout>
            <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Matriz de Riesgos – ${projectData.name}`}
        text={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${projectData.name}\n📍 Ubicación: ${projectData.location}\n👷 Responsable: ${projectData.responsable}\n\nGenerado con Asistente HYS`}
        rawMessage={`📋 Matriz de Riesgos\n🏗️ Proyecto: ${projectData.name}\n📍 Ubicación: ${projectData.location}\n👷 Responsable: ${projectData.responsable}\n\nGenerado con Asistente HYS`}
        elementIdToPrint="pdf-content"
        fileName={`Matriz_${projectData.name || 'Riesgos'}.pdf`} />
      

        <ModuleFormToolbar
            title="Matriz de Riesgos"
            subtitle={`${countryNorms.general} - HYS`}
            icon={<TriangleAlert size={32} color="#ffffff" />}
        />

        <ModuleFormDocument>
            <ModuleFormSection title="Datos del Proyecto" icon={<ShieldCheck size={20} />}>
            {/* ─── PROJECT DATA ─── */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4 mb-8">
                {[
        { label: 'OBRA / PROYECTO', key: 'name', placeholder: 'Ej: Edificio Central' },
        { label: 'UBICACIÓN', key: 'location', placeholder: 'Ej: Planta Norte' },
        { label: 'RESPONSABLE HYS', key: 'responsable', placeholder: 'Profesional actuante' }].
        map((f) =>
        <div key={f.key} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                        <label className="text-[0.65rem] font-black text-indigo-500 uppercase tracking-widest block mb-2">
                            {f.label}
                        </label>
                        <input
            type="text" value={projectData[f.key]}
            onChange={(e) => setProjectData({ ...projectData, [f.key]: e.target.value })}
            placeholder={f.placeholder}
            className="m-0 border-none bg-transparent font-bold text-[0.95rem] text-slate-900 dark:text-slate-100 outline-none w-full" />
          
                    </div>
        )}
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <label className="text-[0.65rem] font-black text-indigo-500 uppercase tracking-widest block mb-2">FECHA</label>
                    <input type="date" value={projectData.date}
          onChange={(e) => setProjectData({ ...projectData, date: e.target.value })}
          className="m-0 border-none bg-transparent font-bold text-[0.95rem] text-slate-900 dark:text-slate-100 outline-none w-full" />
                </div>
            </div>
            </ModuleFormSection>

            <ModuleFormSection title="Resumen y Mapa de Calor" icon={<Activity size={20} />}>
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6 mb-8">
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] align-content-[start]">
                    {[
          { label: 'Riesgos Bajos', count: summary.bajo, bg: '#dcfce7', color: '#16a34a', border: '#86efac' },
          { label: 'Riesgos Moderados', count: summary.moderado, bg: '#fef9c3', color: '#ca8a04', border: '#fde047' },
          { label: 'Riesgos Críticos', count: summary.critico, bg: '#fee2e2', color: '#dc2626', border: '#fca5a5' },
          { label: 'Total Evaluados', count: summary.total, bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' }].
          map((s) =>
          <div key={s.label} style={{
            background: s.bg, border: `2px solid ${s.border}`


          }} className="rounded-[16px] p-[1.5rem_1rem] text-center box-shadow-[0_4px_12px_rgba(0,0,0,0.03)]">
                            <div style={{ color: s.color }} className="text-[2.5rem] font-[900] line-height-[1]">{s.count}</div>
                            <div style={{ color: s.color }} className="text-[0.75rem] font-[800] uppercase letter-spacing-[0.5px] mt-[0.5rem]">{s.label}</div>
                        </div>
          )}
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 flex flex-col">
                    <h3 className="m-[0_0_1rem_0] text-[0.9rem] font-[900] text-[var(--color-text-muted)] uppercase letter-spacing-[0.05em]">Mapa de Calor (Probabilidad vs Severidad)</h3>
                    <div className="flex flex-[1] gap-[0.5rem]">
                        <div className="flex flex-col justify-space-between pb-[2rem] pr-[0.5rem] border-right-[1px_solid_var(--color-border)]">
                            <span className="text-[0.65rem] font-[800] text-[var(--color-text-muted)] transform-[rotate(-90deg)] transform-origin-[left_center] white-space-[nowrap] mt-[auto] mb-[auto]">PROBABILIDAD</span>
                        </div>
                        <div className="flex-[1] flex flex-col">
                            <div className="grid grid-template-columns-[repeat(4,_1fr)] grid-template-rows-[repeat(4,_1fr)] gap-[4px] flex-[1]">
                                {[4, 3, 2, 1].map((p) =>
                [1, 2, 3, 4].map((s) => {
                  const count = activeRows.filter((r) => r.probability === p && r.severity === s).length;
                  const lvl = getRiskLevel(p, s);
                  return (
                    <div key={`${p}-${s}`} style={{
                      background: count > 0 ? lvl.color : 'var(--color-background)',
                      border: count > 0 ? 'none' : `1px dashed ${lvl.border}`,


                      color: count > 0 ? '#fff' : 'transparent'


                    }} className="rounded-[6px] flex items-center justify-center font-[900] text-[1.2rem] transition-[all_0.3s]">
                                                {count > 0 ? count : ''}
                                            </div>);

                })
                )}
                            </div>
                            <div className="grid grid-template-columns-[repeat(4,_1fr)] gap-[4px] mt-[0.5rem] text-center">
                                <span className="text-[0.6rem] font-[800] text-[var(--color-text-muted)]">S1</span>
                                <span className="text-[0.6rem] font-[800] text-[var(--color-text-muted)]">S2</span>
                                <span className="text-[0.6rem] font-[800] text-[var(--color-text-muted)]">S3</span>
                                <span className="text-[0.6rem] font-[800] text-[var(--color-text-muted)]">S4</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            </ModuleFormSection>

            <ModuleFormSection title="Evaluaciones de Riesgo" icon={<Brain size={20} />}>
            <div className="flex flex-col gap-4 mb-6">
                {rows.map((row, idx) => {
          const level = getRiskLevel(row.probability, row.severity);
          const hazardInfo = HAZARD_TYPES.find((h) => h.value === row.hazardType) || HAZARD_TYPES[0];
          return (
            <div key={row.id} style={{

              border: `2px solid ${level.border}`


            }} className="bg-[var(--color-surface)] rounded-[18px] p-[1.5rem] box-shadow-[0_4px_16px_rgba(0,0,0,0.04)] relative">
                            {/* Row Header */}
                            <div className="flex justify-space-between items-center mb-[1.2rem]">
                                <div className="flex items-center gap-[0.8rem]">
                                    <span className="bg-[var(--color-background)] text-[var(--color-text-muted)] rounded-[8px] p-[0.3rem_0.7rem] font-[900] text-[0.75rem]">


                    #{idx + 1}</span>
                                    <span style={{
                    background: level.bg, color: level.color, border: `1.5px solid ${level.border}`


                  }} className="rounded-[20px] p-[0.3rem_1rem] font-[900] text-[0.75rem] uppercase letter-spacing-[0.05em]">
                                        {level.label} · {level.score}
                                    </span>
                                    {row.hazardType &&
                  <span style={{
                    background: hazardInfo.color + '18', color: hazardInfo.color,
                    border: `1.5px solid ${hazardInfo.color}40`


                  }} className="rounded-[20px] p-[0.3rem_0.9rem] font-[800] text-[0.7rem] flex items-center gap-[0.3rem]">
                                            {hazardInfo.icon} {row.hazardType}
                                        </span>
                  }
                                </div>
                                <button onClick={() => removeRow(row.id)} className="bg-[#fee2e2] border-none rounded-[8px] text-[#dc2626] cursor-pointer p-[0.4rem_0.6rem] flex">


                  
                                    <Trash2 size={16} />
                                </button>
                            </div>

                            {/* Row Fields - Grid */}
                            <div className="grid grid-template-columns-[2fr_1fr_2fr_2fr] gap-[1rem] mb-[1rem]">
                                <div>
                                    <label className={labelStyle}>Tarea / Proceso</label>
                                    <textarea value={row.task} onChange={(e) => updateRow(row.id, 'task', e.target.value)}
                  onInput={(e) => {(e.target as any).style.height = 'auto';(e.target as any).style.height = (e.target as any).scrollHeight + 'px';}}
                  placeholder="Describa la tarea o proceso..." className={textareaStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Tipo de Peligro</label>
                                    <select value={row.hazardType} onChange={(e) => updateRow(row.id, 'hazardType', e.target.value)} className={selectStyle}>
                                        {HAZARD_TYPES.map((h) => <option key={h.value} value={h.value}>{h.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelStyle}>Peligro / Riesgo Identificado</label>
                                    <textarea value={row.hazard} onChange={(e) => updateRow(row.id, 'hazard', e.target.value)}
                  onInput={(e) => {(e.target as any).style.height = 'auto';(e.target as any).style.height = (e.target as any).scrollHeight + 'px';}}
                  placeholder="¿Qué puede causar daño?" className={textareaStyle} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Efecto Probable</label>
                                    <textarea value={row.probableEffect} onChange={(e) => updateRow(row.id, 'probableEffect', e.target.value)}
                  onInput={(e) => {(e.target as any).style.height = 'auto';(e.target as any).style.height = (e.target as any).scrollHeight + 'px';}}
                  placeholder="Ej: Laceración, Hipoacusia..." className={textareaStyle} />
                                </div>
                            </div>

                            {/* Scoring Row */}
                            <div className="grid grid-template-columns-[80px_1fr_1fr_2fr] gap-[1rem] items-start">
                                <div>
                                    <label className={labelStyle}>Expuestos</label>
                                    <input type="number" value={row.exposedCount} min="0"
                  onChange={(e) => updateRow(row.id, 'exposedCount', parseInt(e.target.value) || 0)}
                  className={`${selectStyle} text-center`} />
                                </div>
                                <div>
                                    <label className={labelStyle}>Probabilidad (P)</label>
                                    <div className="flex gap-[0.4rem] flex-wrap">
                                        {[1, 2, 3, 4].map((v) =>
                    <button key={v} onClick={() => updateRow(row.id, 'probability', v)} style={{

                      background: row.probability === v ? '#4f46e5' : 'var(--color-background)',
                      border: `2px solid ${row.probability === v ? '#4f46e5' : 'var(--color-border)'}`,
                      color: row.probability === v ? 'white' : 'var(--color-text-muted)',


                      boxShadow: row.probability === v ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none'
                    }} className="flex-[1] p-[0.6rem_0.2rem] rounded-[10px] font-[900] text-[0.7rem] cursor-pointer flex flex-col items-center gap-[2px] transition-[all_0.2s]">
                                                <span className="text-[1.1rem]">{v}</span>
                                                <span style={{ opacity: row.probability === v ? 1 : 0.7 }} className="text-[0.55rem] text-center line-height-[1]">{PROB_LABELS[v]}</span>
                                            </button>
                    )}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Severidad (S)</label>
                                    <div className="flex gap-[0.4rem] flex-wrap">
                                        {[1, 2, 3, 4].map((v) =>
                    <button key={v} onClick={() => updateRow(row.id, 'severity', v)} style={{

                      background: row.severity === v ? '#ea580c' : 'var(--color-background)',
                      border: `2px solid ${row.severity === v ? '#ea580c' : 'var(--color-border)'}`,
                      color: row.severity === v ? 'white' : 'var(--color-text-muted)',


                      boxShadow: row.severity === v ? '0 4px 12px rgba(234, 88, 12, 0.3)' : 'none'
                    }} className="flex-[1] p-[0.6rem_0.2rem] rounded-[10px] font-[900] text-[0.7rem] cursor-pointer flex flex-col items-center gap-[2px] transition-[all_0.2s]">
                                                <span className="text-[1.1rem]">{v}</span>
                                                <span style={{ opacity: row.severity === v ? 1 : 0.7 }} className="text-[0.55rem] text-center line-height-[1]">{SEV_LABELS[v]}</span>
                                            </button>
                    )}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelStyle}>Medidas de Control</label>
                                    <textarea value={row.controls} onChange={(e) => updateRow(row.id, 'controls', e.target.value)}
                  onInput={(e) => {(e.target as any).style.height = 'auto';(e.target as any).style.height = (e.target as any).scrollHeight + 'px';}}
                  placeholder="EPP, capacitación, procedimientos..." className={textareaStyle} />
                                </div>
                            </div>
                        </div>);

        })}
            </div>

            {/* ─── ADD ROW BUTTON ─── */}
            <button onClick={addRow}






      onMouseEnter={(e) => {e.currentTarget.style.borderColor = '#6366f1';e.currentTarget.style.color = '#6366f1';e.currentTarget.style.background = '#eef2ff';}}
      onMouseLeave={(e) => {e.currentTarget.style.borderColor = '#cbd5e1';e.currentTarget.style.color = 'var(--color-text-muted)';e.currentTarget.style.background = 'var(--color-background)';}} className="w-[100%] p-[1rem] flex items-center justify-center gap-[0.6rem] rounded-[14px] border-[2px_dashed_#cbd5e1] bg-[var(--color-background)] text-[var(--color-text-muted)] font-[800] text-[0.85rem] cursor-pointer mb-[2rem] transition-[all_0.2s]">
        
                <Plus size={18} /> AGREGAR NUEVA EVALUACIÓN DE RIESGO
            </button>
            </ModuleFormSection>

            <ModuleFormSection title="Leyenda" icon={<Leaf size={20} />}>
            <div className="bg-[var(--color-background)] rounded-[14px] p-[1.2rem] border-[1px_solid_var(--color-border)]">
                <p className="m-[0_0_0.8rem_0] text-[0.75rem] font-[800] text-[var(--color-text-muted)] uppercase letter-spacing-[0.05em]">
                    Guía de Valoración (P × S)
                </p>
                <div className="flex gap-[1.5rem] flex-wrap">
                    {[
          { range: '1 – 4', label: 'BAJO', desc: 'Riesgo tolerable', bg: '#dcfce7', color: '#16a34a' },
          { range: '5 – 9', label: 'MODERADO', desc: 'Requiere control', bg: '#fef9c3', color: '#ca8a04' },
          { range: '10 – 16', label: 'CRÍTICO', desc: 'Acción inmediata', bg: '#fee2e2', color: '#dc2626' }].
          map((l) =>
          <div key={l.label} className="flex items-center gap-[0.6rem]">
                            <div style={{ background: l.bg, border: `1.5px solid ${l.color}40` }} className="w-[32px] h-[20px] rounded-[4px] flex items-center justify-center">
                                <span style={{ color: l.color }} className="text-[0.6rem] font-[900]">{l.label[0]}</span>
                            </div>
                            <span className="text-[0.75rem] text-[var(--color-text-muted)]"><strong style={{ color: l.color }}>{l.label}</strong> ({l.range}): {l.desc}</span>
                        </div>
          )}
                </div>
            </div>
            </ModuleFormSection>
        </ModuleFormDocument>
        <ModuleActionBar actions={[
            { id: 'save', label: 'GUARDAR', icon: <Save size={18} />, variant: 'primary', onClick: (e) => { e.preventDefault(); requirePro(handleSave); } },
            { id: 'share', label: 'COMPARTIR', icon: <Share2 size={18} />, variant: 'secondary', onClick: () => requirePro(() => setShowShare(true)) },
            { id: 'print', label: 'IMPRIMIR PDF', icon: <Printer size={18} />, variant: 'secondary', onClick: () => requirePro(() => window.print()) }
        ]} />
    </ModuleFormLayout>);

}

// ─── Shared micro-styles ───
const labelStyle = "block text-[0.65rem] font-black text-slate-500 uppercase tracking-widest mb-1.5";
const textareaStyle = "w-full min-h-[72px] p-2.5 m-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm resize-none overflow-hidden text-slate-900 dark:text-slate-100 outline-none box-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";
const selectStyle = "w-full p-2.5 m-0 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 outline-none box-border focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";