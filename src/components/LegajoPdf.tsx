import React from 'react';
import { Building2, AlertTriangle, Flame, ShieldCheck, Wind, PenTool } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function LegajoPdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const Section = ({ title, icon: Icon, children }: any) => (
        <div style={{ marginBottom: '2rem', pageBreakInside: 'avoid' }}>
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                borderBottom: '2px solid var(--color-primary)',
                paddingBottom: '0.5rem', marginBottom: '1rem'
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '8px',
                    background: 'rgba(59, 130, 246, 0.1)', color: 'var(--color-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <Icon size={18} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                    {title}
                </h3>
            </div>
            {children}
        </div>
    );

    const Field = ({ label, value }: { label: string, value: string | undefined }) => (
        <div style={{ marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.2rem' }}>
                {label}
            </span>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
                {value || '-'}
            </span>
        </div>
    );

    return (
        <div className="pdf-document" style={{
            background: '#ffffff',
            padding: '2rem',
            width: '100%',
            maxWidth: '100%',
            color: '#000000',
            fontFamily: 'Inter, system-ui, sans-serif'
        }}>
            <CompanyLogo />

            <div style={{ textAlign: 'center', marginBottom: '3rem', marginTop: '2rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--color-primary)', margin: '0 0 0.5rem 0' }}>LEGAJO TÉCNICO</h1>
                <p style={{ fontSize: '1.2rem', color: 'var(--color-text-muted)', margin: 0, fontWeight: 600 }}>Higiene y Seguridad en el Trabajo</p>
                <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', margin: '0.5rem 0 0 0' }}>Decreto 351/79 - Ley 19.587</p>
            </div>

            <Section title="Datos del Establecimiento" icon={Building2}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="Razón Social" value={data.empresa?.razonSocial} />
                    <Field label="CUIT" value={data.empresa?.cuit} />
                    <div style={{ gridColumn: '1 / -1' }}><Field label="Domicilio Completo" value={data.empresa?.domicilio} /></div>
                    <Field label="Actividad Principal" value={data.empresa?.actividad} />
                    <Field label="Aseguradora (ART)" value={data.empresa?.art} />
                    <Field label="Cantidad de Empleados" value={data.empresa?.cantidadEmpleados} />
                    <Field label="Superficie (m²)" value={data.empresa?.superficie} />
                </div>
            </Section>

            <Section title="Identificación de Riesgos" icon={AlertTriangle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <Field label="Riesgos Físicos Presentes" value={data.riesgos?.fisicos} />
                    <Field label="Riesgos Químicos/Biológicos" value={data.riesgos?.quimicos} />
                    <Field label="Medidas Preventivas Adoptadas" value={data.riesgos?.medidasPreventivas} />
                </div>
            </Section>

            <Section title="Protección Contra Incendios" icon={Flame}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <Field label="Carga de Fuego (Mcal/m²)" value={data.incendio?.cargaFuego} />
                    <Field label="Riesgo de Incendio" value={data.incendio?.riesgoIncendio} />
                    <Field label="Cantidad Total de Extintores" value={data.incendio?.cantidadExtintores} />
                    <Field label="Plan de Evacuación Aprobado" value={data.incendio?.planEvacuacion ? "SÍ" : "NO"} />
                </div>
            </Section>

            <Section title="EPP y Capacitaciones" icon={ShieldCheck}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                    <div style={{ background: 'rgba(0,0,0,0.02)', padding: '1rem', borderRadius: '8px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'block', marginBottom: '0.5rem' }}>EPP Entregados</span>
                        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                            {data.epp?.ropaTrabajo && <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #eee' }}>Ropa de Trabajo</span>}
                            {data.epp?.calzadoSeguridad && <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #eee' }}>Calzado</span>}
                            {data.epp?.proteccionOcular && <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #eee' }}>Ocular</span>}
                            {data.epp?.proteccionAuditiva && <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #eee' }}>Auditiva</span>}
                            {data.epp?.proteccionRespiratoria && <span style={{ padding: '4px 8px', background: '#fff', borderRadius: '4px', fontSize: '0.9rem', border: '1px solid #eee' }}>Respiratoria</span>}
                        </div>
                    </div>
                    <Field label="Última Capacitación General" value={data.epp?.capacitacionRealizada} />
                    <Field label="Próxima Capacitación Programada" value={data.epp?.proximaCapacitacion} />
                </div>
            </Section>

            <Section title="Medio Ambiente Laboral" icon={Wind}>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>Estudio</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>Apto</th>
                            <th style={{ textAlign: 'left', padding: '0.75rem', borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)' }}>Fecha Medición</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Iluminación en Puestos (Res. 84/12)</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: data.ambiente?.iluminacionApto ? 'var(--color-success)' : 'var(--color-danger)' }}>{data.ambiente?.iluminacionApto ? "SÍ" : "NO"}</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>{data.ambiente?.iluminacionFecha || '-'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Nivel de Ruido (Res. 85/12)</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: data.ambiente?.ruidoApto ? 'var(--color-success)' : 'var(--color-danger)' }}>{data.ambiente?.ruidoApto ? "SÍ" : "NO"}</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>{data.ambiente?.ruidoFecha || '-'}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>Puesta a Tierra (Res. 900/15)</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)', fontWeight: 700, color: data.ambiente?.puestaTierraApto ? 'var(--color-success)' : 'var(--color-danger)' }}>{data.ambiente?.puestaTierraApto ? "SÍ" : "NO"}</td>
                            <td style={{ padding: '0.75rem', borderBottom: '1px solid var(--color-border)' }}>{data.ambiente?.puestaTierraFecha || '-'}</td>
                        </tr>
                    </tbody>
                </table>
            </Section>

            <div style={{ marginTop: '4rem', pageBreakInside: 'avoid' }}>
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
