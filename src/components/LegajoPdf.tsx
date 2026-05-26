import React from 'react';
import { Building2, AlertTriangle, Flame, ShieldCheck, Wind, PenTool, Zap, ArrowUp, Bug } from 'lucide-react';
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

    const Section = ({ title, icon: Icon, colorKey }: any) => {
        const color = sectionColors[colorKey] || '#2563eb';
        return (
            <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: `3px solid ${color}`,
                paddingBottom: '0.5rem', marginBottom: '1rem', marginTop: '2rem'
            }}>
                <div style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: `${color}18`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: color, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                    {title}
                </h3>
            </div>
        );
    };

    const Field = ({ label, value }: { label: string, value: string | undefined }) => (
        <div style={{ marginBottom: '0.6rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
            </span>
            <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                {value || '—'}
            </span>
        </div>
    );

    const Tag = ({ label, active }: { label: string, active: boolean }) => (
        <span style={{
            padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700,
            background: active ? '#dcfce7' : '#f1f5f9',
            color: active ? '#166534' : '#94a3b8',
            border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`
        }}>
            {active ? '✓' : '✕'} {label}
        </span>
    );

    const AmbienteRow = ({ label, apto, fecha }: { label: string, apto: boolean, fecha: string }) => (
        <tr>
            <td style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0', fontSize: '0.9rem', fontWeight: 600 }}>{label}</td>
            <td style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, color: apto ? '#166534' : '#dc2626', textAlign: 'center' }}>
                {apto ? 'SÍ CUMPLE' : 'NO CUMPLE'}
            </td>
            <td style={{ padding: '0.6rem', borderBottom: '1px solid #e2e8f0', textAlign: 'center', fontSize: '0.85rem' }}>
                {fecha ? new Date(fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '—'}
            </td>
        </tr>
    );

    const renderAdjuntos = (adjuntos: any[]) => {
        if (!adjuntos || adjuntos.length === 0) return null;
        return (
            <div style={{ marginTop: '0.75rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Adjuntos</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {adjuntos.map((img: string, i: number) => (
                        <img key={i} src={img} alt="" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="pdf-document" style={{
            background: '#ffffff',
            padding: '2rem',
            width: '100%',
            maxWidth: '100%',
            color: '#000000',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <style type="text/css" media="print">{`
                @page { size: A4 portrait; margin: 12mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
            `}</style>

            <CompanyLogo />

            {/* Premium Header */}
            <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1.5rem', padding: '2rem', background: 'linear-gradient(135deg, #f0f4ff 0%, #faf5ff 100%)', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e293b', margin: '0 0 0.3rem 0', letterSpacing: '-0.02em' }}>LEGAJO TÉCNICO</h1>
                <p style={{ fontSize: '1rem', color: '#475569', margin: 0, fontWeight: 700 }}>Higiene y Seguridad en el Trabajo</p>
                <p style={{ fontSize: '0.85rem', color: '#94a3b8', margin: '0.3rem 0 0 0', fontWeight: 600 }}>Decreto 351/79 — Ley 19.587 · ISO 45001</p>
                {data.empresa?.razonSocial && (
                    <div style={{ marginTop: '1rem', padding: '0.6rem 1.5rem', background: '#2563eb', color: '#fff', borderRadius: '10px', display: 'inline-block', fontWeight: 800, fontSize: '1.1rem' }}>
                        {data.empresa.razonSocial}
                    </div>
                )}
            </div>

            {/* EMPRESA */}
            <Section title="Datos del Establecimiento" icon={Building2} colorKey="empresa" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
                <Field label="Razón Social" value={data.empresa?.razonSocial} />
                <Field label="CUIT" value={data.empresa?.cuit} />
                <div style={{ gridColumn: '1 / -1' }}><Field label="Domicilio Completo" value={data.empresa?.domicilio} /></div>
                <Field label="Localidad" value={data.empresa?.localidad} />
                <Field label="Provincia" value={data.empresa?.provincia} />
                <Field label="Código Postal" value={data.empresa?.codigoPostal} />
                <Field label="Teléfono" value={data.empresa?.telefono} />
                <Field label="Email de Contacto" value={data.empresa?.email} />
                <Field label="Actividad Principal" value={data.empresa?.actividad} />
                <Field label="Aseguradora (ART)" value={data.empresa?.art} />
                <Field label="Nº Póliza ART" value={data.empresa?.polizaArt} />
                <Field label="Cantidad de Empleados" value={data.empresa?.cantidadEmpleados} />
                <Field label="Superficie (m²)" value={data.empresa?.superficie} />
                <Field label="Responsable de Seguridad" value={data.empresa?.responsableSeguridad} />
                <Field label="Matrícula" value={data.empresa?.matriculaResponsable} />
                <Field label="Representante Legal" value={data.empresa?.representanteLegal} />
                <Field label="Horarios de Trabajo" value={data.empresa?.horariosTrabajo} />
                <Field label="Inicio de Actividad" value={data.empresa?.fechaInicioActividad} />
            </div>

            {/* RIESGOS */}
            <Section title="Identificación de Riesgos" icon={AlertTriangle} colorKey="riesgos" />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <Field label="Riesgos Físicos Presentes" value={data.riesgos?.fisicos} />
                <Field label="Riesgos Químicos / Ambiental" value={data.riesgos?.quimicos} />
                <Field label="Riesgos Biológicos" value={data.riesgos?.biologicos} />
                <Field label="Riesgos Ergonómicos" value={data.riesgos?.ergonomicos} />
                <Field label="Riesgos Eléctricos" value={data.riesgos?.electricos} />
                <Field label="Riesgos de Trabajo en Altura" value={data.riesgos?.trabajoAltura} />
                {data.riesgos?.nivelRiesgo && (
                    <div style={{ marginBottom: '0.6rem' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.15rem', textTransform: 'uppercase' }}>Nivel de Riesgo General</span>
                        <span style={{
                            padding: '4px 14px', borderRadius: '8px', fontWeight: 800, fontSize: '0.9rem',
                            background: data.riesgos.nivelRiesgo === 'Crítico' ? '#fef2f2' : data.riesgos.nivelRiesgo === 'Alto' ? '#fff7ed' : data.riesgos.nivelRiesgo === 'Medio' ? '#fefce8' : '#f0fdf4',
                            color: data.riesgos.nivelRiesgo === 'Crítico' ? '#991b1b' : data.riesgos.nivelRiesgo === 'Alto' ? '#9a3412' : data.riesgos.nivelRiesgo === 'Medio' ? '#854d0e' : '#166534',
                            border: `1px solid ${data.riesgos.nivelRiesgo === 'Crítico' ? '#fecaca' : data.riesgos.nivelRiesgo === 'Alto' ? '#fed7aa' : data.riesgos.nivelRiesgo === 'Medio' ? '#fef08a' : '#bbf7d0'}`
                        }}>
                            {data.riesgos.nivelRiesgo}
                        </span>
                    </div>
                )}
                <Field label="Medidas Preventivas Adoptadas" value={data.riesgos?.medidasPreventivas} />
                <Field label="Observaciones / Recomendaciones" value={data.riesgos?.observaciones} />
                {renderAdjuntos(data.riesgos?.adjuntos)}
            </div>

            {/* INCENDIO */}
            <div style={{ pageBreakBefore: 'always' }} />
            <Section title="Protección Contra Incendios" icon={Flame} colorKey="incendio" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 2rem' }}>
                <Field label="Carga de Fuego (Mcal/m²)" value={data.incendio?.cargaFuego} />
                <Field label="Riesgo de Incendio" value={data.incendio?.riesgoIncendio} />
                <Field label="Cantidad Total de Extintores" value={data.incendio?.cantidadExtintores} />
                <Field label="Tipo de Extintores" value={data.incendio?.tipoExtintores} />
                <Field label="Fecha Último Simulacro" value={data.incendio?.fechaSimulacro} />
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.75rem' }}>
                <Tag label="Plan de Evacuación" active={!!data.incendio?.planEvacuacion} />
                <Tag label="Sistema Detección/Alarma" active={!!data.incendio?.sistemaDeteccion} />
                <Tag label="Red Hidrantes/Rociadores" active={!!data.incendio?.redHidrantes} />
                <Tag label="Brigada de Emergencia" active={!!data.incendio?.brigadaEmergencia} />
                <Tag label="Plano de Evacuación" active={!!data.incendio?.planoEvacuacion} />
            </div>
            {renderAdjuntos(data.incendio?.adjuntos)}

            {/* EPP */}
            <Section title="EPP y Capacitaciones" icon={ShieldCheck} colorKey="epp" />
            <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '10px', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Elementos de Protección Personal Entregados</span>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
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
            <Field label="Última Capacitación General" value={data.epp?.capacitacionRealizada} />
            <Field label="Próxima Capacitación Programada" value={data.epp?.proximaCapacitacion} />
            <Field label="Plan Anual de Capacitación" value={data.epp?.planAnualCapacitacion} />
            {renderAdjuntos(data.epp?.adjuntos)}

            {/* AMBIENTE */}
            <Section title="Medio Ambiente Laboral" icon={Wind} colorKey="ambiente" />
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '0.5rem' }}>
                <thead>
                    <tr style={{ background: '#f1f5f9' }}>
                        <th style={{ textAlign: 'left', padding: '0.6rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Estudio / Medición</th>
                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Resultado</th>
                        <th style={{ textAlign: 'center', padding: '0.6rem', borderBottom: '2px solid #cbd5e1', fontSize: '0.8rem', fontWeight: 800, color: '#475569' }}>Fecha Medición</th>
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
            {renderAdjuntos(data.ambiente?.adjuntos)}

            {/* FIRMAS */}
            <div style={{ marginTop: '3rem', pageBreakInside: 'avoid' }}>
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
