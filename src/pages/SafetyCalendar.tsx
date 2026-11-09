import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Bell,
  Trash2,
  Clock,
  CheckCircle2,
  CalendarDays,
  Award,
  Construction,
  Scale,
  X,
  BellDot,
  AlertTriangle,
  List,
  CalendarPlus,
  Filter,
  Info,
  Search,
  Pencil,
  FileSpreadsheet
} from 'lucide-react';
import {
  initializeSchedules,
  scheduleReminder,
  cancelReminder
} from '../services/notificationService';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { useSync } from '../contexts/SyncContext';
import AnimatedPage from '../components/AnimatedPage';
import PremiumHeader from '../components/PremiumHeader';
import { toast } from 'react-hot-toast';

const MONTHS = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre'
];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DAYS_MIN = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  time: string;
  type: 'Inspection' | 'Training' | 'Legal' | 'SystemAuto' | 'Commemorative' | 'Other';
  description?: string;
  isAuto?: boolean;
  modulePath?: string;
}

const EVENT_TYPES: Record<
  string,
  { color: string; bg: string; border: string; label: string; icon: React.ReactNode }
> = {
  Inspection: {
    color: '#2563eb',
    bg: 'rgba(37, 99, 235, 0.14)',
    border: 'rgba(37, 99, 235, 0.35)',
    label: 'Inspección',
    icon: <Construction size={14} />
  },
  Training: {
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.14)',
    border: 'rgba(5, 150, 105, 0.35)',
    label: 'Capacitación',
    icon: <Award size={14} />
  },
  Legal: {
    color: '#dc2626',
    bg: 'rgba(220, 38, 38, 0.14)',
    border: 'rgba(220, 38, 38, 0.35)',
    label: 'Vencimiento Legal',
    icon: <Scale size={14} />
  },
  SystemAuto: {
    color: '#d97706',
    bg: 'rgba(217, 119, 6, 0.14)',
    border: 'rgba(217, 119, 6, 0.35)',
    label: 'Vencimiento Automático',
    icon: <BellDot size={14} />
  },
  Commemorative: {
    color: '#7c3aed',
    bg: 'rgba(124, 58, 237, 0.14)',
    border: 'rgba(124, 58, 237, 0.35)',
    label: 'Efeméride HYS',
    icon: <CalendarDays size={14} />
  },
  Other: {
    color: '#475569',
    bg: 'rgba(71, 85, 105, 0.14)',
    border: 'rgba(71, 85, 105, 0.35)',
    label: 'Otro',
    icon: <CalendarIcon size={14} />
  }
};

function getCountryEvents(country: string, year: number): CalendarEvent[] {
  const base: CalendarEvent[] = [
    {
      id: `comm-oit-${year}`,
      title: 'Día Mundial de la Seguridad y Salud en el Trabajo',
      date: `${year}-04-28`,
      time: '09:00',
      type: 'Commemorative',
      description: 'Efeméride oficial OIT — Prevención de accidentes y enfermedades profesionales'
    }
  ];

  const extra: Record<string, CalendarEvent[]> = {
    argentina: [
      {
        id: `comm-arg-${year}`,
        title: 'Día de la Higiene y Seguridad en el Trabajo (Argentina)',
        date: `${year}-04-21`,
        time: '09:00',
        type: 'Commemorative',
        description: 'Sanción de la Ley Nacional N° 19.587'
      },
      {
        id: `leg-rgrl-${year}`,
        title: 'Renovación Anual R.G.R.L. (Relevamiento Gral. de Riesgos Laborales)',
        date: `${year}-03-31`,
        time: '10:00',
        type: 'Legal',
        description: 'Resolución SRT N° 463/09 — Presentación ante A.R.T.'
      },
      {
        id: `leg-rar-${year}`,
        title: 'Presentación Anual R.A.R. y Nómina de Expuestos (ESOP)',
        date: `${year}-04-15`,
        time: '10:00',
        type: 'Legal',
        description: 'Resolución SRT N° 37/10 y Res. SRT N° 81/19'
      }
    ],
    chile: [
      {
        id: `comm-chl-${year}`,
        title: 'Día del Experto en Prevención de Riesgos',
        date: `${year}-03-07`,
        time: '09:00',
        type: 'Commemorative',
        description: 'Reconocimiento Nacional de Prevención de Riesgos'
      }
    ]
  };
  return [...base, ...(extra[country] || [])];
}

// Sincronización automática con los demás módulos de la plataforma
function loadAutoSyncEvents(): CalendarEvent[] {
  const auto: CalendarEvent[] = [];

  try {
    // 1. Extintores
    const extintores = JSON.parse(localStorage.getItem('extinguishers_inventory') || '[]');
    extintores.forEach((ex: any) => {
      const num = ex.numero || ex.number || ex.id || '?';
      const loc = ex.ubicacion || ex.location || 'Sector General';
      const recDate = ex.nextRecharge || ex.vencimientoRecarga;
      if (recDate) {
        auto.push({
          id: `ext-rcg-${ex.id || num}`,
          title: `Vto. Recarga Extintor #${num}`,
          date: String(recDate).slice(0, 10),
          time: '09:00',
          type: 'SystemAuto',
          description: `Ubicación: ${loc} • Agente: ${ex.tipo || ex.agente || 'ABC'}`,
          isAuto: true,
          modulePath: '/extintores'
        });
      }
      const phDate = ex.nextHydraulic || ex.vencimientoPH;
      if (phDate) {
        auto.push({
          id: `ext-ph-${ex.id || num}`,
          title: `Prueba Hidráulica Extintor #${num}`,
          date: String(phDate).slice(0, 10),
          time: '09:00',
          type: 'SystemAuto',
          description: `Ubicación: ${loc}`,
          isAuto: true,
          modulePath: '/extintores'
        });
      }
    });

    // 2. Capacitaciones
    const trainings = JSON.parse(localStorage.getItem('training_sessions_db') || '[]');
    trainings.forEach((tr: any) => {
      if (tr.date) {
        auto.push({
          id: `train-${tr.id}`,
          title: `Capacitación: ${tr.topic || tr.title || 'Seguridad'}`,
          date: String(tr.date).slice(0, 10),
          time: tr.time || '10:00',
          type: 'Training',
          description: `Lugar: ${tr.location || '-'} | Instructor: ${tr.trainer || '-'}`,
          isAuto: true,
          modulePath: '/training-management'
        });
      }
    });

    // 3. Simulacros
    const drills = JSON.parse(localStorage.getItem('drills_history') || '[]');
    drills.forEach((dr: any) => {
      const dDate = dr.date || dr.fecha;
      if (dDate) {
        auto.push({
          id: `drill-${dr.id}`,
          title: `Simulacro: ${dr.type || dr.hipotesis || 'Evacuación'}`,
          date: String(dDate).slice(0, 10),
          time: dr.time || '11:00',
          type: 'Inspection',
          description: `Ubicación: ${dr.location || dr.empresa || '-'}`,
          isAuto: true,
          modulePath: '/drills'
        });
      }
    });

    // 4. Auditorías
    const audits = JSON.parse(localStorage.getItem('ehs_audits_db') || '[]');
    audits.forEach((au: any) => {
      const aDate = au.date || au.scheduledDate || au.fecha;
      if (aDate) {
        auto.push({
          id: `aud-${au.id}`,
          title: `Auditoría: ${au.title || au.type || 'General'}`,
          date: String(aDate).slice(0, 10),
          time: '09:00',
          type: 'Inspection',
          description: `Sector: ${au.location || au.area || '-'}`,
          isAuto: true,
          modulePath: '/audit'
        });
      }
    });

    // 5. Aptitudes Médicas (Res. SRT 37/10)
    const medical = JSON.parse(localStorage.getItem('ehs_medical_db') || '[]');
    medical.forEach((med: any) => {
      if (med.expirationDate) {
        auto.push({
          id: `med-${med.id}`,
          title: `Vto. Aptitud Médica: ${med.workerName || 'Trabajador'}`,
          date: String(med.expirationDate).slice(0, 10),
          time: '08:30',
          type: 'Legal',
          description: `DNI: ${med.dni || '-'} • Empresa: ${med.company || '-'}`,
          isAuto: true,
          modulePath: '/medical'
        });
      }
    });

    // 6. Acciones Correctivas CAPA
    const capas = JSON.parse(localStorage.getItem('ehs_capa_db') || '[]');
    capas.forEach((cp: any) => {
      const target = cp.targetDate || cp.vencimiento || cp.fechaLimite;
      if (target && cp.status !== 'Cerrada') {
        auto.push({
          id: `capa-${cp.id}`,
          title: `Vto. Acción CAPA: ${cp.title || cp.titulo || 'Mejora'}`,
          date: String(target).slice(0, 10),
          time: '10:00',
          type: 'SystemAuto',
          description: `Responsable: ${cp.responsible || cp.responsable || '-'}`,
          isAuto: true,
          modulePath: '/capa'
        });
      }
    });
  } catch (e) {
    console.error('Failed to sync auto events', e);
  }

  return auto;
}

function diffDays(dateStr: string): number {
  const ev = new Date(dateStr + 'T12:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((ev.getTime() - now.getTime()) / 86400000);
}

function urgencyBadge(days: number) {
  if (days < 0)
    return {
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.15)',
      border: 'rgba(220, 38, 38, 0.4)',
      label: `VENCIDO (${Math.abs(days)}d)`
    };
  if (days === 0)
    return {
      color: '#dc2626',
      bg: 'rgba(220, 38, 38, 0.18)',
      border: 'rgba(220, 38, 38, 0.45)',
      label: 'HOY'
    };
  if (days <= 3)
    return {
      color: '#d97706',
      bg: 'rgba(217, 119, 6, 0.16)',
      border: 'rgba(217, 119, 6, 0.4)',
      label: `EN ${days} DÍAS`
    };
  if (days <= 7)
    return {
      color: '#ca8a04',
      bg: 'rgba(202, 138, 4, 0.15)',
      border: 'rgba(202, 138, 4, 0.4)',
      label: `EN ${days} DÍAS`
    };
  return {
    color: '#059669',
    bg: 'rgba(5, 150, 105, 0.15)',
    border: 'rgba(5, 150, 105, 0.4)',
    label: `EN ${days} DÍAS`
  };
}

export default function SafetyCalendar(): React.ReactElement | null {
  useDocumentTitle('Calendario Anual y Agenda HYS');
  const navigate = useNavigate();
  const { syncCollection } = useSync();
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  const [manualEvents, setManualEvents] = useState<CalendarEvent[]>([]);
  const [autoEvents, setAutoEvents] = useState<CalendarEvent[]>([]);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(todayStr);
  const [view, setView] = useState<'month' | 'list'>('month');

  const [formData, setFormData] = useState({
    title: '',
    date: todayStr,
    time: '09:00',
    type: 'Inspection' as CalendarEvent['type'],
    description: ''
  });

  let userCountry = 'argentina';
  try {
    const savedData = localStorage.getItem('personalData');
    if (savedData && !savedData.startsWith('data:')) {
      userCountry = JSON.parse(savedData).country || 'argentina';
    }
  } catch {}

  useEffect(() => {
    let loaded = getCountryEvents(userCountry, today.getFullYear());
    try {
      const saved = localStorage.getItem('safety_calendar_events');
      if (saved && !saved.startsWith('data:')) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          loaded = parsed;
        }
      } else if (!saved) {
        localStorage.setItem('safety_calendar_events', JSON.stringify(loaded));
      }
    } catch {}

    const auto = loadAutoSyncEvents();
    setManualEvents(loaded);
    setAutoEvents(auto);
    initializeSchedules(loaded);
  }, []);

  const saveManualEvents = async (ev: CalendarEvent[]) => {
    setManualEvents(ev);
    localStorage.setItem('safety_calendar_events', JSON.stringify(ev));
    await syncCollection('safety_calendar_events', ev);
  };

  const openCreateModal = (defaultDate?: string) => {
    setEditingEventId(null);
    setFormData({
      title: '',
      date: defaultDate || selectedDay || todayStr,
      time: '09:00',
      type: 'Inspection',
      description: ''
    });
    setIsModalOpen(true);
  };

  const openEditModal = (ev: CalendarEvent) => {
    if (ev.isAuto) {
      toast('Evento sincronizado automáticamente desde su módulo de origen.', { icon: 'ℹ️' });
      if (ev.modulePath) navigate(ev.modulePath);
      return;
    }
    setEditingEventId(ev.id || `${ev.date}-${ev.title}`);
    setFormData({
      title: ev.title,
      date: ev.date,
      time: ev.time || '09:00',
      type: ev.type || 'Inspection',
      description: ev.description || ''
    });
    setIsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Ingresá un título para el evento');
      return;
    }

    if (editingEventId) {
      const updated = manualEvents.map((ev) => {
        const currentKey = ev.id || `${ev.date}-${ev.title}`;
        if (currentKey === editingEventId) {
          return {
            ...ev,
            id: ev.id || `ev-${Date.now()}`,
            title: formData.title.trim(),
            date: formData.date,
            time: formData.time,
            type: formData.type,
            description: formData.description.trim(),
            isAuto: false
          };
        }
        return ev;
      });
      saveManualEvents(updated);
      setSelectedDay(formData.date);
      toast.success('Evento actualizado en el calendario');
    } else {
      const id = `ev-${Date.now()}`;
      const item: CalendarEvent = {
        id,
        title: formData.title.trim(),
        date: formData.date,
        time: formData.time,
        type: formData.type,
        description: formData.description.trim(),
        isAuto: false
      };
      const updated = [...manualEvents, item];
      saveManualEvents(updated);
      scheduleReminder(id, item.date, item.time, item.title);
      setSelectedDay(item.date);
      toast.success('¡Evento agendado correctamente!');
    }

    setIsModalOpen(false);
    setEditingEventId(null);
  };

  const deleteEvent = (ev: CalendarEvent) => {
    if (ev.isAuto) {
      toast.error('Este vencimiento proviene de otro módulo. Modificalo desde su módulo de origen.');
      return;
    }
    if (!window.confirm(`¿Deseás eliminar el evento "${ev.title}" de la agenda?`)) return;
    const id = ev.id || `${ev.date}-${ev.time}-${ev.title}`;
    cancelReminder(id);
    saveManualEvents(manualEvents.filter((e) => e !== ev && (e.id ? e.id !== ev.id : true)));
    toast.success('Evento eliminado de la agenda');
  };

  const exportToGoogleCalendar = (ev: CalendarEvent) => {
    const timePart = ev.time && ev.time.includes(':') ? ev.time : '09:00';
    const startObj = new Date(`${ev.date}T${timePart}:00`);
    const validStart = isNaN(startObj.getTime()) ? new Date() : startObj;
    const endObj = new Date(validStart.getTime() + 60 * 60 * 1000);

    const start = validStart.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const end = endObj.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      ev.title
    )}&dates=${start}/${end}&details=${encodeURIComponent(ev.description || 'Agendado desde Asistente H&S')}`;
    window.open(url, '_blank');
  };

  const handleExportCSV = () => {
    if (!allEvents.length) {
      toast.error('No hay eventos en el calendario para exportar');
      return;
    }
    const headers = ['Fecha', 'Hora', 'Título del Evento', 'Categoría', 'Origen', 'Descripción / Detalle'];
    const sorted = [...allEvents].sort((a, b) => a.date.localeCompare(b.date));
    const rows = sorted.map((ev) =>
      [
        `"${ev.date}"`,
        `"${ev.time || '09:00'}"`,
        `"${(ev.title || '').replace(/"/g, '""')}"`,
        `"${EVENT_TYPES[ev.type]?.label || ev.type}"`,
        `"${ev.isAuto ? 'Sincronización Automática' : 'Manual / Agenda'}"`,
        `"${(ev.description || '').replace(/"/g, '""')}"`
      ].join(';')
    );
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Agenda_Anual_HyS_${currentYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Agenda anual exportada en formato CSV');
  };

  // Navegación de meses
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };
  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };
  const goToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
    setSelectedDay(todayStr);
  };

  const rawCombinedEvents = useMemo(() => [...manualEvents, ...autoEvents], [manualEvents, autoEvents]);

  // Eventos combinados y filtrados
  const allEvents = useMemo(() => {
    return rawCombinedEvents.filter((e) => {
      if (activeFilter && e.type !== activeFilter) return false;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (e.title || '').toLowerCase().includes(q) ||
        (e.description || '').toLowerCase().includes(q) ||
        (EVENT_TYPES[e.type]?.label || '').toLowerCase().includes(q) ||
        (e.date || '').includes(q)
      );
    });
  }, [rawCombinedEvents, activeFilter, searchQuery]);

  // Métricas KPI
  const metrics = useMemo(() => {
    const monthPrefix = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    const total = rawCombinedEvents.length;
    const thisMonth = rawCombinedEvents.filter((e) => e.date.startsWith(monthPrefix)).length;
    let urgent7Days = 0;
    let overdue = 0;

    rawCombinedEvents.forEach((e) => {
      const d = diffDays(e.date);
      if (d < 0 && (e.type === 'Legal' || e.type === 'SystemAuto' || e.type === 'Inspection')) {
        overdue++;
      } else if (d >= 0 && d <= 7) {
        urgent7Days++;
      }
    });

    return { total, thisMonth, urgent7Days, overdue };
  }, [rawCombinedEvents, currentYear, currentMonth]);

  // Eventos indexados por fecha
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    allEvents.forEach((e) => {
      if (!map[e.date]) map[e.date] = [];
      map[e.date].push(e);
    });
    return map;
  }, [allEvents]);

  // Próximos eventos vigentes
  const upcoming = useMemo(
    () =>
      allEvents
        .filter((e) => diffDays(e.date) >= -3)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(0, 7),
    [allEvents]
  );

  const selectedEvents = selectedDay ? eventsByDate[selectedDay] || [] : [];

  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDay = new Date(currentYear, currentMonth, 1).getDay();

  return (
    <AnimatedPage>
      <div
        className="container min-h-[100vh] flex flex-col px-3 sm:px-4"
        style={{ paddingTop: '7.25rem', paddingBottom: '6.5rem' }}
      >
        {/* Encabezado Principal con Contraste Garantizado */}
        <PremiumHeader
          title="Calendario Anual y Agenda H&S"
          subtitle="Planificación preventiva de inspecciones, capacitaciones, simulacros y vencimientos legales sincronizados"
          badge="ISO 45001 · Planificación Anual H&S"
          icon={<CalendarDays size={36} color="#ffffff" />}
          gradient="linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #4f46e5 100%)"
        />

        {/* Tarjetas KPI de Resumen */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mt-5">
          <div
            onClick={() => setActiveFilter(null)}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '18px',
              background: !activeFilter ? 'rgba(37, 99, 235, 0.12)' : 'var(--color-surface)',
              border: !activeFilter ? '2px solid #2563eb' : '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#2563eb', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Total Agenda
              </span>
              <CalendarIcon size={18} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: 'var(--color-text)', lineHeight: 1.1 }}>
              {metrics.total}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Eventos manuales y automáticos
            </span>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '18px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#6366f1', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                En {MONTHS[currentMonth]}
              </span>
              <CalendarDays size={18} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#6366f1', lineHeight: 1.1 }}>
              {metrics.thisMonth}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Compromisos de este mes
            </span>
          </div>

          <div
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '18px',
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#d97706', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Próximos 7 Días
              </span>
              <BellDot size={18} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#d97706', lineHeight: 1.1 }}>
              {metrics.urgent7Days}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Atención prioritaria
            </span>
          </div>

          <div
            onClick={() => setActiveFilter('Legal')}
            style={{
              padding: '0.85rem 1rem',
              borderRadius: '18px',
              background: activeFilter === 'Legal' ? 'rgba(220, 38, 38, 0.12)' : 'var(--color-surface)',
              border: activeFilter === 'Legal' ? '2px solid #dc2626' : '1px solid var(--color-border)',
              boxShadow: 'var(--shadow-sm)',
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: '#dc2626', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Vencidos / Legales
              </span>
              <AlertTriangle size={18} />
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#dc2626', lineHeight: 1.1 }}>
              {metrics.overdue}
            </div>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
              Requieren regularización
            </span>
          </div>
        </div>

        {/* Barra de Control del Calendario (Navegación de Mes, Buscador, Vista y Botones de Acción) */}
        <div
          style={{
            marginTop: '1.25rem',
            padding: '1rem',
            borderRadius: '20px',
            background: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px'
          }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Título del Mes Activo + Controles Anterior / Hoy / Siguiente */}
            <div className="flex items-center justify-between sm:justify-start flex-wrap gap-3 w-full lg:w-auto">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                    flexShrink: 0
                  }}
                >
                  <CalendarIcon size={20} color="#ffffff" />
                </div>
                <div>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: '1.2rem',
                      fontWeight: 900,
                      color: 'var(--color-text)',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15
                    }}
                  >
                    {MONTHS[currentMonth]}{' '}
                    <span style={{ color: '#2563eb' }}>{currentYear}</span>
                  </h2>
                  <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                    {allEvents.length} evento{allEvents.length !== 1 ? 's' : ''} visible{allEvents.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Botonera Mes Anterior / HOY / Mes Siguiente */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '4px',
                  borderRadius: '12px',
                  background: 'var(--color-background)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <button
                  type="button"
                  onClick={prevMonth}
                  title="Mes anterior"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronLeft size={18} color="#ffffff" />
                </button>

                <button
                  type="button"
                  onClick={goToday}
                  style={{
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 12px',
                    height: '34px',
                    minHeight: 'unset',
                    fontSize: '0.75rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    letterSpacing: '0.4px'
                  }}
                >
                  HOY
                </button>

                <button
                  type="button"
                  onClick={nextMonth}
                  title="Mes siguiente"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    width: '34px',
                    height: '34px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <ChevronRight size={18} color="#ffffff" />
                </button>
              </div>
            </div>

            {/* Controles Derecha: Buscador + Conmutador Mes/Lista + Exportar CSV + Nuevo Evento */}
            <div className="flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2.5 w-full lg:w-auto">
              {/* Buscador */}
              <div className="relative w-full sm:w-56">
                <Search
                  size={15}
                  style={{
                    position: 'absolute',
                    left: '11px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#64748b',
                    pointerEvents: 'none'
                  }}
                />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar evento o sector..."
                  style={{
                    width: '100%',
                    height: '38px',
                    paddingLeft: '34px',
                    paddingRight: searchQuery ? '30px' : '12px',
                    paddingTop: '6px',
                    paddingBottom: '6px',
                    marginBottom: 0,
                    borderRadius: '10px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    boxSizing: 'border-box'
                  }}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{
                      position: 'absolute',
                      right: '6px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'transparent',
                      border: 'none',
                      padding: '4px',
                      minHeight: 'unset',
                      color: '#64748b',
                      cursor: 'pointer',
                      boxShadow: 'none'
                    }}
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-start gap-2 w-full sm:w-auto">
                {/* Conmutador Vista Mes / Lista */}
                <div
                  style={{
                    display: 'inline-flex',
                    padding: '3px',
                    borderRadius: '11px',
                    background: 'var(--color-background)',
                    border: '1px solid var(--color-border)'
                  }}
                  className="shrink-0"
                >
                  {(['month', 'list'] as const).map((v) => {
                    const active = view === v;
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setView(v)}
                        style={{
                          background: active ? '#2563eb' : 'transparent',
                          color: active ? '#ffffff' : 'var(--color-text-muted)',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          minHeight: 'unset',
                          fontSize: '0.76rem',
                          fontWeight: 800,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                          boxShadow: active ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none'
                        }}
                      >
                        {v === 'month' ? <CalendarDays size={14} /> : <List size={14} />}
                        <span>{v === 'month' ? 'Mes' : 'Lista'}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Botón Exportar CSV */}
                <button
                  type="button"
                  onClick={handleExportCSV}
                  style={{
                    backgroundColor: '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '11px',
                    padding: '9px 12px',
                    minHeight: 'unset',
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)'
                  }}
                  className="shrink-0"
                  title="Exportar agenda anual a Excel / CSV"
                >
                  <FileSpreadsheet size={15} color="#ffffff" />
                  <span>CSV</span>
                </button>

                {/* Botón Nuevo Evento */}
                <button
                  type="button"
                  onClick={() => openCreateModal()}
                  style={{
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '11px',
                    padding: '9px 14px',
                    minHeight: 'unset',
                    fontSize: '0.78rem',
                    fontWeight: 900,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '5px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                  }}
                  className="flex-1 sm:flex-initial"
                >
                  <Plus size={16} strokeWidth={2.5} color="#ffffff" />
                  <span>Nuevo Evento</span>
                </button>
              </div>
            </div>
          </div>

          {/* Filtros por Categoría de Evento */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              overflowX: 'auto',
              paddingTop: '10px',
              borderTop: '1px solid var(--color-border)'
            }}
          >
            <button
              type="button"
              onClick={() => setActiveFilter(null)}
              style={{
                background: !activeFilter ? '#2563eb' : 'var(--color-background)',
                color: !activeFilter ? '#ffffff' : 'var(--color-text)',
                border: !activeFilter ? '1px solid #2563eb' : '1px solid var(--color-border)',
                padding: '6px 14px',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                minHeight: 'unset'
              }}
            >
              <Filter size={13} />
              <span>Todos ({rawCombinedEvents.length})</span>
            </button>

            {Object.entries(EVENT_TYPES).map(([k, v]) => {
              const isActive = activeFilter === k;
              const count = rawCombinedEvents.filter((e) => e.type === k).length;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setActiveFilter(isActive ? null : k)}
                  style={{
                    background: isActive ? v.color : 'var(--color-background)',
                    color: isActive ? '#ffffff' : 'var(--color-text)',
                    border: `1.5px solid ${isActive ? v.color : 'var(--color-border)'}`,
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    minHeight: 'unset'
                  }}
                >
                  <span style={{ color: isActive ? '#ffffff' : v.color, display: 'inline-flex' }}>
                    {v.icon}
                  </span>
                  <span>
                    {v.label} ({count})
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout Principal en 2 Columnas en Desktop (8 Cols Calendario/Lista + 4 Cols Panel Lateral) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6 items-start">
          {/* 🗓️ COLUMNA IZQUIERDA (8 cols): Grilla Mensual o Vista de Lista */}
          <div className="lg:col-span-8">
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '22px',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-md)'
              }}
            >
              {view === 'month' ? (
                <>
                  {/* Cabecera de Días de la Semana */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      width: '100%',
                      borderBottom: '1px solid var(--color-border)',
                      background: 'var(--color-background)'
                    }}
                  >
                    {DAYS_SHORT.map((d, i) => (
                      <div
                        key={d}
                        style={{
                          textAlign: 'center',
                          padding: '10px 4px',
                          fontSize: '0.72rem',
                          fontWeight: 900,
                          color: i === 0 || i === 6 ? '#64748b' : 'var(--color-text)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em'
                        }}
                      >
                        <span className="hidden sm:inline">{d}</span>
                        <span className="sm:hidden">{DAYS_MIN[i]}</span>
                      </div>
                    ))}
                  </div>

                  {/* Celdas del Mes */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(7, 1fr)',
                      width: '100%'
                    }}
                  >
                    {/* Celdas vacías previas al día 1 */}
                    {Array.from({ length: startDay }).map((_, i) => (
                      <div
                        key={`empty-${i}`}
                        style={{
                          minHeight: 'clamp(64px, 9vw, 102px)',
                          borderRight: '1px solid var(--color-border)',
                          borderBottom: '1px solid var(--color-border)',
                          background: 'var(--color-background)',
                          opacity: 0.45
                        }}
                      />
                    ))}

                    {/* Celdas de cada día del mes */}
                    {Array.from({ length: totalDays }, (_, i) => i + 1).map((day) => {
                      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(
                        2,
                        '0'
                      )}-${String(day).padStart(2, '0')}`;
                      const dayEvs = eventsByDate[dateStr] || [];
                      const isToday = dateStr === todayStr;
                      const isSelected = selectedDay === dateStr;
                      const col = (startDay + day - 1) % 7;
                      const isWeekend = col === 0 || col === 6;

                      return (
                        <div
                          key={day}
                          onClick={() => setSelectedDay(dateStr)}
                          onMouseEnter={() => setHoveredDay(dateStr)}
                          onMouseLeave={() => setHoveredDay(null)}
                          style={{
                            minHeight: 'clamp(64px, 9vw, 102px)',
                            borderRight: '1px solid var(--color-border)',
                            borderBottom: '1px solid var(--color-border)',
                            padding: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            cursor: 'pointer',
                            position: 'relative',
                            boxSizing: 'border-box',
                            background: isSelected
                              ? 'rgba(37, 99, 235, 0.12)'
                              : isToday
                              ? 'rgba(16, 185, 129, 0.08)'
                              : isWeekend
                              ? 'rgba(100, 116, 139, 0.04)'
                              : 'transparent',
                            outline: isSelected
                              ? '2px solid #2563eb'
                              : isToday
                              ? '2px solid #10b981'
                              : 'none',
                            outlineOffset: '-2px',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Fila superior de celda: Número de día + indicador hoy */}
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between'
                            }}
                          >
                            <span
                              style={{
                                width: '26px',
                                height: '26px',
                                borderRadius: '50%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.76rem',
                                fontWeight: isToday || isSelected ? 900 : 700,
                                background: isToday
                                  ? '#10b981'
                                  : isSelected
                                  ? '#2563eb'
                                  : 'transparent',
                                color:
                                  isToday || isSelected
                                    ? '#ffffff'
                                    : isWeekend
                                    ? 'var(--color-text-muted)'
                                    : 'var(--color-text)',
                                boxShadow: isToday
                                  ? '0 2px 8px rgba(16, 185, 129, 0.4)'
                                  : 'none'
                              }}
                            >
                              {day}
                            </span>

                            {dayEvs.length > 0 && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 900,
                                  padding: '1px 6px',
                                  borderRadius: '999px',
                                  backgroundColor: 'rgba(37, 99, 235, 0.14)',
                                  color: '#2563eb'
                                }}
                                className="hidden sm:inline-block"
                              >
                                {dayEvs.length}
                              </span>
                            )}
                          </div>

                          {/* Eventos en Desktop (píldoras legibles) */}
                          <div className="hidden sm:flex flex-col gap-1 overflow-hidden flex-1 w-full">
                            {dayEvs.slice(0, 3).map((ev, k) => {
                              const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.Other;
                              return (
                                <div
                                  key={k}
                                  style={{
                                    background: meta.bg,
                                    color: meta.color,
                                    border: `1px solid ${meta.border}`,
                                    borderRadius: '6px',
                                    padding: '2px 5px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    minWidth: 0
                                  }}
                                  title={`${ev.time} - ${ev.title}`}
                                >
                                  <span style={{ flexShrink: 0, display: 'inline-flex' }}>
                                    {meta.icon}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: '0.64rem',
                                      fontWeight: 800,
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      flex: 1
                                    }}
                                  >
                                    {ev.title}
                                  </span>
                                </div>
                              );
                            })}
                            {dayEvs.length > 3 && (
                              <span
                                style={{
                                  fontSize: '0.62rem',
                                  fontWeight: 800,
                                  color: '#2563eb',
                                  paddingLeft: '4px'
                                }}
                              >
                                +{dayEvs.length - 3} más
                              </span>
                            )}
                          </div>

                          {/* Eventos en Móvil (puntos de color de alto contraste) */}
                          <div className="sm:hidden flex flex-row flex-wrap items-center justify-center gap-1 w-full my-auto">
                            {dayEvs.slice(0, 4).map((ev, k) => (
                              <span
                                key={k}
                                style={{
                                  width: '8px',
                                  height: '8px',
                                  borderRadius: '50%',
                                  backgroundColor:
                                    EVENT_TYPES[ev.type]?.color || '#2563eb',
                                  flexShrink: 0
                                }}
                              />
                            ))}
                            {dayEvs.length > 4 && (
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 900,
                                  color: '#2563eb'
                                }}
                              >
                                +{dayEvs.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                /* ── VISTA DE LISTA DETALLADA ── */
                <div>
                  {allEvents.length === 0 ? (
                    <div style={{ padding: '3.5rem 1.5rem', textAlign: 'center' }}>
                      <CalendarIcon
                        size={48}
                        style={{ margin: '0 auto 12px', color: '#64748b', opacity: 0.6 }}
                      />
                      <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, color: 'var(--color-text)' }}>
                        No hay eventos agendados con este filtro
                      </h3>
                      <p style={{ margin: '6px 0 16px', fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                        Agregá una inspección, capacitación o vencimiento legal manualmente.
                      </p>
                      <button
                        type="button"
                        onClick={() => openCreateModal()}
                        style={{
                          background: 'linear-gradient(135deg, #059669, #0d9488)',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 18px',
                          borderRadius: '12px',
                          fontSize: '0.82rem',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        + Agendar Primer Evento
                      </button>
                    </div>
                  ) : (
                    Object.entries(
                      allEvents.reduce((acc: Record<string, CalendarEvent[]>, ev) => {
                        if (!acc[ev.date]) acc[ev.date] = [];
                        acc[ev.date].push(ev);
                        return acc;
                      }, {})
                    )
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([date, evs]) => {
                        const d = diffDays(date);
                        const u = urgencyBadge(d);
                        return (
                          <div key={date} style={{ borderBottom: '1px solid var(--color-border)' }}>
                            {/* Encabezado de Fecha */}
                            <div
                              style={{
                                padding: '10px 18px',
                                background: 'var(--color-background)',
                                borderBottom: '1px solid var(--color-border)',
                                borderLeft: '4px solid #2563eb',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '10px',
                                flexWrap: 'wrap'
                              }}
                            >
                              <span
                                style={{
                                  fontSize: '0.85rem',
                                  fontWeight: 900,
                                  color: 'var(--color-text)',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {new Date(date + 'T12:00:00').toLocaleDateString('es-AR', {
                                  weekday: 'long',
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric'
                                })}
                              </span>

                              <span
                                style={{
                                  backgroundColor: u.bg,
                                  color: u.color,
                                  border: `1px solid ${u.border}`,
                                  padding: '3px 10px',
                                  borderRadius: '999px',
                                  fontSize: '0.68rem',
                                  fontWeight: 900,
                                  letterSpacing: '0.4px'
                                }}
                              >
                                {u.label}
                              </span>
                            </div>

                            {/* Eventos de esa fecha */}
                            {evs.map((ev, i) => {
                              const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.Other;
                              return (
                                <div
                                  key={i}
                                  style={{
                                    padding: '14px 18px',
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: '12px',
                                    borderBottom:
                                      i < evs.length - 1 ? '1px solid var(--color-border)' : 'none'
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: '220px' }}>
                                    <div
                                      style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: meta.bg,
                                        color: meta.color,
                                        border: `1px solid ${meta.border}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flexShrink: 0
                                      }}
                                    >
                                      {meta.icon}
                                    </div>

                                    <div style={{ minWidth: 0, flex: 1 }}>
                                      <div
                                        style={{
                                          fontWeight: 900,
                                          fontSize: '0.92rem',
                                          color: 'var(--color-text)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '6px',
                                          flexWrap: 'wrap'
                                        }}
                                      >
                                        <span>{ev.title}</span>
                                        {ev.isAuto && (
                                          <span
                                            style={{
                                              fontSize: '0.65rem',
                                              fontWeight: 800,
                                              padding: '2px 7px',
                                              borderRadius: '6px',
                                              backgroundColor: 'rgba(217, 119, 6, 0.14)',
                                              color: '#d97706'
                                            }}
                                          >
                                            Sincronizado
                                          </span>
                                        )}
                                      </div>

                                      <div
                                        style={{
                                          display: 'flex',
                                          flexWrap: 'wrap',
                                          alignItems: 'center',
                                          gap: '8px',
                                          marginTop: '4px',
                                          fontSize: '0.76rem',
                                          fontWeight: 600,
                                          color: 'var(--color-text-muted)'
                                        }}
                                      >
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                          <Clock size={12} /> {ev.time || '09:00'} hs
                                        </span>
                                        <span>•</span>
                                        <span style={{ color: meta.color, fontWeight: 800 }}>
                                          {meta.label}
                                        </span>
                                        {ev.description && (
                                          <>
                                            <span>•</span>
                                            <span>{ev.description}</span>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Botones de Acción Visibles */}
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                    <button
                                      type="button"
                                      onClick={() => exportToGoogleCalendar(ev)}
                                      style={{
                                        backgroundColor: '#2563eb',
                                        color: '#ffffff',
                                        border: 'none',
                                        padding: '7px 12px',
                                        borderRadius: '9px',
                                        fontSize: '0.74rem',
                                        fontWeight: 800,
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '5px',
                                        cursor: 'pointer',
                                        minHeight: '32px'
                                      }}
                                      title="Añadir a Google Calendar"
                                    >
                                      <CalendarPlus size={14} color="#ffffff" />
                                      <span>Google</span>
                                    </button>

                                    {!ev.isAuto && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(ev)}
                                          style={{
                                            backgroundColor: '#d97706',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 12px',
                                            borderRadius: '9px',
                                            fontSize: '0.74rem',
                                            fontWeight: 800,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            cursor: 'pointer',
                                            minHeight: '32px'
                                          }}
                                          title="Editar evento"
                                        >
                                          <Pencil size={14} color="#ffffff" />
                                          <span>Editar</span>
                                        </button>

                                        <button
                                          type="button"
                                          onClick={() => deleteEvent(ev)}
                                          style={{
                                            backgroundColor: '#dc2626',
                                            color: '#ffffff',
                                            border: 'none',
                                            padding: '7px 12px',
                                            borderRadius: '9px',
                                            fontSize: '0.74rem',
                                            fontWeight: 800,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '5px',
                                            cursor: 'pointer',
                                            minHeight: '32px'
                                          }}
                                          title="Eliminar evento"
                                        >
                                          <Trash2 size={14} color="#ffffff" />
                                          <span>Borrar</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 🔔 COLUMNA DERECHA (4 cols): Día Seleccionado + Próximos Vencimientos */}
          <div className="lg:col-span-4 space-y-5">
            {/* Tarjeta 1: Detalle del Día Seleccionado */}
            {selectedDay && (
              <div
                style={{
                  background: 'var(--color-surface)',
                  border: '2px solid #2563eb',
                  borderRadius: '22px',
                  padding: '1.25rem',
                  boxShadow: '0 10px 28px -6px rgba(37, 99, 235, 0.2)'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    paddingBottom: '10px',
                    marginBottom: '12px',
                    borderBottom: '1px solid var(--color-border)'
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 900,
                        textTransform: 'uppercase',
                        color: '#2563eb',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Fecha Seleccionada
                    </span>
                    <h3
                      style={{
                        margin: '2px 0 0',
                        fontSize: '0.98rem',
                        fontWeight: 900,
                        color: 'var(--color-text)',
                        textTransform: 'capitalize'
                      }}
                    >
                      {new Date(selectedDay + 'T12:00:00').toLocaleDateString('es-AR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long'
                      })}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => openCreateModal(selectedDay)}
                    style={{
                      background: 'linear-gradient(135deg, #059669, #0d9488)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '7px 12px',
                      borderRadius: '10px',
                      fontSize: '0.74rem',
                      fontWeight: 900,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      cursor: 'pointer',
                      minHeight: 'unset',
                      flexShrink: 0
                    }}
                    title="Agendar evento en este día"
                  >
                    <Plus size={14} color="#ffffff" />
                    <span>Agendar Aquí</span>
                  </button>
                </div>

                {selectedEvents.length === 0 ? (
                  <div
                    style={{
                      padding: '1.25rem 0.75rem',
                      textAlign: 'center',
                      background: 'var(--color-background)',
                      borderRadius: '14px',
                      border: '1px dashed var(--color-border)'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                      No hay compromisos cargados para este día.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedEvents.map((ev, i) => {
                      const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.Other;
                      return (
                        <div
                          key={i}
                          style={{
                            padding: '12px',
                            borderRadius: '14px',
                            background: 'var(--color-background)',
                            border: `1px solid ${meta.border}`
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '10px',
                                background: meta.bg,
                                color: meta.color,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}
                            >
                              {meta.icon}
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontWeight: 900,
                                  fontSize: '0.86rem',
                                  color: 'var(--color-text)',
                                  lineHeight: 1.25
                                }}
                              >
                                {ev.title}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.73rem',
                                  fontWeight: 700,
                                  color: 'var(--color-text-muted)',
                                  marginTop: '3px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px'
                                }}
                              >
                                <Clock size={12} /> {ev.time || '09:00'} hs •{' '}
                                <span style={{ color: meta.color }}>{meta.label}</span>
                              </div>
                              {ev.description && (
                                <div
                                  style={{
                                    marginTop: '6px',
                                    padding: '6px 8px',
                                    borderRadius: '8px',
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border)',
                                    fontSize: '0.74rem',
                                    color: 'var(--color-text-muted)',
                                    fontWeight: 600
                                  }}
                                >
                                  {ev.description}
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'flex-end',
                              gap: '6px',
                              marginTop: '10px',
                              paddingTop: '8px',
                              borderTop: '1px solid var(--color-border)'
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => exportToGoogleCalendar(ev)}
                              style={{
                                backgroundColor: '#2563eb',
                                color: '#ffffff',
                                border: 'none',
                                padding: '5px 10px',
                                borderRadius: '8px',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                cursor: 'pointer',
                                minHeight: 'unset'
                              }}
                            >
                              <CalendarPlus size={13} color="#ffffff" />
                              <span>Google Calendar</span>
                            </button>

                            {!ev.isAuto && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => openEditModal(ev)}
                                  style={{
                                    backgroundColor: '#d97706',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    minHeight: 'unset'
                                  }}
                                >
                                  <Pencil size={13} color="#ffffff" />
                                  <span>Editar</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => deleteEvent(ev)}
                                  style={{
                                    backgroundColor: '#dc2626',
                                    color: '#ffffff',
                                    border: 'none',
                                    padding: '5px 10px',
                                    borderRadius: '8px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    cursor: 'pointer',
                                    minHeight: 'unset'
                                  }}
                                >
                                  <Trash2 size={13} color="#ffffff" />
                                  <span>Eliminar</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Tarjeta 2: Próximos Vencimientos y Alertas */}
            <div
              style={{
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '22px',
                padding: '1.25rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(220, 38, 38, 0.14)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#dc2626'
                    }}
                  >
                    <Bell size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '0.96rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      Próximos Vencimientos
                    </h3>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      Cronograma preventivo inmediato
                    </span>
                  </div>
                </div>
              </div>

              {upcoming.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
                  <CheckCircle2 size={36} style={{ margin: '0 auto 8px', color: '#10b981' }} />
                  <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text)' }}>
                    Todo al día, sin vencimientos críticos pendientes.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {upcoming.map((ev, i) => {
                    const d = diffDays(ev.date);
                    const u = urgencyBadge(d);
                    const meta = EVENT_TYPES[ev.type] || EVENT_TYPES.Other;
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const dt = new Date(ev.date + 'T12:00:00');
                          if (!isNaN(dt.getTime())) {
                            setCurrentMonth(dt.getMonth());
                            setCurrentYear(dt.getFullYear());
                            setSelectedDay(ev.date);
                          }
                        }}
                        style={{
                          padding: '10px 12px',
                          borderRadius: '14px',
                          background: 'var(--color-background)',
                          border: '1px solid var(--color-border)',
                          borderLeft: `4px solid ${meta.color}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '10px',
                          cursor: 'pointer'
                        }}
                      >
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div
                            style={{
                              fontSize: '0.83rem',
                              fontWeight: 800,
                              color: 'var(--color-text)',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {ev.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 600,
                              color: 'var(--color-text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '5px',
                              marginTop: '3px'
                            }}
                          >
                            <Clock size={11} />
                            <span>
                              {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-AR', {
                                day: 'numeric',
                                month: 'short'
                              })}{' '}
                              · {ev.time || '09:00'} hs
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '5px',
                            flexShrink: 0
                          }}
                        >
                          <span
                            style={{
                              backgroundColor: u.bg,
                              color: u.color,
                              border: `1px solid ${u.border}`,
                              padding: '2px 8px',
                              borderRadius: '999px',
                              fontSize: '0.62rem',
                              fontWeight: 900
                            }}
                          >
                            {u.label}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              exportToGoogleCalendar(ev);
                            }}
                            style={{
                              backgroundColor: '#2563eb',
                              color: '#ffffff',
                              border: 'none',
                              padding: '3px 8px',
                              borderRadius: '6px',
                              fontSize: '0.65rem',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                              cursor: 'pointer',
                              minHeight: 'unset'
                            }}
                            title="Añadir a Google Calendar"
                          >
                            <CalendarPlus size={11} color="#ffffff" />
                            <span>Google</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── MODAL CREAR / EDITAR EVENTO ── */}
        {isModalOpen && (
          <div
            onClick={() => setIsModalOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(2, 6, 23, 0.82)',
              backdropFilter: 'blur(8px)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
          >
            <form
              onSubmit={handleSaveEvent}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'var(--color-surface-solid, #0f172a)',
                color: 'var(--color-text)',
                border: '2px solid var(--color-border)',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '480px',
                padding: '1.5rem',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.45)',
                maxHeight: '92vh',
                overflowY: 'auto'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--color-border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      background: 'linear-gradient(135deg, #2563eb, #4f46e5)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff'
                    }}
                  >
                    <BellDot size={22} color="#ffffff" />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: 'var(--color-text)' }}>
                      {editingEventId ? 'Editar Evento de Agenda' : 'Agendar Nuevo Evento H&S'}
                    </h2>
                    <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      Configurá fecha, hora de alerta y categoría preventiva
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)',
                    borderRadius: '10px',
                    width: '36px',
                    height: '36px',
                    padding: 0,
                    minHeight: 'unset',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer'
                  }}
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Título del Evento / Vencimiento *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Ej: Auditoría de Tableros Eléctricos / Simulacro"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.88rem',
                      fontWeight: 600
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Fecha Programada *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.86rem',
                        fontWeight: 700
                      }}
                    />
                  </div>

                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        color: 'var(--color-text)',
                        marginBottom: '5px'
                      }}
                    >
                      Hora de Alerta *
                    </label>
                    <input
                      type="time"
                      required
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        marginBottom: 0,
                        borderRadius: '12px',
                        background: 'var(--color-background)',
                        border: '1px solid var(--color-border)',
                        color: 'var(--color-text)',
                        fontSize: '0.86rem',
                        fontWeight: 700
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Categoría *
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value as CalendarEvent['type'] })
                    }
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.86rem',
                      fontWeight: 700
                    }}
                  >
                    {Object.entries(EVENT_TYPES)
                      .filter(([k]) => k !== 'SystemAuto')
                      .map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      color: 'var(--color-text)',
                      marginBottom: '5px'
                    }}
                  >
                    Descripción / Sector / Responsable (Opcional)
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Detalles adicionales, ubicación o normativa aplicable..."
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      marginBottom: 0,
                      borderRadius: '12px',
                      background: 'var(--color-background)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text)',
                      fontSize: '0.85rem',
                      fontWeight: 600
                    }}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '20px',
                  paddingTop: '14px',
                  borderTop: '1px solid var(--color-border)'
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    backgroundColor: '#64748b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 18px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #059669, #0d9488)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 22px',
                    borderRadius: '12px',
                    fontSize: '0.82rem',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(5, 150, 105, 0.35)'
                  }}
                >
                  {editingEventId ? 'Guardar Cambios' : 'Agendar Evento'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AnimatedPage>
  );
}
