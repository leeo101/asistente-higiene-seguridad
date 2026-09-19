import React, { useRef } from 'react';
import { Flame, ShieldCheck, Info, FileText, Building2, Droplets, Wind, AlertTriangle, CheckCircle2 } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import type { FireLoadAssessmentProtocol } from '../types/fireload';

export default function FireLoadPdfGenerator({ data }: { data: any }): React.ReactElement | null {
  const componentRef = useRef<HTMLDivElement>(null);

  if (!data) return null;

  const report: Partial<FireLoadAssessmentProtocol> & Record<string, any> = data;

  const cuit = report.cuit || report.empresaCuit || 'No informado';
  const razonSocial = report.razonSocial || report.empresa || report.companyName || 'Empresa No Especificada';
  const direccion = report.direccion || report.obra || 'Domicilio Legal';
  const localidad = report.localidad || 'Buenos Aires';
  const art = report.art || 'Asociart ART';
  const establecimiento = report.establecimiento || 'Planta Principal';

  const sector = report.sector || 'Sector de Incendio Principal';
  const superficie = report.superficie || 100;
  const riesgo = report.riesgo || report.metricas?.clasificacionRiesgo || 'R4';
  const ventilacion = report.ventilacion || report.metricas?.ventilacion || 'natural';
  const actividad = report.actividadResumen || report.descripcionActividad || report.actividadGrupo || 'Actividad Comercial / Industrial';

  const materiales = report.materiales || [];
  const metrics = report.metricas || report.results || {};

  const qf = metrics.cargaFuegoKgM2 ?? metrics.cargaDeFuego ?? metrics.cargaFuego ?? 0;
  const maderaEq = metrics.maderaEquivalenteKg ?? metrics.maderaEquivalente ?? 0;
  const totalKcal = metrics.cargaTermicaTotalKcal ?? metrics.cargaTermicaTotal ?? 0;
  const rf = metrics.resistenciaFuegoRequerida ?? metrics.rfRequerida ?? metrics.resistenciaRequerida ?? 'F60';
  const minExtintores = metrics.minExtintores ?? metrics.cantidadMatafuegos ?? metrics.minMatafuegos ?? 2;
  const potNominal = metrics.potencialExtintorNominal ?? metrics.potencialExtintor ?? '2A-10B:C';
  const reqHidrantes = metrics.requiereRedHidrantes ?? false;
  const reqSprinklers = metrics.requiereRociadoresAutomaticos ?? false;

  const getRiesgoDescription = (r: string) => {
    switch (r) {
      case 'R1': return 'R1 — Explosivo';
      case 'R2': return 'R2 — Inflamable';
      case 'R3': return 'R3 — Muy Combustible';
      case 'R4': return 'R4 — Combustible (Actividades industriales y depósitos generales)';
      case 'R5': return 'R5 — Poco Combustible';
      default: return r;
    }
  };

  return (
    <div className="w-[100%] flex justify-center bg-slate-100 p-2 sm:p-6 print:p-0 print:bg-white">
      <div
        id="pdf-content"
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[12mm_15mm] bg-[#ffffff] text-[#0f172a] shadow-2xl print:shadow-none rounded-none sm:rounded-xl box-border m-[0_auto] font-sans"
        ref={componentRef}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 0 !important; width: 100% !important; max-width: none !important; }
          `}
        </style>

        {/* Encabezado Oficial Institucional Dec. 351/79 Anexo VII */}
        <div className="border-b-2 border-slate-900 pb-3 mb-4">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9pt] font-black uppercase tracking-wider bg-slate-900 text-white px-2 py-0.5 rounded">
                  ESTUDIO TÉCNICO OFICIAL
                </span>
                <span className="text-[9pt] font-bold text-slate-600">
                  Decreto PEN N° 351/79 Anexo VII (Capítulo 18) • IRAM 3517-2
                </span>
              </div>
              <h1 className="text-[15pt] font-black text-slate-900 uppercase tracking-tight leading-snug m-0">
                Memoria de Carga de Fuego y Potencial Extintor
              </h1>
              <p className="text-[8pt] text-slate-500 m-0">
                Determinación de madera equivalente, resistencia al fuego estructural (F) y dotación de protección contra incendios
              </p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <CompanyLogo style={{ maxHeight: '44px', maxWidth: '140px', objectFit: 'contain' }} className="p-1 border border-slate-200 rounded" />
            </div>
          </div>
        </div>

        {/* 1. Datos del Establecimiento y Sector de Incendio */}
        <div className="mb-3">
          <div className="bg-slate-900 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Building2 size={13} className="text-amber-400" />
              1. IDENTIFICACIÓN DE LA EMPRESA Y SECTOR DE ESTUDIO
            </span>
            <span className="text-[7.5pt] text-slate-300 font-normal">
              Fecha: {report.fecha ? new Date(report.fecha + 'T12:00:00Z').toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
            </span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <tbody>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold w-[20%] border border-slate-300">Razón Social:</td>
                <td className="p-1.5 font-black text-slate-900 w-[40%] border border-slate-300">{razonSocial}</td>
                <td className="bg-slate-100 p-1.5 font-bold w-[15%] border border-slate-300">C.U.I.T. N°:</td>
                <td className="p-1.5 font-black text-slate-900 border border-slate-300">{cuit}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Ubicación / Planta:</td>
                <td className="p-1.5 border border-slate-300">{direccion} ({localidad})</td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">A.R.T.:</td>
                <td className="p-1.5 border border-slate-300">{art}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Sector de Incendio:</td>
                <td className="p-1.5 font-black text-blue-900 border border-slate-300">{sector}</td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Superficie (S):</td>
                <td className="p-1.5 font-black text-slate-900 border border-slate-300">{superficie} m²</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Riesgo y Ventilación:</td>
                <td className="p-1.5 border border-slate-300" colSpan={3}>
                  <strong className="text-orange-800">{getRiesgoDescription(riesgo)}</strong> • 
                  <span className="font-semibold text-slate-700 ml-1">
                    Ventilación: {ventilacion === 'natural' ? 'Ventilado naturalmente (aberturas al exterior ≥ 1/30 de S)' : 'Sin ventilación natural adecuada / Subsuelo'}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 2. Inventario de Materiales Combustibles */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Flame size={13} className="text-orange-400" />
              2. INVENTARIO DE MATERIALES COMBUSTIBLES PONDERADOS
            </span>
            <span className="text-[7.5pt] text-slate-300 font-normal">Poder Calorífico Patrón: 4.400 kcal/kg (Madera)</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300 text-center">
                <th className="p-1.5 text-left w-[40%] border-r border-slate-300">Material Combustible</th>
                <th className="p-1.5 w-[20%] border-r border-slate-300">Masa / Peso (kg)</th>
                <th className="p-1.5 w-[20%] border-r border-slate-300">Poder Cal. (kcal/kg)</th>
                <th className="p-1.5 w-[20%]">Calor Total (kcal)</th>
              </tr>
            </thead>
            <tbody>
              {materiales.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-3 text-center text-slate-400 italic">No se registraron materiales en el sector.</td>
                </tr>
              ) : (
                materiales.map((m: any, idx: number) => {
                  const p = Number(m.peso) || 0;
                  const c = Number(m.poderCalorifico) || 0;
                  const subtotal = p * c;
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-1.5 font-bold text-slate-800 border-r border-slate-300">{m.nombre}</td>
                      <td className="p-1.5 text-center font-mono border-r border-slate-300">{p.toLocaleString('es-AR')} kg</td>
                      <td className="p-1.5 text-center font-mono text-slate-600 border-r border-slate-300">{c.toLocaleString('es-AR')}</td>
                      <td className="p-1.5 text-right font-black text-slate-900 pr-3">{subtotal.toLocaleString('es-AR')}</td>
                    </tr>
                  );
                })
              )}
              <tr className="bg-slate-50 font-black text-slate-900 border-t-2 border-slate-400">
                <td className="p-1.5 border-r border-slate-300">TOTAL CARGA TÉRMICA:</td>
                <td className="p-1.5 text-center border-r border-slate-300 font-mono">
                  {materiales.reduce((acc: number, m: any) => acc + (Number(m.peso) || 0), 0).toLocaleString('es-AR')} kg
                </td>
                <td className="p-1.5 text-center border-r border-slate-300 font-mono text-slate-600">
                  {(totalKcal / 1000).toLocaleString('es-AR')} Mcal
                </td>
                <td className="p-1.5 text-right pr-3 font-mono text-blue-900">
                  {Math.round(totalKcal).toLocaleString('es-AR')} kcal
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 3. Resultados del Cálculo Normativo Qf y Resistencia Estructural (F) */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-emerald-400" />
              3. RESULTADOS DE CARGA DE FUEGO Y RESISTENCIA AL FUEGO (DEC. 351/79)
            </span>
            <span className="text-[7.5pt] text-slate-300 font-normal">Tabla 2.2.1 Anexo VII</span>
          </div>
          <div className="border border-t-0 border-slate-300 p-2.5 bg-white">
            <div className="grid grid-cols-4 gap-2 text-center mb-2">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded">
                <div className="text-[7pt] text-blue-900 font-bold uppercase">Carga de Fuego (Qf)</div>
                <div className="text-[18pt] font-black text-blue-700 leading-tight">{qf}</div>
                <div className="text-[6.5pt] text-slate-600 font-bold">kg Madera / m²</div>
              </div>
              <div className="p-2 bg-slate-50 border border-slate-300 rounded">
                <div className="text-[7pt] text-slate-700 font-bold uppercase">Madera Equivalente</div>
                <div className="text-[18pt] font-black text-slate-800 leading-tight">{maderaEq.toLocaleString('es-AR')}</div>
                <div className="text-[6.5pt] text-slate-500 font-medium">kg madera patrón</div>
              </div>
              <div className="p-2 bg-orange-50 border border-orange-200 rounded">
                <div className="text-[7pt] text-orange-900 font-bold uppercase">Riesgo Dominante</div>
                <div className="text-[18pt] font-black text-orange-600 leading-tight">{riesgo}</div>
                <div className="text-[6.5pt] text-slate-500 font-medium">{getRiesgoDescription(riesgo).split('—')[1] || riesgo}</div>
              </div>
              <div className="p-2 bg-rose-50 border border-rose-200 rounded">
                <div className="text-[7pt] text-rose-900 font-bold uppercase">Resistencia Estructural</div>
                <div className="text-[18pt] font-black text-rose-700 leading-tight">{rf}</div>
                <div className="text-[6.5pt] text-slate-600 font-bold">Minutos de retardo (F)</div>
              </div>
            </div>
            <div className="text-[7.5pt] text-slate-600 bg-slate-50 p-1.5 rounded border border-dashed border-slate-300 flex justify-between items-center">
              <span>
                <strong>Fórmula Aplicada:</strong> Qf = ∑(Pi · Ki) / (S · 4.400 kcal/kg) = {Math.round(totalKcal)} / ({superficie} · 4400) = <strong>{qf} kg/m²</strong>
              </span>
              <span className="font-bold text-slate-900">
                Ventilación: {ventilacion === 'natural' ? 'Natural' : 'No ventilado'} → Exigencia {rf}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Dotación de Extintores y Condiciones Específicas de Extinción */}
        <div className="mb-3">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Droplets size={13} className="text-cyan-300" />
              4. PROTECCIÓN ACTIVA, EXTINTORES Y CONDICIONES ESPECÍFICAS
            </span>
            <span className="text-[7.5pt] text-cyan-200">IRAM 3517-2 / Cuadros 1 y 2 Cap. 18</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <tbody>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold w-[25%] border border-slate-300">Dotación Mínima Extintores:</td>
                <td className="p-1.5 font-black text-emerald-700 border border-slate-300">
                  {minExtintores} extintor(es) <span className="font-normal text-slate-600">(1 cada 200 m² de superficie, mín. 2)</span>
                </td>
                <td className="bg-slate-100 p-1.5 font-bold w-[20%] border border-slate-300">Potencial Certificado:</td>
                <td className="p-1.5 font-black text-purple-900 border border-slate-300">{potNominal}</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Distancia Máx. de Traslado:</td>
                <td className="p-1.5 border border-slate-300">
                  {(riesgo === 'R1' || riesgo === 'R2') ? '15 metros (Líquidos inflamables)' : '20 metros (Clase A ordinarios)'}
                </td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Tipo de Agente Recomendado:</td>
                <td className="p-1.5 font-bold text-slate-800 border border-slate-300">Polvo Químico Seco (PQS) ABC o CO₂</td>
              </tr>
              <tr>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Condición E1 (Red Hidrantes):</td>
                <td className="p-1.5 border border-slate-300">
                  {reqHidrantes ? (
                    <span className="text-rose-700 font-black">⚠️ EXIGIDA (S &gt; 600m² en R3 o Qf &gt; 60 kg/m²)</span>
                  ) : (
                    <span className="text-slate-600 font-medium">No exigida por superficie/carga</span>
                  )}
                </td>
                <td className="bg-slate-100 p-1.5 font-bold border border-slate-300">Condición E2 (Sprinklers):</td>
                <td className="p-1.5 border border-slate-300">
                  {reqSprinklers ? (
                    <span className="text-rose-700 font-black">⚠️ EXIGIDA (Qf elevada en gran superficie)</span>
                  ) : (
                    <span className="text-slate-600 font-medium">No exigida reglamentariamente</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* 5. Memoria Técnica y Conclusiones */}
        <div className="mb-4">
          <div className="bg-slate-800 text-white px-3 py-1 text-[8.5pt] font-black uppercase tracking-wide rounded-t flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText size={13} className="text-amber-400" />
              5. MEMORIA TÉCNICA Y RECOMENDACIONES DE INGENIERÍA
            </span>
            <span className="text-[7.5pt] text-slate-300">Validez Legal</span>
          </div>
          <div className="border border-t-0 border-slate-300 p-2.5 text-[7.5pt] text-slate-800 leading-relaxed bg-slate-50/50">
            <ul className="m-0 pl-4 space-y-1 list-disc">
              <li>
                <strong>Carga de Fuego Ponderada:</strong> El sector presenta una carga de fuego de <strong>{qf} kg/m²</strong> de madera equivalente. Los muros perimetrales y elementos portantes deben garantizar una resistencia al fuego no inferior a <strong>{rf}</strong> según la Tabla 2.2.1 del Anexo VII del Decreto 351/79.
              </li>
              <li>
                <strong>Extintores Manuales:</strong> Se requiere instalar como mínimo <strong>{minExtintores} extintores</strong> de Polvo Químico Seco (PQS) de 5 kg o 10 kg con sello IRAM y potencial extintor mínimo certificado de <strong>{potNominal}</strong>, distribuidos a distancias no superiores a 20 metros.
              </li>
              <li>
                <strong>Señalización y Montaje:</strong> Los equipos deben colocarse a una altura entre 1.20 m y 1.50 m respecto del suelo, en lugares visibles, de fácil acceso y señalizados con balizas normalizadas según norma IRAM 10005-2.
              </li>
              {reqHidrantes && (
                <li className="text-rose-900 font-bold">
                  <strong>Instalación Fija contra Incendio (Condición E1):</strong> El predio debe contar con red húmeda presurizada de hidrantes con reserva de agua exclusiva y sistema motobomba para abastecer el caudal de extinción simultáneo.
                </li>
              )}
              {report.conclusion && (
                <li>
                  <strong>Observaciones del Profesional:</strong> {report.conclusion}
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* 6. Firmas Profesionales */}
        <div className="mt-4">
          <PdfSignatures
            data={report}
            box1={report.showSignatures?.operator !== false ? {
              title: 'RESPONSABLE TÉCNICO DEL SECTOR',
              subtitle: 'Recepción del Estudio Técnico',
              signatureUrl: report.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={report.showSignatures?.professional !== false ? {
              title: 'PROFESIONAL DE HIGIENE Y SEGURIDAD',
              subtitle: (report.professionalName || 'Profesional Actuante').toUpperCase(),
              signatureUrl: report.professionalSignature || null,
              stampUrl: report.professionalStamp || null,
              isProfessional: true,
              license: report.professionalLicense || 'Matrícula Profesional H&S'
            } : null}
            box3={report.showSignatures?.supervisor !== false ? {
              title: 'DIRECCIÓN DE LA EMPRESA',
              subtitle: 'Conformidad y Plan de Adecuación',
              signatureUrl: report.supervisorSignature || report.signature || null,
              isProfessional: false
            } : null}
          />
        </div>

        {/* Pie de Página Institucional */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex justify-between items-center text-[7pt] text-slate-500">
          <div>
            Estudio de Carga de Fuego y Extintores • Decreto PEN N° 351/79 Anexo VII • Normas IRAM 3517-2
          </div>
          <div>
            Emisión: {new Date().toLocaleDateString('es-AR')} {new Date().toLocaleTimeString()}
          </div>
        </div>

        <PdfBrandingFooter />
      </div>
    </div>
  );
}