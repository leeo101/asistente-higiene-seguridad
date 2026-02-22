import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon,
    AlertTriangle, Bell, Trash2, Clock, CheckCircle2,
    CalendarDays, Award, Construction, Scale, X, BellDot
} from 'lucide-react';

export default function CalendarPage() {
    const navigate = useNavigate();
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [events, setEvents] = useState([]);
    const [isAddingEvent, setIsAddingEvent] = useState(false);
    const [lastNotified, setLastNotified] = useState({}); // To avoid duplicate notifications in the same minute
    const [newEvent, setNewEvent] = useState({
        title: '',
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        type: 'Inspection',
        description: ''
    });

    const eventTypes = {
        'Inspection': { color: '#3b82f6', label: 'Inspección', icon: <Construction size={14} /> },
        'Training': { color: '#10b981', label: 'Capacitación', icon: <Award size={14} /> },
        'Legal': { color: '#ef4444', label: 'Vencimiento Legal', icon: <Scale size={14} /> },
        'Commemorative': { color: '#8b5cf6', label: 'Efeméride H&S', icon: <CalendarDays size={14} /> },
        'Other': { color: '#64748b', label: 'Otro', icon: <CalendarIcon size={14} /> }
    };

    const initialDates = [
        { title: 'Día de la Higiene y Seguridad en el Trabajo (Arg)', date: '2026-04-21', time: '09:00', type: 'Commemorative', description: 'Ley 19.587' },
        { title: 'Día Mundial de la Seguridad y Salud en el Trabajo', date: '2026-04-28', time: '09:00', type: 'Commemorative', description: 'OIT' },
        { title: 'Presentación Anual R.G.R.L.', date: '2026-03-31', time: '10:00', type: 'Legal', description: 'Resolución SRT 463/09' },
        { title: 'Presentación de Relevamiento de Agentes de Riesgo', date: '2026-04-15', time: '10:00', type: 'Legal', description: 'Res. 81/19' }
    ];

    // Notification permission request
    useEffect(() => {
        if ("Notification" in window) {
            if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                Notification.requestPermission();
            }
        }
    }, []);

    // Load events and setup interval for notifications
    useEffect(() => {
        const savedEvents = localStorage.getItem('safety_calendar_events');
        if (savedEvents) {
            setEvents(JSON.parse(savedEvents));
        } else {
            setEvents(initialDates);
            localStorage.setItem('safety_calendar_events', JSON.stringify(initialDates));
        }

        const interval = setInterval(() => {
            checkNotifications();
        }, 30000); // Check every 30 seconds

        return () => clearInterval(interval);
    }, []);

    const checkNotifications = () => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const currentEvents = events.filter(e => e.date === dateStr && e.time === timeStr);

        currentEvents.forEach(e => {
            const eventId = `${e.date}-${e.time}-${e.title}`;
            if (!lastNotified[eventId]) {
                showNotification(e);
                setLastNotified(prev => ({ ...prev, [eventId]: true }));
            }
        });
    };

    const showNotification = (event) => {
        if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Aviso de Seguridad (Escritorio)", {
                body: `${event.title} (${event.time} hs)`,
                icon: "/logo192.png" // Fallback icon
            });
        }
        console.log("DESKTOP NOTIFICATION TRIGGERED:", event);
    };

    const deleteEvent = (eventToDelete) => {
        const updatedEvents = events.filter(e => e !== eventToDelete);
        setEvents(updatedEvents);
        localStorage.setItem('safety_calendar_events', JSON.stringify(updatedEvents));
    };

    const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

    const renderHeader = () => {
        const months = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        return (
            <div key={`header-${currentMonth}-${currentYear}`} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                background: 'rgba(255, 255, 255, 0.03)',
                padding: '1.5rem',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid var(--color-border)',
                boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{
                        background: 'var(--color-primary)',
                        padding: '0.8rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)'
                    }}>
                        <CalendarIcon size={24} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.02em' }}>
                            {months[currentMonth]}
                        </h1>
                        <span style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                            {currentYear}
                        </span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.4rem', borderRadius: '12px' }}>
                    <button
                        onClick={() => {
                            if (currentMonth === 0) {
                                setCurrentMonth(11);
                                setCurrentYear(prev => prev - 1);
                            } else {
                                setCurrentMonth(prev => prev - 1);
                            }
                        }}
                        style={{
                            padding: '0.6rem',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-text)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => {
                            setCurrentMonth(today.getMonth());
                            setCurrentYear(today.getFullYear());
                        }}
                        style={{
                            padding: '0.6rem 1.2rem',
                            background: 'rgba(255,255,255,0.05)',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-text)',
                            fontSize: '0.85rem',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                    >
                        HOY
                    </button>
                    <button
                        onClick={() => {
                            if (currentMonth === 11) {
                                setCurrentMonth(0);
                                setCurrentYear(prev => prev + 1);
                            } else {
                                setCurrentMonth(prev => prev + 1);
                            }
                        }}
                        style={{
                            padding: '0.6rem',
                            background: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: 'var(--color-text)',
                            display: 'flex',
                            alignItems: 'center',
                            transition: 'all 0.2s'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>
        );
    };

    const renderDays = () => {
        const days = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
        return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem' }}>
                {days.map(day => (
                    <div key={day} style={{
                        textAlign: 'center',
                        padding: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.1em'
                    }}>
                        {day}
                    </div>
                ))}
            </div>
        );
    };

    const renderCells = () => {
        const year = currentYear;
        const month = currentMonth;
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const cells = [];

        for (let i = 0; i < startDay; i++) {
            cells.push(<div key={`empty-${i}`} style={{ padding: '0.5rem', minHeight: '100px' }}></div>);
        }

        for (let day = 1; day <= totalDays; day++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year;

            cells.push(
                <div key={day} style={{
                    padding: '0.75rem',
                    minHeight: '110px',
                    border: '1px solid var(--color-border)',
                    background: isToday ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    transition: 'transform 0.2s, background 0.2s',
                    position: 'relative',
                    cursor: 'default'
                }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                        e.currentTarget.style.zIndex = '5';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = isToday ? 'rgba(59, 130, 246, 0.08)' : 'transparent';
                        e.currentTarget.style.zIndex = '1';
                    }}
                >
                    <span style={{
                        fontSize: '0.9rem',
                        fontWeight: isToday ? 800 : 600,
                        color: isToday ? 'var(--color-primary)' : 'inherit',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '26px',
                        height: '26px',
                        borderRadius: '6px',
                        background: isToday ? 'rgba(59, 130, 246, 0.15)' : 'transparent',
                        marginBottom: '4px'
                    }}>{day}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', overflowY: 'auto', maxHeight: '70px', paddingRight: '2px' }} className="custom-scrollbar">
                        {dayEvents.map((e, idx) => (
                            <div key={idx} style={{
                                fontSize: '0.65rem',
                                padding: '4px 6px',
                                background: `linear-gradient(90deg, ${eventTypes[e.type].color}, ${eventTypes[e.type].color}ee)`,
                                color: 'white',
                                borderRadius: '4px',
                                overflow: 'hidden',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '4px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflow: 'hidden' }}>
                                    {eventTypes[e.type].icon}
                                    <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                                </div>
                                <button
                                    onClick={(event) => {
                                        event.stopPropagation();
                                        deleteEvent(e);
                                    }}
                                    style={{
                                        background: 'rgba(255,255,255,0.2)',
                                        border: 'none',
                                        borderRadius: '4px',
                                        padding: '2px',
                                        display: 'flex',
                                        cursor: 'pointer',
                                        color: 'white'
                                    }}
                                >
                                    <Trash2 size={10} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return (
            <div key={`grid-${currentMonth}-${currentYear}`} style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden',
                background: 'rgba(0,0,0,0.1)'
            }}>
                {cells}
            </div>
        );
    };

    const handleAddEvent = () => {
        if (!newEvent.title || !newEvent.date) return;
        const updatedEvents = [...events, newEvent];
        setEvents(updatedEvents);
        localStorage.setItem('safety_calendar_events', JSON.stringify(updatedEvents));
        setIsAddingEvent(false);
        setNewEvent({
            title: '',
            date: new Date().toISOString().split('T')[0],
            time: '09:00',
            type: 'Inspection',
            description: ''
        });
    };

    const upcomingEvents = events
        .filter(e => new Date(e.date + 'T' + (e.time || '12:00')) >= new Date())
        .sort((a, b) => new Date(a.date + 'T' + (a.time || '12:00')) - new Date(b.date + 'T' + (b.time || '12:00')))
        .slice(0, 5);

    return (
        <div className="container" style={{ paddingBottom: '5rem', maxWidth: '1200px' }}>
            {renderHeader()}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <div className="card" style={{ padding: '1rem', border: '1px solid var(--color-border)' }}>
                        {renderDays()}
                        {renderCells()}
                        <button
                            onClick={() => setIsAddingEvent(true)}
                            className="btn-primary"
                            style={{
                                marginTop: '1.5rem',
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.7rem',
                                padding: '1rem',
                                borderRadius: '14px',
                                fontSize: '1rem',
                                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.4)',
                                border: 'none'
                            }}
                        >
                            <Plus size={20} /> AGREGAR EVENTO / TAREA
                        </button>
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div className="card" style={{
                        padding: '1.5rem',
                        borderColor: 'rgba(239, 68, 68, 0.2)',
                        background: 'linear-gradient(135deg, var(--color-surface), rgba(239, 68, 68, 0.05))',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute', top: '-10px', right: '-10px', opacity: 0.1, color: '#ef4444', transform: 'rotate(15deg)'
                        }}>
                            <Bell size={80} />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.2rem', color: '#ef4444' }}>
                            <Bell size={22} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Recordatorios</h3>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {upcomingEvents.length > 0 ? upcomingEvents.map((e, i) => (
                                <div key={i} style={{
                                    borderLeft: `4px solid ${eventTypes[e.type].color}`,
                                    padding: '0.8rem 1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '0 8px 8px 0',
                                    transition: 'all 0.2s',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '2px' }}>{e.title}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <Clock size={12} />
                                            {new Date(e.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                            {e.time && ` • ${e.time} hs`} • {eventTypes[e.type].label}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteEvent(e)}
                                        style={{ background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', padding: '4px' }}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '2rem 0', opacity: 0.5 }}>
                                    <CheckCircle2 size={40} style={{ margin: '0 auto 1rem', display: 'block' }} />
                                    <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>Todo al día.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', border: '1px solid var(--color-border)' }}>
                        <h3 style={{ margin: '0 0 1.2rem 0', fontSize: '1rem', fontWeight: 800 }}>Etiquetas</h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                            {Object.entries(eventTypes).map(([type, info]) => (
                                <div key={type} style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem' }}>
                                    <div style={{
                                        width: '28px',
                                        height: '28px',
                                        borderRadius: '8px',
                                        background: info.color,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'white',
                                        boxShadow: `0 2px 8px ${info.color}44`
                                    }}>
                                        {info.icon}
                                    </div>
                                    <span style={{ fontWeight: 600 }}>{info.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {isAddingEvent && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                    background: 'rgba(0,0,0,0.7)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
                    backdropFilter: 'blur(5px)'
                }}>
                    <div className="card" style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', borderRadius: '24px', position: 'relative' }}>
                        <button onClick={() => setIsAddingEvent(false)} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                            <X size={24} />
                        </button>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <BellDot size={20} color="var(--color-primary)" />
                            <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>Nuevo Evento</h2>
                        </div>
                        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>Recibirás una notificación a la hora seleccionada.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block' }}>Título de la Tarea</label>
                                <input
                                    type="text"
                                    value={newEvent.title}
                                    onChange={e => setNewEvent({ ...newEvent, title: e.target.value })}
                                    placeholder="Ej: Recarga de Extintores..."
                                    style={{ borderRadius: '12px', padding: '1rem', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block' }}>Fecha</label>
                                    <input
                                        type="date"
                                        value={newEvent.date}
                                        onChange={e => setNewEvent({ ...newEvent, date: e.target.value })}
                                        style={{ borderRadius: '12px', padding: '1rem', width: '100%' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block' }}>Hora de Alerta</label>
                                    <input
                                        type="time"
                                        value={newEvent.time}
                                        onChange={e => setNewEvent({ ...newEvent, time: e.target.value })}
                                        style={{ borderRadius: '12px', padding: '1rem', width: '100%' }}
                                    />
                                </div>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block' }}>Categoría</label>
                                <select
                                    value={newEvent.type}
                                    onChange={e => setNewEvent({ ...newEvent, type: e.target.value })}
                                    style={{ borderRadius: '12px', padding: '1rem', width: '100%', appearance: 'none', background: 'var(--color-surface)' }}
                                >
                                    {Object.entries(eventTypes).map(([key, info]) => (
                                        <option key={key} value={key}>{info.label}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '0.6rem', display: 'block' }}>Descripción (Opcional)</label>
                                <textarea
                                    value={newEvent.description}
                                    onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                                    placeholder="Detalles adicionales sobre esta agenda..."
                                    style={{ height: '80px', borderRadius: '12px', padding: '1rem', width: '100%' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                                <button onClick={() => setIsAddingEvent(false)} className="btn-secondary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700 }}>CANCELAR</button>
                                <button onClick={handleAddEvent} className="btn-primary" style={{ flex: 1, padding: '1rem', borderRadius: '14px', fontWeight: 700, marginTop: 0 }}>GUARDAR AGENDA</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>
                {`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: rgba(0,0,0,0.1);
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: rgba(255,255,255,0.1);
                        border-radius: 10px;
                    }
                    .btn-secondary:hover {
                        background: rgba(255,255,255,0.1) !important;
                    }
                `}
            </style>
        </div>
    );
}
