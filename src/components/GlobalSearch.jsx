import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search, X, ShieldCheck, Flame, ClipboardList,
    TriangleAlert, ScrollText, Lightbulb, KeySquare,
    FileText, Bot, HardHat
} from 'lucide-react';

// Map each history key to navigation info
const SOURCES = [
    {
        key: 'ats_history', label: 'ATS', color: '#10b981', bg: 'rgba(16,185,129,0.1)',
        icon: <ShieldCheck size={15} />, nav: '/ats-history',
        titleField: 'empresa', subtitleField: 'obra', dateField: 'fecha'
    },
    {
        key: 'fireload_history', label: 'Carga Fuego', color: '#f97316', bg: 'rgba(249,115,22,0.1)',
        icon: <Flame size={15} />, nav: '/fire-load-history',
        titleField: 'empresa', subtitleField: 'sector', dateField: 'createdAt'
    },
    {
        key: 'inspections_history', label: 'Inspección', color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',
        icon: <ClipboardList size={15} />, nav: '/history',
        titleField: 'name', subtitleField: 'location', dateField: 'date'
    },
    {
        key: 'risk_matrix_history', label: 'Matriz', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',
        icon: <TriangleAlert size={15} />, nav: '/history',
        titleField: 'name', subtitleField: 'location', dateField: 'createdAt'
    },
    {
        key: 'reports_history', label: 'Informe', color: '#ec4899', bg: 'rgba(236,72,153,0.1)',
        icon: <ScrollText size={15} />, nav: '/history',
        titleField: 'title', subtitleField: 'company', dateField: 'createdAt'
    },
    {
        key: 'tool_checklists_history', label: 'Checklist', color: '#14b8a6', bg: 'rgba(20,184,166,0.1)',
        icon: <ClipboardList size={15} />, nav: '/checklists-history',
        titleField: 'equipo', subtitleField: 'empresa', dateField: 'fecha'
    },
    {
        key: 'lighting_history', label: 'Iluminación', color: '#eab308', bg: 'rgba(234,179,8,0.1)',
        icon: <Lightbulb size={15} />, nav: '/lighting-history',
        titleField: 'empresa', subtitleField: 'sector', dateField: 'date'
    },
    {
        key: 'work_permits_history', label: 'Permiso', color: '#2563eb', bg: 'rgba(37,99,235,0.1)',
        icon: <KeySquare size={15} />, nav: '/work-permit-history',
        titleField: 'empresa', subtitleField: 'tarea', dateField: 'createdAt'
    },
    {
        key: 'ai_advisor_history', label: 'Asesor IA', color: '#a855f7', bg: 'rgba(168,85,247,0.1)',
        icon: <Bot size={15} />, nav: '/ai-advisor',
        titleField: 'task', subtitleField: null, dateField: 'date'
    },
];

export default function GlobalSearch({ onClose }) {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const inputRef = useRef(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    useEffect(() => {
        if (!query.trim() || query.length < 2) {
            setResults([]);
            return;
        }
        const q = query.toLowerCase();
        const found = [];

        SOURCES.forEach(src => {
            try {
                const items = JSON.parse(localStorage.getItem(src.key) || '[]');
                items.forEach(item => {
                    const title = item[src.titleField] || '';
                    const subtitle = src.subtitleField ? (item[src.subtitleField] || '') : '';
                    const combined = `${title} ${subtitle}`.toLowerCase();
                    if (combined.includes(q)) {
                        found.push({
                            ...src,
                            id: item.id || item.date,
                            title: title || '—',
                            subtitle,
                            date: item[src.dateField]
                        });
                    }
                });
            } catch { /* skip malformed */ }
        });

        // Sort by date desc, limit 12
        found.sort((a, b) => new Date(b.date) - new Date(a.date));
        setResults(found.slice(0, 12));
    }, [query]);

    const handleSelect = (item) => {
        navigate(item.nav);
        onClose();
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
            padding: '5rem 1rem 2rem',
            animation: 'fadeIn 0.18s ease'
        }} onClick={onClose}>
            <div
                onClick={e => e.stopPropagation()}
                style={{
                    background: 'var(--color-surface)', borderRadius: '20px',
                    width: '100%', maxWidth: '580px',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.4)',
                    border: '1px solid var(--color-border)',
                    overflow: 'hidden'
                }}
            >
                {/* Search input */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '1rem 1.2rem', borderBottom: '1px solid var(--color-border)' }}>
                    <Search size={20} color="var(--color-primary)" style={{ flexShrink: 0 }} />
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder="Buscar en todos los módulos..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => e.key === 'Escape' && onClose()}
                        style={{
                            flex: 1, border: 'none', outline: 'none',
                            background: 'transparent', fontSize: '1.05rem',
                            color: 'var(--color-text)', fontWeight: 500
                        }}
                    />
                    {query && (
                        <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.2rem', display: 'flex' }}>
                            <X size={18} />
                        </button>
                    )}
                    <button onClick={onClose} style={{ background: 'rgba(0,0,0,0.06)', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)', padding: '0.3rem 0.6rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                        ESC
                    </button>
                </div>

                {/* Results */}
                <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
                    {query.length < 2 ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>
                            Escribí al menos 2 caracteres para buscar...
                        </div>
                    ) : results.length === 0 ? (
                        <div style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                            <Search size={36} style={{ opacity: 0.2, marginBottom: '0.8rem', display: 'block', margin: '0 auto 0.8rem' }} />
                            <p style={{ margin: 0, fontWeight: 600 }}>Sin resultados para "{query}"</p>
                            <p style={{ margin: '0.4rem 0 0', fontSize: '0.8rem' }}>Intentá con otro término</p>
                        </div>
                    ) : (
                        <div>
                            <div style={{ padding: '0.6rem 1.2rem 0.2rem', fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {results.length} resultado{results.length !== 1 ? 's' : ''}
                            </div>
                            {results.map((item, i) => (
                                <div
                                    key={`${item.key}-${item.id}-${i}`}
                                    onClick={() => handleSelect(item)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.9rem',
                                        padding: '0.8rem 1.2rem', cursor: 'pointer',
                                        borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none',
                                        transition: 'background 0.12s'
                                    }}
                                    onMouseOver={e => e.currentTarget.style.background = 'var(--color-background)'}
                                    onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                                >
                                    <div style={{
                                        width: '36px', height: '36px', borderRadius: '10px',
                                        background: item.bg, color: item.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                    }}>
                                        {item.icon}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {item.title}
                                        </div>
                                        <div style={{ fontSize: '0.73rem', color: 'var(--color-text-muted)', display: 'flex', gap: '0.5rem', marginTop: '0.1rem' }}>
                                            <span style={{ background: item.bg, color: item.color, padding: '0.05rem 0.45rem', borderRadius: '20px', fontWeight: 700, fontSize: '0.62rem' }}>
                                                {item.label}
                                            </span>
                                            {item.subtitle && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.subtitle}</span>}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                                        {item.date ? new Date(item.date).toLocaleDateString('es-AR') : ''}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer hint */}
                <div style={{ padding: '0.6rem 1.2rem', borderTop: '1px solid var(--color-border)', display: 'flex', gap: '1rem', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                    <span>↵ para ir al módulo</span>
                    <span>ESC para cerrar</span>
                </div>
            </div>
        </div>
    );
}
