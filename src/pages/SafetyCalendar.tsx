import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    Bell, Trash2, Clock, CheckCircle2,
    CalendarDays, Award, Construction, Scale, X, BellDot,
    ShieldAlert, AlertTriangle, List
} from 'lucide-react';
import {
    requestNotificationPermission,
    initializeSchedules,
    scheduleReminder,
    cancelReminder,
    isNotificationDenied
} from '../services/notifications';
import { getCountryNormativa } from '../data/legislationData';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const MONTHS = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
const DAYS_SHORT = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
const DAYS_MIN   = ["D","L","M","X","J","V","S"];

const EVENT_TYPES = {
    Inspection:   { color:'#3b82f6', bg:'rgba(59,130,246,0.12)',  label:'Inspección',       icon:<Construction size={14}/> },
    Training:     { color:'#10b981', bg:'rgba(16,185,129,0.12)',  label:'Capacitación',     icon:<Award size={14}/> },
    Legal:        { color:'#ef4444', bg:'rgba(239,68,68,0.12)',   label:'Vencimiento Legal',icon:<Scale size={14}/> },
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

// ─── Diff days helper ─────────────────────────────────────────────────────────
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
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear,  setCurrentYear]  = useState(today.getFullYear());
    const [events,       setEvents]       = useState<any[]>([]);
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
        setEvents(loaded);
        initializeSchedules(loaded);
    }, []);

    const saveEvents = (ev: any[]) => {
        setEvents(ev);
        localStorage.setItem('safety_calendar_events', JSON.stringify(ev));
    };

    const addEvent = () => {
        if (!newEvent.title.trim()) return;
        const id = `ev-${Date.now()}`;
        const item = { ...newEvent, id };
        const updated = [...events, item];
        saveEvents(updated);
        scheduleReminder(id, item.date, item.time, item.title);
        setIsAdding(false);
        setNewEvent({ title:'', date: today.toISOString().split('T')[0], time:'09:00', type:'Inspection', description:'' });
    };

    const deleteEvent = (ev: any) => {
        const id = ev.id || `${ev.date}-${ev.time}-${ev.title}`;
        cancelReminder(id);
        saveEvents(events.filter(e => e !== ev));
    };

    // Navigation helpers
    const prevMonth = () => { if (currentMonth===0){setCurrentMonth(11);setCurrentYear(y=>y-1);} else setCurrentMonth(m=>m-1); };
    const nextMonth = () => { if (currentMonth===11){setCurrentMonth(0); setCurrentYear(y=>y+1);} else setCurrentMonth(m=>m+1); };
    const goToday   = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

    // Events indexed by date
    const eventsByDate = useMemo(()=>{
        const map: Record<string,any[]> = {};
        events.forEach(e=>{ if(!map[e.date]) map[e.date]=[]; map[e.date].push(e); });
        return map;
    }, [events]);

    // Upcoming
    const upcoming = useMemo(()=>
        events
            .filter(e => new Date(e.date+'T12:00:00') >= new Date(today.toDateString()))
            .sort((a,b) => a.date.localeCompare(b.date))
            .slice(0, 6)
    , [events]);

    // Selected day events
    const selectedEvents = selectedDay ? (eventsByDate[selectedDay] || []) : [];

    // Build calendar cells
    const totalDays = new Date(currentYear, currentMonth+1, 0).getDate();
    const startDay  = new Date(currentYear, currentMonth, 1).getDay();

    // ──────────────────────────────────────────────────────────────────────────
    return (
        <div className="container" style={{ maxWidth:'1100px', paddingTop:'6rem', paddingBottom:'6rem' }}>

            {/* ── Notification banners ──────────────────────────────────── */}
            {permStatus === 'default' && (
                <div style={{ background:'var(--color-primary)', color:'#fff', padding:'0.85rem 1.2rem', borderRadius:'14px', marginBottom:'1.2rem', display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1rem', flexWrap:'wrap', boxShadow:'0 4px 16px rgba(59,130,246,0.35)' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', fontSize:'0.9rem', fontWeight:700 }}>
                        <Bell size={18}/> Activá las notificaciones para recibir alertas de vencimientos
                    </div>
                    <button onClick={async()=>{ await requestNotificationPermission(); setPermStatus(Notification.permission); }} style={{ background:'#fff', color:'var(--color-primary)', border:'none', padding:'0.5rem 1.1rem', borderRadius:'8px', fontWeight:800, cursor:'pointer', fontSize:'0.8rem', flexShrink:0 }}>ACTIVAR</button>
                </div>
            )}
            {isNotificationDenied() && (
                <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', color:'#ef4444', padding:'0.85rem 1.2rem', borderRadius:'14px', marginBottom:'1.2rem', display:'flex', alignItems:'center', gap:'0.7rem', fontSize:'0.85rem', fontWeight:600 }}>
                    <ShieldAlert size={18}/> Notificaciones bloqueadas — habilitálas en la configuración del navegador.
                </div>
            )}

            {/* ── Header ───────────────────────────────────────────────── */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem', flexWrap:'wrap', gap:'0.85rem' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.85rem' }}>
                    <div style={{ background:'var(--color-primary)', borderRadius:'12px', padding:'0.6rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 14px rgba(59,130,246,0.3)', flexShrink:0 }}>
                        <CalendarIcon size={22} color="#fff"/>
                    </div>
                    <div>
                        <h1 style={{ margin:0, fontSize:'clamp(1.2rem, 4vw, 1.6rem)', fontWeight:900, letterSpacing:'-0.02em', lineHeight:1.1 }}>
                            {MONTHS[currentMonth]} <span style={{ color:'var(--color-primary)' }}>{currentYear}</span>
                        </h1>
                        <p style={{ margin:0, fontSize:'0.77rem', color:'var(--color-text-muted)', fontWeight:600 }}>{events.length} evento{events.length!==1?'s':''} registrado{events.length!==1?'s':''}</p>
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

            {/* ── Main layout ───────────────────────────────────────────── */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:'1.25rem' }}>
                <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:'1.25rem', alignItems:'start' }} className="cal-main-grid">

                    {/* ── Calendar / List panel ─────────────────────────── */}
                    <div className="card" style={{ padding:'0', overflow:'hidden', border:'1px solid var(--color-border)' }}>

                        {view === 'month' ? (
                            <>
                                {/* Day labels */}
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, 1fr)', borderBottom:'1px solid var(--color-border)', background:'var(--color-surface)' }}>
                                    {DAYS_SHORT.map((d,i)=>(
                                        <div key={d} style={{ textAlign:'center', padding:'0.6rem 0.2rem', fontSize:'0.68rem', fontWeight:800, color:'var(--color-text-muted)', textTransform:'uppercase', letterSpacing:'0.04em' }}>
                                            <span className="hidden sm:block">{d}</span>
                                            <span className="sm:hidden">{DAYS_MIN[i]}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Cells */}
                                <div style={{ display:'grid', gridTemplateColumns:'repeat(7, minmax(0,1fr))' }}>
                                    {/* Empty leading cells */}
                                    {Array.from({length:startDay}).map((_,i)=>(
                                        <div key={`e-${i}`} style={{ minHeight:'clamp(52px, 10vw, 90px)', borderRight:'1px solid var(--color-border)', borderBottom:'1px solid var(--color-border)', background:'var(--color-background)', opacity:0.4 }}/>
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
                                                style={{
                                                    minHeight:'clamp(52px, 10vw, 90px)',
                                                    borderRight:'1px solid var(--color-border)',
                                                    borderBottom:'1px solid var(--color-border)',
                                                    padding:'4px 3px',
                                                    display:'flex', flexDirection:'column', gap:'2px',
                                                    cursor: dayEvs.length>0 ? 'pointer' : 'default',
                                                    background: isSelected ? 'rgba(59,130,246,0.08)' : isToday ? 'rgba(59,130,246,0.05)' : isWeekend ? 'var(--color-background)' : 'transparent',
                                                    transition:'background 0.15s',
                                                    boxSizing:'border-box',
                                                    outline: isSelected ? '2px solid var(--color-primary)' : 'none',
                                                    outlineOffset:'-2px',
                                                }}
                                                onMouseOver={e=>{ if(!isSelected && dayEvs.length>0)(e.currentTarget as HTMLElement).style.background='var(--color-surface)'; }}
                                                onMouseOut={e=>{ if(!isSelected)(e.currentTarget as HTMLElement).style.background= isToday?'rgba(59,130,246,0.05)': isWeekend?'var(--color-background)':'transparent'; }}
                                            >
                                                {/* Day number */}
                                                <span style={{
                                                    fontSize:'0.72rem', fontWeight: isToday?900:600,
                                                    width:'22px', height:'22px', borderRadius:'50%',
                                                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                                                    background: isToday ? 'var(--color-primary)' : 'transparent',
                                                    color: isToday ? '#fff' : isWeekend ? 'var(--color-text-muted)' : 'var(--color-text)',
                                                    alignSelf:'flex-start',
                                                }}>
                                                    {day}
                                                </span>

                                                {/* Events on this day */}
                                                <div style={{ display:'flex', flexDirection:'column', gap:'2px', overflow:'hidden', flex:1 }}>
                                                    {dayEvs.slice(0,3).map((ev,k)=>(
                                                        <div key={k} style={{ background:EVENT_TYPES[ev.type]?.color||'#64748b', borderRadius:'4px', padding:'1px 4px', display:'flex', alignItems:'center', gap:'2px', minWidth:0 }}>
                                                            <span className="hidden sm:block" style={{ fontSize:'0.52rem', color:'#fff', fontWeight:700, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>{ev.title}</span>
                                                            <span className="sm:hidden" style={{ width:'6px', height:'6px', borderRadius:'50%', background:'rgba(255,255,255,0.7)', flexShrink:0, display:'block' }}/>
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
                            <div>
                                {events.length===0 && (
                                    <div style={{ padding:'3rem', textAlign:'center', color:'var(--color-text-muted)', opacity:0.5 }}>
                                        <CalendarIcon size={40} style={{ display:'block', margin:'0 auto 1rem' }}/>
                                        <p style={{ fontWeight:600 }}>No hay eventos agendados.</p>
                                    </div>
                                )}
                                {Object.entries(
                                    events.reduce((acc:any,ev)=>{ if(!acc[ev.date])acc[ev.date]=[]; acc[ev.date].push(ev); return acc; },{})
                                ).sort(([a],[b])=>a.localeCompare(b)).map(([date,evs]:any)=>(
                                    <div key={date}>
                                        <div style={{ padding:'0.6rem 1.2rem', background:'var(--color-background)', borderBottom:'1px solid var(--color-border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                                            <span style={{ fontSize:'0.78rem', fontWeight:800, color:'var(--color-primary)', textTransform:'uppercase' }}>
                                                {new Date(date+'T12:00:00').toLocaleDateString('es-AR',{weekday:'short',day:'numeric',month:'long'})}
                                            </span>
                                            {(() => { const d=diffDays(date); const u=urgencyBadge(d); return <span style={{ background:u.bg, color:u.color, padding:'0.15rem 0.6rem', borderRadius:'20px', fontSize:'0.65rem', fontWeight:800 }}>{u.label}</span>; })()}
                                        </div>
                                        {evs.map((ev:any,i:number)=>(
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'0.85rem 1.2rem', borderBottom:'1px solid var(--color-border)', transition:'background 0.12s' }}
                                                onMouseOver={e=>(e.currentTarget as HTMLElement).style.background='var(--color-surface)'}
                                                onMouseOut={e=>(e.currentTarget as HTMLElement).style.background='transparent'}
                                            >
                                                <div style={{ width:'10px', height:'10px', borderRadius:'50%', background:EVENT_TYPES[ev.type]?.color, flexShrink:0 }}/>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{ev.title}</div>
                                                    <div style={{ fontSize:'0.73rem', color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'2px' }}>
                                                        <Clock size={11}/> {ev.time} hs · {EVENT_TYPES[ev.type]?.label}
                                                        {ev.description && <> · <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{ev.description}</span></>}
                                                    </div>
                                                </div>
                                                <button onClick={()=>deleteEvent(ev)} style={{ background:'none', border:'none', color:'var(--color-text-muted)', cursor:'pointer', padding:'4px', borderRadius:'6px', flexShrink:0 }}>
                                                    <Trash2 size={15}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ── Sidebar ──────────────────────────────────────── */}
                    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }} className="cal-sidebar">

                        {/* Selected day detail */}
                        {selectedDay && selectedEvents.length>0 && (
                            <div className="card" style={{ padding:'1.25rem', border:'2px solid var(--color-primary)' }}>
                                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'0.85rem' }}>
                                    <h3 style={{ margin:0, fontSize:'0.9rem', fontWeight:800, color:'var(--color-primary)' }}>
                                        {new Date(selectedDay+'T12:00:00').toLocaleDateString('es-AR',{weekday:'long',day:'numeric',month:'long'})}
                                    </h3>
                                    <button onClick={()=>setSelectedDay(null)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--color-text-muted)', padding:'2px' }}><X size={16}/></button>
                                </div>
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.75rem' }}>
                                    {selectedEvents.map((ev,i)=>(
                                        <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'0.75rem', padding:'0.75rem', background:'var(--color-background)', borderRadius:'10px', border:'1px solid var(--color-border)' }}>
                                            <div style={{ width:'32px', height:'32px', borderRadius:'8px', background:EVENT_TYPES[ev.type]?.bg, color:EVENT_TYPES[ev.type]?.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                                                {EVENT_TYPES[ev.type]?.icon}
                                            </div>
                                            <div style={{ flex:1, minWidth:0 }}>
                                                <div style={{ fontWeight:700, fontSize:'0.85rem' }}>{ev.title}</div>
                                                <div style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', marginTop:'2px', display:'flex', alignItems:'center', gap:'0.3rem' }}><Clock size={11}/> {ev.time} hs</div>
                                                {ev.description && <div style={{ fontSize:'0.72rem', color:'var(--color-text-muted)', marginTop:'3px' }}>{ev.description}</div>}
                                            </div>
                                            <button onClick={()=>deleteEvent(ev)} style={{ background:'none', border:'none', color:'var(--color-text-muted)', cursor:'pointer', padding:'2px', flexShrink:0 }}><Trash2 size={14}/></button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Upcoming */}
                        <div className="card" style={{ padding:'1.25rem', border:'1px solid var(--color-border)' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:'0.6rem', marginBottom:'1rem' }}>
                                <Bell size={18} color="#ef4444"/>
                                <h3 style={{ margin:0, fontSize:'0.95rem', fontWeight:800 }}>Próximos Eventos</h3>
                            </div>
                            {upcoming.length===0 ? (
                                <div style={{ textAlign:'center', padding:'1.5rem 0', opacity:0.45 }}>
                                    <CheckCircle2 size={32} style={{ display:'block', margin:'0 auto 0.6rem' }}/>
                                    <p style={{ fontSize:'0.82rem', fontWeight:600, margin:0 }}>Todo al día</p>
                                </div>
                            ) : (
                                <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
                                    {upcoming.map((ev,i)=>{
                                        const d = diffDays(ev.date);
                                        const u = urgencyBadge(d);
                                        return (
                                            <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.75rem', padding:'0.75rem', background:'var(--color-background)', borderRadius:'10px', border:`1px solid ${EVENT_TYPES[ev.type]?.color}22`, borderLeft:`3px solid ${EVENT_TYPES[ev.type]?.color}` }}>
                                                <div style={{ flex:1, minWidth:0 }}>
                                                    <div style={{ fontSize:'0.83rem', fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{ev.title}</div>
                                                    <div style={{ fontSize:'0.7rem', color:'var(--color-text-muted)', display:'flex', alignItems:'center', gap:'0.3rem', marginTop:'2px' }}>
                                                        <Clock size={10}/> {new Date(ev.date+'T12:00:00').toLocaleDateString('es-AR',{day:'numeric',month:'short'})} · {ev.time}
                                                    </div>
                                                </div>
                                                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', flexShrink:0 }}>
                                                    <span style={{ background:u.bg, color:u.color, padding:'0.12rem 0.5rem', borderRadius:'20px', fontSize:'0.62rem', fontWeight:800, border:`1px solid ${u.color}33` }}>{u.label}</span>
                                                    <button onClick={()=>deleteEvent(ev)} style={{ background:'none', border:'none', color:'var(--color-text-muted)', cursor:'pointer', padding:'2px' }}><Trash2 size={12}/></button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Legend */}
                        <div className="card" style={{ padding:'1.25rem', border:'1px solid var(--color-border)' }}>
                            <h3 style={{ margin:'0 0 0.9rem 0', fontSize:'0.85rem', fontWeight:800 }}>Categorías</h3>
                            <div style={{ display:'flex', flexDirection:'column', gap:'0.6rem' }}>
                                {Object.entries(EVENT_TYPES).map(([t,info])=>(
                                    <div key={t} style={{ display:'flex', alignItems:'center', gap:'0.75rem', fontSize:'0.82rem' }}>
                                        <div style={{ width:'28px', height:'28px', borderRadius:'8px', background:info.bg, color:info.color, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, border:`1px solid ${info.color}33` }}>
                                            {info.icon}
                                        </div>
                                        <span style={{ fontWeight:600 }}>{info.label}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Add Event Modal ───────────────────────────────────────── */}
            {isAdding && (
                <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(8px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }} onClick={()=>setIsAdding(false)}>
                    <div className="card" onClick={e=>e.stopPropagation()} style={{ width:'100%', maxWidth:'480px', padding:'2rem', borderRadius:'24px', background:'var(--color-surface)', border:'1px solid var(--color-border)', position:'relative', animation:'cmdIn 0.2s cubic-bezier(0.16,1,0.3,1)' }}>
                        <button onClick={()=>setIsAdding(false)} style={{ position:'absolute', top:'1.2rem', right:'1.2rem', background:'none', border:'none', color:'var(--color-text-muted)', cursor:'pointer' }}><X size={22}/></button>

                        <div style={{ display:'flex', alignItems:'center', gap:'0.7rem', marginBottom:'1.6rem' }}>
                            <div style={{ background:'var(--color-primary)', borderRadius:'10px', padding:'0.55rem', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 4px 12px rgba(59,130,246,0.3)' }}>
                                <BellDot size={20} color="#fff"/>
                            </div>
                            <div>
                                <h2 style={{ margin:0, fontSize:'1.25rem', fontWeight:900 }}>Nuevo Evento</h2>
                                <p style={{ margin:0, fontSize:'0.78rem', color:'var(--color-text-muted)' }}>Se programará una notificación automática</p>
                            </div>
                        </div>

                        <div style={{ display:'flex', flexDirection:'column', gap:'1.1rem' }}>
                            <div>
                                <label style={labelStyle}>Título *</label>
                                <input type="text" value={newEvent.title} onChange={e=>setNewEvent({...newEvent,title:e.target.value})} placeholder="Ej: Recarga de Matafuegos" style={inputStyle}/>
                            </div>
                            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.85rem' }}>
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
                                    {Object.entries(EVENT_TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={labelStyle}>Descripción (opcional)</label>
                                <textarea value={newEvent.description} onChange={e=>setNewEvent({...newEvent,description:e.target.value})} placeholder="Detalles adicionales..." style={{ ...inputStyle, minHeight:'72px', resize:'vertical' }}/>
                            </div>

                            <div style={{ display:'flex', gap:'0.85rem', marginTop:'0.4rem' }}>
                                <button onClick={()=>setIsAdding(false)} style={{ flex:1, padding:'0.9rem', border:'1px solid var(--color-border)', background:'transparent', borderRadius:'12px', fontWeight:700, cursor:'pointer', color:'var(--color-text)', fontSize:'0.9rem' }}>Cancelar</button>
                                <button onClick={addEvent} disabled={!newEvent.title.trim()} style={{ flex:1, padding:'0.9rem', background: newEvent.title.trim()?'var(--color-primary)':'var(--color-border)', color:'#fff', border:'none', borderRadius:'12px', fontWeight:800, cursor: newEvent.title.trim()?'pointer':'not-allowed', fontSize:'0.9rem', boxShadow: newEvent.title.trim()?'0 4px 12px rgba(59,130,246,0.35)':'none', transition:'all 0.2s' }}>GUARDAR</button>
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
                    from { opacity:0; transform: translateY(-12px) scale(0.97); }
                    to   { opacity:1; transform: none; }
                }
            `}</style>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const navBtnStyle: React.CSSProperties = {
    padding:'0.42rem 0.6rem', background:'transparent', border:'none',
    borderRadius:'8px', cursor:'pointer', color:'var(--color-text)',
    display:'flex', alignItems:'center', justifyContent:'center',
    transition:'background 0.15s', fontSize:'0.78rem', fontWeight:700,
};

const labelStyle: React.CSSProperties = {
    display:'block', fontSize:'0.82rem', fontWeight:700,
    color:'var(--color-text)', marginBottom:'0.5rem',
};

const inputStyle: React.CSSProperties = {
    width:'100%', padding:'0.8rem 1rem', borderRadius:'10px',
    border:'1px solid var(--color-border)', background:'var(--color-background)',
    color:'var(--color-text)', fontSize:'0.9rem', fontFamily:'inherit',
    boxSizing:'border-box',
};
