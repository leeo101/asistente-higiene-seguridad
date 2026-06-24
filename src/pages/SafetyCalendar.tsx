import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    Bell, Trash2, Clock, CheckCircle2,
    CalendarDays, Award, Construction, Scale, X, BellDot,
    ShieldAlert, AlertTriangle, List, CalendarPlus, Filter, Info
} from 'lucide-react';
import {
    requestNotificationPermission,
    initializeSchedules,
    scheduleReminder,
    cancelReminder,
    isNotificationDenied
} from '../services/notificationService';
import { getCountryNormativa } from '../data/legislationData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_MIN   = ["D","L","M","X","J","V","S"];

const EVENT_TYPES: any = {
    Inspection:   { color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  label:'Inspección',       icon:<Construction size={14}/> },
    Training:     { color:'#10b981', bg:'rgba(16,185,129,0.12)',  label:'Capacitación',     icon:<Award size={14}/> },
    Legal:        { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   label:'Vencimiento Legal',icon:<Scale size={14}/> },
    SystemAuto:   { color:'#f59e0b', bg:'rgba(245,158,11,0.12)',  label:'Vencimiento Automático', icon:<BellDot size={14}/> },
    Commemorative:{ color:'#8b5cf6', bg:'rgba(139,92,246,0.12)', label:'Efeméride HYS',    icon:<CalendarDays size={14}/> },
    Other:        { color:'#64748b', bg:'rgba(100,116,139,0.12)', label:'Otro',             icon:<CalendarIcon size={14}/> },
};

function getCountryEvents(country: string, year: number) {
    const base = [
        { title:'Día Mundial Seg. y Salud en el Trabajo', date:`${year}-04-28`, time:'09:00', type:'Commemorative', description:'OIT' },
    ];
    const extra: Record<string,any[]> = {
        argentina: [
            { title:'Día de la HyS en el Trabajo (Arg)', date:`${year}-04-21`, time:'09:00', type:'Commemorative', description:'Ley 19.587' },
            { title:'Presentación Anual R.G.R.L.',       date:`${year}-03-31`, time:'10:00', type:'Legal',         description:'Resolución SRT 463/09' },
            { title:'Relevamiento de Agentes de Riesgo', date:`${year}-04-15`, time:'10:00', type:'Legal',         description:'Res. 81/19' },
        ],
        chile: [
            { title:'Día del Prevencionista de Riesgos', date:`${year}-03-07`, time:'09:00', type:'Commemorative', description:'Reconocimiento Nacional' },
        ],
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
    } catch(e) {
        console.error("Failed to sync auto events", e);
    }
    
    return auto;
}

// Diff days helper
function diffDays(dateStr: string): number {
    const ev = new Date(dateStr + 'T12:00:00');
    const now = new Date(); now.setHours(0,0,0,0);
    return Math.round((ev.getTime() - now.getTime()) / 86400000);
}

function urgencyBadge(days: number) {
    if (days < 0)  return { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   label:'VENCIDO' };
    if (days === 0)return { color:'#ef4444', bg:'rgba(239,68,68,0.1)',   label:'HOY' };
    if (days <= 3) return { color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  label:`${days}d` };
    if (days <= 7) return { color:'#eab308', bg:'rgba(234,179,8,0.1)',   label:`${days}d` };
    return               { color:'#10b981', bg:'rgba(16,185,129,0.1)',  label:`${days}d` };
}

export default function SafetyCalendar(): React.ReactElement | null {
    useDocumentTitle('Calendario HYS');
    const navigate = useNavigate();
    const { syncCollection } = useSync();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
    
    const [manualEvents, setManualEvents] = useState<any[]>([]);
    const [autoEvents,   setAutoEvents]   = useState<any[]>([]);
    const [activeFilter, setActiveFilter] = useState<string|null>(null);
    const [hoveredDay,   setHoveredDay]   = useState<string|null>(null);
    
    const [isAdding,     setIsAdding]     = useState(false);
    const [selectedDay,  setSelectedDay]  = useState<string|null>(null);
    const [view,         setView]         = useState<'month'|'list'>('month');
    const [permStatus,   setPermStatus]   = useState(
        typeof Notification !== 'undefined' ? Notification.permission : 'default'
    );
    const [newEvent, setNewEvent] = useState({
        title:'', date: today.toISOString().split('T')[0], time:'09:00', type:'Inspection', description:''
    });

    const savedData  = localStorage.getItem('personalData');
    const userCountry = savedData ? (JSON.parse(savedData).country || 'argentina') : 'argentina';

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
        setNewEvent({ title:'', date: today.toISOString().split('T')[0], time:'09:00', type:'Inspection', description:'' });
    };

    const deleteEvent = (ev: any) => {
        if (ev.isAuto) {
            alert('Este es un evento generado automáticamente. Para borrarlo o modificarlo, ve al módulo correspondiente.');
            return;
        }
        const id = ev.id || `${ev.date}-${ev.time}-${ev.title}`;
        cancelReminder(id);
        saveManualEvents(manualEvents.filter(e => e !== ev));
    };

    const exportToGoogleCalendar = (ev: any) => {
        const start = new Date(ev.date + 'T' + ev.time).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const end = new Date(new Date(ev.date + 'T' + ev.time).getTime() + 60*60*1000).toISOString().replace(/-|:|\.\d\d\d/g, "");
        const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${start}/${end}&details=${encodeURIComponent(ev.description || '')}`;
        window.open(url, '_blank');
    };

    // Navigation helpers
    const prevMonth = () => { if (currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1);} else setCurrentMonth(m=>m-1); };
    const nextMonth = () => { if (currentMonth===11){setCurrentMonth(0); setCurrentYear(y=>y+1);} else setCurrentMonth(m=>m+1); };
    const goToday   = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

    // Combine events and apply filter
    const allEvents = useMemo(() => {
        const combined = [...manualEvents, ...autoEvents];
        if (activeFilter) return combined.filter(e => e.type === activeFilter);
        return combined;
    }, [manualEvents, autoEvents, activeFilter]);

    // Events indexed by date
    const eventsByDate = useMemo(()=>{
        const map: Record<string,any[]> = {};
        allEvents.forEach(e=>{ if(!map[e.date]) map[e.date]=[]; map[e.date].push(e); });
        return map;
    }, [allEvents]);

    // Upcoming
    const upcoming = useMemo(()=>
        allEvents
            .filter(e => new Date(e.date+'T12:00:00') >= new Date(today.toDateString()))
            .sort((a,b) => a.date.localeCompare(b.date))
            .slice(0, 6)
    , [allEvents]);

    // Selected day events
    const selectedEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

    // Build calendar cells
    const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();
    const startDay  = new Date(currentYear, currentMonth, 1).getDay();

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="container" style={{ maxWidth:'1100px', paddingTop:'6rem', paddingBottom:'6rem' }}>

{/* Banners removed as per user request */}

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem', flexWrap:'wrap', gap:'0.85rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                    <div style={{ background:'var(--color-primary)', borderRadius:'12px', padding:'0.6rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(59,130,246,0.3)', flexShrink:0 }}>
                        <CalendarIcon size={22} color="#fff"/>
                    </div>
                    <div>
                        <h1 style={{ margin:0, fontSize:'clamp(1.2rem, 4vw, 1.6rem)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1 }}>
                            {MONTHS[currentMonth]} <span style={{ color:'var(--color-primary)' }}>{currentYear}</span>
                        </h1>
                        <p style={{ margin:0, fontSize:'0.77rem', color:'var(--color-text-muted)', fontWeight:600 }}>{allEvents.length} evento{allEvents.length!==1?'s':''} registrado{allEvents.length!==1?'s':''}</p>
                    </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', flexWrap:'wrap' }}>
                    {/* View switcher */}
                    <div style={{ display:'flex', background:'var(--color-surface)', borderRadius:'10px', padding:'3px', border:'1px solid var(--color-border)' }}>
                        {(['month','list'] as const).map(v=>(
                            <button key={v} onClick={()=>setView(v)} style={{ padding:'0.4rem 0.8rem', border:'none', borderRadius:'8px', cursor:'pointer', fontWeight:700, fontSize:'0.78rem', background: view===v?'var(--color-primary)':'transparent', color: view===v?'#fff':'var(--color-text-muted)', transition:'all 0.15s', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                                {v==='month'?<CalendarDays size={15}/>:<List size={15}/>}
                                <span className="hidden sm:inline">{v==='month'?'Mes':'Lista'}</span>
                            </button>
                        ))}
                    </div>

                    {/* Month nav */}
                    <div style={{ display:'flex', alignItems:'center', gap:'0.3rem', background:'var(--color-surface)', padding:'3px', borderRadius:'10px', border:'1px solid var(--color-border)' }}>
                        <button onClick={prevMonth} style={navBtnStyle}><ChevronLeft size={18}/></button>
                        <button onClick={goToday}   style={{ ...navBtnStyle, fontSize:'0.78rem', fontWeight:800, padding:'0.4rem 0.8rem', whiteSpace:'nowrap' }}>HOY</button>
                        <button onClick={nextMonth} style={navBtnStyle}><ChevronRight size={18}/></button>
                    </div>

                    {/* Add */}
                    <button
                        onClick={()=>{ setNewEvent({title:'',date:today.toISOString().split('T')[0],time:'09:00',type:'Inspection',description:''}); setIsAdding(true); }}
                        style={{ display:'flex', alignItems:'center', gap:'0.5rem', padding:'0.55rem 1rem', background:'var(--color-primary)', color:'#fff', border:'none', borderRadius:'10px', fontWeight:800, fontSize:'0.82rem', cursor:'pointer', boxShadow:'0 4px 12px rgba(59,130,246,0.35)', letterSpacing:'0.02em', whiteSpace:'nowrap', flexShrink:0 }}
                    >
                        <Plus size={17}/> <span className="hidden sm:inline">NUEVO EVENTO</span><span className="sm:hidden">+</span>
                    </button>
                </div>
            </div>

            {/* ── Category Filters ─────────────────────────────────────── */}
            <div style={{ display:'flex', gap:'0.5rem', overflowX:'auto', paddingTop:'0.3rem', paddingBottom:'0.5rem', marginBottom:'1rem' }} className="hide-scrollbar">
                <button 
                    onClick={()=>setActiveFilter(null)} 
                    style={{ padding:'0.4rem 0.8rem', borderRadius:'20px', border:'1px solid var(--color-border)', background: !activeFilter ? 'var(--color-primary)' : 'var(--color-surface)', color: !activeFilter ? '#fff' : 'var(--color-text)', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'0.3rem' }}
                >
                    <Filter size={12}/> Todos
                </button>
                {Object.entries(EVENT_TYPES).map(([k,v]: [string, any]) => (
                    <button 
                        key={k}
                        onClick={()=>setActiveFilter(k)} 
                        style={{ padding:'0.4rem 0.8rem', borderRadius:'20px', border:`1px solid ${activeFilter===k ? v.color : 'var(--color-border)'}`, background: activeFilter===k ? v.bg : 'var(--color-surface)', color: activeFilter===k ? v.color : 'var(--color-text)', fontSize:'0.75rem', fontWeight:700, cursor:'pointer', whiteSpace:'nowrap', transition:'all 0.2s', display:'flex', alignItems:'center', gap:'0.3rem' }}
                    >
                        {v.icon} {v.label}
                    </button>
                ))}
            </div>

            {/* ── Main layout ───────────────────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.25rem' }}>
                <div style={{ display:'grid', gap:'1.25rem', alignItems:'start' }} className="cal-main-grid">

                    {/* ── Calendar / List panel ─────────────────────────── */}
                    <div className="card" style={{ padding:'0', overflow:'visible', border:'1px solid var(--color-border)', boxShadow:'0 10px 40px -10px rgba(0,0,0,0.05)', position:'relative', zIndex:10 }}>

                        {view === 'month' ? (
                            <>
                                {/* Day labels */}
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)', borderTopLeftRadius:'12px', borderTopRightRadius:'12px' }}>
                                    {DAYS_SHORT.map((d,i)=>(
                                        <div key={d} style={{ textAlign:'center', padding:'0.7rem 0.2rem', fontSize:'0.68rem', fontWeight:800, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                                            <span className="hidden sm:block">{d}</span>
                                            <span className="sm:hidden">{DAYS_MIN[i]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Cells */}
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, minmax(0,1fr))' }}>
                                    {/* Empty leading cells */}
                                    {Array.from({length:startDay}).map((_,i)=>(
                                        <div key={`e-${i}`} style={{ minHeight:'clamp(60px, 12vw, 100px)', borderRight:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', background:'var(--color-background)', opacity:0.4 }}/>
                                    ))}

                                    {/* Day cells */}
                                    {Array.from({length:totalDays}, (_,i)=>i+1).map(day=>{
                                        const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                                        const dayEvs  = eventsByDate[dateStr] || [];
                                        const isToday = today.getDate()===day && today.getMonth()===currentMonth && today.getFullYear()===currentYear;
                                        const isSelected = selectedDay===dateStr;
                                        const col = (startDay + day - 1) % 7;
                                        const isWeekend = col===0 || col===6;

                                        return (
                                            <div
                                                key={day}
                                                onClick={()=>setSelectedDay(isSelected ? null : dateStr)}
                                                onMouseEnter={()=>setHoveredDay(dateStr)}
                                                onMouseLeave={()=>setHoveredDay(null)}
                                                style={{
                                                    minHeight:'clamp(60px, 12vw, 100px)',
                                                    borderRight:'1px solid var(--color-border)',
                                                    borderBottom:'1px solid var(--color-border)',
                                                    padding:'6px 4px',
                                                    display:'flex', flexDirection:'column', gap:'3px',
                                                    cursor: dayEvs.length>0 ? 'pointer' : 'default',
                                                    background: isSelected ? 'rgba(59,130,246,0.08)' : isToday ? 'rgba(59,130,246,0.05)' : isWeekend ? 'var(--color-background)' : 'transparent',
                                                    transition:'all 0.15s ease',
                                                    boxSizing:'border-box',
                                                    outline: isSelected ? '2px solid var(--color-primary)' : 'none',
                                                    outlineOffset:'-2px',
                                                    position:'relative'
                                                }}
                                            >
                                                {/* Tooltip Popover on Hover */}
                                                {hoveredDay === dateStr && dayEvs.length > 0 && !isSelected && (
                                                    <div style={{
                                                        position:'absolute', bottom:'100%', left:'50%', transform:'translateX(-50%)',
                                                        marginBottom:'10px', background:'var(--color-surface)', border:'1px solid var(--color-border)',
                                                        borderRadius:'12px', padding:'0.8rem', boxShadow:'0 10px 30px -5px rgba(0,0,0,0.2)',
                                                        zIndex: 50, minWidth:'200px', pointerEvents:'none',
                                                        animation: 'tooltipFade 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                                                    }}>
                                                        <div style={{ fontSize:'0.75rem', fontWeight:800, color:'var(--color-primary)', marginBottom:'0.5rem', borderBottom:'1px solid var(--color-border)', paddingBottom:'0.3rem' }}>
                                                            {day} {MONTHS[currentMonth]}
                                                        </div>
                                                        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
                                                            {dayEvs.map((ev, i) => (
                                                                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.4rem', fontSize:'0.75rem', fontWeight:600 }}>
                                                                    <div style={{ width:'8px', height:'8px', borderRadius:'50%', background:EVENT_TYPES[ev.type]?.color, flexShrink:0 }}/>
                                                                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.title}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Day number */}
                                                <span style={{
                                                    fontSize:'0.75rem', fontWeight: isToday?900:600,
                                                    width:'24px', height:'24px', borderRadius:'50%',
                                                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                                    background: isToday ? 'var(--color-primary)' : 'transparent',
                                                    color: isToday ? '#fff' : isWeekend ? 'var(--color-text-muted)' : 'var(--color-text)',
                                                    alignSelf:'flex-start',
                                                    boxShadow: isToday ? '0 2px 8px rgba(59,130,246,0.4)' : 'none'
                                                }}>
                                                    {day}
                                                </span>

                                                {/* Events on this day */}
                                                <div style={{ display:'flex', flexDirection:'column', gap:'2px', overflow:'hidden', flex:1 }}>
                                                    {dayEvs.slice(0,3).map((ev,k)=>(
                                                        <div key={k} style={{ 
                                                            background:EVENT_TYPES[ev.type]?.bg||'#64748b22', 
                                                            color:EVENT_TYPES[ev.type]?.color||'#64748b',
                                                            border:`1px solid ${EVENT_TYPES[ev.type]?.color}33`,
                                                            borderRadius:'4px', padding:'1px 4px', display:'flex', alignItems:'center', gap:'3px', minWidth:0 
                                                        }}>
                                                            <div className="hidden sm:flex" style={{ flexShrink:0 }}>{EVENT_TYPES[ev.type]?.icon}</div>
                                                            <span className="hidden sm:block" style={{ fontSize:'0.55rem', fontWeight:800, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</span>
                                                            <span className="sm:hidden" style={{ width:'6px', height:'6px', borderRadius:'50%', background:EVENT_TYPES[ev.type]?.color, flexShrink:0, display:'block' }}/>
                                                        </div>
                                                    ))}
                                                    {dayEvs.length>3 && <span style={{ fontSize:'0.5rem', color:'var(--color-text-muted)', fontWeight:800, paddingLeft:'2px' }}>+{dayEvs.length-3} más</span>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            /* ── LIST VIEW ───────────────────────────────── */
                            <div style={{ background:'var(--color-surface)', borderRadius:'12px' }}>
                                {allEvents.length===0 && (
                                    <div style={{ padding:'4rem 2rem', textAlign:'center', color:'var(--color-text-muted)', opacity:0.6 }}>
                                        <CalendarIcon size={48} style={{ display:'block', margin:'0 auto 1rem', opacity:0.5 }}/>
                                        <p style={{ fontWeight:700, fontSize:'1.1rem' }}>No hay eventos agendados.</p>
                                        <p style={{ fontSize:'0.85rem' }}>Generá vencimientos en otros módulos o agregalos manualmente.</p>
                                    </div>
                                )}
                                {Object.entries(
                                    allEvents.reduce((acc:any,ev)=>{ if(!acc[ev.date])acc[ev.date]=[]; acc[ev.date].push(ev); return acc; },{})
                                ).sort(([a],[b])=>a.localeCompare(b)).map(([date,evs]:any)=>(
                                    <div key={date}>
                                        <div style={{ padding:'0.7rem 1.2rem', background:'var(--color-background)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between', borderLeft:'3px solid var(--color-primary)' }}>
                                            <span style={{ fontSize:'0.85rem', fontWeight:800, color:'var(--color-primary)', textTransform:'capitalize' }}>
                                                {new Date(date+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                                            </span>
                                            {(() => { const d=diffDays(date); const u=urgencyBadge(d); return <span style={{ background:u.bg, color:u.color, padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.65rem', fontWeight:800, border:`1px solid ${u.color}33` }}>{u.label}</span>; })()}
                                        </div>
                                        {evs.map((ev:any,i:number)=>(
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'1rem', padding:'1rem 1.2rem', borderBottom:'1px solid var(--color-border)', transition:'background 0.12s' }}
                                                onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='var(--color-background)'}
                                                onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                                            >
                                                <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:EVENT_TYPES[ev.type]?.bg, color:EVENT_TYPES[ev.type]?.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${EVENT_TYPES[ev.type]?.color}33` }}>
                                                    {EVENT_TYPES[ev.type]?.icon}
                                                </div>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontWeight:800, fontSize:'0.95rem', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                                                        {ev.title}
                                                        {ev.isAuto && <span title="Generado Automáticamente"><Info size={12} color="#94a3b8"/></span>}
                                                    </div>
                                                    <div style={{ fontSize:'0.78rem', color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:'0.5rem', marginTop:'4px' }}>
                                                        <Clock size={12}/> {ev.time} hs <span style={{opacity:0.5}}>|</span> {EVENT_TYPES[ev.type]?.label}
                                                        {ev.description && <><span style={{opacity:0.5}}>|</span> <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.description}</span></>}
                                                    </div>
                                                </div>
                                                <div style={{ display:'flex', alignItems:'center', gap:'0.4rem' }}>
                                                    <button onClick={()=>exportToGoogleCalendar(ev)} title="Añadir a Google Calendar" style={{ background:'none', border:'1px solid var(--color-border)', color:'var(--color-text)', cursor:'pointer', padding:'6px', borderRadius:'8px', display:'flex', alignItems:'center', gap:'0.3rem', fontSize:'0.7rem', fontWeight:700 }}>
                                                        <CalendarPlus size={14}/> <span className="hidden sm:inline">Google</span>
                                                    </button>
                                                    <button onClick={()=>deleteEvent(ev)} title="Eliminar" style={{ background:'none', border:'1px solid var(--color-border)', color:'#ef4444', cursor:'pointer', padding:'6px', borderRadius:'8px', display:'flex', alignItems:'center' }}>
                                                        <Trash2 size={14}/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ──────────────────────────────────────── */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }} className="cal-sidebar">

                        {/* Selected day detail */}
                        {selectedDay && selectedEvents.length>0 && (
                            <div className="card" style={{ padding:'1.25rem', border:'2px solid var(--color-primary)', boxShadow:'0 10px 25px -5px rgba(59,130,246,0.15)' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
                                    <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:900, color:'var(--color-primary)', textTransform:'capitalize' }}>
                                        {new Date(selectedDay+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                                    </h3>
                                    <button onClick={()=>setSelectedDay(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', padding:'2px', borderRadius:'50%', transition:'background 0.2s' }} onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='var(--color-background)'} onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='none'}><X size={18}/></button>
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.85rem' }}>
                                    {selectedEvents.map((ev,i)=>(
                                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.85rem', padding:'1rem', background:'var(--color-background)', borderRadius:'12px', border:`1px solid ${EVENT_TYPES[ev.type]?.color}33`, position:'relative' }}>
                                            <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:EVENT_TYPES[ev.type]?.bg, color:EVENT_TYPES[ev.type]?.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                {EVENT_TYPES[ev.type]?.icon}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontWeight:800, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                                                    {ev.title} {ev.isAuto && <Info size={12} color="var(--color-text-muted)"/>}
                                                </div>
                                                <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:'4px', display:'flex', alignItems:'center', gap:'0.4rem' }}>
                                                    <Clock size={12}/> {ev.time} hs
                                                </div>
                                                {ev.description && <div style={{ fontSize:'0.75rem', color:'var(--color-text-muted)', marginTop:'6px', padding:'6px', background:'var(--color-surface)', borderRadius:'6px', border:'1px solid var(--color-border)' }}>{ev.description}</div>}
                                            </div>
                                            <div style={{ display:'flex', flexDirection:'column', gap:'0.3rem' }}>
                                                <button onClick={()=>exportToGoogleCalendar(ev)} title="Añadir a Google Calendar" style={{ background:'none', border:'none', color:'var(--color-text)', cursor:'pointer', padding:'4px', backgroundBlendMode:'multiply', borderRadius:'6px' }}><CalendarPlus size={16}/></button>
                                                <button onClick={()=>deleteEvent(ev)} title="Eliminar" style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', padding:'4px', borderRadius:'6px' }}><Trash2 size={16}/></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        <div className="card" style={{ padding:'1.5rem', border:'1px solid var(--color-border)', boxShadow:'0 4px 15px rgba(0,0,0,0.03)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1.2rem' }}>
                                <div style={{ background:'rgba(239,68,68,0.1)', padding:'6px', borderRadius:'8px' }}><Bell size={18} color="#ef4444"/></div>
                                <h3 style={{ margin:0, fontSize:'1rem', fontWeight:900 }}>Próximos Vencimientos</h3>
                            </div>
                            {upcoming.length===0 ? (
                                <div style={{ textAlign:'center', padding:'2rem 0', opacity:0.5 }}>
                                    <CheckCircle2 size={36} style={{ display:'block', margin:'0 auto 0.8rem', color:'var(--color-primary)' }}/>
                                    <p style={{ fontSize:'0.9rem', fontWeight:700, margin:0 }}>Todo al día, excelente trabajo.</p>
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                                    {upcoming.map((ev,i)=>{
                                        const d = diffDays(ev.date);
                                        const u = urgencyBadge(d);
                                        return (
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.85rem', background:'var(--color-background)', borderRadius:'12px', border:`1px solid ${EVENT_TYPES[ev.type]?.color}22`, borderLeft:`4px solid ${EVENT_TYPES[ev.type]?.color}` }}>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:'0.85rem', fontWeight:800, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', display:'flex', alignItems:'center', gap:'0.3rem' }}>
                                                        {ev.title}
                                                    </div>
                                                    <div style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'4px' }}>
                                                        <Clock size={11}/> {new Date(ev.date+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'})} · {ev.time}
                                                    </div>
                                                </div>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'6px', flexShrink:0 }}>
                                                    <span style={{ background:u.bg, color:u.color, padding:'0.2rem 0.6rem', borderRadius:'20px', fontSize:'0.65rem', fontWeight:900, border:`1px solid ${u.color}33`, letterSpacing:'0.03em' }}>{u.label}</span>
                                                    <button onClick={()=>exportToGoogleCalendar(ev)} style={{ background:'none', border:'none', color:'var(--color-text-muted)', cursor:'pointer', padding:'2px' }}><CalendarPlus size={14}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Add Event Modal ───────────────────────────────────────── */}
            {isAdding && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={()=>setIsAdding(false)}>
                    <div className="card" onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:'480px', padding:'2rem', borderRadius:'24px', background:'var(--color-surface)', border:'1px solid var(--color-border)', position:'relative', animation:'cmdIn 0.2s cubic-bezier(0.16,1,0.3,1)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' }}>
                        <button onClick={()=>setIsAdding(false)} style={{ position:'absolute', top:'1.2rem', right:'1.2rem', background:'var(--color-background)', border:'1px solid var(--color-border)', borderRadius:'50%', width:'32px', height:'32px', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--color-text)', cursor:'pointer' }}><X size={18}/></button>

                        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', marginBottom:'1.8rem' }}>
                            <div style={{ background:'var(--color-primary)', borderRadius:'12px', padding:'0.75rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(59,130,246,0.35)' }}>
                                <BellDot size={22} color="#fff"/>
                            </div>
                            <div>
                                <h2 style={{ margin:0, fontSize:'1.35rem', fontWeight:900 }}>Nuevo Evento Manual</h2>
                                <p style={{ margin:0, fontSize:'0.82rem', color:'var(--color-text-muted)' }}>Agrega un evento que no se haya sincronizado automáticamente.</p>
                            </div>
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:'1.25rem' }}>
                            <div>
                                <label style={labelStyle}>Título *</label>
                                <input type="text" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="Ej: Recarga de Matafuegos" style={inputStyle}/>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
                                <div>
                                    <label style={labelStyle}>Fecha</label>
                                    <input type="date" value={newEvent.date} onChange={e=>setNewEvent({...newEvent,date:e.target.value})} style={inputStyle}/>
                                </div>
                                <div>
                                    <label style={labelStyle}>Hora de alerta</label>
                                    <input type="time" value={newEvent.time} onChange={e=>setNewEvent({...newEvent,time:e.target.value})} style={inputStyle}/>
                                </div>
                            </div>
                            <div>
                                <label style={labelStyle}>Categoría</label>
                                <select value={newEvent.type} onChange={e=>setNewEvent({...newEvent,type:e.target.value})} style={inputStyle}>
                                    {Object.entries(EVENT_TYPES).filter(([k])=>k!=='SystemAuto').map(([k,v]: [string, any])=><option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Descripción (opcional)</label>
                                <textarea value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} placeholder="Detalles adicionales..." style={{ ...inputStyle, minHeight:'80px', resize:'vertical' }}/>
                            </div>

                            <div style={{ display:'flex', gap:'1rem', marginTop:'0.5rem' }}>
                                <button onClick={()=>setIsAdding(false)} style={{ flex:1, padding:'1rem', border:'1px solid var(--color-border)', background:'var(--color-background)', borderRadius:'14px', fontWeight:800, cursor:'pointer', color:'var(--color-text)', fontSize:'0.95rem' }}>Cancelar</button>
                                <button onClick={addEvent} disabled={!newEvent.title.trim()} style={{ flex:1, padding:'1rem', background: newEvent.title.trim()?'var(--color-primary)':'var(--color-border)', color:'#fff', border:'none', borderRadius:'14px', fontWeight:900, cursor: newEvent.title.trim()?'pointer':'not-allowed', fontSize:'0.95rem', boxShadow: newEvent.title.trim()?'0 8px 24px rgba(59,130,246,0.35)':'none', transition:'all 0.2s' }}>AGENDAR</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
    padding:'0.45rem 0.65rem', background:'transparent', border:'none',
    borderRadius:'8px', cursor:'pointer', color:'var(--color-text)',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background 0.15s', fontSize:'0.82rem', fontWeight:800,
};

const labelStyle: React.CSSProperties = {
    display:'block', fontSize:'0.85rem', fontWeight:800,
    color:'var(--color-text)', marginBottom:'0.5rem',
};

const inputStyle: React.CSSProperties = {
    width:'100%', padding:'0.85rem 1.1rem', borderRadius:'12px',
    border:'1px solid var(--color-border)', background:'var(--color-background)',
    color:'var(--color-text)', fontSize:'0.95rem', fontFamily:'inherit',
    boxSizing:'border-box', outline:'none', transition:'border-color 0.2s',
};
