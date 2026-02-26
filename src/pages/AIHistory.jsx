import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Search, Calendar, ChevronRight,
    Trash2, Sparkles, Download, FileText, HardHat,
    ShieldAlert, Lightbulb, Gavel
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function AIHistory() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);

    useEffect(() => {
        const raw = localStorage.getItem('ai_advisor_history');
        if (raw) setHistory(JSON.parse(raw));
    }, []);

    const handleDelete = (id, e) => {
        e.stopPropagation();
        if (window.confirm('¿Estás seguro de que quieres eliminar este registro?')) {
            const updated = history.filter(item => item.id !== id);
            setHistory(updated);
            localStorage.setItem('ai_advisor_history', JSON.stringify(updated));
            if (selectedItem?.id === id) setSelectedItem(null);
        }
    };

    const handleDownloadPDF = (result) => {
        try {
            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const colors = {
                primary: [37, 99, 235],
                text: [31, 41, 55],
                muted: [107, 114, 128]
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
            doc.text(`Fecha de consulta: ${new Date(result.date).toLocaleString()}`, 15, 28);

            // Task
            doc.setTextColor(...colors.text);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Análisis de Tarea:', 15, 45);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            const taskLines = doc.splitTextToSize(result.task, pageWidth - 30);
            doc.text(taskLines, 15, 52);

            let currentY = 52 + (taskLines.length * 7);

            const createSection = (title, items, color) => {
                if (currentY > 240) { doc.addPage(); currentY = 20; }
                doc.setFontSize(14); doc.setFont('helvetica', 'bold');
                doc.setTextColor(...color); doc.text(title, 15, currentY + 10);
                doc.setDrawColor(...color); doc.setLineWidth(0.5);
                doc.line(15, currentY + 12, pageWidth - 15, currentY + 12);
                autoTable(doc, {
                    startY: currentY + 15,
                    head: [], body: items.map(it => [it.startsWith('•') ? it : `• ${it}`]),
                    theme: 'plain', styles: { fontSize: 10, cellPadding: 2 },
                    columnStyles: { 0: { cellWidth: pageWidth - 30 } }
                });
                currentY = doc.lastAutoTable.finalY + 10;
            };

            createSection('Riesgos Detectados', result.riesgos, [239, 68, 68]);
            createSection('EPP Recomendado', result.epp, [37, 99, 235]);
            createSection('Medidas Preventivas', result.recomendaciones, [16, 185, 129]);
            createSection('Marco Legal (Arg)', result.normativa, [139, 92, 246]);

            // Professional Signature
            const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
            const profName = personalData.fullName || 'Profesional Responsable';
            const profTitle = personalData.profession || 'Lic. en Higiene y Seguridad';
            const profMat = personalData.license || '-------';

            if (currentY > 230) { doc.addPage(); currentY = 20; }
            doc.setFontSize(10); doc.setTextColor(...colors.text); doc.setFont('helvetica', 'bold');
            doc.text(profName.toUpperCase(), 120, currentY + 22);
            doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
            doc.text(`${profTitle}`, 120, currentY + 27);
            doc.text(`Matrícula: ${profMat}`, 120, currentY + 32);
            doc.setDrawColor(...colors.primary); doc.setLineWidth(1); doc.rect(115, currentY + 10, 80, 28);

            doc.save(`Analisis_IA_${new Date(result.date).getTime()}.pdf`);
        } catch (error) {
            console.error('[PDF ERROR]', error);
            alert('Error al generar el PDF.');
        }
    };

    const filteredHistory = history.filter(item =>
        item.task.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (selectedItem) {
        return (
            <div className="container" style={{ paddingBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                    <button onClick={() => setSelectedItem(null)} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', cursor: 'pointer' }}>
                        <ArrowLeft size={24} />
                    </button>
                    <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Detalle del Análisis IA</h1>
                </div>

                <div className="card" style={{ padding: '1.5rem', marginBottom: '1.5rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.3rem' }}>
                                {new Date(selectedItem.date).toLocaleString()}
                            </span>
                            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>{selectedItem.task}</h3>
                        </div>
                        <button
                            onClick={() => handleDownloadPDF(selectedItem)}
                            className="btn-primary"
                            style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}
                        >
                            <Download size={16} /> Descargar PDF
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.2rem', marginTop: '1.5rem' }}>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #ef4444' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', marginBottom: '0.8rem' }}>
                                <ShieldAlert size={18} /> <h4 style={{ margin: 0 }}>Riesgos</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {selectedItem.riesgos.map((it, i) => <li key={i}>{it}</li>)}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #3b82f6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#3b82f6', marginBottom: '0.8rem' }}>
                                <HardHat size={18} /> <h4 style={{ margin: 0 }}>EPP</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {selectedItem.epp.map((it, i) => <li key={i}>{it}</li>)}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #10b981' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.8rem' }}>
                                <Lightbulb size={18} /> <h4 style={{ margin: 0 }}>Medidas</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0 }}>
                                {selectedItem.recomendaciones.map((it, i) => <li key={i}>{it}</li>)}
                            </ul>
                        </div>
                        <div style={{ padding: '1rem', borderRadius: '12px', border: '1px solid var(--color-border)', borderLeft: '4px solid #8b5cf6' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8b5cf6', marginBottom: '0.8rem' }}>
                                <Gavel size={18} /> <h4 style={{ margin: 0 }}>Normativa</h4>
                            </div>
                            <ul style={{ fontSize: '0.85rem', paddingLeft: '1.2rem', margin: 0, listStyle: 'none' }}>
                                {selectedItem.normativa.map((it, i) => <li key={i}>• {it}</li>)}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container" style={{ paddingBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                <button onClick={() => navigate('/history')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', cursor: 'pointer' }}>
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Sparkles size={24} color="var(--color-primary)" />
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Historial Consultas IA</h1>
                </div>
            </div>

            <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                <input
                    type="text"
                    placeholder="Buscar por tarea..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ paddingLeft: '2.8rem' }}
                />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {filteredHistory.length > 0 ? (
                    filteredHistory.map(item => (
                        <div
                            key={item.id}
                            className="card"
                            onClick={() => setSelectedItem(item)}
                            style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s' }}
                        >
                            <div style={{ background: 'rgba(37, 99, 235, 0.1)', padding: '0.8rem', borderRadius: '12px', color: 'var(--color-primary)' }}>
                                <Sparkles size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 0.3rem 0', fontWeight: 700 }}>{item.task}</h4>
                                <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                        <Calendar size={14} /> {new Date(item.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleDownloadPDF(item); }}
                                    style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer', padding: '0.5rem' }}
                                    title="Descargar PDF"
                                >
                                    <Download size={20} />
                                </button>
                                <button
                                    onClick={(e) => handleDelete(item.id, e)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '0.5rem' }}
                                    title="Eliminar"
                                >
                                    <Trash2 size={20} />
                                </button>
                                <ChevronRight size={20} color="var(--color-text-muted)" style={{ alignSelf: 'center' }} />
                            </div>
                        </div>
                    ))
                ) : (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                        <Sparkles size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                        <p>{searchTerm ? 'No se encontraron resultados' : 'Aún no tienes consultas guardadas'}</p>
                    </div>
                )}
            </div>
        </div>
    );
}
