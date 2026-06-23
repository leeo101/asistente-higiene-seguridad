import React from 'react';
import { Building2, AlertTriangle, Flame, ShieldCheck, Wind, PenTool } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function LegajoPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const sectionColors: Record<string, string> = {
        empresa: '#2563eb',
        riesgos: '#dc2626',
        incendio: '#ea580c',
        epp: '#16a34a',
        ambiente: '#0d9488',
        firmas: '#7c3aed'
    };

    const ChapterDivider = ({ title, subtitle, icon: Icon, colorKey, chapterNum }: any) => {
        const color = sectionColors[colorKey] || '#2563eb';
        return (
            <>
                <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>
                <div style={{
                    height: '250mm', // Force full page height for divider (A4 is 297mm, giving some margins)
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    background: `linear-gradient(135deg, #ffffff 0%, ${color}08 100%)`,
                    borderRadius: '24px',
                    border: `1px solid ${color}20`,
                    margin: '10mm 0',
                    padding: '2rem',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '80px', height: '80px', borderRadius: '20px',
                        background: `linear-gradient(135deg, ${color}, ${color}dd)`, color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '2rem',
                        boxShadow: `0 10px 30px ${color}40`
                    }}>
                        <Icon size={40} />
                    </div>
                    <div style={{ color: color, fontWeight: 900, fontSize: '1.2rem', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                        Capítulo {chapterNum}
                    </div>
                    <h2 style={{ margin: 0, fontSize: '2.5rem', fontWeight: 900, color: '#1e293b', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                        {title}
                    </h2>
                    {subtitle && (
                        <p style={{ fontSize: '1.1rem', color: '#64748b', marginTop: '1rem', fontWeight: 500 }}>
                            {subtitle}
                        </p>
                    )}
                </div>
                <div style={{ pageBreakAfter: 'always', breakAfter: 'page' }}></div>
            </>
        );
    };

    const SectionHeader = ({ title, icon: Icon, colorKey }: any) => {
        const color = sectionColors[colorKey] || '#2563eb';
        return (
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: `2px solid ${color}`,
                paddingBottom: '0.75rem', marginBottom: '1.5rem', marginTop: '1rem'
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: `${color}18`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {title}
                </h3>
            </div>
        );
    };

    const FieldBox = ({ label, value, fullWidth = false }: { label: string, value: string | undefined, fullWidth?: boolean }) => (
        <div style={{ 
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            padding: '1rem',
            gridColumn: fullWidth ? '1 / -1' : 'auto'
        }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: '#64748b', display: 'block', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {label}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a', display: 'block' }}>
                {value || '—'}
            </span>
        </div>
    );

    const Tag = ({ label, active }: { label: string, active: boolean }) => (
        <span style={{
            padding: '4px 12px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700,
            background: active ? '#dcfce7' : '#f1f5f9',
            color: active ? '#166534' : '#94a3b8',
            border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`
        }}>
            {active ? '✓' : '✕'} {label}
        </span>
    );

    const AmbienteRow = ({ label, apto, fecha }: { label: string, apto: boolean, fecha: string }) => (
        <tr className="avoid-break"  style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600, color: '#1e293b' }}>{label}</td>
            <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: apto ? '#166534' : '#dc2626', textAlign: 'center' }}>
                <span style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '0.75rem',
                    background: apto ? '#dcfce7' : '#fee2e2',
                    border: `1px solid ${apto ? '#bbf7d0' : '#fecaca'}`
                }}>
                    {apto ? 'SÍ CUMPLE' : 'NO CUMPLE'}
                </span>
            </td>
            <td style={{ padding: '0.8rem 1rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>
                {fecha ? new Date(fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '—'}
            </td>
        </tr>
    );

    const renderAdjuntos = (adjuntos: any[]) => {
        if (!adjuntos || adjuntos.length === 0) return null;
        return (
            <div style={{ marginTop: '1.5rem', pageBreakInside: 'avoid' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>Registro Fotográfico / Adjuntos</span>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '10px' }}>
                    {adjuntos.map((img: string, i: number) => (
                        <div key={i} style={{ aspectRatio: '1', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                            <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="pdf-document premium-legajo" style={{
            background: '#ffffff',
            padding: '2rem',
            width: '100%',
            maxWidth: '100%',
            color: '#0f172a',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <style type="text/css" media="print">{`
                @page { size: A4 portrait; margin: 12mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                .premium-legajo { max-width: 210mm; margin: 0 auto; }
            `}</style>

            {/* CARÁTULA PRINCIPAL (COVER PAGE) */}
            <div style={{ 
                height: '260mm', // Full page approx
                display: 'flex', 
                flexDirection: 'column', 
                position: 'relative',
                pageBreakAfter: 'always',
                breakAfter: 'page'
            }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'auto', paddingTop: '2rem' }}>
                    <CompanyLogo />
                </div>

                <div style={{ textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ 
                        width: '100px', height: '6px', background: '#2563eb', margin: '0 auto 2rem', borderRadius: '3px'
                    }} />
                    
                    <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 1rem 0', letterSpacing: '-0.04em', lineHeight: 1 }}>
                        LEGAJO TÉCNICO
                    </h1>
                    <p style={{ fontSize: '1.4rem', color: '#475569', margin: '0 0 0.5rem 0', fontWeight: 700, letterSpacing: '-0.01em' }}>
                        Higiene y Seguridad en el Trabajo
                    </p>
                    <p style={{ fontSize: '1rem', color: '#94a3b8', margin: '0 0 3rem 0', fontWeight: 600 }}>
                        Decreto 351/79 — Ley 19.587 · ISO 45001
                    </p>

                    <div style={{ 
                        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '24px',
                        padding: '3rem 2rem',
                        margin: '0 auto',
                        maxWidth: '80%',
                        width: '100%',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.03)'
                    }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 0.5rem 0' }}>Establecimiento</p>
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.5rem 0' }}>
                            {data.empresa?.razonSocial || 'Razón Social No Definida'}
                        </h2>
                        {data.empresa?.cuit && (
                            <p style={{ fontSize: '1.1rem', color: '#64748b', margin: 0, fontWeight: 600, fontFamily: 'monospace' }}>
                                CUIT: {data.empresa.cuit}
                            </p>
                        )}
                    </div>
                </div>

                <div style={{ marginTop: 'auto', borderTop: '2px solid #e2e8f0', paddingTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Profesional Interviniente</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{data.professionalName || 'Profesional H&S'}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha de Emisión</p>
                        <p style={{ margin: '0.2rem 0 0', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>{new Date().toLocaleDateString('es-AR')}</p>
                    </div>
                </div>
            </div>

            {/* CAPÍTULO 1: EMPRESA */}
            <ChapterDivider title="Datos del Establecimiento" subtitle="Información general y administrativa de la empresa" icon={Building2} colorKey="empresa" chapterNum={1} />
            <SectionHeader title="Información General" icon={Building2} colorKey="empresa" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <FieldBox fullWidth label="Razón Social" value={data.empresa?.razonSocial} />
                <FieldBox label="CUIT" value={data.empresa?.cuit} />
                <FieldBox label="Actividad Principal" value={data.empresa?.actividad} />
                <FieldBox fullWidth label="Domicilio Completo" value={`${data.empresa?.domicilio || ''} ${data.empresa?.localidad ? '- ' + data.empresa.localidad : ''} ${data.empresa?.provincia ? '(' + data.empresa.provincia + ')' : ''}`} />
                <FieldBox label="Código Postal" value={data.empresa?.codigoPostal} />
                <FieldBox label="Teléfono" value={data.empresa?.telefono} />
                <FieldBox fullWidth label="Email de Contacto" value={data.empresa?.email} />
            </div>

            <SectionHeader title="Datos Laborales y Seguros" icon={ShieldCheck} colorKey="empresa" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <FieldBox label="Aseguradora (ART)" value={data.empresa?.art} />
                <FieldBox label="Nº Póliza ART" value={data.empresa?.polizaArt} />
                <FieldBox label="Cantidad de Empleados" value={data.empresa?.cantidadEmpleados} />
                <FieldBox label="Superficie (m²)" value={data.empresa?.superficie} />
                <FieldBox label="Horarios de Trabajo" value={data.empresa?.horariosTrabajo} />
                <FieldBox label="Inicio de Actividad" value={data.empresa?.fechaInicioActividad} />
                <FieldBox label="Representante Legal" value={data.empresa?.representanteLegal} />
                <FieldBox label="Responsable de Seguridad" value={data.empresa?.responsableSeguridad} />
                <FieldBox fullWidth label="Matrícula" value={data.empresa?.matriculaResponsable} />
            </div>

            {/* CAPÍTULO 2: RIESGOS */}
            <ChapterDivider title="Identificación de Riesgos" subtitle="Análisis de peligros presentes y medidas preventivas" icon={AlertTriangle} colorKey="riesgos" chapterNum={2} />
            
            {data.riesgos?.nivelRiesgo && (
                <div style={{ 
                    background: data.riesgos.nivelRiesgo === 'Crítico' ? '#fef2f2' : data.riesgos.nivelRiesgo === 'Alto' ? '#fff7ed' : data.riesgos.nivelRiesgo === 'Medio' ? '#fefce8' : '#f0fdf4',
                    border: `2px solid ${data.riesgos.nivelRiesgo === 'Crítico' ? '#fca5a5' : data.riesgos.nivelRiesgo === 'Alto' ? '#fdba74' : data.riesgos.nivelRiesgo === 'Medio' ? '#fde047' : '#86efac'}`,
                    borderRadius: '16px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    marginBottom: '2rem'
                }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.5rem' }}>Nivel de Riesgo General</span>
                    <span style={{
                        fontSize: '1.8rem', fontWeight: 900,
                        color: data.riesgos.nivelRiesgo === 'Crítico' ? '#991b1b' : data.riesgos.nivelRiesgo === 'Alto' ? '#9a3412' : data.riesgos.nivelRiesgo === 'Medio' ? '#854d0e' : '#166534',
                    }}>
                        {data.riesgos.nivelRiesgo}
                    </span>
                </div>
            )}

            <SectionHeader title="Matriz de Riesgos Detectados" icon={AlertTriangle} colorKey="riesgos" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <FieldBox fullWidth label="Riesgos Físicos Presentes" value={data.riesgos?.fisicos} />
                <FieldBox fullWidth label="Riesgos Químicos / Ambiental" value={data.riesgos?.quimicos} />
                <FieldBox fullWidth label="Riesgos Biológicos" value={data.riesgos?.biologicos} />
                <FieldBox fullWidth label="Riesgos Ergonómicos" value={data.riesgos?.ergonomicos} />
                <FieldBox fullWidth label="Riesgos Eléctricos" value={data.riesgos?.electricos} />
                <FieldBox fullWidth label="Riesgos de Trabajo en Altura" value={data.riesgos?.trabajoAltura} />
            </div>

            <div style={{ marginTop: '2rem' }}>
                <SectionHeader title="Medidas Preventivas y Observaciones" icon={ShieldCheck} colorKey="riesgos" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <FieldBox fullWidth label="Medidas Preventivas Adoptadas" value={data.riesgos?.medidasPreventivas} />
                    <FieldBox fullWidth label="Observaciones / Recomendaciones" value={data.riesgos?.observaciones} />
                </div>
            </div>
            {renderAdjuntos(data.riesgos?.adjuntos)}

            {/* CAPÍTULO 3: INCENDIO */}
            <ChapterDivider title="Protección Contra Incendios" subtitle="Sistemas de detección, extinción y evacuación" icon={Flame} colorKey="incendio" chapterNum={3} />
            <SectionHeader title="Análisis de Carga de Fuego" icon={Flame} colorKey="incendio" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <FieldBox label="Carga de Fuego (Mcal/m²)" value={data.incendio?.cargaFuego} />
                <FieldBox label="Riesgo de Incendio" value={data.incendio?.riesgoIncendio} />
            </div>

            <SectionHeader title="Medios de Extinción" icon={Flame} colorKey="incendio" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
                <FieldBox label="Cantidad Total de Extintores" value={data.incendio?.cantidadExtintores} />
                <FieldBox label="Tipo de Extintores" value={data.incendio?.tipoExtintores} />
            </div>

            <SectionHeader title="Instalaciones Fijas y Evacuación" icon={Building2} colorKey="incendio" />
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
                    <Tag label="Plan de Evacuación" active={!!data.incendio?.planEvacuacion} />
                    <Tag label="Sistema Detección/Alarma" active={!!data.incendio?.sistemaDeteccion} />
                    <Tag label="Red Hidrantes/Rociadores" active={!!data.incendio?.redHidrantes} />
                    <Tag label="Brigada de Emergencia" active={!!data.incendio?.brigadaEmergencia} />
                    <Tag label="Plano de Evacuación" active={!!data.incendio?.planoEvacuacion} />
                </div>
                <FieldBox fullWidth label="Fecha Último Simulacro" value={data.incendio?.fechaSimulacro} />
            </div>
            {renderAdjuntos(data.incendio?.adjuntos)}

            {/* CAPÍTULO 4: EPP */}
            <ChapterDivider title="EPP y Capacitaciones" subtitle="Elementos de protección personal y registro de entrenamiento" icon={ShieldCheck} colorKey="epp" chapterNum={4} />
            <SectionHeader title="Elementos de Protección Entregados" icon={ShieldCheck} colorKey="epp" />
            <div style={{ background: '#f8fafc', padding: '1.5rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <Tag label="Ropa de Trabajo" active={!!data.epp?.ropaTrabajo} />
                    <Tag label="Calzado de Seguridad" active={!!data.epp?.calzadoSeguridad} />
                    <Tag label="Protección Ocular" active={!!data.epp?.proteccionOcular} />
                    <Tag label="Protección Auditiva" active={!!data.epp?.proteccionAuditiva} />
                    <Tag label="Protección Respiratoria" active={!!data.epp?.proteccionRespiratoria} />
                    <Tag label="Casco de Seguridad" active={!!data.epp?.cascoSeguridad} />
                    <Tag label="Guantes de Seguridad" active={!!data.epp?.guantesSeguridad} />
                    <Tag label="Arnés de Seguridad" active={!!data.epp?.arnesSeguridad} />
                    <Tag label="Protección Facial" active={!!data.epp?.proteccionFacial} />
                    <Tag label="Chaleco Reflectivo" active={!!data.epp?.chalecoReflectivo} />
                </div>
            </div>

            <SectionHeader title="Cronograma de Capacitaciones" icon={Building2} colorKey="epp" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                <FieldBox fullWidth label="Última Capacitación General" value={data.epp?.capacitacionRealizada} />
                <FieldBox fullWidth label="Próxima Capacitación Programada" value={data.epp?.proximaCapacitacion} />
                <FieldBox fullWidth label="Plan Anual de Capacitación" value={data.epp?.planAnualCapacitacion} />
            </div>
            {renderAdjuntos(data.epp?.adjuntos)}

            {/* CAPÍTULO 5: AMBIENTE */}
            <ChapterDivider title="Medio Ambiente Laboral" subtitle="Estudios de higiene ocupacional" icon={Wind} colorKey="ambiente" chapterNum={5} />
            <SectionHeader title="Estudios y Mediciones" icon={Wind} colorKey="ambiente" />
            <div style={{ background: '#f8fafc', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
                <table style={{ tableLayout: 'fixed', wordBreak: 'break-word', overflowWrap: 'break-word',  width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr className="avoid-break" style={{ pageBreakInside: 'avoid', breakInside: 'avoid',  background: '#f1f5f9' }}>
                            <th style={{ textAlign: 'left', padding: '1rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Estudio / Medición</th>
                            <th style={{ textAlign: 'center', padding: '1rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Resultado</th>
                            <th style={{ textAlign: 'center', padding: '1rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase' }}>Fecha Medición</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AmbienteRow label="Iluminación en Puestos (Res. 84/12)" apto={data.ambiente?.iluminacionApto !== false} fecha={data.ambiente?.iluminacionFecha} />
                        <AmbienteRow label="Nivel de Ruido (Res. 85/12)" apto={data.ambiente?.ruidoApto !== false} fecha={data.ambiente?.ruidoFecha} />
                        <AmbienteRow label="Puesta a Tierra (Res. 900/15)" apto={data.ambiente?.puestaTierraApto !== false} fecha={data.ambiente?.puestaTierraFecha} />
                        <AmbienteRow label="Estrés Térmico" apto={data.ambiente?.estresTermicoApto !== false} fecha={data.ambiente?.estresTermicoFecha} />
                        <AmbienteRow label="Ventilación" apto={data.ambiente?.ventilacionApto !== false} fecha={data.ambiente?.ventilacionFecha} />
                        <AmbienteRow label="Contaminantes Químicos" apto={data.ambiente?.contaminantesApto !== false} fecha={data.ambiente?.contaminantesFecha} />
                    </tbody>
                </table>
            </div>
            {renderAdjuntos(data.ambiente?.adjuntos)}

            {/* FIRMAS Y CIERRE */}
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page' }}></div>
            <SectionHeader title="Declaración y Cierre" icon={PenTool} colorKey="firmas" />
            <div style={{ background: '#f8fafc', padding: '2rem', borderRadius: '16px', border: '1px solid #e2e8f0', marginBottom: '3rem' }}>
                <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
                    El presente <strong>Legajo Técnico</strong> ha sido elaborado conforme a las disposiciones de la Ley 19.587 de Higiene y Seguridad en el Trabajo y su Decreto Reglamentario 351/79 (y sus modificatorias). Toda la información contenida en este documento tiene carácter de declaración jurada respecto a las condiciones relevadas en la fecha de emisión.
                </p>
            </div>
            <div style={{ marginTop: '2rem', pageBreakInside: 'avoid' }}>
                <PdfSignatures
                    data={{
                        professionalSignature: data.firmas?.profesional,
                        professionalName: data.professionalName || 'Profesional H&S',
                        companyName: data.empresa?.razonSocial || 'Empresa'
                    }}
                    box1={{
                        title: 'REPRESENTANTE EMPRESA',
                        subtitle: (data.empresa?.razonSocial || 'Firma Representante').toUpperCase(),
                        signatureUrl: data.firmas?.representante || null,
                        isProfessional: false
                    }}
                    box2={{
                        title: 'PROFESIONAL H&S',
                        subtitle: (data.professionalName || 'Especialista H&S').toUpperCase(),
                        signatureUrl: data.firmas?.profesional || null,
                        stampUrl: null,
                        isProfessional: true,
                        license: 'Matrícula en trámite'
                    }}
                    box3={null}
                />
            </div>

            <PdfBrandingFooter />
        </div>
    );
}
