import React from 'react';
import PdfSignatures from './PdfSignatures';
import { Activity, Wind, Clipboard } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

const MONITORING_TYPES = [
{ id: 'air', name: 'Calidad de Aire', icon: '💨' },
{ id: 'water', name: 'Calidad de Agua', icon: '💧' },
{ id: 'noise', name: 'Ruido Ambiental', icon: '🔊' },
{ id: 'waste', name: 'Gestión de Residuos', icon: '♻️' },
{ id: 'emissions', name: 'Emisiones', icon: '🏭' },
{ id: 'soil', name: 'Calidad de Suelo', icon: '🌱' },
{ id: 'radiation', name: 'Radiación', icon: '☢️' },
{ id: 'vibration', name: 'Vibraciones', icon: '📳' }];


const PARAMETERS_MAP = {
  air: { pm25: 'PM2.5', pm10: 'PM10', co: 'CO', no2: 'NO₂', so2: 'SO₂', o3: 'Ozono' },
  water: { ph: 'pH', turbidity: 'Turbidez', bod: 'DBO₅', cod: 'DQO', tss: 'SST', oil: 'Aceites y Grasas' },
  noise: { leq: 'Leq', lmax: 'Lmax', lmin: 'Lmin' },
  emissions: { co2: 'CO₂', nox: 'NOx', sox: 'SOx', particulates: 'Particulados' }
};

const UNITS_MAP = {
  pm25: 'μg/m³', pm10: 'μg/m³', co: 'ppm', no2: 'ppb', so2: 'ppb', o3: 'ppb',
  ph: 'pH', turbidity: 'NTU', bod: 'mg/L', cod: 'mg/L', tss: 'mg/L', oil: 'mg/L',
  leq: 'dB(A)', lmax: 'dB(A)', lmin: 'dB(A)',
  co2: 'ton/año', nox: 'mg/Nm³', sox: 'mg/Nm³', particulates: 'mg/Nm³'
};

export default function EnvironmentalPdf({ data, id = "pdf-content" }: {data: any;id?: string;}): React.ReactElement | null {
  if (!data) return null;

  // Obtener firma profesional desde data o localStorage
  let actSignature: string | null = data?.professionalSignature || null;
  let actStamp: string | null = data?.professionalStamp || null;
  let actName: string | null = data?.professionalName || null;
  let actLic: string | null = data?.professionalLicense || data?.license || null;

  if (!actSignature) {
    try {
      const lsStamp = localStorage.getItem('signatureStampData');
      const legacySig = localStorage.getItem('capturedSignature');
      const lsPersonal = localStorage.getItem('personalData');
      if (lsStamp) {
        const parsed = JSON.parse(lsStamp);
        actSignature = parsed.signature;
        actStamp = parsed.stamp;
      } else
      if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const typeConfig = MONITORING_TYPES.find((t) => t.id === data.monitoringType) || MONITORING_TYPES[0];
  const statusColor = data.status === 'critical' ? '#dc2626' : data.status === 'warning' ? '#f59e0b' : '#16a34a';

  return (
    <div className="w-[100%] flex justify-center">
            <div
        id={id}
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[15mm] bg-[#ffffff] text-[#000000] box-sizing-[border-box] m-[0_auto] text-[10pt] font-family-[system-ui,_-apple-system,_sans-serif]">






        
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
                        .no-print { display: none !important; }
                        .print-area { 
                            box-shadow: none !important; 
                            margin: 0 !important; 
                            padding: 5mm !important; 
                            width: 100% !important; 
                            max-width: none !important; 
                            border-top: 12px solid #2563eb !important; 
                            border-radius: 0 !important; 
                            min-height: auto !important; 
                            height: auto !important; 
                        }
                        .signature-container-row {
                            display: flex !important;
                            flex-direction: row !important;
                            justify-content: space-between !important;
                            align-items: flex-start !important;
                            gap: 1rem !important;
                            width: 100% !important;
                            margin-top: 2rem !important;
                        }
                        .signature-item-box {
                            flex: 1 !important;
                            max-width: none !important;
                            padding: 0.8rem !important;
                            margin-top: 0 !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            border-radius: 8px !important;
                            text-align: center !important;
                        }
                        .signature-line {
                            width: 100% !important;
                            border-bottom: 1.5px solid #cbd5e1 !important;
                            margin-bottom: 0.5rem !important;
                            margin-top: 0.5rem !important;
                        }
                    `}
                </style>

                {/* Header */}
                <div className="flex justify-space-between items-center border-bottom-[4px_solid_#f1f5f9] pb-[1.2rem] mb-[1.5rem]">
                    <div className="flex-[1]">
                        <h1 className="m-[0] text-[1.8rem] font-[900] text-[#0f172a] letter-spacing-[-0.02em]">PROTOCOLO DE MONITOREO AMBIENTAL</h1>
                        <p className="m-[0.2rem_0_0] text-[0.8rem] font-[800] text-[#3b82f6] uppercase letter-spacing-[0.05em]">SISTEMA DE GESTIÓN ISO 14001 • LEY 19.587</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-[0.2rem]">
                        <CompanyLogo className="h-[40px] max-w-[140px]" />
                        <div className="text-[0.55rem] font-[900] text-[#94a3b8] letter-spacing-[0.05em] uppercase">Doc. Controlado</div>
                    </div>
                </div>

                {/* Main Identity */}
                <div style={{ border: `2px solid ${statusColor}` }} className="bg-[#f8fafc] p-[1.2rem] rounded-[8px] flex justify-space-between items-center mb-[1.5rem]">
                    <div>
                        <span className="text-[0.65rem] font-[900] text-[#64748b] block">ESTACIÓN DE MONITOREO</span>
                        <h2 className="m-[0] text-[1.4rem] font-[900] text-[#1e293b]">{data.stationName || 'N/A'}</h2>
                        <div className="flex gap-[1rem] mt-[0.25rem]">
                            <span className="text-[0.85rem] font-[700]">Tipo: {typeConfig.icon} {typeConfig.name}</span>
                            <span className="text-[0.85rem] font-[700]">ID: {data.id || 'N/A'}</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}` }} className="p-[0.5rem_1rem] rounded-[var(--radius-full)] font-[900] text-[0.9rem]">
                            ESTADO: {data.status?.toUpperCase() || 'NORMAL'}
                        </span>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-template-columns-[1.5fr_1fr] gap-[0] border-[1.5px_solid_#000] mb-[1.5rem]">
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">UBICACIÓN / PUNTO DE MEDICIÓN</span>
                        <span className="font-[700]">{data.location || 'Sin especificar'}</span>
                    </div>
                    <div className="p-[0.5rem] border-bottom-[1px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">FECHA Y HORA</span>
                        <span className="font-[700]">{new Date(data.measurementDate || data.date || data.createdAt || Date.now()).toLocaleDateString('es-AR')} {data.measurementTime || ''}</span>
                    </div>
                    <div className="p-[0.5rem] border-right-[1.5px_solid_#000]">
                        <span className="text-[0.6rem] font-[900] block">COORDENADAS (LAT/LONG)</span>
                        <span className="font-[700]">{data.latitude || '-'}{data.longitude ? ` / ${data.longitude}` : ''}</span>
                    </div>
                    <div className="p-[0.5rem]">
                        <span className="text-[0.6rem] font-[900] block">NORMATIVA APLICABLE</span>
                        <span className="font-[700]">{data.regulation || 'ISO 14001:2015'}</span>
                    </div>
                </div>

                {/* Dynamic Parameters Table */}
                <div className="mb-[1.5rem]">
                    <h3 className="m-[0_0_0.5rem_0] text-[0.9rem] font-[900] flex items-center gap-[0.5rem] border-bottom-[1px_solid_#000] pb-[0.3rem]">
                        <Activity size={18} /> RESULTADOS DE LAS MEDICIONES
                    </h3>
                    <table className="table-layout-[fixed] word-break-[break-word] overflow-wrap-[break-word] w-[100%] border-collapse-[collapse] border-[1px_solid_#ddd]">
                        <thead>
                            <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid] bg-[#f1f5f9]">
                                <th className="border-[1px_solid_#ddd] p-[0.5rem] text-left text-[0.75rem] font-[900]">PARÁMETRO</th>
                                <th className="border-[1px_solid_#ddd] p-[0.5rem] text-center text-[0.75rem] font-[900]">VALOR HALLADO</th>
                                <th className="border-[1px_solid_#ddd] p-[0.5rem] text-center text-[0.75rem] font-[900]">UNIDAD</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.parameters && data.parameters.length > 0 ? data.parameters.map((p, i) =>
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]" key={i}>
                                    <td className="border-[1px_solid_#ddd] p-[0.5rem] font-[700]">{PARAMETERS_MAP[data.monitoringType]?.[p.parameterId] || p.parameterId}</td>
                                    <td style={{ color: statusColor }} className="border-[1px_solid_#ddd] p-[0.5rem] text-center font-[900]">{p.value}</td>
                                    <td className="border-[1px_solid_#ddd] p-[0.5rem] text-center">{UNITS_MAP[p.parameterId] || '-'}</td>
                                </tr>
              ) :
              <tr className="avoid-break page-break-inside-[avoid] break-inside-[avoid]">
                                    <td colSpan={3} className="border-[1px_solid_#ddd] p-[1rem] text-center text-[#666]">No se registraron parámetros específicos</td>
                                </tr>
              }
                        </tbody>
                    </table>
                </div>

                {/* Weather & Equipment */}
                <div className="grid grid-template-columns-[1fr_1fr] gap-[1rem] mb-[1.5rem]">
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[8px]">
                        <h4 className="m-[0_0_0.5rem_0] text-[0.75rem] font-[900] flex items-center gap-[0.4rem]">
                            <Wind size={14} /> CONDICIONES METEOROLÓGICAS
                        </h4>
                        <div className="text-[0.8rem] grid grid-template-columns-[1fr_1fr] gap-[0.25rem]">
                            <span>Temp: <b>{data.weather?.temperature || '-'}°C</b></span>
                            <span>Hum: <b>{data.weather?.humidity || '-'}%</b></span>
                            <span>Viento: <b>{data.weather?.windSpeed || '-'} km/h</b></span>
                            <span>Dir: <b>{data.weather?.windDirection || '-'}</b></span>
                        </div>
                    </div>
                    <div className="border-[1px_solid_#ddd] p-[0.8rem] rounded-[8px]">
                        <h4 className="m-[0_0_0.5rem_0] text-[0.75rem] font-[900] flex items-center gap-[0.4rem]">
                            <Clipboard size={14} /> EQUIPO UTILIZADO
                        </h4>
                        <p className="m-[0] text-[0.8rem] font-[700]">{data.equipment || 'No especificado'}</p>
                    </div>
                </div>

                {/* Observations */}
                <div className="mb-[1.5rem] border-[1.5px_solid_#000] p-[0.8rem]">
                    <span className="text-[0.7rem] font-[900] block mb-[0.3rem]">OBSERVACIONES Y CONCLUSIÓN</span>
                    <p className="m-[0] text-[0.85rem]">{data.observations || 'Se han realizado las mediciones ambientales siguiendo los protocolos establecidos. El estado general del punto monitoreado se considera aceptable bajo los criterios de gestión ambiental vigentes.'}</p>
                </div>

                {/* Signatures */}
                <PdfSignatures
          data={data}
          box1={data.showSignatures?.operator !== false ? {
            title: 'TÉCNICO DE CAMPO',
            subtitle: 'Firma y Aclaración',
            signatureUrl: data.operatorSignature || null,
            isProfessional: false
          } : null}
          box2={data.showSignatures?.professional !== false ? {
            title: 'ESPECIALISTA H&S',
            subtitle: (actName || 'Firma de Especialista').toUpperCase(),
            signatureUrl: actSignature || null,
            stampUrl: data.professionalStamp || actStamp || null,
            isProfessional: true,
            license: actLic || null
          } : null}
          box3={data.showSignatures?.supervisor !== false ? {
            title: 'RESPONSABLE AMBIENTAL',
            subtitle: 'Aprobación / Autoridad',
            signatureUrl: data.signature || data.supervisorSignature || null,
            isProfessional: false
          } : null} />
        
            <PdfBrandingFooter />

                <div className="mt-[1.5rem] text-[0.6rem] text-[#64748b] text-center">
                    DOCUMENTO OBLIGATORIO PARA EL SEGUIMIENTO AMBIENTAL SEGÚN ISO 14001:2015.
                </div>
            </div>
        </div>);

}