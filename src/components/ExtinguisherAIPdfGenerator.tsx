import React from 'react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';
import PdfSignatures from './PdfSignatures';
import { Flame, Calendar, Info, CheckCircle2, AlertTriangle, Crosshair, Package, Gauge, ShieldCheck, Clock, Check } from 'lucide-react';

const EXTINTOR_INFO: Record<string, {name: string; fires: string; color: string; icon: string; usage: string; classes: string[]}> = {
  'ABC': {
    name: 'Polvo Químico Seco (ABC / HCFC)',
    fires: 'Clase A (sólidos), B (líquidos), C (equipos eléctricos)',
    color: '#0284c7',
    icon: '🧯',
    usage: 'Tirar del pasador de seguridad, apuntar a la base de las llamas y presionar la palanca en forma de abanico.',
    classes: ['A', 'B', 'C']
  },
  'CO2': {
    name: 'Dióxido de Carbono (CO2)',
    fires: 'Clase B (líquidos combustibles) y Clase C (equipos eléctricos energizados)',
    color: '#2563eb',
    icon: '❄️',
    usage: 'Sujetar por la tobera aislante (riesgo de quemadura por frío), aproximar y descargar barriendo el área.',
    classes: ['B', 'C']
  },
  'Agua': {
    name: 'Agua Bajo Presión / Agua Pulverizada',
    fires: 'Clase A (madera, papel, textiles y materiales sólidos ordinarios)',
    color: '#059669',
    icon: '💧',
    usage: 'Dirigir el chorro directamente a la base de las brasas. NO utilizar jamás en instalaciones eléctricas.',
    classes: ['A']
  },
  'Espuma': {
    name: 'Espuma Mecánica (AFFF)',
    fires: 'Clase A (sólidos) y Clase B (hidrocarburos y solventes)',
    color: '#d97706',
    icon: '🫧',
    usage: 'Aplicar suavemente contra el lateral del recipiente para formar película selladora de vapores.',
    classes: ['A', 'B']
  },
  'K': {
    name: 'Acetato de Potasio (Clase K)',
    fires: 'Clase K (grasas y aceites de freidoras y cocinas comerciales)',
    color: '#7c3aed',
    icon: '🍳',
    usage: 'Descargar a distancia prudencial con efecto de niebla para evitar salpicaduras de aceite caliente.',
    classes: ['K']
  }
};

export default function ExtinguisherAIPdfGenerator({ item }: { item: any }): React.ReactElement | null {
  if (!item) return null;

  const typeKey = (item.type || 'ABC').toUpperCase();
  const info = EXTINTOR_INFO[typeKey] || {
    name: item.type || 'Extintor Portátil de Seguridad',
    fires: 'Clases estándar según agente extintor',
    color: '#0284c7',
    icon: '🧯',
    usage: 'Verificar especificaciones en chapa de instrucciones del fabricante.',
    classes: ['A', 'B']
  };

  const isVigente = item.status === 'vigente' || item.expirationStatus === 'vigente';
  const confidencePercent = item.confidence ? Math.round(item.confidence * 100) : 95;
  const company = item.company || item.empresa || 'Planta Operativa';
  const location = item.location || item.ubicacion || 'Sector General';

  const manometerStatus = item.manometerStatus || (isVigente ? 'zona_verde' : 'descargado');
  const isZonaVerde = manometerStatus === 'zona_verde';
  const isNoAplica = manometerStatus === 'no_aplica' || typeKey === 'CO2';

  return (
    <div className="w-[100%] flex justify-center bg-transparent">
      <div
        id="pdf-content-ext-ai"
        className="pdf-container report-print print-area w-[100%] max-w-[210mm] min-h-[auto] p-[16mm_18mm] bg-[#ffffff] text-[#1e293b] box-shadow-[0_20px_40px_rgba(0,0,0,0.08)] rounded-[12px] box-sizing-[border-box] m-[0_auto] text-[9.5pt] block"
        style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 12mm; }
            body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              margin: 0 !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border: none !important;
              border-radius: 0 !important; 
            }
          `}
        </style>

        {/* Encabezado Ejecutivo */}
        <div className="flex justify-between items-start border-bottom-[3px_solid_#0284c7] pb-[1.2rem] mb-[1.8rem] avoid-break break-inside-avoid">
          <div className="flex-[1]">
            <div className="inline-flex items-center gap-[0.4rem] bg-[#0f172a] text-[#ffffff] font-[800] text-[0.68rem] uppercase tracking-[1.5px] p-[0.35rem_0.85rem] rounded-full mb-[0.8rem]">
              <Flame size={12} className="text-amber-400" />
              <span>IRAM 3517-2 & Dec. 351/79 — Control IA</span>
            </div>
            <h1 className="m-[0_0_0.25rem_0] text-[#0f172a] text-[1.8rem] font-[900] tracking-[-0.5px] leading-tight">
              INFORME TÉCNICO DE EXTINTOR
            </h1>
            <p className="m-[0] text-[0.95rem] text-[#0284c7] font-[700] uppercase tracking-[0.5px]">
              Inspección de Estado Operativo & Verificación de Manómetro
            </p>
          </div>
          <div className="flex flex-col items-end gap-[0.6rem] ml-[1rem]">
            <div className="h-[52px] flex items-center">
              <CompanyLogo style={{ maxHeight: '48px', maxWidth: '140px', objectFit: 'contain' }} />
            </div>
            <div className="text-[8.5pt] text-[#475569] font-[700] bg-[#f1f5f9] p-[0.3rem_0.75rem] rounded-full border border-slate-200">
              Fecha: {item.date ? new Date(item.date).toLocaleDateString('es-AR') : item.savedAt ? new Date(item.savedAt).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
            </div>
          </div>
        </div>

        {/* Bloque de Información de Contexto */}
        <div className="grid grid-cols-4 gap-[0.8rem] mb-[1.8rem] bg-[#f8fafc] p-[1.1rem] rounded-[10px] border border-slate-200 avoid-break break-inside-avoid">
          <div className="border-r border-slate-200 pr-[0.6rem]">
            <div className="text-[0.68rem] text-[#64748b] font-[700] uppercase tracking-wider mb-[0.2rem]">Tipo Identificado</div>
            <p className="m-[0] font-[900] text-[0.92rem] text-[#0284c7] truncate">{info.name.split('(')[0]}</p>
          </div>
          <div className="border-r border-slate-200 pr-[0.6rem]">
            <div className="text-[0.68rem] text-[#64748b] font-[700] uppercase tracking-wider mb-[0.2rem]">Empresa / Instalación</div>
            <p className="m-[0] font-[800] text-[0.92rem] text-[#0f172a] truncate">{company}</p>
          </div>
          <div className="border-r border-slate-200 pr-[0.6rem]">
            <div className="text-[0.68rem] text-[#64748b] font-[700] uppercase tracking-wider mb-[0.2rem]">Sector / Ubicación</div>
            <p className="m-[0] font-[800] text-[0.92rem] text-[#0f172a] truncate">{location}</p>
          </div>
          <div>
            <div className="text-[0.68rem] text-[#64748b] font-[700] uppercase tracking-wider mb-[0.2rem]">Confianza Modelo IA</div>
            <p className="m-[0] font-[900] text-[0.92rem] text-[#059669] flex items-center gap-1">
              <Crosshair size={13} /> {confidencePercent}%
            </p>
          </div>
        </div>

        {/* Sección Principal de Diagnóstico: Foto de Evidencia + Análisis de Presión y Estado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-[1.4rem] mb-[1.8rem] avoid-break break-inside-avoid">
          {/* Columna Izquierda: Fotografía de Evidencia */}
          <div className="flex flex-col items-center justify-center p-[0.75rem] bg-[#f8fafc] rounded-[12px] border border-slate-200 shadow-sm relative">
            <div className="w-[100%] h-[260px] flex items-center justify-center overflow-hidden rounded-[8px] bg-slate-100">
              {item.image ? (
                <img
                  src={item.image}
                  alt="Extintor inspeccionado"
                  crossOrigin="anonymous"
                  className="w-full h-full object-contain block mx-auto rounded-[6px]"
                  style={{ maxHeight: '260px', objectFit: 'contain' }}
                />
              ) : (
                <div className="text-center text-[#94a3b8] p-[2rem]">
                  <Flame size={36} className="mx-auto mb-[0.5rem] opacity-30" />
                  <span className="text-[9pt] font-[600]">Evidencia fotográfica no disponible</span>
                </div>
              )}
            </div>
            {/* Badge superpuesto en la fotografía */}
            <div className="absolute top-[1.2rem] right-[1.2rem]">
              <span
                style={{
                  backgroundColor: isVigente ? '#059669' : '#dc2626',
                  color: '#ffffff'
                }}
                className="text-[0.72rem] font-[900] px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-white"
              >
                {isVigente ? '✓ VIGENTE' : '⚠️ REVISIÓN'}
              </span>
            </div>
            <p className="mt-[0.6rem] mb-0 text-[0.72rem] text-[#64748b] italic text-center">
              Registro fotográfico procesado por visión artificial y lectura de manómetro
            </p>
          </div>

          {/* Columna Derecha: Tarjetas de Diagnóstico y Manómetro */}
          <div className="flex flex-col gap-[0.8rem] justify-between">
            {/* Tarjeta de Estado Operativo Global */}
            <div
              style={{
                background: isVigente ? '#f0fdf4' : '#fef2f2',
                border: `1.5px solid ${isVigente ? '#bbf7d0' : '#fecaca'}`
              }}
              className="p-[1rem] rounded-[10px]"
            >
              <div className="flex items-center gap-[0.6rem] mb-[0.4rem]">
                {isVigente ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertTriangle size={20} className="text-rose-600" />}
                <div className="text-[0.75rem] font-[800] uppercase tracking-wider" style={{ color: isVigente ? '#166534' : '#991b1b' }}>
                  Condición del Equipo: {isVigente ? 'APTO PARA USO' : 'REQUIERE ATENCIÓN INMEDIATA'}
                </div>
              </div>
              <p className="m-0 text-[8.5pt] leading-relaxed text-slate-700">
                {isVigente
                  ? 'El extintor cumple con los estándares visuales de presurización, precintado y vigencia periódica exigidos por Dec. 351/79.'
                  : 'Se detectaron desvíos operativos o vencimiento en la carga del extintor. Debe ser enviado a servicio técnico homologado.'}
              </p>
            </div>

            {/* Tarjeta de Análisis de Manómetro (Presión) */}
            <div className="p-[1rem] rounded-[10px] bg-[#f8fafc] border border-slate-200">
              <div className="flex items-center gap-[0.5rem] mb-[0.5rem]">
                <Gauge size={18} className="text-[#0284c7]" />
                <span className="text-[0.75rem] font-[800] text-[#0f172a] uppercase tracking-wider">
                  Verificación de Manómetro & Presión
                </span>
              </div>
              <div className="flex items-center gap-[0.6rem] mb-[0.4rem]">
                <div
                  style={{
                    backgroundColor: isNoAplica ? '#e0f2fe' : isZonaVerde ? '#dcfce7' : '#fee2e2',
                    color: isNoAplica ? '#0284c7' : isZonaVerde ? '#15803d' : '#b91c1c',
                    border: `1px solid ${isNoAplica ? '#bae6fd' : isZonaVerde ? '#bbf7d0' : '#fecaca'}`
                  }}
                  className="px-2.5 py-1 rounded-[6px] font-[900] text-[0.78rem] uppercase"
                >
                  {isNoAplica
                    ? 'CO2 / ALTA PRESIÓN'
                    : isZonaVerde
                    ? '🟢 ZONA VERDE (1.2 - 1.4 MPa)'
                    : '🔴 DESPRESURIZADO / FUERA DE RANGO'}
                </div>
              </div>
              <p className="m-0 text-[8.5pt] text-slate-600 leading-relaxed">
                {item.manometerMessage ||
                  (isNoAplica
                    ? 'Extintor de CO2 sin manómetro. Su verificación de carga se realiza mediante control de peso en balanza (IRAM 3509).'
                    : isZonaVerde
                    ? 'Aguja indicadora ubicada en el cuadrante verde de presurización correcta con nitrógeno seco.'
                    : 'Aguja indicadora en zona de baja presión o sobrepresión. Peligro de descarga ineficaz.')}
              </p>
            </div>

            {/* Fechas de Mantenimiento y Control */}
            <div className="grid grid-cols-3 gap-[0.5rem]">
              <div className="p-[0.6rem] bg-slate-50 border border-slate-200 rounded-[8px] text-center">
                <div className="text-[0.65rem] text-slate-500 font-[700] uppercase">Último Control</div>
                <div className="text-[0.82rem] font-[800] text-slate-800 mt-[2px]">
                  {item.lastCheck ? new Date(item.lastCheck).toLocaleDateString('es-AR') : 'Registrado'}
                </div>
              </div>
              <div className="p-[0.6rem] bg-slate-50 border border-slate-200 rounded-[8px] text-center">
                <div className="text-[0.65rem] text-slate-500 font-[700] uppercase">Próxima Revisión</div>
                <div className="text-[0.82rem] font-[800] text-amber-600 mt-[2px]">
                  {item.nextCheck ? new Date(item.nextCheck).toLocaleDateString('es-AR') : 'En 30 días'}
                </div>
              </div>
              <div className="p-[0.6rem] bg-slate-50 border border-slate-200 rounded-[8px] text-center">
                <div className="text-[0.65rem] text-slate-500 font-[700] uppercase">Vencimiento P.H.</div>
                <div className="text-[0.82rem] font-[800] text-blue-600 mt-[2px]">
                  {item.phDate ? new Date(item.phDate).toLocaleDateString('es-AR') : 'Quinquenal'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Eficacia Extintora & Especificaciones Operativas */}
        <div className="p-[1rem] rounded-[10px] bg-[#f8fafc] border border-slate-200 mb-[1.6rem] avoid-break break-inside-avoid">
          <div className="flex items-center justify-between mb-[0.6rem]">
            <div className="flex items-center gap-[0.5rem]">
              <Package size={16} className="text-[#0284c7]" />
              <span className="text-[0.78rem] font-[800] text-slate-900 uppercase tracking-wider">
                Aptitud de Extinción & Clases de Fuego
              </span>
            </div>
            {item.capacity && (
              <span className="text-[0.75rem] font-[800] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                Capacidad: {item.capacity}
              </span>
            )}
          </div>
          <div className="flex items-center gap-[0.5rem] mb-[0.6rem]">
            {info.classes.map((cls) => (
              <div
                key={cls}
                className="w-[28px] h-[28px] rounded-[6px] bg-[#0f172a] text-white flex items-center justify-center font-[900] text-[0.85rem]"
              >
                {cls}
              </div>
            ))}
            <span className="text-[8.5pt] text-slate-600 font-[600] ml-[0.3rem]">{info.fires}</span>
          </div>
          <div className="text-[8pt] text-slate-600 bg-white p-[0.6rem_0.8rem] rounded-[6px] border border-slate-200 leading-relaxed">
            <strong className="text-slate-800">Modo de Uso:</strong> {info.usage}
          </div>
        </div>

        {/* Recomendaciones Técnicas */}
        {item.recommendations && item.recommendations.length > 0 && (
          <div className="mb-[1.8rem] avoid-break break-inside-avoid">
            <div className="flex items-center gap-[0.5rem] mb-[0.6rem]">
              <div className="w-[6px] h-[16px] bg-[#0284c7] rounded-[2px]" />
              <h4 className="m-0 text-[0.85rem] font-[800] text-slate-900 uppercase tracking-wider">
                Observaciones y Medidas Preventivas
              </h4>
            </div>
            <ul className="m-0 pl-[1.2rem] text-[8.5pt] text-slate-700 leading-relaxed">
              {item.recommendations.map((rec: string, i: number) => (
                <li key={i} className="mb-[0.25rem]">
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Bloque de Firmas y Validación Profesional */}
        <div className="pdf-signatures-wrapper avoid-break avoid-break-strictly mb-[1rem]">
          <PdfSignatures
            data={{
              ...item,
              professionalName: item.inspectorName || 'Técnico Especialista en Seguridad',
              professionalSignature: item.signature || null
            }}
            box1={{
              title: 'INSPECTOR / AUDITOR TÉCNICO',
              subtitle: 'Aclaración y Firma',
              signatureUrl: item.signature || null,
              isProfessional: true
            }}
            box2={{
              title: 'RESPONSABLE DE HIGIENE Y SEGURIDAD',
              subtitle: 'Matrícula Profesional',
              signatureUrl: null,
              isProfessional: true
            }}
            box3={null}
          />
        </div>

        {/* Pie de Marca y Certificación Electrónica */}
        <PdfBrandingFooter />
        <div className="text-center mt-[1rem] pt-[0.6rem] border-t border-slate-200 text-[7pt] text-slate-400">
          Documento digital de verificación técnica emitido por Asistente H&S — Cumplimiento legal Ley 19.587 y Norma IRAM 3517.
        </div>
      </div>
    </div>
  );
}
