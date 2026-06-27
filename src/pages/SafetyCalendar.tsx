import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
  Bell, Trash2, Clock, CheckCircle2,
  CalendarDays, Award, Construction, Scale, X, BellDot,
  ShieldAlert, AlertTriangle, List, CalendarPlus, Filter, Info } from
'lucide-react';
import {
  requestNotificationPermission,
  initializeSchedules,
  scheduleReminder,
  cancelReminder,
  isNotificationDenied } from
'../services/notificationService';
import { getCountryNormativa } from '../data/legislationData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS_SHORT = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const DAYS_MIN = ["D", "L", "M", "X", "J", "V", "S"];

const EVENT_TYPES: any = {
  Inspection: { color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Inspección', icon: <Construction size={14} /> },
  Training: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Capacitación', icon: <Award size={14} /> },
  Legal: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', label: 'Vencimiento Legal', icon: <Scale size={14} /> },
  SystemAuto: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', label: 'Vencimiento Automático', icon: <BellDot size={14} /> },
  Commemorative: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Efeméride HYS', icon: <CalendarDays size={14} /> },
  Other: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', label: 'Otro', icon: <CalendarIcon size={14} /> }
};

function getCountryEvents(country: string, year: number) {
  const base = [
  { title: 'Día Mundial Seg. y Salud en el Trabajo', date: `${year}-04-28`, time: '09:00', type: 'Commemorative', description: 'OIT' }];

  const extra: Record<string, any[]> = {
    argentina: [
    { title: 'Día de la HyS en el Trabajo (Arg)', date: `${year}-04-21`, time: '09:00', type: 'Commemorative', description: 'Ley 19.587' },
    { title: 'Presentación Anual R.G.R.L.', date: `${year}-03-31`, time: '10:00', type: 'Legal', description: 'Resolución SRT 463/09' },
    { title: 'Relevamiento de Agentes de Riesgo', date: `${year}-04-15`, time: '10:00', type: 'Legal', description: 'Res. 81/19' }],

    chile: [
    { title: 'Día del Prevencionista de Riesgos', date: `${year}-03-07`, time: '09:00', type: 'Commemorative', description: 'Reconocimiento Nacional' }]

  };
  return [...base, ...(extra[country] || [])];
}

// Helper to pull data from other modules
function loadAutoSyncEvents() {
  const auto: any[] = [];

  try {
    const extintores = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
    extintores.forEach((ex: any) => {
      if (ex.nextRecharge) {
        auto.push({
          id: `ext-rcg-${ex.id}`, title: `Recarga Extintor #${ex.numero || ex.number || '?'}`,
          date: ex.nextRecharge, time: '09:00', type: 'SystemAuto',
          description: `Ubicación: ${ex.ubicacion || ex.location || '-'}`, isAuto: true
        });
      }
      if (ex.nextHydraulic) {
        auto.push({
          id: `ext-ph-${ex.id}`, title: `PH Extintor #${ex.numero || ex.number || '?'}`,
          date: ex.nextHydraulic, time: '09:00', type: 'SystemAuto',
          description: `Ubicación: ${ex.ubicacion || ex.location || '-'}`, isAuto: true
        });
      }
    });

    const trainings = JSON.parse(localStorage.getItem('training_sessions_db') || '[]');
    trainings.forEach((tr: any) => {
      if (tr.date) {
        auto.push({
          id: `train-${tr.id}`, title: `Capacitación: ${tr.topic || tr.title}`,
          date: tr.date, time: tr.time || '10:00', type: 'Training',
          description: `Lugar: ${tr.location || '-'} | Cap.: ${tr.trainer || '-'}`, isAuto: true
        });
      }
    });

    const drills = JSON.parse(localStorage.getItem('ehs_drills_db') || '[]');
    drills.forEach((dr: any) => {
      if (dr.date) {
        auto.push({
          id: `drill-${dr.id}`, title: `Simulacro: ${dr.type || 'Evacuación'}`,
          date: dr.date, time: dr.time || '11:00', type: 'Inspection',
          description: `Ubicación: ${dr.location || '-'}`, isAuto: true
        });
      }
    });

    const audits = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
    audits.forEach((au: any) => {
      if (au.date) {
        auto.push({
          id: `aud-${au.id}`, title: `Auditoría: ${au.type || 'General'}`,
          date: au.date, time: '09:00', type: 'Inspection',
          description: `Lugar: ${au.location || '-'}`, isAuto: true
        });
      }
    });
  } catch (e) {
    console.error("Failed to sync auto events", e);
  }

  return auto;
}

// Diff days helper
function diffDays(dateStr: string): number {
  const ev = new Date(dateStr + 'T12:00:00');
  const now = new Date();now.setHours(0, 0, 0, 0);
  return Math.round((ev.getTime() - now.getTime()) / 86400000);
}

function urgencyBadge(days: number) {
  if (days < 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'VENCIDO' };
  if (days === 0) return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', label: 'HOY' };
  if (days <= 3) return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', label: `${days}d` };
  if (days <= 7) return { color: '#eab308', bg: 'rgba(234,179,8,0.1)', label: `${days}d` };
  return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', label: `${days}d` };
}

export default function SafetyCalendar(): React.ReactElement | null {
  useDocumentTitle('Calendario HYS');
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [manualEvents, setManualEvents] = useState<any[]>([]);
  const [autoEvents, setAutoEvents] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [view, setView] = useState<'month' | 'list'>('month');
  const [permStatus, setPermStatus] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [newEvent, setNewEvent] = useState({
    title: '', date: today.toISOString().split('T')[0], time: '09:00', type: 'Inspection', description: ''
  });

  const savedData = localStorage.getItem('personalData');
  const userCountry = savedData ? JSON.parse(savedData).country || 'argentina' : 'argentina';

  // Load events
  useEffect(() => {
    const saved = localStorage.getItem('safety_calendar_events');
    const loaded = saved ? JSON.parse(saved) : getCountryEvents(userCountry, today.getFullYear());
    if (!saved) localStorage.setItem('safety_calendar_events', JSON.stringify(loaded));

    const auto = loadAutoSyncEvents();
    setManualEvents(loaded);
    setAutoEvents(auto);
    initializeSchedules(loaded);
  }, []);

  const saveManualEvents = async (ev: any[]) => {
    setManualEvents(ev);
    localStorage.setItem('safety_calendar_events', JSON.stringify(ev));
    await syncCollection('safety_calendar_events', ev);
  };

  const addEvent = () => {
    if (!newEvent.title.trim()) return;
    const id = `ev-${Date.now()}`;
    const item = { ...newEvent, id, isAuto: false };
    const updated = [...manualEvents, item];
    saveManualEvents(updated);
    scheduleReminder(id, item.date, item.time, item.title);
    setIsAdding(false);
    setNewEvent({ title: '', date: today.toISOString().split('T')[0], time: '09:00', type: 'Inspection', description: '' });
  };

  const deleteEvent = (ev: any) => {
    if (ev.isAuto) {
      alert('Este es un evento generado automáticamente. Para borrarlo o modificarlo, ve al módulo correspondiente.');
      return;
    }
    const id = ev.id || `${ev.date}-${ev.time}-${ev.title}`;
    cancelReminder(id);
    saveManualEvents(manualEvents.filter((e) => e !== ev));
  };

  const exportToGoogleCalendar = (ev: any) => {
    const start = new Date(ev.date + 'T' + ev.time).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const end = new Date(new Date(ev.date + 'T' + ev.time).getTime() + 60 * 60 * 1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(ev.description || '')}`;
    window.open(url, '_blank');
  };

  // Navigation helpers
  const prevMonth = () => {if (currentMonth === 0) {setCurrentMonth(11);setCurrentYear((y) => y - 1);} else setCurrentMonth((m) => m - 1);};
  const nextMonth = () => {if (currentMonth === 11) {setCurrentMonth(0);setCurrentYear((y) => y + 1);} else setCurrentMonth((m) => m + 1);};
  const goToday = () => {setCurrentMonth(today.getMonth());setCurrentYear(today.getFullYear());};

  // Combine events and apply filter
  const allEvents = useMemo(() => {
    const combined = [...manualEvents, ...autoEvents];
    if (activeFilter) return combined.filter((e) => e.type === activeFilter);
    return combined;
  }, [manualEvents, autoEvents, activeFilter]);

  // Events indexed by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    allEvents.forEach((e) => {if (!map[e.date]) map[e.date] = [];map[e.date].push(e);});
    return map;
  }, [allEvents]);

  // Upcoming
  const upcoming = useMemo(() =>
  allEvents.
  filter((e) => new Date(e.date + 'T12:00:00') >= new Date(today.toDateString())).
  sort((a, b) => a.date.localeCompare(b.date)).
  slice(0, 6),
  [allEvents]);

  // Selected day events
  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  // Build calendar cells
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="container max-w-[1100px] pt-[6rem] pb-[6rem]">

{/* Banners removed as per user request */}

            {/* ── Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-space-between mb-[1rem] flex-wrap gap-[0.85rem]">
                <div className="flex items-center gap-[0.85rem]">
                    <div className="bg-[var(--color-primary)] rounded-[12px] p-[0.6rem] flex items-center justify-center box-shadow-[0_4px_14px_rgba(59,130,246,0.3)] flex-shrink-[0]">
                        <CalendarIcon size={22} color="#fff" />
                    </div>
                    <div>
                        <h1 className="m-[0] text-[clamp(1.2rem,_4vw,_1.6rem)] font-[900] letter-spacing-[-0.02em] line-height-[1.1]">
                            {MONTHS[currentMonth]} <span className="text-[var(--color-primary)]">{currentYear}</span>
                        </h1>
                        <p className="m-[0] text-[0.77rem] text-[var(--color-text-muted)] font-[600]">{allEvents.length} evento{allEvents.length !== 1 ? 's' : ''} registrado{allEvents.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>

                <div className="flex items-center gap-[0.6rem] flex-wrap">
                    {/* View switcher */}
                    <div className="flex bg-[var(--color-surface)] rounded-[10px] p-[3px] border-[1px_solid_var(--color-border)]">
                        {(['month', 'list'] as const).map((v) =>
            <button key={v} onClick={() => setView(v)} style={{ background: view === v ? 'var(--color-primary)' : 'transparent', color: view === v ? '#fff' : 'var(--color-text-muted)' }} className="p-[0.4rem_0.8rem] border-none rounded-[8px] cursor-pointer font-[700] text-[0.78rem] transition-[all_0.15s] flex items-center gap-[0.3rem]">
                                {v === 'month' ? <CalendarDays size={15} /> : <List size={15} />}
                                <span className="hidden sm:inline">{v === 'month' ? 'Mes' : 'Lista'}</span>
                            </button>
            )}
                    </div>

                    {/* Month nav */}
                    <div className="flex items-center gap-[0.3rem] bg-[var(--color-surface)] p-[3px] rounded-[10px] border-[1px_solid_var(--color-border)]">
                        <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={18} /></button>
                        <button onClick={goToday} style={{ ...navBtnStyle }} className="text-[0.78rem] font-[800] p-[0.4rem_0.8rem] white-space-[nowrap]">HOY</button>
                        <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={18} /></button>
                    </div>

                    {/* Add */}
                    <button
            onClick={() => {setNewEvent({ title: '', date: today.toISOString().split('T')[0], time: '09:00', type: 'Inspection', description: '' });setIsAdding(true);}} className="flex items-center gap-[0.5rem] p-[0.55rem_1rem] bg-[var(--color-primary)] text-[#fff] border-none rounded-[10px] font-[800] text-[0.82rem] cursor-pointer box-shadow-[0_4px_12px_rgba(59,130,246,0.35)] letter-spacing-[0.02em] white-space-[nowrap] flex-shrink-[0]">

            
                        <Plus size={17} /> <span className="hidden sm:inline">NUEVO EVENTO</span><span className="sm:hidden">+</span>
                    </button>
                </div>
            </div>

            {/* ── Category Filters ─────────────────────────────────────── */}
            <div className="hide-scrollbar flex gap-[0.5rem] overflow-x-[auto] pt-[0.3rem] pb-[0.5rem] mb-[1rem]">
                <button
          onClick={() => setActiveFilter(null)}
          style={{ background: !activeFilter ? 'var(--color-primary)' : 'var(--color-surface)', color: !activeFilter ? '#fff' : 'var(--color-text)' }} className="p-[0.4rem_0.8rem] rounded-[20px] border-[1px_solid_var(--color-border)] text-[0.75rem] font-[700] cursor-pointer white-space-[nowrap] transition-[all_0.2s] flex items-center gap-[0.3rem]">
          
                    <Filter size={12} /> Todos
                </button>
                {Object.entries(EVENT_TYPES).map(([k, v]: [string, any]) =>
        <button
          key={k}
          onClick={() => setActiveFilter(k)}
          style={{ border: `1px solid ${activeFilter === k ? v.color : 'var(--color-border)'}`, background: activeFilter === k ? v.bg : 'var(--color-surface)', color: activeFilter === k ? v.color : 'var(--color-text)' }} className="p-[0.4rem_0.8rem] rounded-[20px] text-[0.75rem] font-[700] cursor-pointer white-space-[nowrap] transition-[all_0.2s] flex items-center gap-[0.3rem]">
          
                        {v.icon} {v.label}
                    </button>
        )}
            </div>

            {/* ── Main layout ───────────────────────────────────────────── */}
            <div className="grid grid-template-columns-[1fr] gap-[1.25rem]">
                <div className="cal-main-grid grid gap-[1.25rem] items-start">

                    {/* ── Calendar / List panel ─────────────────────────── */}
                    <div className="card p-[0] overflow-[visible] border-[1px_solid_var(--color-border)] box-shadow-[0_10px_40px_-10px_rgba(0,0,0,0.05)] relative z-[10]">

                        {view === 'month' ?
            <>
                                {/* Day labels */}
                                <div className="grid grid-template-columns-[repeat(7,_1fr)] border-bottom-[1px_solid_var(--color-border)] bg-[var(--color-surface)] border-top-left-radius-[12px] border-top-right-radius-[12px]">
                                    {DAYS_SHORT.map((d, i) =>
                <div key={d} className="text-center p-[0.7rem_0.2rem] text-[0.68rem] font-[800] text-[var(--color-text-muted)] uppercase letter-spacing-[0.04em]">
                                            <span className="hidden sm:block">{d}</span>
                                            <span className="sm:hidden">{DAYS_MIN[i]}</span>
                                        </div>
                )}
                                </div>

                                {/* Cells */}
                                <div className="grid grid-template-columns-[repeat(7,_minmax(0,1fr))]">
                                    {/* Empty leading cells */}
                                    {Array.from({ length: startDay }).map((_, i) =>
                <div key={`e-${i}`} className="min-h-[clamp(60px,_12vw,_100px)] border-right-[1px_solid_var(--color-border)] border-bottom-[1px_solid_var(--color-border)] bg-[var(--color-background)] opacity-[0.4]" />
                )}

                                    {/* Day cells */}
                                    {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                  const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEvs = eventsByDate[dateStr] || [];
                  const isToday = today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
                  const isSelected = selectedDay === dateStr;
                  const col = (startDay + day - 1) % 7;
                  const isWeekend = col === 0 || col === 6;

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                      onMouseEnter={() => setHoveredDay(dateStr)}
                      onMouseLeave={() => setHoveredDay(null)}
                      style={{





                        cursor: dayEvs.length > 0 ? 'pointer' : 'default',
                        background: isSelected ? 'rgba(59,130,246,0.08)' : isToday ? 'rgba(59,130,246,0.05)' : isWeekend ? 'var(--color-background)' : 'transparent',


                        outline: isSelected ? '2px solid var(--color-primary)' : 'none'


                      }} className="min-h-[clamp(60px,_12vw,_100px)] border-right-[1px_solid_var(--color-border)] border-bottom-[1px_solid_var(--color-border)] p-[6px_4px] flex flex-col gap-[3px] transition-[all_0.15s_ease] box-sizing-[border-box] outline-offset-[-2px] relative">
                      
                                                {/* Tooltip Popover on Hover */}
                                                {hoveredDay === dateStr && dayEvs.length > 0 && !isSelected &&
                      <div className="absolute bottom-[100%] left-[50%] transform-[translateX(-50%)] mb-[10px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] rounded-[12px] p-[0.8rem] box-shadow-[0_10px_30px_-5px_rgba(0,0,0,0.2)] z-[50] min-width-[200px] pointer-events-[none] animation-[tooltipFade_0.2s_cubic-bezier(0.16,_1,_0.3,_1)]">





                        
                                                        <div className="text-[0.75rem] font-[800] text-[var(--color-primary)] mb-[0.5rem] border-bottom-[1px_solid_var(--color-border)] pb-[0.3rem]">
                                                            {day} {MONTHS[currentMonth]}
                                                        </div>
                                                        <div className="flex flex-col gap-[0.4rem]">
                                                            {dayEvs.map((ev, i) =>
                          <div key={i} className="flex items-center gap-[0.4rem] text-[0.75rem] font-[600]">
                                                                    <div style={{ background: EVENT_TYPES[ev.type]?.color }} className="w-[8px] h-[8px] rounded-[50%] flex-shrink-[0]" />
                                                                    <span className="overflow-[hidden] text-overflow-[ellipsis] white-space-[nowrap]">{ev.title}</span>
                                                                </div>
                          )}
                                                        </div>
                                                    </div>
                      }

                                                {/* Day number */}
                                                <span style={{
                        fontWeight: isToday ? 900 : 600,


                        background: isToday ? 'var(--color-primary)' : 'transparent',
                        color: isToday ? '#fff' : isWeekend ? 'var(--color-text-muted)' : 'var(--color-text)',

                        boxShadow: isToday ? '0 2px 8px rgba(59,130,246,0.4)' : 'none'
                      }} className="text-[0.75rem] w-[24px] h-[24px] rounded-[50%] flex items-center justify-center flex-shrink-[0] align-self-[flex-start]">
                                                    {day}
                                                </span>

                                                {/* Events on this day */}
                                                <div className="flex flex-col gap-[2px] overflow-[hidden] flex-[1]">
                                                    {dayEvs.slice(0, 3).map((ev, k) =>
                        <div key={k} style={{
                          background: EVENT_TYPES[ev.type]?.bg || '#64748b22',
                          color: EVENT_TYPES[ev.type]?.color || '#64748b',
                          border: `1px solid ${EVENT_TYPES[ev.type]?.color}33`
                        }} className="rounded-[4px] p-[1px_4px] flex items-center gap-[3px] min-width-[0]">
                                                            <div className="hidden sm:flex flex-shrink-[0]">{EVENT_TYPES[ev.type]?.icon}</div>
                                                            <span className="hidden sm:block text-[0.55rem] font-[800] overflow-[hidden] text-overflow-[ellipsis] white-space-[nowrap] flex-[1]">{ev.title}</span>
                                                            <span className="sm:hidden w-[6px] h-[6px] rounded-[50%] flex-shrink-[0] block" style={{ background: EVENT_TYPES[ev.type]?.color }} />
                                                        </div>
                        )}
                                                    {dayEvs.length > 3 && <span className="text-[0.5rem] text-[var(--color-text-muted)] font-[800] pl-[2px]">+{dayEvs.length - 3} más</span>}
                                                </div>
                                            </div>);

                })}
                                </div>
                            </> : (

            /* ── LIST VIEW ───────────────────────────────── */
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                {allEvents.length === 0 &&
              <div className="p-16 text-center text-slate-500 dark:text-slate-400">
                                        <CalendarIcon size={48} className="mx-auto mb-4 opacity-50" />
                                        <p className="font-bold text-lg m-0">No hay eventos agendados.</p>
                                        <p className="text-sm mt-2">Generá vencimientos en otros módulos o agregalos manualmente.</p>
                                    </div>
              }
                                {Object.entries(
                allEvents.reduce((acc: any, ev) => {if (!acc[ev.date]) acc[ev.date] = [];acc[ev.date].push(ev);return acc;}, {})
              ).sort(([a], [b]) => a.localeCompare(b)).map(([date, evs]: any) =>
              <div key={date}>
                                        <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between border-l-4 border-l-blue-500">
                                            <span className="text-sm font-black text-slate-700 dark:text-slate-200 capitalize">
                                                {new Date(date + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                            </span>
                                            {(() => {const d = diffDays(date);const u = urgencyBadge(d);return <span style={{ background: u.bg, color: u.color, border: `1px solid ${u.color}33` }} className="px-3 py-1 rounded-full text-[0.65rem] font-black uppercase tracking-wider shadow-sm">{u.label}</span>;})()}
                                        </div>
                                        {evs.map((ev: any, i: number) => (
                                            <div key={i} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                                <div style={{ background: EVENT_TYPES[ev.type]?.bg, color: EVENT_TYPES[ev.type]?.color, border: `1px solid ${EVENT_TYPES[ev.type]?.color}33` }} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm">
                                                    {EVENT_TYPES[ev.type]?.icon}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="font-bold text-slate-800 dark:text-slate-200 text-[0.95rem] flex items-center gap-2 mb-1">
                                                        {ev.title}
                                                        {ev.isAuto && <span title="Generado Automáticamente"><Info size={14} className="text-slate-400" /></span>}
                                                    </div>
                                                    <div className="text-[0.78rem] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                                                        <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md"><Clock size={12} /> {ev.time} hs</span> 
                                                        <span className="opacity-50">•</span> 
                                                        <span className="font-semibold">{EVENT_TYPES[ev.type]?.label}</span>
                                                        {ev.description && <><span className="opacity-50">•</span> <span className="truncate max-w-[200px]">{ev.description}</span></>}
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 sm:mt-0">
                                                    <button onClick={() => exportToGoogleCalendar(ev)} title="Añadir a Google Calendar" className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors flex items-center gap-2 text-xs font-bold shadow-sm">
                                                        <CalendarPlus size={16} /> <span className="hidden sm:inline">Google</span>
                                                    </button>
                                                    <button onClick={() => deleteEvent(ev)} title="Eliminar" className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center shadow-sm">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
              )}
                            </div>)
            }
                    </div>

                    {/* ── Sidebar ──────────────────────────────────────── */}
                    <div className="cal-sidebar flex flex-col gap-[1.25rem]">

                        {/* Selected day detail */}
                        {selectedDay && selectedEvents.length > 0 &&
            <div className="card p-[1.25rem] border-[2px_solid_var(--color-primary)] box-shadow-[0_10px_25px_-5px_rgba(59,130,246,0.15)]">
                                <div className="flex justify-space-between items-center mb-[1rem]">
                                    <h3 className="m-[0] text-[0.95rem] font-[900] text-[var(--color-primary)] capitalize">
                                        {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </h3>
                                    <button onClick={() => setSelectedDay(null)} onMouseOver={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--color-background)'} onMouseOut={(e) => (e.currentTarget as HTMLElement).style.background = 'none'} className="bg-[none] border-none cursor-pointer text-[var(--color-text-muted)] p-[2px] rounded-[50%] transition-[background_0.2s]"><X size={18} /></button>
                                </div>
                                <div className="flex flex-col gap-[0.85rem]">
                                    {selectedEvents.map((ev, i) =>
                <div key={i} style={{ border: `1px solid ${EVENT_TYPES[ev.type]?.color}33` }} className="flex items-start gap-[0.85rem] p-[1rem] bg-[var(--color-background)] rounded-[12px] relative">
                                            <div style={{ background: EVENT_TYPES[ev.type]?.bg, color: EVENT_TYPES[ev.type]?.color }} className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center flex-shrink-[0]">
                                                {EVENT_TYPES[ev.type]?.icon}
                                            </div>
                                            <div className="flex-[1] min-width-[0]">
                                                <div className="font-[800] text-[0.88rem] flex items-center gap-[0.3rem]">
                                                    {ev.title} {ev.isAuto && <Info size={12} color="var(--color-text-muted)" />}
                                                </div>
                                                <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-[4px] flex items-center gap-[0.4rem]">
                                                    <Clock size={12} /> {ev.time} hs
                                                </div>
                                                {ev.description && <div className="text-[0.75rem] text-[var(--color-text-muted)] mt-[6px] p-[6px] bg-[var(--color-surface)] rounded-[6px] border-[1px_solid_var(--color-border)]">{ev.description}</div>}
                                            </div>
                                            <div className="flex flex-col gap-[0.3rem]">
                                                <button onClick={() => exportToGoogleCalendar(ev)} title="Añadir a Google Calendar" className="bg-[none] border-none text-[var(--color-text)] cursor-pointer p-[4px] background-blend-mode-[multiply] rounded-[6px]"><CalendarPlus size={16} /></button>
                                                <button onClick={() => deleteEvent(ev)} title="Eliminar" className="bg-[none] border-none text-[#ef4444] cursor-pointer p-[4px] rounded-[6px]"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                )}
                                </div>
                            </div>
            }

                        {/* Upcoming */}
                        <div className="card p-[1.5rem] border-[1px_solid_var(--color-border)] box-shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                            <div className="flex items-center gap-[0.6rem] mb-[1.2rem]">
                                <div className="bg-[rgba(239,68,68,0.1)] p-[6px] rounded-[8px]"><Bell size={18} color="#ef4444" /></div>
                                <h3 className="m-[0] text-[1rem] font-[900]">Próximos Vencimientos</h3>
                            </div>
                            {upcoming.length === 0 ?
              <div className="text-center p-[2rem_0] opacity-[0.5]">
                                    <CheckCircle2 size={36} className="block m-[0_auto_0.8rem] text-[var(--color-primary)]" />
                                    <p className="text-[0.9rem] font-[700] m-[0]">Todo al día, excelente trabajo.</p>
                                </div> :

              <div className="flex flex-col gap-3">
                                    {upcoming.map((ev, i) => {
                  const d = diffDays(ev.date);
                  const u = urgencyBadge(d);
                  return (
                    <div key={i} style={{ border: `1px solid ${EVENT_TYPES[ev.type]?.color}22`, borderLeft: `4px solid ${EVENT_TYPES[ev.type]?.color}` }} className="flex items-center gap-[0.85rem] p-[0.85rem] bg-[var(--color-background)] rounded-[12px]">
                                                <div className="flex-[1] min-width-[0]">
                                                    <div className="text-[0.85rem] font-[800] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis] flex items-center gap-[0.3rem]">
                                                        {ev.title}
                                                    </div>
                                                    <div className="text-[0.72rem] text-[var(--color-text-muted)] flex items-center gap-[0.4rem] mt-[4px]">
                                                        <Clock size={11} /> {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} · {ev.time}
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-[6px] flex-shrink-[0]">
                                                    <span style={{ background: u.bg, color: u.color, border: `1px solid ${u.color}33` }} className="p-[0.2rem_0.6rem] rounded-[20px] text-[0.65rem] font-[900] letter-spacing-[0.03em]">{u.label}</span>
                                                    <button onClick={() => exportToGoogleCalendar(ev)} className="bg-[none] border-none text-[var(--color-text-muted)] cursor-pointer p-[2px]"><CalendarPlus size={14} /></button>
                                                </div>
                                            </div>);

                })}
                                </div>
              }
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Add Event Modal ───────────────────────────────────────── */}
            {isAdding &&
      <div onClick={() => setIsAdding(false)} className="fixed inset-[0] bg-[rgba(0,0,0,0.65)] backdrop-filter-[blur(8px)] z-[2000] flex items-center justify-center p-[1rem]">
                    <div className="card w-[100%] max-w-[480px] p-[2rem] rounded-[24px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] relative animation-[cmdIn_0.2s_cubic-bezier(0.16,1,0.3,1)] box-shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)]" onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => setIsAdding(false)} className="absolute top-[1.2rem] right-[1.2rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[50%] w-[32px] h-[32px] flex items-center justify-center text-[var(--color-text)] cursor-pointer"><X size={18} /></button>

                        <div className="flex items-center gap-[0.85rem] mb-[1.8rem]">
                            <div className="bg-[var(--color-primary)] rounded-[12px] p-[0.75rem] flex items-center justify-center box-shadow-[0_8px_24px_rgba(59,130,246,0.35)]">
                                <BellDot size={22} color="#fff" />
                            </div>
                            <div>
                                <h2 className="m-[0] text-[1.35rem] font-[900]">Nuevo Evento Manual</h2>
                                <p className="m-[0] text-[0.82rem] text-[var(--color-text-muted)]">Agrega un evento que no se haya sincronizado automáticamente.</p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-[1.25rem]">
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Título *</label>
                                <input type="text" value={newEvent.title} onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })} placeholder="Ej: Recarga de Matafuegos" className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                            </div>
                            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Fecha</label>
                                    <input type="date" value={newEvent.date} onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                </div>
                                <div>
                                    <label className="block mb-2 text-sm font-semibold text-slate-400">Hora de alerta</label>
                                    <input type="time" value={newEvent.time} onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Categoría</label>
                                <select value={newEvent.type} onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-700 bg-slate-900 text-slate-100 text-base focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors">
                                    {Object.entries(EVENT_TYPES).filter(([k]) => k !== 'SystemAuto').map(([k, v]: [string, any]) => <option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block mb-2 text-sm font-semibold text-slate-400">Descripción (opcional)</label>
                                <textarea value={newEvent.description} onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })} placeholder="Detalles adicionales..." style={{ ...inputStyle }} className="min-h-[80px] resize-[vertical]" />
                            </div>

                            <div className="flex gap-[1rem] mt-[0.5rem]">
                                <button onClick={() => setIsAdding(false)} className="flex-[1] p-[1rem] border-[1px_solid_var(--color-border)] bg-[var(--color-background)] rounded-[14px] font-[800] cursor-pointer text-[var(--color-text)] text-[0.95rem]">Cancelar</button>
                                <button onClick={addEvent} disabled={!newEvent.title.trim()} style={{ background: newEvent.title.trim() ? 'var(--color-primary)' : 'var(--color-border)', cursor: newEvent.title.trim() ? 'pointer' : 'not-allowed', boxShadow: newEvent.title.trim() ? '0 8px 24px rgba(59,130,246,0.35)' : 'none' }} className="flex-[1] p-[1rem] text-[#fff] border-none rounded-[14px] font-[900] text-[0.95rem] transition-[all_0.2s]">AGENDAR</button>
                            </div>
                        </div>
                    </div>
                </div>
      }

            <style>{`
                @media (max-width: 900px) {
                    .cal-main-grid { grid-template-columns: 1fr !important; }
                }
                @media (max-width: 600px) {
                    .cal-sidebar { order: -1; }
                }
                @keyframes cmdIn {
                    from { opacity:0; transform: translateY(-20px) scale(0.95); }
                    to   { opacity:1; transform: none; }
                }
                @keyframes tooltipFade {
                    from { opacity:0; transform: translate(-50%, 10px); }
                    to   { opacity:1; transform: translate(-50%, 0); }
                }
                .hide-scrollbar::-webkit-scrollbar { display: none; }
                .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>);

}

// ─── Styles ───────────────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
  padding: '0.45rem 0.65rem', background: 'transparent', border: 'none',
  borderRadius: '8px', cursor: 'pointer', color: 'var(--color-text)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'background 0.15s', fontSize: '0.82rem', fontWeight: 800
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.85rem', fontWeight: 800,
  color: 'var(--color-text)', marginBottom: '0.5rem'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1.1rem', borderRadius: '12px',
  border: '1px solid var(--color-border)', background: 'var(--color-background)',
  color: 'var(--color-text)', fontSize: '0.95rem', fontFamily: 'inherit',
  boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s'
};