import React from 'react';
import { CheckCircle2, Zap, ShieldAlert, Building2, Gauge, Camera, ClipboardCheck } from 'lucide-react';
import DualPdfHeader from './DualPdfHeader';
import ReportContentRenderer from './reports/ReportContentRenderer';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import type { GroundingProtocol } from '../types/grounding';
import { evaluateFullGroundingProtocol } from '../utils/srtProtocols';

interface Props {
  data: GroundingProtocol;
  customId?: string;
}

export default function GroundingProtocolPdf({ data, customId = 'pdf-content' }: Props): React.ReactElement | null {
  if (!data) return null;

  const evaluation = evaluateFullGroundingProtocol(data);
  const isConforme = evaluation.isFullyCompliant;

  // Firma profesional
  let actSignature: string | null = data.professionalSignature || data.firmaProfesionalUrl || null;
  let actStamp: string | null = data.professionalStamp || null;
  let actName: string | null = data.profesionalNombre || null;
  let actLic: string | null = data.profesionalMatricula || null;

  try {
    const lsStamp = localStorage.getItem('signatureStampData');
    const legacySig = localStorage.getItem('capturedSignature');
    const lsPersonal = localStorage.getItem('personalData');
    if (lsStamp) {
      const parsed = JSON.parse(lsStamp);
      if (!actSignature) actSignature = parsed.signature;
      if (!actStamp) actStamp = parsed.stamp;
    } else if (legacySig && !actSignature) {
      actSignature = legacySig;
    }
    if (lsPersonal) {
      const pd = JSON.parse(lsPersonal);
      actName = actName || pd.name;
      actLic = actLic || pd.license;
    }
  } catch (e) {}

  const visualChecks = data.verificacionesVisuales || [];
  const photosList = data.evidenciaFotos || [];

  return (
    <div className="w-full flex justify-center">
      <div
        id={customId}
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

        {/* Encabezado Institucional SRT con Doble Membrete */}
        <DualPdfHeader
          title="MEDICIÓN DE PUESTA A TIERRA Y CONTINUIDAD DE LAS MASAS"
          subtitle="Reglamentación para la Ejecución de Instalaciones Eléctricas en Inmuebles (AEA 90364) · Ley 19.587 Dec. 351/79"
          normBadge="Protocolo Oficial · Res. S.R.T. N° 900/15"
          normBadgeColor="amber"
          normBadgeIcon={<Zap size={13} className="text-amber-600" />}
          documentId={data.id}
          establishmentName={data.razonSocial || data.establecimiento}
          establishmentCuit={data.cuit}
          establishmentAddress={data.direccion}
          consultantName={actName || data.profesionalNombre}
          consultantLicense={actLic || data.profesionalMatricula}
          date={data.fechaMedicion}
        />

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
              <div className="text-[11pt] font-black uppercase tracking-wide flex items-center gap-2">
                <span>DICTAMEN: {evaluation.dictamenGeneral || (isConforme ? 'CONFORME' : 'NO CONFORME')}</span>
                <span className={`text-[7pt] px-2 py-0.5 rounded font-bold uppercase ${
                  isConforme ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                }`}>
                  {evaluation.estadoInstalacion || (isConforme ? 'Excelente' : 'Peligro Eléctrico')}
                </span>
              </div>
              <div className="text-[8pt] font-medium opacity-90 mt-0.5">
                {isConforme
                  ? 'Los valores de resistencia de puesta a tierra, continuidad de masas y dispositivos diferenciales cumplen las exigencias legales del Anexo I Res. SRT 900/15.'
                  : 'Se detectaron parámetros fuera de los límites máximos permisibles de la Res. SRT 900/15 y AEA 90364. Requiere adecuaciones técnicas.'}
              </div>
            </div>
          </div>
          <div className="text-right pl-4 border-l border-slate-300 flex items-center gap-4">
            <div>
              <div className="text-[7.5pt] font-bold uppercase text-slate-600">Promedio PAT</div>
              <div className="text-[1.3rem] font-black">{evaluation.promedioResistenciaOhms} Ω</div>
              <div className="text-[7pt] text-slate-500">Máx: {evaluation.maxResistenciaMedida} Ω</div>
            </div>
            <div>
              <div className="text-[7.5pt] font-bold uppercase text-slate-600">Tensión Contacto Uc</div>
              <div className={`text-[1.2rem] font-black ${evaluation.tensionContactoExcedida ? 'text-red-600' : 'text-slate-900'}`}>
                {evaluation.tensionContactoPresuntaMaxVolts} V
              </div>
              <div className="text-[7pt] text-slate-500">Límite: {data.tensionSeguridadContacto || 50} V</div>
            </div>
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
              <span className="font-bold text-slate-600">Establecimiento:</span>
              <span className="col-span-2 font-semibold text-slate-800">{data.establecimiento || 'Planta Principal'}</span>
              <span className="font-bold text-slate-600">ART Afiliada:</span>
              <span className="col-span-2 text-slate-800">{data.artNombre || 'No declarada'}</span>
              <span className="font-bold text-slate-600">Tipo Instalación:</span>
              <span className="col-span-2 font-semibold text-blue-800">{data.tipoInstalacion || 'Industrial'}</span>
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
              <Gauge size={13} className="text-amber-600" /> 2. INSTRUMENTO, METODOLOGÍA Y RED ELÉCTRICA
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
              <span className="col-span-2 text-slate-800">{data.instrumentoLaboratorio || 'Oficial Trazable INTI / SAC'}</span>
              <span className="font-bold text-slate-600">Método Ensayo:</span>
              <span className="col-span-2 font-semibold text-slate-900">
                {data.metodoMedicion || 'Telurímetro 3 Polos (Caída de Potencial 62% - IRAM 2281)'}
              </span>
              <span className="font-bold text-slate-600">Régimen Tierra:</span>
              <span className="col-span-2 font-black text-blue-700">
                Esquema {data.esquemaConexionTierra || 'TT'} · {data.tensionSuministro || '380V/220V'} ({data.tipoAcometida || 'Subterránea'})
              </span>
              <span className="font-bold text-slate-600">Tensión Seguridad:</span>
              <span className="col-span-2 font-semibold text-slate-900">
                UL = {data.tensionSeguridadContacto || 50} V (AEA 90364-4-41)
              </span>
              <span className="font-bold text-slate-600">Suelo / Clima:</span>
              <span className="col-span-2 text-slate-800">
                {data.estadoSuelo || 'Normal'} · {data.condicionesClimaticas || 'Sin precipitaciones (72 hs)'}
              </span>
              <span className="font-bold text-slate-600">Anexos SRT:</span>
              <span className="col-span-2 font-semibold text-emerald-800">
                {data.certificadoAdjunto !== false ? '✓ Cert. Calibración Adjunto' : 'Sin Cert.'} · {data.planoEsquemaAdjunto !== false ? '✓ Croquis Unifilar' : 'Sin Croquis'}
              </span>
            </div>
          </div>
        </div>

        {/* Inspección Visual Reglamentaria AEA 90364 Parte 6 */}
        {visualChecks.length > 0 && (
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-4 text-[8pt]" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 flex items-center justify-between uppercase text-[8.5pt]">
              <span className="flex items-center gap-1.5">
                <ClipboardCheck size={13} className="text-emerald-600" /> VERIFICACIÓN VISUAL REGLAMENTARIA (AEA 90364 PARTE 6 · ANEXO I RES. 900/15)
              </span>
              <span className="text-[7.5pt] font-bold text-emerald-700">{visualChecks.length} ítems verificados</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {visualChecks.map((item, i) => (
                <div key={i} className="flex items-start gap-1.5 text-slate-800">
                  <span className="text-emerald-600 font-black">✓</span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
                      <td className="p-1 border border-slate-300 text-slate-600 text-[7.5pt]">{m.observaciones ? <ReportContentRenderer content={m.observaciones} /> : 'Sin anomalías'}</td>
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

        {/* Registro Fotográfico de Cámaras de Inspección, Telurímetro y Tableros */}
        {photosList.length > 0 && (
          <div className="border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-4 text-[8.5pt]" style={{ breakInside: 'avoid', pageBreakInside: 'avoid' }}>
            <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-2 uppercase flex items-center gap-1.5">
              <Camera size={13} className="text-blue-600" /> REGISTRO FOTOGRÁFICO DE MEDICIÓN, CÁMARAS DE INSPECCIÓN Y CERTIFICADO
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {photosList.map((src, i) => (
                <div key={i} className="border border-slate-300 rounded bg-white p-1 flex flex-col items-center">
                  <img
                    src={src}
                    alt={`Evidencia PAT ${i + 1}`}
                    style={{ width: '100%', height: '95px', objectFit: 'cover', borderRadius: '3px' }}
                  />
                  <span className="text-[7pt] font-bold text-slate-600 mt-1">
                    Evidencia Técnica N° {i + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Conclusiones y Recomendaciones */}
        <div className="border border-slate-300 rounded p-2.5 bg-slate-50/70 mb-4 text-[8.5pt]">
          <div className="font-black text-slate-800 border-b border-slate-200 pb-1 mb-1.5 uppercase">
            3. CONCLUSIONES Y RECOMENDACIONES TÉCNICAS
          </div>
          <div className="m-0 mb-1.5 text-slate-800 leading-relaxed font-medium">
            {data.conclusiones ? (
              <ReportContentRenderer content={data.conclusiones} className="text-slate-800 leading-relaxed font-medium" />
            ) : (
              <p className="m-0 mb-1.5 text-slate-800 leading-relaxed font-medium">
                {isConforme
                  ? 'La instalación evaluada cuenta con sistema de puesta a tierra reglamentario, continuidad de masas efectiva y protecciones diferenciales operativas, satisfaciendo las exigencias del Anexo I Res. SRT 900/15 y reglamentación AEA 90364.'
                  : 'La instalación presenta deficiencias que vulneran las condiciones de seguridad contra contactos eléctricos indirectos. Se deberán ejecutar las acciones correctivas señaladas a continuación.'}
              </p>
            )}
          </div>

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

        {/* Firmas Digitales Formato ATS (Profesional H&S en el Centro) */}
        <PdfSignatures
          data={data}
          compact={true}
          box1={{
            title: 'RESPONSABLE DEL ESTABLECIMIENTO / EMPLEADOR',
            subtitle: (data.responsableEstablecimientoNombre || data.razonSocial || 'Titular / Apoderado').toUpperCase(),
            signatureUrl: data.operatorSignature || data.firmaClienteUrl || null,
            isProfessional: false,
            license: data.cuit ? `CUIT ${data.cuit}` : undefined
          }}
          box2={{
            title: (data.profesionalTitulo || 'PROFESIONAL ACTUANTE HYS / MATRICULADO').toUpperCase(),
            subtitle: (actName || data.profesionalNombre || 'Firma y Sello Profesional').toUpperCase(),
            signatureUrl: actSignature,
            stampUrl: actStamp,
            isProfessional: true,
            license: actLic || data.profesionalMatricula || 'En trámite'
          }}
          box3={{
            title: 'JEFE DE MANTENIMIENTO / SUPERVISIÓN TÉCNICA',
            subtitle: (data.jefeMantenimientoNombre || 'Conformidad Técnica de Planta').toUpperCase(),
            signatureUrl: data.supervisorSignature || null,
            isProfessional: false,
            license: data.artNombre ? `ART ${data.artNombre}` : undefined
          }}
        />

        {/* Footer legal */}
        <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[7pt] text-slate-500">
          Documento emitido conforme Resolución S.R.T. N° 900/15 Anexo I y Anexo II. Validez legal de 12 (doce) meses contados desde la fecha de medición.
        </div>
        <PdfBrandingFooter />
      </div>
    </div>
  );
}
