import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Send, ShieldAlert, HardHat,
    Lightbulb, Gavel, ClipboardList, Copy,
    Check, Download, Sparkles, Loader2,
    Mic, MicOff
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { API_BASE_URL } from '../config';

export default function AIChatAdvisor() {
    const navigate = useNavigate();
    const [task, setTask] = useState('');
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isListening, setIsListening] = useState(false);

    const toggleListening = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert('Tu navegador no soporta reconocimiento de voz. Prueba con Chrome.');
            return;
        }

        if (isListening) {
            setIsListening(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'es-AR';
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

    const handleDownloadPDF = () => {
        if (!result) return;
        setLoading(true);

        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Color Palette
            const colors = {
                primary: [37, 99, 235],    // blue-600
                danger: [239, 68, 68],     // red-500
                success: [16, 185, 129],   // emerald-500
                warning: [249, 115, 22],   // orange-500
                text: [31, 41, 55],        // gray-800
                muted: [107, 114, 128]     // gray-500
            };

            // Header
            doc.setFillColor(...colors.primary);
            doc.rect(0, 0, pageWidth, 35, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('ASISTENTE H&S', 15, 15);

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Análisis de Seguridad con Inteligencia Artificial', 15, 22);

            doc.setFontSize(8);
            doc.text(`Fecha de consulta: ${new Date().toLocaleString()}`, 15, 28);

            // Task Title
            doc.setTextColor(...colors.text);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Análisis de Tarea:', 15, 45);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            const taskLines = doc.splitTextToSize(result.task, pageWidth - 30);
            doc.text(taskLines, 15, 52);

            let currentY = 52 + (taskLines.length * 7);

            // Sections
            const createSection = (title, items, color) => {
                doc.setFillColor(...color);
                doc.rect(15, currentY, 4, 8, 'F');

                doc.setFont('helvetica', 'bold');
                doc.setFontSize(12);
                doc.setTextColor(...colors.text);
                doc.text(title, 22, currentY + 6);
                currentY += 12;

                autoTable(doc, {
                    startY: currentY,
                    body: items.map(item => [item]),
                    columns: [{ header: '', dataKey: 'item' }],
                    theme: 'plain',
                    styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { cellWidth: pageWidth - 30 } },
                    margin: { left: 20 },
                    didDrawPage: (data) => { currentY = data.cursor.y; }
                });
                currentY += 10;
            };

            createSection('Riesgos Detectados', result.riesgos, colors.danger);
            createSection('EPP Recomendado', result.epp, colors.primary);
            createSection('Medidas Preventivas', result.recomendaciones, colors.success);
            createSection('Marco Legal (Argentina)', result.normativa, [139, 92, 246]);

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(...colors.muted);
            doc.setFont('helvetica', 'italic');
            const disclaimer = 'Este análisis es generado por IA y debe ser validado por un profesional matriculado bajo su propia responsabilidad.';
            const disclaimerLines = doc.splitTextToSize(disclaimer, pageWidth - 30);
            doc.text(disclaimerLines, 15, doc.internal.pageSize.getHeight() - 15);

            doc.save(`Analisis_H&S_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('[PDF ERROR]', error);
            alert('Error al generar el PDF. Revisa que el navegador no esté bloqueando las descargas.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!task.trim()) return;

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-advisor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription: task })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Error del servidor (${response.status})`);
            }

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error('Error:', error);
            alert(`Error: ${error.message}. Por favor, verifica tu conexión o intenta más tarde.`);
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
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={24} color="var(--color-primary)" />
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Asesor de Seguridad IA</h1>
                </div>
            </div>

            {/* Input Section */}
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', background: 'var(--color-surface)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700 }}>¿Qué tarea vas a analizar?</h3>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ position: 'relative' }}>
                        <textarea
                            placeholder="Ej: Pintura de fachada con hidroelevador, limpieza de tanque de combustible, etc."
                            value={task}
                            onChange={(e) => setTask(e.target.value)}
                            style={{
                                width: '100%',
                                minHeight: '120px',
                                padding: '1rem',
                                paddingRight: '3.5rem',
                                borderRadius: '12px',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-background)',
                                color: 'var(--color-text)',
                                fontSize: '1rem',
                                resize: 'vertical'
                            }}
                        />
                        <button
                            type="button"
                            onClick={toggleListening}
                            style={{
                                position: 'absolute',
                                right: '1rem',
                                top: '1rem',
                                background: isListening ? '#ef4444' : '#f8fafc',
                                border: '1px solid var(--color-border)',
                                borderRadius: '50%',
                                width: '46px',
                                height: '46px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: 0,
                                color: isListening ? 'white' : 'var(--color-primary)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                boxShadow: isListening ? '0 0 15px rgba(239, 68, 68, 0.4)' : '0 2px 4px rgba(0,0,0,0.05)',
                                animation: isListening ? 'pulse 1.5s infinite' : 'none',
                                zIndex: 10
                            }}
                            title={isListening ? 'Escuchando...' : 'Hablar'}
                        >
                            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                        </button>
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
                            marginTop: 0
                        }}
                    >
                        {loading ? (
                            <>
                                <Loader2 size={20} className="animate-spin" />
                                Analizando situación...
                            </>
                        ) : (
                            <>
                                <Send size={20} />
                                Generar Análisis IA
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* Results Section */}
            {result && (
                <div style={{ animation: 'fadeIn 0.5s ease' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Resultados del Análisis</h2>
                        <div style={{ display: 'flex', gap: '0.8rem' }}>
                            <button
                                onClick={handleDownloadPDF}
                                className="btn-secondary"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    marginTop: 0,
                                    width: 'auto',
                                    background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                                    color: 'white',
                                    border: 'none',
                                    fontSize: '0.85rem'
                                }}
                            >
                                <Download size={16} />
                                Descargar PDF
                            </button>
                            <button
                                onClick={handleCopy}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'transparent',
                                    border: '1px solid var(--color-border)',
                                    padding: '0.5rem 1rem',
                                    borderRadius: '8px',
                                    color: 'var(--color-text)',
                                    cursor: 'pointer',
                                    fontSize: '0.85rem'
                                }}
                            >
                                {copied ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                                {copied ? 'Copiado' : 'Copiar Todo'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem' }}>
                        {/* Risks */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#ef4444' }}>
                                <ShieldAlert size={20} />
                                <h4 style={{ margin: 0, fontWeight: 700 }}>Riesgos Detectados</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {result.riesgos.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>

                        {/* PPE */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#3b82f6' }}>
                                <HardHat size={20} />
                                <h4 style={{ margin: 0, fontWeight: 700 }}>EPP Recomendado</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {result.epp.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>

                        {/* Recommendations */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid #10b981' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#10b981' }}>
                                <Lightbulb size={20} />
                                <h4 style={{ margin: 0, fontWeight: 700 }}>Medidas Preventivas</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                {result.recomendaciones.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>

                        {/* Legislation */}
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', borderLeft: '4px solid #8b5cf6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#8b5cf6' }}>
                                <Gavel size={20} />
                                <h4 style={{ margin: 0, fontWeight: 700 }}>Marco Legal (Arg)</h4>
                            </div>
                            <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.9rem', lineHeight: '1.5', listStyleType: 'none' }}>
                                {result.normativa.map((item, i) => <li key={i} style={{ marginBottom: '0.4rem' }}>• {item}</li>)}
                            </ul>
                        </div>
                    </div>

                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', maxWidth: '500px', margin: '0 auto' }}>
                            * Este análisis es generado por IA y debe ser validado por un profesional matriculado bajo su propia responsabilidad.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
