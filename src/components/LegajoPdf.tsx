import React from 'react';
import { Building2, AlertTriangle, Flame, ShieldCheck, Wind, PenTool, Wrench, PackageSearch } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';

export default function LegajoPdf({ data }: {data: any;}): React.ReactElement | null {
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
      <div style={{




        background: `linear-gradient(135deg, #ffffff 0%, ${color}08 100%)`,

        border: `1px solid ${color}20`





      }} className="flex flex-col justify-center items-center rounded-[24px] m-[20px_0] p-[1.5rem] text-center page-break-inside-[avoid] break-inside-[avoid]">
                <div style={{

          background: `linear-gradient(135deg, ${color}, ${color}dd)`,


          boxShadow: `0 10px 30px ${color}40`
        }} className="w-[60px] h-[60px] rounded-[16px] text-[#fff] flex items-center justify-center mb-[1rem]">
                    <Icon size={30} />
                </div>
                <div style={{ color: color }} className="font-[900] text-[1rem] letter-spacing-[0.1em] uppercase mb-[0.5rem]">
                    Capítulo {chapterNum}
                </div>
                <h2 className="m-[0] text-[1.8rem] font-[900] text-[#1e293b] letter-spacing-[-0.03em] line-height-[1.1]">
                    {title}
                </h2>
                {subtitle &&
        <p className="text-[1rem] text-[#64748b] mt-[0.5rem] font-[500]">
                        {subtitle}
                    </p>
        }
            </div>);

  };

  const SectionHeader = ({ title, icon: Icon, colorKey }: any) => {
    const color = sectionColors[colorKey] || '#2563eb';
    return (
      <div style={{

        borderBottom: `2px solid ${color}`

      }} className="flex items-center gap-[0.75rem] pb-[0.75rem] mb-[1.5rem] mt-[1rem]">
                <div style={{

          background: `${color}18`, color: color

        }} className="w-[32px] h-[32px] rounded-[8px] flex items-center justify-center">
                    <Icon size={18} />
                </div>
                <h3 style={{ color: color }} className="m-[0] text-[1.1rem] font-[800] uppercase letter-spacing-[0.03em]">
                    {title}
                </h3>
            </div>);

  };

  const FieldBox = ({ label, value, fullWidth = false }: {label: string;value: string | undefined;fullWidth?: boolean;}) =>
  <div style={{




    gridColumn: fullWidth ? '1 / -1' : 'auto'
  }} className="bg-[#f8fafc] border-[1px_solid_#e2e8f0] rounded-[12px] p-[1rem]">
            <span className="text-[0.7rem] font-[800] text-[#64748b] block mb-[0.4rem] uppercase letter-spacing-[0.05em]">
                {label}
            </span>
            <span className="text-[0.95rem] font-[600] text-[#0f172a] block">
                {value || '—'}
            </span>
        </div>;


  const Tag = ({ label, active }: {label: string;active: boolean;}) =>
  <span style={{

    background: active ? '#dcfce7' : '#f1f5f9',
    color: active ? '#166534' : '#94a3b8',
    border: `1px solid ${active ? '#bbf7d0' : '#e2e8f0'}`
  }} className="p-[4px_12px] rounded-[8px] text-[0.8rem] font-[700]">
            {active ? '✓' : '✕'} {label}
        </span>;


  
  const AmbienteRow = ({ label, apto, fecha, valor, limite, empresa, protocolo, unit }: any) =>
  <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.8rem] font-[600] text-[#1e293b]">{label}</td>
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.8rem] text-center">{fecha ? new Date(fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : '—'}</td>
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.8rem] text-center font-[700]">{valor ? `${valor} ${unit}` : '—'}</td>
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.8rem] text-center text-[#64748b]">{limite ? `${limite} ${unit}` : '—'}</td>
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.7rem] text-center text-[#64748b]">{protocolo || '—'}</td>
            <td className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] text-[0.7rem] text-center text-[#64748b]">{empresa || '—'}</td>
            <td style={{ color: apto ? '#166534' : '#dc2626' }} className="p-[0.8rem_1rem] border-bottom-[1px_solid_#e2e8f0] font-[800] text-center">
                <span style={{
        background: apto ? '#dcfce7' : '#fee2e2',
        border: `1px solid ${apto ? '#bbf7d0' : '#fecaca'}`
      }} className="p-[4px_12px] rounded-[6px] text-[0.65rem] uppercase">
                    {apto ? 'CUMPLE' : 'NO CUMPLE'}
                </span>
            </td>
        </tr>;



  const renderAdjuntos = (adjuntos: any[]) => {
    if (!adjuntos || adjuntos.length === 0) return null;
    return (
      <div className="mt-[1.5rem] page-break-inside-[avoid]">
                <span className="text-[0.8rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.05em] block mb-[0.75rem]">Registro Fotográfico / Adjuntos</span>
                <div className="grid grid-template-columns-[repeat(auto-fill,_minmax(140px,_1fr))] gap-[10px]">
                    {adjuntos.map((img: string, i: number) =>
          <div key={i} className="aspect-ratio-[1] rounded-[12px] overflow-[hidden] border-[1px_solid_#e2e8f0] bg-[#f8fafc]">
                            <img src={img} alt="" className="w-[100%] h-[100%] object-fit-[cover]" />
                        </div>
          )}
                </div>
            </div>);

  };

  return (
    <div className="pdf-document premium-legajo bg-[#ffffff] p-[2rem] w-[100%] max-w-[100%] text-[#0f172a] font-family-[Inter,_system-ui,_sans-serif]">






      
            <style type="text/css" media="print">{`
                @page { size: A4 portrait; margin: 12mm; }
                body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                .no-print { display: none !important; }
                .premium-legajo { max-width: 210mm; margin: 0 auto; }
            `}</style>

            {/* CARÁTULA PRINCIPAL (COVER PAGE) */}
            <div className="min-h-[230mm] flex flex-col relative page-break-after-[always] break-after-[page]">






        
                <div className="flex justify-center mb-[auto] pt-[2rem]">
                    <CompanyLogo />
                </div>

                <div className="text-center flex-[1] flex flex-col justify-center">
                    <div className="w-[100px] h-[6px] bg-[#2563eb] m-[0_auto_2rem] rounded-[3px]" />

          
                    
                    <h1 className="text-[3.5rem] font-[900] text-[#0f172a] m-[0_0_1rem_0] letter-spacing-[-0.04em] line-height-[1]">
                        LEGAJO TÉCNICO
                    </h1>
                    <p className="text-[1.4rem] text-[#475569] m-[0_0_0.5rem_0] font-[700] letter-spacing-[-0.01em]">
                        Higiene y Seguridad en el Trabajo
                    </p>
                    <p className="text-[1rem] text-[#94a3b8] m-[0_0_3rem_0] font-[600]">
                        Decreto 351/79 — Ley 19.587 · ISO 45001
                    </p>

                    <div className="bg-[linear-gradient(135deg,_#f8fafc_0%,_#f1f5f9_100%)] border-[1px_solid_#e2e8f0] rounded-[24px] p-[3rem_2rem] m-[0_auto] max-w-[80%] w-[100%] box-shadow-[0_20px_40px_rgba(0,0,0,0.03)]">








            
                        <p className="text-[0.85rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.1em] m-[0_0_0.5rem_0]">Establecimiento</p>
                        <h2 className="text-[2rem] font-[900] text-[#1e293b] m-[0_0_0.5rem_0]">
                            {data.empresa?.razonSocial || 'Razón Social No Definida'}
                        </h2>
                        {data.empresa?.cuit &&
            <p className="text-[1.1rem] text-[#64748b] m-[0] font-[600] font-family-[monospace]">
                                CUIT: {data.empresa.cuit}
                            </p>
            }
                    </div>
                </div>

                <div className="mt-[auto] border-top-[2px_solid_#e2e8f0] pt-[1.5rem] flex justify-space-between items-end">
                    <div>
                        <p className="m-[0] text-[0.8rem] font-[700] text-[#64748b] uppercase letter-spacing-[0.05em]">Profesional Interviniente</p>
                        <p className="m-[0.2rem_0_0] text-[1.1rem] font-[800] text-[#0f172a]">{data.professionalName || 'Profesional H&S'}</p>
                    </div>
                    <div className="text-right">
                        <p className="m-[0] text-[0.8rem] font-[700] text-[#64748b] uppercase letter-spacing-[0.05em]">Fecha de Emisión</p>
                        <p className="m-[0.2rem_0_0] text-[1.1rem] font-[800] text-[#0f172a]">{new Date().toLocaleDateString('es-AR')}</p>
                    </div>
                </div>
            </div>

            {/* CAPÍTULO 1: EMPRESA */}
            <ChapterDivider title="Datos del Establecimiento" subtitle="Información general y administrativa de la empresa" icon={Building2} colorKey="empresa" chapterNum={1} />
            <SectionHeader title="Información General" icon={Building2} colorKey="empresa" />
            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[2rem]">
                <FieldBox fullWidth label="Razón Social" value={data.empresa?.razonSocial} />
                <FieldBox label="CUIT" value={data.empresa?.cuit} />
                <FieldBox label="Actividad Principal" value={data.empresa?.actividad} />
                <FieldBox fullWidth label="Domicilio Completo" value={`${data.empresa?.domicilio || ''} ${data.empresa?.localidad ? '- ' + data.empresa.localidad : ''} ${data.empresa?.provincia ? '(' + data.empresa.provincia + ')' : ''}`} />
                <FieldBox label="Código Postal" value={data.empresa?.codigoPostal} />
                <FieldBox label="Teléfono" value={data.empresa?.telefono} />
                <FieldBox fullWidth label="Email de Contacto" value={data.empresa?.email} />
            </div>

            <SectionHeader title="Datos Laborales y Seguros" icon={ShieldCheck} colorKey="empresa" />
            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
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
            
            {data.riesgos?.nivelRiesgo &&
      <div style={{
        background: data.riesgos.nivelRiesgo === 'Crítico' ? '#fef2f2' : data.riesgos.nivelRiesgo === 'Alto' ? '#fff7ed' : data.riesgos.nivelRiesgo === 'Medio' ? '#fefce8' : '#f0fdf4',
        border: `2px solid ${data.riesgos.nivelRiesgo === 'Crítico' ? '#fca5a5' : data.riesgos.nivelRiesgo === 'Alto' ? '#fdba74' : data.riesgos.nivelRiesgo === 'Medio' ? '#fde047' : '#86efac'}`
      }} className="rounded-[16px] p-[1.5rem] text-center mb-[2rem]">
                    <span className="text-[0.85rem] font-[800] text-[#64748b] uppercase letter-spacing-[0.1em] block mb-[0.5rem]">Nivel de Riesgo General de Planta</span>
                    <span style={{
          color: data.riesgos.nivelRiesgo === 'Crítico' ? '#991b1b' : data.riesgos.nivelRiesgo === 'Alto' ? '#9a3412' : data.riesgos.nivelRiesgo === 'Medio' ? '#854d0e' : '#166534'
        }} className="text-[1.8rem] font-[900]">
                        {data.riesgos.nivelRiesgo}
                    </span>
                </div>
      }

            <SectionHeader title="Matriz de Evaluación de Riesgos" icon={AlertTriangle} colorKey="riesgos" />
            
            {data.riesgos?.matriz && data.riesgos.matriz.length > 0 ? (
              <div className="bg-[#f8fafc] rounded-[16px] border-[1px_solid_#e2e8f0] overflow-[hidden] mb-[2rem]">
                  <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse]">
                      <thead>
                          <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#f1f5f9]">
                              <th className="text-left p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase">Tipo / Puesto</th>
                              <th className="text-left p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase">Peligro</th>
                              <th className="text-center p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase w-[50px]">Exp.</th>
                              <th className="text-center p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase">PxC</th>
                              <th className="text-center p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase">Nivel</th>
                              <th className="text-left p-[0.7rem] border-bottom-[2px_solid_#cbd5e1] text-[0.65rem] font-[800] text-[#475569] uppercase">Medida Control</th>
                          </tr>
                      </thead>
                      <tbody>
                        {data.riesgos.matriz.map((r: any, idx: number) => (
                          <tr key={idx} className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0]">
                              <div className="text-[0.7rem] font-[800] text-[#0f172a]">{r.tipo || '-'}</div>
                              <div className="text-[0.65rem] text-[#64748b] mt-1">{r.puesto || '-'}</div>
                            </td>
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0] text-[0.7rem] text-[#1e293b]">{r.descripcion || '-'}</td>
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0] text-[0.7rem] text-center font-bold text-[#475569]">{r.expuestos || '-'}</td>
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0] text-[0.6rem] text-center text-[#64748b]">
                              P: {r.probabilidad ? r.probabilidad[0] : '-'}<br/>C: {r.consecuencia ? r.consecuencia[0] : '-'}
                            </td>
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0] text-center">
                              <span style={{
                                background: r.nivel === 'Crítico' ? '#fca5a5' : r.nivel === 'Alto' ? '#fdba74' : r.nivel === 'Medio' ? '#fde047' : r.nivel === 'Bajo' ? '#86efac' : '#f1f5f9',
                                color: r.nivel === 'Crítico' ? '#7f1d1d' : r.nivel === 'Alto' ? '#7c2d12' : r.nivel === 'Medio' ? '#713f12' : r.nivel === 'Bajo' ? '#14532d' : '#475569'
                              }} className="p-[3px_6px] rounded-[4px] text-[0.65rem] font-bold uppercase">{r.nivel || '-'}</span>
                            </td>
                            <td className="p-[0.7rem] border-bottom-[1px_solid_#e2e8f0]">
                              <div className="text-[0.7rem] text-[#1e293b]">{r.medida || '-'}</div>
                              {r.plazo && <div className="text-[0.6rem] text-[#64748b] mt-1 font-bold">Plazo: {new Date(r.plazo + 'T12:00:00Z').toLocaleDateString('es-AR')}</div>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                  </table>
              </div>
            ) : (
              <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                  <FieldBox fullWidth label="Riesgos Físicos Presentes" value={data.riesgos?.fisicos} />
                  <FieldBox fullWidth label="Riesgos Químicos / Ambiental" value={data.riesgos?.quimicos} />
                  <FieldBox fullWidth label="Riesgos Biológicos" value={data.riesgos?.biologicos} />
                  <FieldBox fullWidth label="Riesgos Ergonómicos" value={data.riesgos?.ergonomicos} />
                  <FieldBox fullWidth label="Riesgos Eléctricos" value={data.riesgos?.electricos} />
                  <FieldBox fullWidth label="Riesgos de Trabajo en Altura" value={data.riesgos?.trabajoAltura} />
              </div>
            )}

            <div className="mt-[2rem]">
                <SectionHeader title="Medidas Preventivas Generales" icon={ShieldCheck} colorKey="riesgos" />
                <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                    <FieldBox fullWidth label="Medidas Generales y Procedimientos" value={data.riesgos?.medidasPreventivas} />
                    <FieldBox fullWidth label="Observaciones / Recomendaciones" value={data.riesgos?.observaciones} />
                </div>
            </div>
            {renderAdjuntos(data.riesgos?.adjuntos)}

            {/* CAPÍTULO 3: INCENDIO */}
            <ChapterDivider title="Protección Contra Incendios" subtitle="Sistemas de detección, extinción y evacuación" icon={Flame} colorKey="incendio" chapterNum={3} />
            <SectionHeader title="Análisis de Carga de Fuego" icon={Flame} colorKey="incendio" />
            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[2rem]">
                <FieldBox label="Carga de Fuego (Mcal/m²)" value={data.incendio?.cargaFuego} />
                <FieldBox label="Riesgo de Incendio" value={data.incendio?.riesgoIncendio} />
            </div>

            <SectionHeader title="Medios de Extinción" icon={Flame} colorKey="incendio" />
            <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[2rem]">
                <FieldBox label="Cantidad Total de Extintores" value={data.incendio?.cantidadExtintores} />
                <FieldBox label="Tipo de Extintores" value={data.incendio?.tipoExtintores} />
            </div>

            <SectionHeader title="Instalaciones Fijas y Evacuación" icon={Building2} colorKey="incendio" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[1.5rem]">
                <div className="flex gap-[0.75rem] flex-wrap mb-[1.5rem]">
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
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap">
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
            <div className="grid grid-template-columns-[1fr] gap-[1rem]">
                <FieldBox fullWidth label="Última Capacitación General" value={data.epp?.capacitacionRealizada} />
                <FieldBox fullWidth label="Próxima Capacitación Programada" value={data.epp?.proximaCapacitacion} />
                <FieldBox fullWidth label="Plan Anual de Capacitación" value={data.epp?.planAnualCapacitacion} />
            </div>
            {renderAdjuntos(data.epp?.adjuntos)}

            
            {/* CAPÍTULO 5: AMBIENTE */}
            <ChapterDivider title="Medio Ambiente Laboral" subtitle="Estudios de higiene ocupacional según Res. 905/15" icon={Wind} colorKey="ambiente" chapterNum={5} />
            <SectionHeader title="Estudios y Mediciones" icon={Wind} colorKey="ambiente" />
            <div className="bg-[#f8fafc] rounded-[16px] border-[1px_solid_#e2e8f0] overflow-[hidden] mb-[2rem]">
                <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse]">
                    <thead>
                        <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#f1f5f9]">
                            <th className="text-left p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Estudio</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Fecha</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Valor Hallado</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Límite</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Protocolo</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Ejecutor</th>
                            <th className="text-center p-[0.7rem_1rem] border-bottom-[2px_solid_#cbd5e1] text-[0.7rem] font-[800] text-[#475569] uppercase">Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <AmbienteRow label="Iluminación en Puestos (Res. 84/12)" apto={data.ambiente?.iluminacionApto !== false} fecha={data.ambiente?.iluminacionFecha} valor={data.ambiente?.iluminacionValor} limite={data.ambiente?.iluminacionLimite} protocolo={data.ambiente?.iluminacionProtocolo} empresa={data.ambiente?.iluminacionEmpresa} unit="lux" />
                        <AmbienteRow label="Nivel de Ruido (Res. 85/12)" apto={data.ambiente?.ruidoApto !== false} fecha={data.ambiente?.ruidoFecha} valor={data.ambiente?.ruidoValor} limite={data.ambiente?.ruidoLimite} protocolo={data.ambiente?.ruidoProtocolo} empresa={data.ambiente?.ruidoEmpresa} unit="dB(A)" />
                        <AmbienteRow label="Puesta a Tierra (Res. 900/15)" apto={data.ambiente?.puestaTierraApto !== false} fecha={data.ambiente?.puestaTierraFecha} valor={data.ambiente?.puestaTierraValor} limite={data.ambiente?.puestaTierraLimite} protocolo={data.ambiente?.puestaTierraProtocolo} empresa={data.ambiente?.puestaTierraEmpresa} unit="Ohms" />
                        <AmbienteRow label="Estrés Térmico (Res. 295/03)" apto={data.ambiente?.estresTermicoApto !== false} fecha={data.ambiente?.estresTermicoFecha} valor={data.ambiente?.estresTermicoValor} limite={data.ambiente?.estresTermicoLimite} protocolo={data.ambiente?.estresTermicoProtocolo} empresa={data.ambiente?.estresTermicoEmpresa} unit="°TGBH" />
                        <AmbienteRow label="Ventilación (Dec. 351/79)" apto={data.ambiente?.ventilacionApto !== false} fecha={data.ambiente?.ventilacionFecha} valor={data.ambiente?.ventilacionValor} limite={data.ambiente?.ventilacionLimite} protocolo={data.ambiente?.ventilacionProtocolo} empresa={data.ambiente?.ventilacionEmpresa} unit="Ren/h" />
                        <AmbienteRow label="Contaminantes Químicos (Res. 295/03)" apto={data.ambiente?.contaminantesApto !== false} fecha={data.ambiente?.contaminantesFecha} valor={data.ambiente?.contaminantesValor} limite={data.ambiente?.contaminantesLimite} protocolo={data.ambiente?.contaminantesProtocolo} empresa={data.ambiente?.contaminantesEmpresa} unit="mg/m³" />
                    </tbody>
                </table>
            </div>
            {renderAdjuntos(data.ambiente?.adjuntos)}

            {/* CAPÍTULO 6: INSTALACIONES Y MÁQUINAS */}
            <ChapterDivider title="Instalaciones y Máquinas" subtitle="Condiciones de seguridad según Dec. 351/79 (Caps. 14 al 16)" icon={Wrench} colorKey="empresa" chapterNum={6} />
            
            <SectionHeader title="Instalaciones Eléctricas (Cap. 14)" icon={AlertTriangle} colorKey="empresa" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap mb-[1rem]">
                    <Tag label="Tableros frentes muertos" active={!!data.instalaciones?.tablerosElectricos} />
                    <Tag label="Protecciones (Dif/Termo)" active={!!data.instalaciones?.proteccionDiferencial} />
                    <Tag label="Puesta a Tierra Conectada" active={!!data.instalaciones?.patVerificada} />
                    <Tag label="Certificado Electricista" active={!!data.instalaciones?.certificadoElectricista} />
                </div>
                <FieldBox fullWidth label="Estado General del Cableado" value={data.instalaciones?.estadoCableado} />
            </div>

            <SectionHeader title="Máquinas y Herramientas (Caps. 15-16)" icon={Wrench} colorKey="empresa" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap mb-[1rem]">
                    <Tag label="Guardas de Protección" active={!!data.instalaciones?.guardasProteccion} />
                    <Tag label="Paros de Emergencia" active={!!data.instalaciones?.parosEmergencia} />
                    <Tag label="Mantenimiento Preventivo" active={!!data.instalaciones?.mantenimientoPreventivo} />
                    <Tag label="Instructivos / Hojas Seg." active={!!data.instalaciones?.hojasSeguridad} />
                </div>
            </div>

            <SectionHeader title="Gas y Aparatos a Presión" icon={Flame} colorKey="empresa" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap mb-[1rem]">
                    <Tag label="Instalación Aprobada" active={!!data.instalaciones?.gasHabilitacion} />
                    <Tag label="Válvulas Corte Rápido" active={!!data.instalaciones?.gasValvulas} />
                    <Tag label="Detector Fugas/CO" active={!!data.instalaciones?.gasDetector} />
                    <Tag label="Compresores s/Norma" active={!!data.instalaciones?.gasEnargas} />
                </div>
            </div>
            {renderAdjuntos(data.instalaciones?.adjuntos)}

            {/* CAPÍTULO 7: ORDEN Y SEÑALIZACIÓN */}
            <ChapterDivider title="Orden, Limpieza y Señalización" subtitle="Condiciones generales de los ambientes laborales" icon={PackageSearch} colorKey="riesgos" chapterNum={7} />
            
            <SectionHeader title="Orden y Circulación" icon={PackageSearch} colorKey="riesgos" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap">
                    <Tag label="Pasajes Libres (70cm+)" active={!!data.orden?.pasajesLibres} />
                    <Tag label="Almacenamiento Delimitado" active={!!data.orden?.almacenamientoDelimitado} />
                    <Tag label="Gestión Residuos" active={!!data.orden?.gestionResiduos} />
                </div>
            </div>

            <SectionHeader title="Señalización (IRAM 10005)" icon={AlertTriangle} colorKey="riesgos" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap">
                    <Tag label="Cumple Colores/Señales" active={!!data.orden?.iram10005} />
                    <Tag label="Vías Escape Señalizadas" active={!!data.orden?.senalizacionEscape} />
                    <Tag label="Zonas Peligrosas Demarcadas" active={!!data.orden?.zonasPeligrosas} />
                </div>
            </div>

            <SectionHeader title="Servicios y Primeros Auxilios" icon={ShieldCheck} colorKey="riesgos" />
            <div className="bg-[#f8fafc] p-[1.5rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[2rem]">
                <div className="flex gap-[0.75rem] flex-wrap mb-[1rem]">
                    <Tag label="Vestuarios Separados" active={!!data.orden?.vestuarios} />
                    <Tag label="Comedor Aislado" active={!!data.orden?.comedor} />
                    <Tag label="Botiquín Completo" active={!!data.orden?.botiquinCompleto} />
                </div>
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem]">
                    <FieldBox label="Cantidad Sanitarios/Duchas" value={data.orden?.sanitariosCantidad} />
                    <FieldBox label="Responsable Primeros Aux." value={data.orden?.responsablePrimerosAuxilios} />
                    <FieldBox fullWidth label="Distancia a Centro Asistencial (km)" value={data.orden?.distanciaCentroAsistencial} />
                </div>
            </div>
            {renderAdjuntos(data.orden?.adjuntos)}

            {/* FIRMAS Y CIERRE */}
            <div className="page-break-before-[always] break-before-[page]"></div>
            <SectionHeader title="Declaración y Cierre" icon={PenTool} colorKey="firmas" />
            <div className="bg-[#f8fafc] p-[2rem] rounded-[16px] border-[1px_solid_#e2e8f0] mb-[3rem]">
                <p className="m-[0] text-[0.95rem] text-[#475569] line-height-[1.6]">
                    El presente <strong>Legajo Técnico</strong> ha sido elaborado conforme a las disposiciones de la Ley 19.587 de Higiene y Seguridad en el Trabajo y su Decreto Reglamentario 351/79 (y sus modificatorias). Toda la información contenida en este documento tiene carácter de declaración jurada respecto a las condiciones relevadas en la fecha de emisión.
                </p>
            </div>
            <div className="mt-[2rem] page-break-inside-[avoid]">
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
          box3={null} />
        
            </div>

            <PdfBrandingFooter />
        </div>);

}