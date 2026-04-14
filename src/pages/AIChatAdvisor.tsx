import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
    ArrowLeft, Send, ShieldAlert, HardHat,
    Lightbulb, Gavel, ClipboardList, Copy,
    Check, Download, Sparkles, Loader2,
    Mic, MicOff, History, ChevronDown, ChevronUp,
    RotateCcw, Clock, Database, Zap
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';
import AdBanner from '../components/AdBanner';
import { toast } from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

// ── Subcomponent for history panel ─────────────────────────────────────────
function HistoryPanel({ onLoad }) {
    const [open, setOpen] = useState(false);
    let history = [];
    try {
        const raw = localStorage.getItem('ai_advisor_history');
        if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
                history = parsed.filter(item => item && item.id && item.task).slice(0, 5);
            }
        }
    } catch (err) {
        console.error("Error loading ai_advisor_history:", err);
    }

    if (history.length === 0) return null;

    return (
        <div style={{ marginBottom: '1.5rem' }}>
            <button
                onClick={() => setOpen(o => !o)}
                style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'var(--color-surface)', border: '1px solid var(--color-border)',
                    borderRadius: open ? '14px 14px 0 0' : '14px',
                    padding: '0.85rem 1.2rem', cursor: 'pointer', transition: 'all 0.2s'
                }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
                    <History size={16} color="var(--color-primary)" />
                    Consultas anteriores ({history.length})
                </span>
                {open ? <ChevronUp size={16} color="var(--color-text-muted)" /> : <ChevronDown size={16} color="var(--color-text-muted)" />}
            </button>
            {open && (
                <div style={{
                    border: '1px solid var(--color-border)', borderTop: 'none',
                    borderRadius: '0 0 14px 14px', overflow: 'hidden'
                }}>
                    {history.map((item, i) => (
                        <div
                            key={item.id}
                            style={{
                                padding: '0.9rem 1.2rem',
                                borderBottom: i < history.length - 1 ? '1px solid var(--color-border)' : 'none',
                                display: 'flex', alignItems: 'center', gap: '1rem',
                                background: 'var(--color-surface)',
                                transition: 'background 0.15s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                            onMouseOut={e => e.currentTarget.style.background = 'var(--color-surface)'}
                        >
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.88rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {item.task}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                                    <Clock size={11} />
                                    {new Date(item.date).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            <button
                                onClick={() => onLoad(item)}
                                title="Cargar esta consulta"
                                style={{
                                    background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)',
                                    borderRadius: '8px', padding: '0.4rem 0.7rem',
                                    color: 'var(--color-primary)', cursor: 'pointer',
                                    fontSize: '0.75rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', gap: '0.3rem',
                                    whiteSpace: 'nowrap', flexShrink: 0
                                }}
                            >
                                <RotateCcw size={12} /> Cargar
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const LOADING_MESSAGES = [
    "Analizando contexto de la tarea...",
    "Identificando riesgos potenciales...",
    "Seleccionando Elementos de Protección Personal...",
    "Redactando medidas preventivas...",
    "Consultando la normativa local aplicable...",
    "Dando los toques finales al reporte..."
];

const QUICK_PROMPTS = [
    "Trabajos en altura con andamios",
    "Limpieza de tanque de combustible",
    "Excavación manual en vía pública",
    "Trabajos en caliente",
    "Uso de amoladora angular"
];

export default function AIChatAdvisor(): React.ReactElement | null {
    const navigate = useNavigate();
    useDocumentTitle('Asesor de Seguridad IA');
    const [task, setTask] = useState('');
    const [loading, setLoading] = useState(false);
    const [loadingTextIndex, setLoadingTextIndex] = useState(0);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const [userCountry, setUserCountry] = useState('argentina');

    useEffect(() => {
        const savedData = localStorage.getItem('personalData');
        if (savedData) {
            try {
                const parsed = JSON.parse(savedData);
                if (parsed.country) setUserCountry(parsed.country);
            } catch (err) {
                console.error(err);
            }
        }
    }, []);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (loading) {
            interval = setInterval(() => {
                setLoadingTextIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
            }, 2500);
        } else {
            setLoadingTextIndex(0);
        }
        return () => clearInterval(interval);
    }, [loading]);

    const [isListening, setIsListening] = useState(false);

    const toggleListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            toast.error('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        const langMap: Record<string, string> = {
            chile: 'es-CL', bolivia: 'es-BO', paraguay: 'es-PY', uruguay: 'es-UY', argentina: 'es-AR'
        };
        recognition.lang = langMap[userCountry] || 'es-AR';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setTask(prev => prev ? `${prev} ${transcript}` : transcript);
            setIsListening(false);
        };

        recognition.start();
    };

    const getRecentContext = () => {
        const safeParse = (key) => {
            try {
                const raw = localStorage.getItem(key);
                if (!raw || raw === 'undefined') return [];
                const parsed = JSON.parse(raw);
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                console.error(`[Advisor IA] Error parsing ${key}:`, err);
                return [];
            }
        };

        try {
            const ats = safeParse('atsHistory')
                .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                .slice(0, 3)
                .map(a => `- Fecha: ${a.fecha}, Tarea: ${a.tarea}, Ubicación: ${a.ubicacion}`);

            const insp = safeParse('inspections_history')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 3)
                .map(i => `- Fecha: ${i.date}, Sector: ${i.sector}, Resultado: ${i.score}%`);

            const risk = safeParse('risk_assessment_history')
                .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
                .slice(0, 3)
                .map(r => `- Fecha: ${r.date || (r.createdAt && r.createdAt.split('T')[0])}, Tarea: ${r.name}, Nivel de Riesgo: ${r.riskLevel}`);

            let ctx = [];
            if (ats.length) ctx.push("ÚLTIMOS ATS CREADOS:\n" + ats.join("\n"));
            if (insp.length) ctx.push("ÚLTIMAS INSPECCIONES REALIZADAS:\n" + insp.join("\n"));
            if (risk.length) ctx.push("ÚLTIMAS EVALUACIONES DE RIESGO:\n" + risk.join("\n"));
            return ctx.join("\n\n");
        } catch (err) {
            console.error("[Advisor IA] Error getting context:", err);
            return "";
        }
    };

    const handleNewQuery = () => {
        setResult(null);
        setTask('');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleLoadHistory = (item) => {
        setTask(item.task);
        setResult(item);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDownloadPDF = () => {
        if (!result) return;
        setLoading(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Color Palette
            const colors = {
                primary: [37, 99, 235] as [number, number, number],    // blue-600
                danger: [239, 68, 68] as [number, number, number],     // red-500
                success: [16, 185, 129] as [number, number, number],   // emerald-500
                warning: [249, 115, 22] as [number, number, number],   // orange-500
                text: [31, 41, 55] as [number, number, number],
                muted: [107, 114, 128] as [number, number, number],
                border: [229, 231, 235] as [number, number, number]
            };

            // Enterprise Header
            doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.rect(0, 0, pageWidth, 40, 'F');

            // Logo Placeholder or Text Left
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('REPORTE IA H&S', 15, 18);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Análisis Estadístico y Preventivo Inteligente', 15, 25);

            // Right side details
            doc.setFontSize(9);
            const dateStr = `Generado: ${new Date().toLocaleDateString()}`;
            const timeStr = `Hora: ${new Date().toLocaleTimeString()}`;
            const countryStr = `Contexto legal: ${userCountry.toUpperCase()}`;
            
            doc.text(dateStr, pageWidth - 15, 15, { align: 'right' });
            doc.text(timeStr, pageWidth - 15, 21, { align: 'right' });
            doc.text(countryStr, pageWidth - 15, 27, { align: 'right' });

            // Beautiful Underline in Header
            doc.setDrawColor(255, 255, 255);
            doc.setGlobalAlpha(0.3);
            doc.line(15, 32, pageWidth - 15, 32);
            doc.setGlobalAlpha(1.0);

            // Task Description Area
            let currentY = 50;
            doc.setFillColor(249, 250, 251); // gray-50
            doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'F');
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.roundedRect(15, currentY, pageWidth - 30, 25, 3, 3, 'S');

            doc.setTextColor(...colors.text);
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Descripción de la Tarea/Situación:', 20, currentY + 8);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const taskLines = doc.splitTextToSize(result.task, pageWidth - 40);
            doc.text(taskLines, 20, currentY + 15);

            currentY += 35 + (taskLines.length * 5) - 5;

            // Sections
            const createSection = (title, items, color, iconContext = '') => {
                // Section Title Box
                doc.setFillColor(color[0], color[1], color[2]);
                doc.rect(15, currentY, 5, 8, 'F');
                doc.setFillColor(color[0], color[1], color[2]);
                doc.setGlobalAlpha(0.1);
                doc.rect(20, currentY, pageWidth - 35, 8, 'F');
                doc.setGlobalAlpha(1.0);

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.setTextColor(color[0], color[1], color[2]);
                doc.text(title.toUpperCase(), 23, currentY + 6);
                currentY += 12;

                if (!items || items.length === 0) {
                    doc.setTextColor(...colors.muted);
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(10);
                    doc.text('No se detectaron elementos en esta sección.', 20, currentY + 2);
                    currentY += 10;
                    return;
                }

                autoTable(doc, {
                    startY: currentY,
                    body: items.map(item => [item]),
                    columns: [{ header: '', dataKey: 'item' }],
                    theme: 'plain',
                    styles: { 
                        fontSize: 9.5, 
                        cellPadding: { top: 2, right: 4, bottom: 2, left: 2 },
                        textColor: colors.text 
                    },
                    columnStyles: { 0: { cellWidth: pageWidth - 35 } },
                    margin: { left: 20 },
                    didDrawCell: (data) => {
                        // Drawing a tiny bullet point for each item
                        doc.setFillColor(color[0], color[1], color[2]);
                        doc.circle(18, data.cell.y + data.cell.height / 2, 0.8, 'F');
                    },
                    didDrawPage: (data) => { currentY = data.cursor.y; }
                });
                currentY += 8;
            };

            createSection('Riesgos Detectados', result.riesgos, colors.danger);
            createSection('EPP Recomendado', result.epp, colors.primary);
            createSection('Medidas Preventivas', result.recomendaciones, colors.success);
            
            const countryLabel = userCountry.charAt(0).toUpperCase() + userCountry.slice(1);
            createSection(`Marco Legal (${countryLabel})`, result.normativa, [139, 92, 246]); // violet-500

            // Professional Signature Section
            const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
            const profName = personalData.fullName || 'Profesional de HyS';
            const profMat = personalData.matricula || '---';
            const profTitle = personalData.profesion || 'Higiene y Seguridad';
            const userSignature = localStorage.getItem('userSignature'); // Base64 image
            const userStamp = localStorage.getItem('userStamp'); // Optional stamp

            currentY += 25;
            if (currentY > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                currentY = 25;
            }

            const signBoxWidth = 80;
            const signX = pageWidth - signBoxWidth - 15;
            const signBoxHeight = 45;

            // Optional: Draw a subtle box for the signature
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.3);
            doc.roundedRect(signX, currentY, signBoxWidth, signBoxHeight, 2, 2, 'S');

            // Insert Signature Image if available
            try {
                if (userSignature) {
                    doc.addImage(userSignature, 'PNG', signX + 15, currentY + 2, 50, 20);
                } else {
                    doc.setTextColor(...colors.muted);
                    doc.setFont('helvetica', 'italic');
                    doc.setFontSize(9);
                    doc.text('Firma Digital Pendiente', signX + signBoxWidth/2, currentY + 15, { align: 'center' });
                }
            } catch (e) {
                console.warn('Could not insert signature image', e);
            }

            // Divider line for Name
            doc.setDrawColor(colors.muted[0], colors.muted[1], colors.muted[2]);
            doc.setLineWidth(0.4);
            doc.line(signX + 10, currentY + 26, signX + signBoxWidth - 10, currentY + 26);

            doc.setTextColor(...colors.text);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text(profName, signX + signBoxWidth/2, currentY + 31, { align: 'center' });

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.text(profTitle, signX + signBoxWidth/2, currentY + 36, { align: 'center' });
            doc.text(`Mat: ${profMat}`, signX + signBoxWidth/2, currentY + 41, { align: 'center' });

            // Add stamp text if needed
            if (!userStamp && profName !== 'Profesional de HyS') {
                doc.setTextColor(37, 99, 235);
                doc.setFontSize(8);
                doc.setGlobalAlpha(0.2);
                doc.setFont('helvetica', 'bolditalic');
                doc.text('VALIDADO POR H&S', signX + 15, currentY + 12, { angle: -15 });
                doc.setGlobalAlpha(1.0);
            }

            // Footer
            const pageHeight = doc.internal.pageSize.getHeight();
            doc.setFontSize(7);
            doc.setTextColor(...colors.muted);
            doc.text('Generado por Asistente de Higiene y Seguridad Profesional - Todos los derechos reservados', pageWidth/2, pageHeight - 10, { align: 'center' });

            doc.save(`Analisis_HYS_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('[PDF ERROR]', error);
            toast.error('Error al generar el PDF. Revisa que el navegador no esté bloqueando las descargas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!task.trim()) return;

        setLoading(true);
        setResult(null);
        setLoadingTextIndex(0);

        try {
            const contextData = getRecentContext();
            const response = await fetch(`${API_BASE_URL}/api/ai-advisor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription: task, contextData, country: userCountry })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error del servidor (${response.status})`);
            }

            const data = await response.json();
            setResult(data);

            let history = [];
            try {
                const raw = localStorage.getItem('ai_advisor_history');
                if (raw && raw !== 'undefined' && raw !== '') {
                    const parsed = JSON.parse(raw);
                    history = Array.isArray(parsed) ? parsed : [];
                }
            } catch (err) {
                console.error("[Advisor IA] Error parsing history for save:", err);
                history = [];
            }
            
            const newRecord = {
                id: Date.now().toString(),
                date: new Date().toISOString(),
                ...data
            };
            try {
                localStorage.setItem('ai_advisor_history', JSON.stringify([newRecord, ...history].slice(0, 20)));
            } catch (err) {
                console.error("[Advisor IA] Error saving to history:", err);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error(`Error: ${error.message}. Por favor, verifica tu conexión o intenta más tarde.`);
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        if (!result) return;
        const text = `ANÁLISIS DE SEGURIDAD IA\nTarea: ${result.task}\n\nRIESGOS:\n- ${result.riesgos.join('\n- ')}\n\nEPP RECOMENDADO:\n- ${result.epp.join('\n- ')}\n\nRECOMENDACIONES:\n- ${result.recomendaciones.join('\n- ')}\n\nNORMATIVA:\n- ${result.normativa.join('\n- ')}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/#tools')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                    className="hover:opacity-70 transition-opacity"
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={26} color="var(--color-primary)" className="animate-pulse" />
                    <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800, background: 'linear-gradient(to right, var(--color-primary), #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Asesor de Seguridad IA
                    </h1>
                </div>
            </div>

            {/* History Panel */}
            <HistoryPanel onLoad={handleLoadHistory} />

            {/* Input Section */}
            <div className="card" style={{ padding: '1.8rem', marginBottom: '2rem', background: 'var(--color-surface)', border: '1px solid var(--color-primary-light)', boxShadow: '0 8px 30px rgba(0,0,0,0.04)' }}>
                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 700 }}>¿Qué tarea vas a analizar hoy?</h3>
                <p style={{ margin: '0 0 1.2rem 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                    Describe la tarea con el mayor detalle posible para obtener un análisis preciso y personalizado.
                </p>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                    <div style={{ position: 'relative' }}>
                        <textarea
                            placeholder="Ej: Pintura de fachada con hidroelevador a 15 metros de altura cerca de tendido eléctrico."
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            disabled={loading}
                            style={{
                                width: '100%',
                                minHeight: '130px',
                                padding: '1.2rem',
                                paddingRight: '4rem',
                                borderRadius: '16px',
                                border: '2px solid var(--color-border)',
                                background: 'var(--color-background)',
                                color: 'var(--color-text)',
                                fontSize: '1.05rem',
                                resize: 'vertical',
                                transition: 'border-color 0.2s',
                                opacity: loading ? 0.7 : 1
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--color-border)'}
                        />
                        <button
                            type="button"
                            onClick={toggleListening}
                            disabled={loading}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '1rem',
                                background: isListening ? '#ef4444' : 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '50%',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                color: isListening ? 'white' : 'var(--color-primary)',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isListening ? '0 0 20px rgba(239, 68, 68, 0.5)' : '0 4px 10px rgba(0,0,0,0.05)',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                                zIndex: 10
                            }}
                            title={isListening ? 'Escuchando...' : 'Dictar por voz'}
                        >
                            {isListening ? <MicOff size={22} /> : <Mic size={22} />}
                        </button>
                    </div>

                    {/* Quick Prompts (Chips) */}
                    {!task && !loading && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', marginTop: '-0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem', width: '100%' }}>
                                <Zap size={14} color="#eab308" /> Sugerencias rápidas:
                            </span>
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setTask(prompt)}
                                    style={{
                                        background: 'var(--color-background)',
                                        border: '1px solid var(--color-border)',
                                        borderRadius: '20px',
                                        padding: '0.4rem 0.8rem',
                                        fontSize: '0.8rem',
                                        color: 'var(--color-text)',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.background = 'var(--color-primary-light)';
                                        e.currentTarget.style.borderColor = 'var(--color-primary)';
                                        e.currentTarget.style.color = 'var(--color-primary)';
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.background = 'var(--color-background)';
                                        e.currentTarget.style.borderColor = 'var(--color-border)';
                                        e.currentTarget.style.color = 'var(--color-text)';
                                    }}
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.1)', padding: '0.5rem 0.9rem', borderRadius: '10px', alignSelf: 'flex-start' }}>
                        <Database size={15} /> Evaluando contexto reciente de tu dispositivo para un reporte más exacto.
                    </div>

                    <button
                        type="submit"
                        disabled={loading || !task.trim()}
                        className="btn-primary"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.8rem',
                            marginTop: '0.5rem',
                            padding: '1rem',
                            fontSize: '1.1rem',
                            borderRadius: '14px'
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={22} className="animate-spin" />
                                <span style={{ minWidth: '220px', textAlign: 'left' }}>{LOADING_MESSAGES[loadingTextIndex]}</span>
                            </>
                        ) : (
                            <>
                                <Send size={22} />
                                Generar Análisis IA
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {result && !loading && (
                <div style={{ animation: 'fadeIn 0.6s ease-out' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.8rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Resultados del Análisis</h2>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button
                                onClick={handleDownloadPDF}
                                className="btn-secondary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '10px',
                                    marginTop: 0,
                                    width: 'auto',
                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                    color: '#ffffff',
                                    border: 'none',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)'
                                }}
                            >
                                <Download size={18} />
                                Exportar PDF
                            </button>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.6rem',
                                    background: copied ? 'rgba(16, 185, 129, 0.1)' : 'var(--color-surface)',
                                    border: `1px solid ${copied ? '#10b981' : 'var(--color-border)'}`,
                                    padding: '0.6rem 1.2rem',
                                    borderRadius: '10px',
                                    color: copied ? '#10b981' : 'var(--color-text)',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem',
                                    fontWeight: 600,
                                    transition: 'all 0.2s'
                                }}
                            >
                                {copied ? <Check size={18} /> : <Copy size={18} />}
                                {copied ? 'Copiado al Portapapeles' : 'Copiar Todo'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Risks */}
                        <div className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #ef4444', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#ef4444', background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '10px' }}>
                                <ShieldAlert size={22} />
                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Riesgos Detectados</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                                {(result.riesgos || []).map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                                {(!result.riesgos || result.riesgos.length === 0) && <li>No hay riesgos detectados</li>}
                            </ul>
                        </div>

                        {/* PPE */}
                        <div className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #3b82f6', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#3b82f6', background: 'rgba(59,130,246,0.1)', padding: '0.8rem', borderRadius: '10px' }}>
                                <HardHat size={22} />
                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>EPP Recomendado</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                                {(result.epp || []).map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                                {(!result.epp || result.epp.length === 0) && <li>No hay EPP recomendados</li>}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #10b981', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '0.8rem', borderRadius: '10px' }}>
                                <Lightbulb size={22} />
                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Medidas Preventivas</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--color-text)' }}>
                                {(result.recomendaciones || []).map((item, i) => <li key={i} style={{ marginBottom: '0.5rem' }}>{item}</li>)}
                                {(!result.recomendaciones || result.recomendaciones.length === 0) && <li>No hay medidas preventivas</li>}
                            </ul>
                        </div>

                        {/* Legislation */}
                        <div className="card hover-scale" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', borderTop: '4px solid #8b5cf6', transition: 'transform 0.2s, box-shadow 0.2s' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', padding: '0.8rem', borderRadius: '10px' }}>
                                <Gavel size={22} />
                                <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem' }}>Marco Legal ({userCountry.charAt(0).toUpperCase() + userCountry.slice(1)})</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.95rem', lineHeight: '1.6', listStyleType: 'disc', color: 'var(--color-text)' }}>
                                {(result.normativa || []).map((item, i) => <li key={i} style={{ marginBottom: '0.5rem', paddingLeft: '0.2rem' }}>{item}</li>)}
                                {(!result.normativa || result.normativa.length === 0) && <li>No hay normativa registrada</li>}
                            </ul>
                        </div>
                    </div>

                    {/* Nueva Consulta Button */}
                    <div style={{ marginTop: '3rem', textAlign: 'center' }}>
                        <button
                            onClick={handleNewQuery}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.8rem',
                                padding: '1rem 2.5rem',
                                background: 'var(--color-surface)',
                                color: 'var(--color-primary)', border: '2px solid var(--color-primary)', 
                                borderRadius: '16px',
                                fontWeight: 800, fontSize: '1.05rem', cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseOver={e => { e.currentTarget.style.background = 'var(--color-primary-light)'; }}
                            onMouseOut={e => { e.currentTarget.style.background = 'var(--color-surface)'; }}
                        >
                            <RotateCcw size={20} /> Realizar Nueva Consulta
                        </button>
                    </div>

                    <AdBanner />
                </div>
            )}
        </div>
    );
}
