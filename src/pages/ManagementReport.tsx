import React from 'react';

import { useNavigate } from 'react-router-dom';
import React, { useState, useEffect } from 'react';

import { ArrowLeft, Download, FileText, Calendar, TrendingUp, TriangleAlert, CheckCircle, Shield, FileSignature, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import AdBanner from '../components/AdBanner';

export default function ManagementReport(): React.ReactElement | null {
    const navigate = useNavigate();
    useDocumentTitle('Informe Mensual de Gestión');

    const [loading, setLoading] = useState(true);
    const [monthOffset, setMonthOffset] = useState(0); // 0 = Current month, -1 = Last month, etc.
    const [metrics, setMetrics] = useState({
        inspections: { total: 0, criticalFindings: 0 },
        ats: { total: 0 },
        riskAssessments: { total: 0, highRisk: 0 },
        permits: { total: 0, active: 0 }
    });

    const getTargetDates = () => {
        const date = new Date();
        date.setMonth(date.getMonth() + monthOffset);

        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

        return {
            firstDay,
            lastDay,
            monthName: date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
        };
    };

    const loadMetrics = () => {
        setLoading(true);
        const { firstDay, lastDay } = getTargetDates();

        const isWithinMonth = (dateString) => {
            if (!dateString) return false;
            const d = new Date(dateString);
            return d >= firstDay && d <= lastDay;
        };

        // 1. Inspections
        const inspections = JSON.parse(localStorage.getItem('inspections_history') || '[]')
            .filter(i => isWithinMonth(i.date || i.createdAt));

        // 2. ATS
        const ats = JSON.parse(localStorage.getItem('atsHistory') || '[]')
            .filter(a => isWithinMonth(a.fecha || a.createdAt));

        // 3. Risk Assessments
        const risks = JSON.parse(localStorage.getItem('risk_assessment_history') || '[]')
            .filter(r => isWithinMonth(r.date || r.createdAt));

        // 4. Work Permits
        const permits = JSON.parse(localStorage.getItem('work_permits_history') || '[]')
            .filter(p => isWithinMonth(p.date || p.createdAt));

        setMetrics({
            inspections: {
                total: inspections.length,
                criticalFindings: inspections.reduce((acc, curr) => curr.score < 50 ? acc + 1 : acc, 0)
            },
            ats: {
                total: ats.length
            },
            riskAssessments: {
                total: risks.length,
                highRisk: risks.filter(r => (r.riskLevel || '').toLowerCase().includes('crítico') || (r.riskLevel || '').toLowerCase().includes('alto')).length
            },
            permits: {
                total: permits.length,
                active: permits.filter(p => p.status === 'approved' || p.status === 'active').length
            }
        });

        setTimeout(() => setLoading(false), 400); // Simulate processing time for UX
    };

    useEffect(() => {
        loadMetrics();
    }, [monthOffset]);

    const handleExportPDF = () => {
        try {
            const { monthName } = getTargetDates();
            const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
            const profName = personalData.fullName || personalData.name || 'Profesional de HyS';
            const company = personalData.company || 'Empresa No Definida';

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();

            // Colors
            const primaryColor = [37, 99, 235];
            const darkText = [31, 41, 55];

            // Header
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 40, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text('INFORME MENSUAL DE GESTIÓN', 15, 20);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Período: ${monthName.toUpperCase()}`, 15, 30);

            // Subheader Data
            doc.setTextColor(...darkText);

            // --- ADD LOGO ---
            const companyLogo = localStorage.getItem('companyLogo');
            if (companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http'))) {
                try {
                    // Try to add the logo if it's base64 or a valid image URL
                    // Note: If it's a cross-origin URL, jsPDF might fail, but base64 works perfectly.
                    doc.addImage(companyLogo, 'PNG', pageWidth - 45, 10, 30, 20);
                } catch {

                    console.error('Error adding logo to PDF:', e);
                }
            }
            // ----------------

            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Datos Pormenorizados:', 15, 55);

            doc.setFont('helvetica', 'normal');
            doc.text(`Empresa/Proyecto: ${company}`, 15, 62);
            doc.text(`Elaborado por: ${profName}`, 15, 68);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, 15, 74);

            // Metrics Table Content
            const tableData = [
                ['Evaluaciones de Riesgo (Identificación)', `${metrics.riskAssessments.total} tareas evaluadas`, `${metrics.riskAssessments.highRisk} con riesgo crítico/alto`],
                ['Análisis de Trabajo Seguro (ATS)', `${metrics.ats.total} confeccionados`, '-'],
                ['Permisos de Trabajo Especial', `${metrics.permits.total} emitidos`, `${metrics.permits.active} actualmente activos`],
                ['Inspecciones de Seguridad', `${metrics.inspections.total} realizadas`, `${metrics.inspections.criticalFindings} con resultado crítico`]
            ];

            autoTable(doc, {
                startY: 85,
                head: [['Módulo / Actividad', 'Volumen Total', 'Observaciones Críticas']],
                body: tableData,
                theme: 'striped',
                headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
                styles: { fontSize: 10, cellPadding: 6 },
                columnStyles: { 0: { fontStyle: 'bold', cellWidth: 70 } }
            });

            // Conclusions section
            const finalY = doc.lastAutoTable.finalY || 130;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Resumen Ejecutivo del Período', 15, finalY + 15);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const summaryText = `Durante el mes de ${monthName}, el servicio de Higiene y Seguridad completó un total de ${metrics.ats.total + metrics.inspections.total + metrics.riskAssessments.total + metrics.permits.total} registros documentales en la plataforma. Este nivel de seguimiento sistemático asegura el cumplimiento de las normativas vigentes y fomenta la mejora continua en la cultura preventiva de la organización.`;

            const splitSummary = doc.splitTextToSize(summaryText, pageWidth - 30);
            doc.text(splitSummary, 15, finalY + 23);

            // Signature area
            doc.setDrawColor(156, 163, 175);
            doc.line(130, finalY + 70, 190, finalY + 70);
            doc.setFontSize(9);
            doc.text('Firma del Profesional', 145, finalY + 75);

            doc.save(`Informe_Gestion_${monthName.replace(/ /g, '_')}.pdf`);
            toast.success('Informe PDF descargado con éxito');
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el PDF.');
        }
    };

    const { monthName } = getTargetDates();
    const totalActions = metrics.inspections.total + metrics.ats.total + metrics.riskAssessments.total + metrics.permits.total;

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)' }}
                >
                    <ArrowLeft size={24} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <TrendingUp size={24} color="var(--color-primary)" />
                    <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Informe de Gestión</h1>
                </div>
            </div>

            <div className="card" style={{ padding: '1.2rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setMonthOffset(prev => prev - 1)}
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text)' }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)', textTransform: 'capitalize', width: '130px', justifyContent: 'center' }}>
                        <Calendar size={18} />
                        {monthName.split(' ')[0]}
                    </div>
                    <button
                        onClick={() => setMonthOffset(prev => prev + 1)}
                        disabled={monthOffset >= 0}
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', cursor: monthOffset >= 0 ? 'not-allowed' : 'pointer', opacity: monthOffset >= 0 ? 0.5 : 1, color: 'var(--color-text)' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <button
                    onClick={handleExportPDF}
                    disabled={loading || totalActions === 0}
                    className="btn-primary"
                    style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem' }}
                >
                    <Download size={18} /> Exportar Mensual PDF
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', opacity: 0.5 }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--color-primary)', marginBottom: '1rem' }}></div>
                    <p>Compilando estadísticas del mes...</p>
                </div>
            ) : totalActions === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--color-primary)' }}>
                    <FileText size={48} color="var(--color-primary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Sin Actividad Registrada</h3>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No hay reportes ni documentos guardados durante {monthName}.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>

                    {/* Tarjeta Resumen */}
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, var(--color-primary), #1e40af)', color: 'white', border: 'none', gridColumn: '1 / -1' }}>
                        <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: 700, opacity: 0.9 }}>Volumen de Gestión Integral</h2>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                            <span style={{ fontSize: '3rem', fontWeight: 900, lineHeight: 1 }}>{totalActions}</span>
                            <span style={{ fontSize: '1rem', fontWeight: 600, opacity: 0.8 }}>registros conformados</span>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#10b981' }}>
                            <FileSignature size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>ATS & Permisos</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>ATS Confeccionados</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{metrics.ats.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Permisos Especiales</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{metrics.permits.total}</span>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#ef4444' }}>
                            <Shield size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Inspecciones</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Realizadas</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{metrics.inspections.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Con Nivel Crítico</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: metrics.inspections.criticalFindings > 0 ? '#ef4444' : 'inherit' }}>{metrics.inspections.criticalFindings}</span>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: '#8b5cf6' }}>
                            <TriangleAlert size={24} />
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Evaluación de Riesgo</h3>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--color-border)' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Identificaciones</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem' }}>{metrics.riskAssessments.total}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0' }}>
                            <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Riesgo Crítico/Alto</span>
                            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: metrics.riskAssessments.highRisk > 0 ? '#ef4444' : 'inherit' }}>{metrics.riskAssessments.highRisk}</span>
                        </div>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem' }}>
                <AdBanner />
            </div>
        </div>
    );
}
