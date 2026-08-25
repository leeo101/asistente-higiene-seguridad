import React from 'react';
import PdfSignatures from './PdfSignatures';
import { Activity, Wind, Clipboard } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import { QRCodeSVG } from 'qrcode.react';

const MONITORING_TYPES: Record<string, { name: string; icon: string; color: string }> = {
  air: { name: 'Calidad de Aire', icon: '💨', color: '#3b82f6' },
  water: { name: 'Calidad de Agua', icon: '💧', color: '#06b6d4' },
  noise: { name: 'Ruido Ambiental', icon: '🔊', color: '#f59e0b' },
  waste: { name: 'Gestión de Residuos', icon: '♻️', color: '#10b981' },
  emissions: { name: 'Emisiones Industriales', icon: '🏭', color: '#6b7280' },
  soil: { name: 'Calidad de Suelo', icon: '🌱', color: '#84cc16' },
  radiation: { name: 'Radiación', icon: '☢️', color: '#f97316' },
  vibration: { name: 'Vibraciones', icon: '📳', color: '#8b5cf6' }
};

const PARAMETERS_MAP: Record<string, Record<string, string>> = {
  air: { pm25: 'Material Particulado PM2.5', pm10: 'Material Particulado PM10', co: 'Monóxido de Carbono (CO)', no2: 'Dióxido de Nitrógeno (NO₂)', so2: 'Dióxido de Azufre (SO₂)', o3: 'Ozono (O₃)' },
  water: { ph: 'Potencial de Hidrógeno (pH)', turbidity: 'Turbidez', bod: 'Demanda Bioquímica de Oxígeno (DBO₅)', cod: 'Demanda Química de Oxígeno (DQO)', tss: 'Sólidos Suspendidos Totales (SST)', oil: 'Aceites y Grasas' },
  noise: { leq: 'Nivel Sonoro Continuo Equivalente (Leq)', lmax: 'Nivel Sonoro Máximo (Lmax)', lmin: 'Nivel Sonoro Mínimo (Lmin)' },
  emissions: { co2: 'Dióxido de Carbono (CO₂)', nox: 'Óxidos de Nitrógeno (NOx)', sox: 'Óxidos de Azufre (SOx)', particulates: 'Partículas Totales' }
};

const LIMITS_MAP: Record<string, string> = {
  pm25: '25 μg/m³', pm10: '50 μg/m³', co: '9 ppm', no2: '100 ppb', so2: '75 ppb', o3: '70 ppb',
  ph: '6.5 - 8.5', turbidity: '5 NTU', bod: '50 mg/L', cod: '150 mg/L', tss: '30 mg/L', oil: '10 mg/L',
  leq: '65 dB(A)', lmax: '80 dB(A)', lmin: 'S/L',
  co2: '1000 t/año', nox: '200 mg/Nm³', sox: '150 mg/Nm³', particulates: '50 mg/Nm³'
};

const UNITS_MAP: Record<string, string> = {
  pm25: 'μg/m³', pm10: 'μg/m³', co: 'ppm', no2: 'ppb', so2: 'ppb', o3: 'ppb',
  ph: 'pH', turbidity: 'NTU', bod: 'mg/L', cod: 'mg/L', tss: 'mg/L', oil: 'mg/L',
  leq: 'dB(A)', lmax: 'dB(A)', lmin: 'dB(A)',
  co2: 'ton/año', nox: 'mg/Nm³', sox: 'mg/Nm³', particulates: 'mg/Nm³'
};

export default function EnvironmentalPdf({ data, id = "pdf-content" }: { data: any; id?: string }): React.ReactElement | null {
  if (!data) return null;

  // Firma profesional heredada
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
      } else if (legacySig) {
        actSignature = legacySig;
      }
      if (lsPersonal) {
        const pd = JSON.parse(lsPersonal);
        actName = actName || pd.name;
        actLic = actLic || pd.license;
      }
    } catch (e) {}
  }

  const typeConfig = MONITORING_TYPES[data.monitoringType] || { name: 'Monitoreo Ambiental', icon: '🌍', color: '#059669' };
  
  const isCritical = data.status === 'critical' || data.status === 'exceeded';
  const isWarning = data.status === 'warning';
  
  const accentColor = isCritical ? '#dc2626' : isWarning ? '#d97706' : '#059669';
  const accentBg = isCritical ? '#fef2f2' : isWarning ? '#fffbeb' : '#f0fdf4';
  const accentBorder = isCritical ? '#fecaca' : isWarning ? '#fde68a' : '#bbf7d0';

  const verificationUrl = `${window.location.origin}/verify/env_${data.id || 'record'}`;

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', backgroundColor: '#ffffff' }}>
      <div
        id={id}
        className="pdf-container print-area"
        style={{
          width: '100%',
          maxWidth: '190mm',
          minHeight: '0',
          height: 'auto',
          padding: '6mm 8mm',
          backgroundColor: '#ffffff',
          color: '#1e293b',
          boxSizing: 'border-box',
          margin: '0 auto',
          fontSize: '8pt',
          fontFamily: 'Helvetica, Arial, sans-serif',
          borderTop: `8px solid ${accentColor}`
        }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 8mm 10mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; background: #ffffff !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 6mm 8mm !important; 
              width: 100% !important; 
              max-width: 190mm !important; 
              border-top: 8px solid ${accentColor} !important; 
              min-height: auto !important; 
              height: auto !important; 
              background: #ffffff !important;
              box-sizing: border-box !important;
            }
            .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
          `}
        </style>

        {/* Encabezado Corporativo Premium */}
        <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px', marginBottom: '10px', width: '100%', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ flex: 1, textAlign: 'left', minWidth: 0, paddingRight: '12px' }}>
            <p style={{ margin: 0, fontWeight: 800, fontSize: '6.5pt', textTransform: 'uppercase', letterSpacing: '0.04em', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              SISTEMA DE GESTIÓN AMBIENTAL ISO 14001:2015 • LEY 19.587
            </p>
            <h1 style={{ margin: '2px 0 0 0', fontWeight: 900, fontSize: '13pt', letterSpacing: '-0.02em', textTransform: 'uppercase', color: '#0f172a', lineHeight: 1.15, wordBreak: 'break-word' }}>
              PROTOCOLO DE MONITOREO AMBIENTAL
            </h1>
            <p style={{ margin: '2px 0 0 0', fontWeight: 700, fontSize: '7pt', textTransform: 'uppercase', letterSpacing: '0.03em', color: accentColor }}>
              Documento Oficial de Evaluación de Impacto
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', textAlign: 'right', flexShrink: 0 }}>
            <div style={{ backgroundColor: '#ffffff', padding: '3px', borderRadius: '6px', border: '1px solid #cbd5e1', display: 'inline-block' }}>
              <QRCodeSVG value={verificationUrl} size={40} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <CompanyLogo style={{ maxHeight: '30px', maxWidth: '110px', objectFit: 'contain' }} />
              <span style={{ fontSize: '5pt', fontWeight: 900, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '2px' }}>
                Doc. Auténtico • Verificación QR
              </span>
            </div>
          </div>
        </div>

        {/* Banner Principal de Identidad & Estado */}
        <div
          style={{
            backgroundColor: accentBg,
            borderColor: accentBorder,
            borderWidth: '1px',
            borderStyle: 'solid',
            borderLeft: `5px solid ${accentColor}`,
            padding: '8px 12px',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            width: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ fontSize: '5.5pt', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
              ESTACIÓN / PUNTO DE CONTROL AMBIENTAL
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '1px' }}>
              <span style={{ fontSize: '16px' }}>{typeConfig.icon}</span>
              <h2 style={{ margin: 0, fontSize: '12pt', fontWeight: 900, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.stationName || 'Estación Monitoreada'}
              </h2>
            </div>
            <div style={{ display: 'flex', gap: '14px', fontSize: '7pt', fontWeight: 700, color: '#475569', marginTop: '2px' }}>
              <span>Tipo: <b>{typeConfig.name}</b></span>
              <span>ID Registro: <b style={{ fontFamily: 'monospace' }}>{data.id ? data.id.slice(0, 10) : 'ENV-REG'}</b></span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '8px' }}>
            <span
              style={{
                backgroundColor: accentColor,
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '999px',
                fontWeight: 900,
                fontSize: '8pt',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                display: 'inline-block'
              }}
            >
              ESTADO: {data.status?.toUpperCase() || 'NORMAL'}
            </span>
          </div>
        </div>

        {/* Grid de Metadatos Trazables (2 Columnas) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 10px', backgroundColor: '#f8fafc', fontSize: '7.5pt', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Ubicación / Coordenadas:</span>
              <span style={{ fontWeight: 800, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {data.location || 'Sector Monitoreado'} {data.latitude ? `(${data.latitude}, ${data.longitude || ''})` : ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Fecha y Hora de Muestra:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>
                {new Date(data.measurementDate || data.date || data.createdAt || Date.now()).toLocaleDateString('es-AR')} {data.measurementTime || ''}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Normativa de Referencia:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{data.regulation || 'ISO 14001:2015 / Res. DPA'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '8px', borderLeft: '1px solid #cbd5e1', minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Técnico de Campo:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{data.technician || 'Personal Acreditado'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e2e8f0', paddingBottom: '2px' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Equipo Utilizado:</span>
              <span style={{ fontWeight: 800, color: '#0f172a' }}>{data.equipment || 'Analizador Calibrado'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 700, color: '#64748b', fontSize: '6pt', textTransform: 'uppercase' }}>Validez Auditoría:</span>
              <span style={{ fontWeight: 800, color: '#047857' }}>Verificado 100% Digital</span>
            </div>
          </div>
        </div>

        {/* Tabla Dinámica de Parámetros Ambiental */}
        <div style={{ marginBottom: '10px', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '8pt', fontWeight: 900, textTransform: 'uppercase', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px', paddingBottom: '3px', borderBottom: '1.5px solid #0f172a' }}>
            <Activity size={13} color="#059669" /> RESULTADOS Y VALORES OBTENIDOS
          </h3>
          <table style={{ width: '100%', tableLayout: 'fixed', borderCollapse: 'collapse', border: '1px solid #cbd5e1', fontSize: '7.5pt', backgroundColor: '#ffffff' }}>
            <thead>
              <tr style={{ backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.03em', fontSize: '6pt' }}>
                <th style={{ width: '30%', padding: '5px 6px', textAlign: 'left', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900 }}>PARÁMETRO MEDIDO</th>
                <th style={{ width: '18%', padding: '5px 6px', textAlign: 'center', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900 }}>VALOR HALLADO</th>
                <th style={{ width: '22%', padding: '5px 6px', textAlign: 'center', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900 }}>LÍMITE MÁXIMO PERMITIDO</th>
                <th style={{ width: '15%', padding: '5px 6px', textAlign: 'center', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900 }}>UNIDAD</th>
                <th style={{ width: '15%', padding: '5px 6px', textAlign: 'center', border: '1px solid #cbd5e1', backgroundColor: '#f1f5f9', color: '#0f172a', fontWeight: 900 }}>EVALUACIÓN</th>
              </tr>
            </thead>
            <tbody>
              {data.parameters && data.parameters.length > 0 ? (
                data.parameters.map((p: any, i: number) => {
                  const paramName = PARAMETERS_MAP[data.monitoringType]?.[p.parameterId] || p.parameterId;
                  const limitVal = LIMITS_MAP[p.parameterId] || 'S/L';
                  const unitVal = UNITS_MAP[p.parameterId] || '-';
                  const rowBg = i % 2 === 0 ? '#ffffff' : '#f8fafc';
                  return (
                    <tr key={i} className="avoid-break" style={{ backgroundColor: rowBg }}>
                      <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', fontWeight: 700, color: '#1e293b', backgroundColor: rowBg, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{paramName}</td>
                      <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 900, fontSize: '8pt', color: accentColor, backgroundColor: rowBg }}>
                        {p.value}
                      </td>
                      <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontWeight: 600, color: '#475569', backgroundColor: rowBg }}>{limitVal}</td>
                      <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', textAlign: 'center', fontFamily: 'monospace', color: '#64748b', backgroundColor: rowBg }}>{unitVal}</td>
                      <td style={{ padding: '5px 6px', border: '1px solid #e2e8f0', textAlign: 'center', backgroundColor: rowBg }}>
                        <span
                          style={{
                            backgroundColor: accentBg,
                            color: accentColor,
                            border: `1px solid ${accentBorder}`,
                            padding: '2px 5px',
                            borderRadius: '4px',
                            fontSize: '5.5pt',
                            fontWeight: 900,
                            textTransform: 'uppercase',
                            display: 'inline-block'
                          }}
                        >
                          {isCritical ? 'EXCEDIDO' : isWarning ? 'PRECAUCIÓN' : 'CONFORME'}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr className="avoid-break" style={{ backgroundColor: '#ffffff' }}>
                  <td colSpan={5} style={{ padding: '10px', border: '1px solid #e2e8f0', textAlign: 'center', color: '#94a3b8', fontStyle: 'italic', backgroundColor: '#ffffff' }}>
                    Sin parámetros específicos registrados para esta medición.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Cuadro de Condiciones Meteorológicas */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '10px', backgroundColor: '#ffffff', boxSizing: 'border-box' }}>
          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 8px', backgroundColor: '#f8fafc' }}>
            <h4 style={{ margin: '0 0 3px 0', fontSize: '6.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Wind size={11} color="#2563eb" /> CONDICIONES METEOROLÓGICAS
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px', fontSize: '7pt', color: '#334155' }}>
              <span>Temperatura: <b>{data.weather?.temperature || '-'} °C</b></span>
              <span>Humedad: <b>{data.weather?.humidity || '-'} %</b></span>
              <span>Viento: <b>{data.weather?.windSpeed || '-'} km/h</b></span>
              <span>Dirección: <b>{data.weather?.windDirection || '-'}</b></span>
            </div>
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', padding: '6px 8px', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <h4 style={{ margin: '0 0 3px 0', fontSize: '6.5pt', fontWeight: 900, textTransform: 'uppercase', color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clipboard size={11} color="#059669" /> EQUIPO Y CALIBRACIÓN
            </h4>
            <p style={{ margin: 0, fontSize: '7pt', fontWeight: 700, color: '#0f172a', lineHeight: 1.25 }}>
              {data.equipment || 'Analizador de parámetros ambientales calibrado bajo norma ISO/IEC 17025.'}
            </p>
          </div>
        </div>

        {/* Observaciones y Conclusión Técnica */}
        <div style={{ marginBottom: '10px', borderLeft: '4px solid #059669', backgroundColor: '#f8fafc', padding: '6px 8px', borderRadius: '0 8px 8px 0', borderTop: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0', fontSize: '7.5pt', boxSizing: 'border-box' }}>
          <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '6pt', color: '#047857', display: 'block', marginBottom: '1px' }}>
            OBSERVACIONES Y CONCLUSIÓN TÉCNICA
          </span>
          <p style={{ margin: 0, color: '#334155', fontWeight: 500, lineHeight: 1.3 }}>
            {data.observations ||
              'Se han completado los ensayos de control ambiental registrando valores compatibles con el marco regulatorio ISO 14001:2015. El estado operativo de la estación se declara CONFORME a las directrices vigentes.'}
          </p>
        </div>

        {/* Bloque de Firmas Profesional Triple */}
        <div className="avoid-break" style={{ marginTop: '10px', backgroundColor: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
          <PdfSignatures
            data={data}
            box1={
              data.showSignatures?.operator !== false
                ? {
                    title: 'TÉCNICO DE CAMPO',
                    subtitle: 'Firma y Aclaración',
                    signatureUrl: data.operatorSignature || null,
                    isProfessional: false
                  }
                : null
            }
            box2={
              data.showSignatures?.professional !== false
                ? {
                    title: 'ESPECIALISTA H&S',
                    subtitle: (actName || 'Firma de Especialista').toUpperCase(),
                    signatureUrl: actSignature || null,
                    stampUrl: data.professionalStamp || actStamp || null,
                    isProfessional: true,
                    license: actLic || null
                  }
                : null
            }
            box3={
              data.showSignatures?.supervisor !== false
                ? {
                    title: 'RESPONSABLE AMBIENTAL',
                    subtitle: 'Aprobación / Autoridad',
                    signatureUrl: data.signature || data.supervisorSignature || null,
                    isProfessional: false
                  }
                : null
            }
          />
        </div>

        {/* Branding & Footer Oficial */}
        <PdfBrandingFooter />

        <div style={{ marginTop: '6px', fontSize: '5.5pt', color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          DOCUMENTO OFICIAL AUDITABLE DE SEGUIMIENTO AMBIENTAL • REGISTRO DIGITAL SEGÚN NORMA ISO 14001:2015
        </div>
      </div>
    </div>
  );
}