import React from 'react';
import { AlertTriangle, CheckCircle2, Zap, Shield, ShieldAlert, Calendar, Building2, User, Gauge } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import type { GroundingProtocol } from '../types/grounding';
import { evaluateFullGroundingProtocol } from '../utils/srtProtocols';

interface Props {
  data: GroundingProtocol;
}

export default function GroundingProtocolPdf({ data }: Props): React.ReactElement | null {
  if (!data) return null;

  const evaluation = evaluateFullGroundingProtocol(data);
  const isConforme = evaluation.isFullyCompliant;

  // Firma profesional
  let actSignature: string | null = data.firmaProfesionalUrl || null;
  let actStamp: string | null = null;
  let actName: string | null = data.profesionalNombre || null;
  let actLic: string | null = data.profesionalMatricula || null;

  try {
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    const lsPersonal = localStorage.getItem('personalData');
    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      if (!actSignature) actSignature = parsed.signature;
      actStamp = parsed.stamp;
    } else if (legacySig && !actSignature) {
      actSignature = legacySig;
    }
    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      actName = actName || pd.name;
      actLic = actLic || pd.license;
    }
  } catch (e) {}

  return (
    <div className="w-full flex justify-center">
      <div
        id="pdf-content"
        className="pdf-container print-area w-full max-w-[210mm] min-h-[297mm] p-[12mm] bg-white text-slate-900 box-border mx-auto text-[9.5pt] font-sans"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { box-shadow: none !important; margin: 0 !important; padding: 4mm !important; width: 100% !important; max-width: none !important; border: none !important; min-height: auto !important; }
          `}
        </style>

        {/* Encabezado Institucional SRT */}
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-3 mb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-100 text-amber-900 text-[8pt] font-black tracking-wider uppercase mb-1">
              <Zap size={13} className="text-amber-600" /> Protocolo Oficial · Res. S.R.T. N° 900/15
            </div>
            <h1 className="m-0 text-[1.3rem] font-black tracking-tight text-slate-900 leading-tight">
              MEDICIÓN DE PUESTA A TIERRA Y CONTINUIDAD DE LAS MASAS
            </h1>
            <p className="m-0 text-[8.5pt] text-slate-600 font-semibold">
              Reglamentación para la Ejecución de Instalaciones Eléctricas en Inmuebles (AEA 90364) · Ley 19.587 Dec. 351/79
            </p>
          </div>
          <div className="text-right flex flex-col items-end">
            <CompanyLogo style={{ maxHeight: '42px', maxWidth: '130px', objectFit: 'contain' }} />
            <span className="text-[7.5pt] font-mono font-bold text-slate-500 mt-1">ID: {data.id?.slice(0, 10)}</span>
          </div>
        </div>

        {/* Banner de Resultado Global */}
        <div className={`p-3 rounded-lg border-2 mb-4 flex items-center justify-between ${
          isConforme ? 'bg-emerald-50 border-emerald-500 text-emerald-950' : 'bg-red-50 border-red-500 text-red-950'
        }`}>
          <div className="flex items-center gap-3">
            {isConforme ? (
              <CheckCircle2 size={32} className="text-emerald-600 flex-shrink-0" />
            ) : (
              <ShieldAlert size={32} className="text-red-600 flex-shrink-0" />
            )}
            <div>
              <div className="text-[11pt] font-black uppercase tracking-wide">
                DICTAMEN TÉCNICO: {isConforme ? 'INSTALACIÓN CONFORME' : 'CON NO CONFORMIDADES / DESVÍOS'}
              </div>
              <div className="text-[8pt] font-medium opacity-90">
                {isConforme
                  ? 'Los valores de resistencia de puesta a tierra, continuidad de masas y dispositivos diferenciales cumplen las exigencias legales.'
                  : 'Se detectaron parámetros fuera de los límites máximos permisibles de la Res. SRT 900/15. Requiere adecuaciones.'}
              </div>
            </div>
          </div>
          <div className="text-right pl-4 border-l border-slate-300">
            <div className="text-[7.5pt] font-bold uppercase text-slate-600">Promedio PAT</div>
            <div className="text-[1.3rem] font-black">{evaluation.promedioResistenciaOhms} Ω</div>
            <div className="text-[7pt] text-slate-500">Máx: {evaluation.maxResistenciaMedida} Ω</div>
          </div>
        </div>

        {/* Bloque 1: Datos del Establecimiento e Instrumento */}
        <div className="grid grid-cols-2 gap-3 mb-4 text-[8.5pt]">
          {/* Establecimiento */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
            <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5 text-[8.5pt]">
              <Building2 size={13} className="text-blue-600" /> 1. DATOS DEL ESTABLECIMIENTO
            </div>
            <div className="grid grid-cols-3 gap-y-1">
              <span className="font-bold text-slate-600">Razón Social:</span>
              <span className="col-span-2 font-semibold text-slate-900">{data.razonSocial || '-'}</span>
              <span className="font-bold text-slate-600">CUIT:</span>
              <span className="col-span-2 font-semibold font-mono text-slate-900">{data.cuit || '-'}</span>
              <span className="font-bold text-slate-600">Dirección:</span>
              <span className="col-span-2 text-slate-800">{data.direccion || '-'} ({data.localidad}, {data.provincia})</span>
              <span className="font-bold text-slate-600">Actividad:</span>
              <span className="col-span-2 text-slate-800">{data.actividadPrincipal || '-'}</span>
              <span className="font-bold text-slate-600">Fecha Ensayo:</span>
              <span className="col-span-2 font-bold text-slate-900">
                {data.fechaMedicion ? new Date(data.fechaMedicion).toLocaleDateString('es-AR') : '-'}
                <span className="ml-2 text-amber-700 font-medium text-[7.5pt]">(Vence: {data.fechaVencimiento || '1 año'})</span>
              </span>
            </div>
          </div>

          {/* Instrumento y Sistema Eléctrico */}
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50/50">
            <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center gap-1.5 text-[8.5pt]">
              <Gauge size={13} className="text-amber-600" /> 2. INSTRUMENTO Y RED ELÉCTRICA
            </div>
            <div className="grid grid-cols-3 gap-y-1">
              <span className="font-bold text-slate-600">Telurímetro:</span>
              <span className="col-span-2 font-semibold text-slate-900">{data.instrumentoMarca} {data.instrumentoModelo}</span>
              <span className="font-bold text-slate-600">N° de Serie:</span>
              <span className="col-span-2 font-mono text-slate-900">{data.instrumentoNroSerie || '-'}</span>
              <span className="font-bold text-slate-600">Calibración:</span>
              <span className="col-span-2 font-semibold text-slate-800">
                {data.instrumentoFechaCalibracion || '-'} (Cert: {data.instrumentoCertificadoNro || 'S/N'})
              </span>
              <span className="font-bold text-slate-600">Laboratorio:</span>
              <span className="col-span-2 text-slate-800">{data.instrumentoLaboratorio || 'Oficial Trazable'}</span>
              <span className="font-bold text-slate-600">Régimen Tierra:</span>
              <span className="col-span-2 font-black text-blue-700">
                Esquema {data.esquemaConexionTierra || 'TT'} · {data.tensionSuministro || '380V/220V'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabla A: Medición de Puesta a Tierra (Jabalinas / Mallas) */}
        <div className="mb-4">
          <div className="bg-slate-800 text-white px-2.5 py-1 text-[8.5pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
            <span>TABLA 1 · RESISTENCIA DE PUESTA A TIERRA (ELECTRODOS / JABALINAS)</span>
            <span className="text-[7.5pt] font-normal opacity-90">Límite: ≤ 10 Ω (General) / ≤ 40 Ω (con ID)</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-1 border border-slate-300 text-center w-12">Código</th>
                <th className="p-1 border border-slate-300 text-left">Ubicación / Identificación</th>
                <th className="p-1 border border-slate-300 text-left">Tipo Electrodo</th>
                <th className="p-1 border border-slate-300 text-center w-16">R. Medida</th>
                <th className="p-1 border border-slate-300 text-center w-14">R. Máx.</th>
                <th className="p-1 border border-slate-300 text-center w-12">Cámara</th>
                <th className="p-1 border border-slate-300 text-center w-12">Borne</th>
                <th className="p-1 border border-slate-300 text-center w-16">Estado</th>
                <th className="p-1 border border-slate-300 text-center w-20">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {data.jabalinas && data.jabalinas.length > 0 ? (
                data.jabalinas.map((j, idx) => {
                  const maxAllowed = j.resistenciaMaximaAdmisible || (data.esquemaConexionTierra === 'TT' ? 40 : 10);
                  const isPointOk = j.resistenciaMedida <= maxAllowed;
                  return (
                    <tr key={j.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-bold font-mono">{j.codigo}</td>
                      <td className="p-1 border border-slate-300">{j.ubicacion}</td>
                      <td className="p-1 border border-slate-300 text-[7.5pt]">{j.tipoElectrodo}</td>
                      <td className="p-1 border border-slate-300 text-center font-black text-[9pt] text-slate-900">
                        {j.resistenciaMedida} Ω
                      </td>
                      <td className="p-1 border border-slate-300 text-center text-slate-600 font-mono">{maxAllowed} Ω</td>
                      <td className="p-1 border border-slate-300 text-center">{j.camaraInspeccion ? 'SÍ' : 'NO'}</td>
                      <td className="p-1 border border-slate-300 text-center">{j.borneDesconexion ? 'SÍ' : 'NO'}</td>
                      <td className="p-1 border border-slate-300 text-center">{j.estadoFisico || 'Bueno'}</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[7pt] font-black uppercase ${
                          isPointOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isPointOk ? 'CONFORME' : 'NO CONFORME'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-2 text-center text-slate-500 italic">No se registraron electrodos de PAT</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla B: Continuidad de las Masas Eléctricas */}
        <div className="mb-4">
          <div className="bg-slate-800 text-white px-2.5 py-1 text-[8.5pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
            <span>TABLA 2 · CONTINUIDAD DEL CONDUCTOR DE PROTECCIÓN (PE) Y MASAS</span>
            <span className="text-[7.5pt] font-normal opacity-90">Límite Admisible: ≤ 1.0 Ω (AEA 90364)</span>
          </div>
          <table className="w-full border-collapse border border-slate-300 text-[8pt]">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                <th className="p-1 border border-slate-300 text-center w-12">Código</th>
                <th className="p-1 border border-slate-300 text-left">Masa / Equipo / Tablero Ensayado</th>
                <th className="p-1 border border-slate-300 text-left">Ubicación</th>
                <th className="p-1 border border-slate-300 text-center w-20">Resistencia (Ω)</th>
                <th className="p-1 border border-slate-300 text-center w-20">Continuidad</th>
                <th className="p-1 border border-slate-300 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {data.continuidadMasas && data.continuidadMasas.length > 0 ? (
                data.continuidadMasas.map((m, idx) => {
                  const isContOk = m.resistenciaContinuidad <= 1.0;
                  return (
                    <tr key={m.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-bold font-mono">{m.codigo}</td>
                      <td className="p-1 border border-slate-300 font-medium">{m.elemento}</td>
                      <td className="p-1 border border-slate-300 text-slate-600">{m.ubicacion || '-'}</td>
                      <td className="p-1 border border-slate-300 text-center font-black text-slate-900">
                        {m.resistenciaContinuidad} Ω
                      </td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[7pt] font-black ${
                          isContOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isContOk ? 'CORRECTA' : 'DEFECTUOSA'}
                        </span>
                      </td>
                      <td className="p-1 border border-slate-300 text-slate-600 text-[7.5pt]">{m.observaciones || 'Sin anomalías'}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-2 text-center text-slate-500 italic">No se registraron masas ensayadas</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Tabla C: Dispositivos Diferenciales */}
        {data.diferenciales && data.diferenciales.length > 0 && (
          <div className="mb-4">
            <div className="bg-slate-800 text-white px-2.5 py-1 text-[8.5pt] font-black uppercase tracking-wider flex justify-between items-center rounded-t">
              <span>TABLA 3 · ENSAYO DE INTERRUPTORES DIFERENCIALES (DISYUNTORES)</span>
              <span className="text-[7.5pt] font-normal opacity-90">Tiempo Máx: ≤ 200 ms a 1x IΔn</span>
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[8pt]">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-300">
                  <th className="p-1 border border-slate-300 text-center w-12">Código</th>
                  <th className="p-1 border border-slate-300 text-left">Tablero</th>
                  <th className="p-1 border border-slate-300 text-left">Circuito Protegido</th>
                  <th className="p-1 border border-slate-300 text-center w-16">Sensibilidad</th>
                  <th className="p-1 border border-slate-300 text-center w-16">T. Disparo</th>
                  <th className="p-1 border border-slate-300 text-center w-14">Test Botón</th>
                  <th className="p-1 border border-slate-300 text-center w-20">Resultado</th>
                </tr>
              </thead>
              <tbody>
                {data.diferenciales.map((d, idx) => {
                  const tiempoOk = d.tiempoDisparoMs > 0 && d.tiempoDisparoMs <= 200;
                  const isDifOk = tiempoOk && d.pulsadorTestFunciona;
                  return (
                    <tr key={d.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                      <td className="p-1 border border-slate-300 text-center font-bold font-mono">{d.codigo}</td>
                      <td className="p-1 border border-slate-300">{d.tableroUbicacion}</td>
                      <td className="p-1 border border-slate-300 text-slate-600">{d.circuitoProtegido}</td>
                      <td className="p-1 border border-slate-300 text-center font-mono">{d.corrienteSensibilidadMa} mA</td>
                      <td className="p-1 border border-slate-300 text-center font-black text-slate-900">{d.tiempoDisparoMs} ms</td>
                      <td className="p-1 border border-slate-300 text-center">{d.pulsadorTestFunciona ? 'OK' : 'FALLA'}</td>
                      <td className="p-1 border border-slate-300 text-center">
                        <span className={`inline-block px-1.5 py-0.5 rounded text-[7pt] font-black ${
                          isDifOk ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isDifOk ? 'CONFORME' : 'NO CONFORME'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Conclusiones y Recomendaciones */}
        <div className="border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-4 text-[8.5pt]">
          <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase">
            3. CONCLUSIONES Y RECOMENDACIONES TÉCNICAS
          </div>
          <p className="m-0 mb-1.5 text-slate-800 leading-relaxed font-medium">
            {data.conclusiones || (
              isConforme
                ? 'La instalación evaluada cuenta con sistema de puesta a tierra reglamentario, continuidad de masas efectiva y protecciones diferenciales operativas, satisfaciendo las exigencias del Anexo I Res. SRT 900/15 y reglamentación AEA 90364.'
                : 'La instalación presenta deficiencias que vulneran las condiciones de seguridad contra contactos eléctricos indirectos. Se deberán ejecutar las acciones correctivas señaladas a continuación.'
            )}
          </p>

          {evaluation.autoRecommendations.length > 0 && (
            <div className="mt-2 pt-1.5 border-t border-slate-200">
              <span className="font-bold text-slate-700 block mb-1">Medidas Correctivas Requeridas:</span>
              <ul className="m-0 pl-4 list-disc space-y-0.5 text-slate-700 text-[8pt]">
                {evaluation.autoRecommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Firmas y Responsabilidad Profesional */}
        <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t-2 border-slate-300 text-[8.5pt]">
          {/* Firma Profesional */}
          <div className="border border-slate-200 rounded p-3 text-center flex flex-col justify-between min-h-[110px] bg-white">
            <span className="font-black text-slate-800 uppercase text-[8pt] block mb-1">
              PROFESIONAL ACTUANTE (HYS / ELECTRICISTA MATRICULADO)
            </span>
            <div className="flex-1 flex items-center justify-center py-1">
              {actSignature ? (
                <img src={actSignature} alt="Firma Profesional" className="max-h-16 object-contain" />
              ) : (
                <div className="border-b border-dashed border-slate-400 w-44 my-3 text-slate-400 text-[7.5pt] italic">
                  Firma y Sello
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900">{actName || data.profesionalNombre || 'Profesional HYS'}</div>
              <div className="text-[7.5pt] text-slate-600">
                Matrícula: <span className="font-mono font-bold">{actLic || data.profesionalMatricula || 'Pendiente'}</span>
                {data.profesionalTitulo && ` · ${data.profesionalTitulo}`}
              </div>
            </div>
          </div>

          {/* Recibió / Responsable Establecimiento */}
          <div className="border border-slate-200 rounded p-3 text-center flex flex-col justify-between min-h-[110px] bg-white">
            <span className="font-black text-slate-800 uppercase text-[8pt] block mb-1">
              RESPONSABLE DEL ESTABLECIMIENTO / EMPRESA
            </span>
            <div className="flex-1 flex items-center justify-center py-1">
              {data.firmaClienteUrl ? (
                <img src={data.firmaClienteUrl} alt="Firma Establecimiento" className="max-h-16 object-contain" />
              ) : (
                <div className="border-b border-dashed border-slate-400 w-44 my-3 text-slate-400 text-[7.5pt] italic">
                  Firma y Aclaración
                </div>
              )}
            </div>
            <div>
              <div className="font-bold text-slate-900">{data.razonSocial || 'Titular / Apoderado'}</div>
              <div className="text-[7.5pt] text-slate-600">Constancia de recepción del informe técnico y recomendaciones</div>
            </div>
          </div>
        </div>

        {/* Footer legal */}
        <div className="mt-4 pt-2 border-t border-slate-200 text-center text-[7pt] text-slate-500">
          Documento emitido conforme Resolución S.R.T. N° 900/15 Anexo I y Anexo II. Validez legal de 12 (doce) meses contados desde la fecha de medición.
        </div>
        <PdfBrandingFooter />
      </div>
    </div>
  );
}
