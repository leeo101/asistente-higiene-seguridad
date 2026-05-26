import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { ArrowLeft, Download, FileText, Calendar, TrendingUp, ShieldCheck, Shield, ClipboardList, Users, Siren, Flame, Target, FileSignature, ChevronRight, HardHat, TriangleAlert, Building } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
    const [monthOffset, setMonthOffset] = useState(0); 

    const [metrics, setMetrics] = useState({
        ats: { total: 0 },
        permits: { total: 0 },
        inspections: { total: 0, critical: 0 },
        riskAssessments: { total: 0, highRisk: 0 },
        training: { total: 0, attendees: 0 },
        drills: { total: 0 },
        accidents: { total: 0 },
        fireload: { total: 0 },
        audits: { total: 0 }
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

        const isWithinMonth = (dateString: string | undefined) => {
            if (!dateString) return false;
            const d = new Date(dateString);
            return d >= firstDay && d <= lastDay;
        };

        const safeParse = (key: string) => {
            try { return JSON.parse(localStorage.getItem(key) || '[]'); } 
            catch (e) { return []; }
        };

        const ats = safeParse('ats_history').filter((i: any) => isWithinMonth(i.fecha || i.createdAt || i.date));
        const permits = safeParse('work_permits_history').filter((i: any) => isWithinMonth(i.createdAt || i.date));
        const inspections = [...safeParse('inspections_history'), ...safeParse('tool_checklists_history')].filter((i: any) => isWithinMonth(i.date || i.createdAt || i.fecha));
        const risks = safeParse('risk_assessment_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
        const training = safeParse('training_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
        const drills = safeParse('drills_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
        const accidents = safeParse('accident_history').filter((i: any) => isWithinMonth(i.date || i.createdAt));
        const fireload = safeParse('fireload_history').filter((i: any) => isWithinMonth(i.createdAt || i.date));
        const audits = safeParse('ehs_audits_db').filter((i: any) => isWithinMonth(i.date || i.createdAt));

        setMetrics({
            ats: { total: ats.length },
            permits: { total: permits.length },
            inspections: { 
                total: inspections.length, 
                critical: inspections.filter(i => i.score < 50 || i.status === 'NC').length 
            },
            riskAssessments: { 
                total: risks.length, 
                highRisk: risks.filter(r => (r.riskLevel || '').toLowerCase().includes('crítico') || (r.riskLevel || '').toLowerCase().includes('alto')).length 
            },
            training: {
                total: training.length,
                attendees: training.reduce((acc: number, curr: any) => acc + (curr.attendees?.length || curr.participants?.length || 0), 0)
            },
            drills: { total: drills.length },
            accidents: { total: accidents.length },
            fireload: { total: fireload.length },
            audits: { total: audits.length }
        });

        setTimeout(() => setLoading(false), 500); 
    };

    useEffect(() => {
        loadMetrics();
    }, [monthOffset]);

    const { monthName } = getTargetDates();
    const totalActions = Object.values(metrics).reduce((acc, curr) => acc + curr.total, 0);

    const getChartData = () => {
        const data = [
            { name: 'ATS', value: metrics.ats.total, color: '#10b981' },
            { name: 'Permisos', value: metrics.permits.total, color: '#3b82f6' },
            { name: 'Inspecciones', value: metrics.inspections.total, color: '#8b5cf6' },
            { name: 'Riesgos', value: metrics.riskAssessments.total, color: '#f59e0b' },
            { name: 'Capacitaciones', value: metrics.training.total, color: '#ec4899' },
            { name: 'Simulacros', value: metrics.drills.total, color: '#14b8a6' },
            { name: 'Auditorías', value: metrics.audits.total, color: '#6366f1' },
            { name: 'Carga de Fuego', value: metrics.fireload.total, color: '#f97316' }
        ];
        return data.filter(d => d.value > 0).sort((a, b) => b.value - a.value);
    };
    
    const chartData = getChartData();

    const handleExportPDF = () => {
        try {
            const personalData = JSON.parse(localStorage.getItem('personalData') || '{}');
            const profName = personalData.fullName || personalData.name || 'Profesional de HyS';
            const company = personalData.company || 'Empresa No Definida';

            const doc = new jsPDF();
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Colors
            const primaryColor: [number, number, number] = [30, 58, 138]; // Dark Blue
            const secondaryColor: [number, number, number] = [59, 130, 246]; // Light Blue
            const textDark: [number, number, number] = [31, 41, 55];
            const textGray: [number, number, number] = [107, 114, 128];

            // --- HEADER ---
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, pageWidth, 45, 'F');
            doc.setFillColor(...secondaryColor);
            doc.rect(0, 45, pageWidth, 5, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont('helvetica', 'bold');
            doc.text('INFORME MENSUAL DE GESTIÓN H&S', 15, 25);
            
            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`PERÍODO: ${monthName.toUpperCase()}`, 15, 35);

            // --- LOGO ---
            const companyLogo = localStorage.getItem('companyLogo');
            if (companyLogo && (companyLogo.startsWith('data:image/') || companyLogo.startsWith('http'))) {
                try {
                    doc.addImage(companyLogo, 'PNG', pageWidth - 55, 8, 40, 25);
                } catch (err) {}
            }

            // --- INFO BOX ---
            doc.setFillColor(243, 244, 246);
            doc.roundedRect(15, 60, pageWidth - 30, 25, 3, 3, 'F');
            
            doc.setTextColor(...textDark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Empresa/Proyecto:', 20, 70);
            doc.text('Elaborado por:', 20, 78);
            
            doc.setFont('helvetica', 'normal');
            doc.text(company, 60, 70);
            doc.text(profName, 60, 78);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-AR')}`, pageWidth - 70, 70);

            // --- EJECUTIVO (SMART SUMMARY) ---
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('Resumen Ejecutivo', 15, 100);

            let mainFocus = 'diversas actividades preventivas';
            if (chartData.length > 0) {
                mainFocus = `la gestión de ${chartData[0].name.toLowerCase()} (con ${chartData[0].value} registros conformados)`;
            }

            const executiveSummary = `Durante el mes de ${monthName}, el servicio de Higiene y Seguridad completó un volumen total de ${totalActions} registros documentales a través de la plataforma. El mayor foco operativo estuvo centralizado en ${mainFocus}. Este seguimiento sistemático asegura el cumplimiento del marco legal vigente y fomenta la mejora continua en la cultura preventiva de la organización, mitigando activamente los riesgos laborales detectados.`;

            doc.setTextColor(...textDark);
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const splitSummary = doc.splitTextToSize(executiveSummary, pageWidth - 30);
            doc.text(splitSummary, 15, 110);

            // --- TABLA DETALLADA ---
            const startY = 115 + (splitSummary.length * 5) + 5;
            
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(...primaryColor);
            doc.text('Desglose de Gestión Documental', 15, startY);

            const tableData = [
                ['Análisis de Trabajo Seguro (ATS)', `${metrics.ats.total} confeccionados`, 'Evaluación de tareas rutinarias y no rutinarias.'],
                ['Permisos de Trabajo Especial', `${metrics.permits.total} emitidos`, 'Gestión de trabajos en altura, caliente, etc.'],
                ['Inspecciones y Checklists', `${metrics.inspections.total} realizadas`, `${metrics.inspections.critical} con observaciones críticas (NC).`],
                ['Identificación de Riesgos', `${metrics.riskAssessments.total} tareas`, `${metrics.riskAssessments.highRisk} mapeadas como riesgo crítico/alto.`],
                ['Capacitaciones (In Situ/Sala)', `${metrics.training.total} dictadas`, `${metrics.training.attendees} trabajadores entrenados en total.`],
                ['Simulacros de Emergencia', `${metrics.drills.total} ejecutados`, 'Cumplimiento de plan anual de evacuación.'],
                ['Auditorías EHS', `${metrics.audits.total} realizadas`, 'Verificación de estándares normativos.'],
                ['Estudios de Carga de Fuego', `${metrics.fireload.total} estudios`, 'Decreto 351/79 Anexo VII.'],
                ['Registro de Siniestralidad', `${metrics.accidents.total} reportes`, 'Investigación de accidentes/incidentes.']
            ].filter(row => parseInt(row[1].split(' ')[0]) > 0); // Solo muestra modulos con actividad

            if (tableData.length === 0) {
                tableData.push(['Sin actividad', '0', 'No se registraron documentos en este período.']);
            }

            autoTable(doc, {
                startY: startY + 5,
                head: [['Módulo / Actividad', 'Volumen', 'Detalle Técnico']],
                body: tableData,
                theme: 'grid',
                headStyles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [249, 250, 251] },
                styles: { fontSize: 10, cellPadding: 6 },
                columnStyles: { 
                    0: { fontStyle: 'bold', cellWidth: 65, textColor: [31, 41, 55] },
                    1: { cellWidth: 35, textColor: [59, 130, 246], fontStyle: 'bold' }
                }
            });

            // --- FOOTER AND SIGNATURE ---
            const finalY = (doc as any).lastAutoTable.finalY || startY + 50;
            
            // Check page break for signature
            if (finalY > pageHeight - 60) {
                doc.addPage();
                doc.setDrawColor(156, 163, 175);
                doc.line(130, 50, 190, 50);
                doc.setFontSize(9);
                doc.setTextColor(...textGray);
                doc.text('Firma del Profesional / Responsable', 135, 55);
            } else {
                doc.setDrawColor(156, 163, 175);
                doc.line(130, finalY + 40, 190, finalY + 40);
                doc.setFontSize(9);
                doc.setTextColor(...textGray);
                doc.text('Firma del Profesional / Responsable', 135, finalY + 45);
            }

            // Page numbers on all pages
            const pageCount = (doc as any).internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.setTextColor(...textGray);
                doc.text(`Generado por Asistente de Higiene y Seguridad - Página ${i} de ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
            }

            doc.save(`Informe_Gestion_${monthName.replace(/ /g, '_')}.pdf`);
            toast.success('Informe PDF descargado con éxito');
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el PDF.');
        }
    };

    return (
        <div className="container" style={{ paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--color-text)', cursor: 'pointer' }}>
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
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', cursor: 'pointer', color: 'var(--color-text)', transition: 'all 0.2s' }}
                    >
                        <ArrowLeft size={16} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-primary)', textTransform: 'capitalize', width: '140px', justifyContent: 'center' }}>
                        <Calendar size={18} />
                        {monthName.split(' ')[0]}
                    </div>
                    <button
                        onClick={() => setMonthOffset(prev => prev + 1)}
                        disabled={monthOffset >= 0}
                        style={{ padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: '10px', background: 'var(--color-surface)', cursor: monthOffset >= 0 ? 'not-allowed' : 'pointer', opacity: monthOffset >= 0 ? 0.5 : 1, color: 'var(--color-text)', transition: 'all 0.2s' }}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>

                <button
                    onClick={handleExportPDF}
                    disabled={loading || totalActions === 0}
                    className="btn-primary"
                    style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.8rem 1.5rem', borderRadius: '12px', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
                >
                    <Download size={18} /> Exportar Mensual PDF
                </button>
            </div>

            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 0', opacity: 0.5 }}>
                    <div className="spinner" style={{ borderTopColor: 'var(--color-primary)', marginBottom: '1rem' }}></div>
                    <p style={{ fontWeight: 600 }}>Compilando estadísticas integrales...</p>
                </div>
            ) : totalActions === 0 ? (
                <div className="card" style={{ padding: '4rem 2rem', textAlign: 'center', background: 'rgba(59, 130, 246, 0.05)', border: '1px dashed var(--color-primary)' }}>
                    <FileText size={48} color="var(--color-primary)" style={{ opacity: 0.3, marginBottom: '1rem' }} />
                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Sin Actividad Registrada</h3>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>No hay reportes ni documentos guardados durante {monthName}.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'fadeIn 0.4s ease' }}>

                    {/* Resumen Superior */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                        {/* Volumen General */}
                        <div className="card" style={{ padding: '2rem', background: 'linear-gradient(135deg, var(--color-primary), #1e40af)', color: 'white', border: 'none', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <h2 style={{ margin: '0 0 1rem 0', fontSize: '1.1rem', fontWeight: 700, opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <TrendingUp size={20} /> Volumen de Gestión Integral
                            </h2>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                <span style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{totalActions}</span>
                                <span style={{ fontSize: '1.1rem', fontWeight: 600, opacity: 0.8 }}>documentos generados</span>
                            </div>
                            <p style={{ margin: '1rem 0 0', fontSize: '0.9rem', opacity: 0.7, lineHeight: 1.5 }}>
                                Incluye todos los registros conformados y avalados dentro de la plataforma durante el período.
                            </p>
                        </div>

                        {/* Gráfico de Distribución */}
                        {chartData.length > 0 && (
                            <div className="card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
                                <h3 style={{ margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Target size={18} color="var(--color-primary)" /> Distribución del Esfuerzo
                                </h3>
                                <div style={{ flex: 1, minHeight: '200px', width: '100%' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={chartData}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <Tooltip 
                                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                                                itemStyle={{ fontWeight: 800 }}
                                            />
                                            <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" wrapperStyle={{ fontSize: '0.8rem', fontWeight: 600 }}/>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Grilla de Métricas Detalladas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1rem' }}>
                        
                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ShieldCheck size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>ATS Realizados</h4>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.ats.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FileSignature size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Permisos Trabajo</h4>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.permits.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ClipboardList size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Inspecciones</h4>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.inspections.total}</span>
                                    {metrics.inspections.critical > 0 && <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{metrics.inspections.critical} CRIT</span>}
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TriangleAlert size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Eval. Riesgos</h4>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.riskAssessments.total}</span>
                                    {metrics.riskAssessments.highRisk > 0 && <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 800, background: 'rgba(239, 68, 68, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{metrics.riskAssessments.highRisk} ALTO</span>}
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Users size={24} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Capacitaciones</h4>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.training.total}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>({metrics.training.attendees} pers)</span>
                                </div>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(20, 184, 166, 0.1)', color: '#14b8a6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Siren size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Simulacros</h4>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.drills.total}</span>
                            </div>
                        </div>
                        
                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(99, 102, 241, 0.1)', color: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Building size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Auditorías</h4>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.audits.total}</span>
                            </div>
                        </div>

                        <div className="card hover-lift" style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(249, 115, 22, 0.1)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Flame size={24} />
                            </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Carga de Fuego</h4>
                                <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--color-text)' }}>{metrics.fireload.total}</span>
                            </div>
                        </div>

                    </div>
                </div>
            )}

            <div style={{ marginTop: '3rem' }}>
                <AdBanner />
            </div>
        </div>
    );
}
