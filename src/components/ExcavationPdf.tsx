import React from 'react';
import {
  Pickaxe, CheckCircle2, AlertOctagon, User, Calendar, MapPin,
  ShieldCheck, AlertTriangle, Layers, Ruler, ShieldAlert, FileText
} from 'lucide-react';
import DualPdfHeader from './DualPdfHeader';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { SOIL_TYPES_INFO } from '../data/excavationData';

interface ExcavationPdfProps {
  data: any;
  customId?: string;
}

export default function ExcavationPdf({
  data,
  customId = 'pdf-excavation-permit'
}: ExcavationPdfProps): React.ReactElement | null {
  if (!data) return null;

  const isDeep = Number(data.depthMeters) > 1.20;
  const soilInfo = SOIL_TYPES_INFO[data.soilType as keyof typeof SOIL_TYPES_INFO] || SOIL_TYPES_INFO.B;
  const checklist = data.checklist || {};

  const volumeM3 = (
    (Number(data.depthMeters) || 0) *
    (Number(data.widthMeters) || 0) *
    (Number(data.lengthMeters) || 0)
  ).toFixed(1);

  const shoringNames: Record<string, string> = {
    trench_box: 'Caja Metálica Blindada (Trench Box)',
    timber_shoring: 'Entibado de Madera Continuo con Puntales',
    sheet_piling: 'Tablestacado Metálico Hincado',
    hydraulic: 'Entibado Hidráulico de Aluminio',
    sloped_only: 'Talud Inclinado sin Entibado Mecánico',
    none: 'Sin Entibado (Profundidad < 1.20 m)'
  };

  const checklistItems = [
    { key: 'utilitiesLocated', label: 'Interferencias subterráneas sondeadas (Gas, Luz, Agua, Telecomunicaciones)', law: 'Dec. 911/96 Art. 140' },
    { key: 'soilClassificationVerified', label: 'Tipo de suelo verificado en terreno y ángulo de reposo compatible', law: 'Res. SRT 550/11 Art. 3' },
    { key: 'spoilDistance1m', label: 'Acopio de tierra extraída a más de 1.00 m del borde superior de la zanja', law: 'Dec. 911/96 Art. 143' },
    { key: 'safeAccessLadders7m', label: 'Escaleras reglamentarias de evacuación rápida cada 7.50 m (sobresalen 1.00 m)', law: 'Dec. 911/96 Art. 147' },
    { key: 'machineryDistanceSafe', label: 'Distancia de seguridad para tránsito y radio de retroexcavadoras / camiones', law: 'Res. SRT 550/11 Art. 5' },
    { key: 'perimeterBarricades', label: 'Vallado perimetral rígido (1.00 m de altura), rodapié y señalización de peligro', law: 'Dec. 911/96 Art. 145' },
    { key: 'waterControlInstalled', label: 'Control de agua, napas freáticas y drenajes o bombas de achique disponibles', law: 'Dec. 911/96 Art. 148' },
    { key: 'atmosphereTested', label: 'Monitoreo de atmósfera peligrosa / gases pesados en zanjas profundas (> 1.20 m)', law: 'Dec. 911/96 Art. 150' }
  ];

  const totalChecks = checklistItems.length;
  const verifiedCount = checklistItems.filter(item => Boolean(checklist[item.key])).length;
  const complianceRate = totalChecks > 0 ? Math.round((verifiedCount / totalChecks) * 100) : 100;

  // Título oficial: Solo "Profesional de Higiene y Seguridad" o "Técnico en Higiene y Seguridad"
  const rawRole = (data.professionalRole || 'Profesional de Higiene y Seguridad').toLowerCase();
  const finalRoleTitle = (rawRole.includes('técnico') || rawRole.includes('tecnico'))
    ? 'TÉCNICO EN HIGIENE Y SEGURIDAD'
    : 'PROFESIONAL DE HIGIENE Y SEGURIDAD';

  return (
    <div className="w-[100%] flex justify-center">
      <div
        id={customId}
        className="pdf-container print-area w-[100%] max-w-[210mm] min-h-[297mm] p-[6mm_10mm] bg-[#ffffff] text-[#1e293b] box-shadow-none rounded-[8px] box-sizing-[border-box] m-[0_auto] text-[9pt] font-family-[system-ui,_-apple-system,_sans-serif] border-t-4 border-amber-600"
      >
        <style type="text/css" media="print">
          {`
            @page { size: A4 portrait; margin: 6mm 8mm; }
            body { 
              -webkit-print-color-adjust: exact !important; 
              print-color-adjust: exact !important; 
              font-family: system-ui, -apple-system, sans-serif; 
              background: white !important; 
            }
            .no-print, .module-form-layout, .module-form-toolbar, .module-action-bar, nav, aside, .sidebar { 
              display: none !important; 
            }
            .dual-pdf-header {
              display: block !important;
              visibility: visible !important;
            }
            #${customId}, .pdf-container { 
              box-shadow: none !important; 
              margin: 0 auto !important; 
              padding: 0 !important; 
              width: 100% !important; 
              max-width: none !important; 
              border-top: 4px solid #d97706 !important; 
              border-radius: 0 !important; 
              min-height: 0 !important; 
              height: auto !important; 
              max-height: none !important;
              opacity: 1 !important;
              visibility: visible !important;
            }
            .striped-row:nth-child(even) { background-color: #f8fafc; }
            .avoid-break {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
            .excavation-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}
        </style>

        {/* Encabezado Principal Institucional con Logos Centrados */}
        <DualPdfHeader
          title="PERMISO OFICIAL DE EXCAVACIONES Y ZANJAS SEGURAS"
          subtitle="Habilitación Diaria y Verificación Geotécnica de Estabilidad y Entibados"
          normBadge="DEC. 911/96 CAP. 10 · RES. SRT 550/11"
          normBadgeColor="amber"
          normBadgeIcon={<Pickaxe size={12} />}
          documentId={data.permitNumber || data.id || `EXC-${Date.now().toString().slice(-6)}`}
          establishmentName={data.projectOrSite || data.companyName || 'Obra en Construcción'}
          date={data.date ? new Date(data.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
          className="mb-3"
        />

        {/* Banner de Estado Operativo */}
        <div className={`p-2 rounded-lg mb-2.5 flex items-center justify-between border avoid-break ${
          isDeep
            ? 'bg-amber-50 border-amber-400 text-amber-950'
            : 'bg-emerald-50 border-emerald-400 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2">
            {isDeep ? (
              <AlertTriangle size={20} className="text-amber-600 shrink-0" />
            ) : (
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="text-[7.8pt] font-black uppercase tracking-wider block">
                {isDeep 
                  ? 'EXCAVACIÓN PROFUNDA (> 1.20 M) — EXIGENCIA OBLIGATORIA DE ENTIBAMIENTO O TALUD REGLAMENTARIO'
                  : 'EXCAVACIÓN SUPERFICIAL (< 1.20 M) — HABILITACIÓN DE INGRESO OPERATIVO SEGURO'}
              </span>
              <span className="text-[6.5pt] text-slate-600 block mt-0.5">
                Cumplimiento estricto del Decreto 911/96 Art. 142 y Resolución S.R.T. 550/11 (Mecanismos de Protección de Zanjas)
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[6pt] font-bold text-slate-500 uppercase block">Cumplimiento</span>
            <span className="text-sm font-black text-slate-900">{complianceRate}%</span>
          </div>
        </div>

        {/* Panel de Metadatos de Ubicación y Parámetros Geotécnicos */}
        <div className="border border-slate-300 rounded-lg mb-2.5 w-full overflow-hidden shadow-xs text-slate-900 avoid-break">
          <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <span className="text-[6.5pt] font-extrabold text-amber-700 uppercase tracking-wider flex items-center gap-1">
              <Layers size={11} /> PARÁMETROS GEOTÉCNICOS Y GEOMETRÍA DE LA EXCAVACIÓN
            </span>
            <span className="text-[6.5pt] font-mono text-slate-500 font-bold">
              UBICACIÓN: {data.location || 'Frente de Obra'}
            </span>
          </div>

          <div className="grid grid-cols-4 divide-x divide-slate-200 bg-white text-[7pt] border-b border-slate-200">
            <div className="p-2">
              <span className="text-[5.8pt] font-bold text-slate-400 uppercase block">Profundidad Máx</span>
              <span className="font-black text-[9pt] text-slate-900">{data.depthMeters || 1.5} m</span>
              <span className="text-[5.8pt] text-slate-500 block">{isDeep ? 'Requiere Entibado' : 'Superficial'}</span>
            </div>
            <div className="p-2">
              <span className="text-[5.8pt] font-bold text-slate-400 uppercase block">Ancho x Longitud</span>
              <span className="font-bold text-[8pt] text-slate-900">{data.widthMeters || 1.0} m x {data.lengthMeters || 10} m</span>
              <span className="text-[5.8pt] text-slate-500 block">Volumen aprox: {volumeM3} m³</span>
            </div>
            <div className="p-2">
              <span className="text-[5.8pt] font-bold text-slate-400 uppercase block">Tipo de Suelo</span>
              <span className="font-black text-[8pt] text-slate-900">Tipo {data.soilType || 'B'}</span>
              <span className="text-[5.8pt] text-slate-500 block">Talud máx: {soilInfo.maxSlope}</span>
            </div>
            <div className="p-2">
              <span className="text-[5.8pt] font-bold text-slate-400 uppercase block">Sistema de Protección</span>
              <span className="font-bold text-[7.5pt] text-slate-900 leading-tight block">
                {shoringNames[data.shoringType] || data.shoringType || 'Caja Metálica Blindada'}
              </span>
            </div>
          </div>

          <div className="px-3 py-1 bg-slate-50/70 text-[6.5pt] text-slate-600 flex justify-between items-center">
            <span><strong>Clasificación Geotécnica:</strong> {soilInfo.name} ({soilInfo.description})</span>
            <span><strong>Acopio Reglamentario:</strong> Mínimo 1.00 m del borde (Art. 143)</span>
          </div>
        </div>

        {/* Tabla Oficial de Verificaciones Críticas en Terreno */}
        <div className="mb-2.5">
          <div className="flex items-center gap-1.5 mb-1.5 pb-0.5 border-b-2 border-slate-800 avoid-break">
            <div className="w-1.5 h-3.5 bg-amber-600 rounded-xs"></div>
            <h3 className="text-[7.5pt] font-black text-slate-900 uppercase tracking-wider m-0">
              RELEVAMIENTO TÉCNICO Y VERIFICACIONES DE SEGURIDAD EN TERRENO (DEC. 911/96)
            </h3>
          </div>

          <div className="border border-slate-300 rounded-lg overflow-hidden shadow-xs w-full">
            <table style={{ tableLayout: 'fixed', width: '100%', boxSizing: 'border-box' }} className="border-collapse text-[7.5pt] excavation-table w-full">
              <colgroup>
                <col style={{ width: '22%' }} />
                <col style={{ width: '58%' }} />
                <col style={{ width: '20%' }} />
              </colgroup>
              <thead>
                <tr className="bg-slate-900 text-white text-left font-bold text-[7pt]">
                  <th style={{ padding: '4px 6px' }}>Norma Aplicable</th>
                  <th style={{ padding: '4px 6px' }}>Punto Crítico de Control en Excavación</th>
                  <th style={{ padding: '4px 6px', textAlign: 'center' }}>Dictamen</th>
                </tr>
              </thead>
              <tbody>
                {checklistItems.map((item, idx) => {
                  const isChecked = Boolean(checklist[item.key]);
                  return (
                    <tr key={item.key || idx} className="border-b border-slate-200 striped-row">
                      <td style={{ padding: '3.5px 6px' }} className="font-bold text-slate-800 align-top">
                        <span className="inline-block px-1 py-0.2 rounded text-[6.2pt] bg-slate-100 text-slate-700 border border-slate-200 font-mono">
                          {item.law}
                        </span>
                      </td>
                      <td style={{ padding: '3.5px 6px' }} className="text-slate-800 font-medium align-top leading-tight text-[7.2pt]">
                        {item.label}
                      </td>
                      <td style={{ padding: '3.5px 6px', textAlign: 'center' }} className="align-top">
                        {isChecked ? (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[6.2pt] font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 size={8} /> CONFORME
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[6.2pt] font-black bg-rose-100 text-rose-800 border border-rose-300">
                            ✗ NO CUMPLE
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Observaciones Técnicas y Medidas de Mitigación */}
        <div className="avoid-break border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 mb-2.5">
          <span className="text-[6pt] font-black text-slate-600 uppercase block mb-0.5 tracking-wider">
            OBSERVACIONES TÉCNICAS Y CONDICIONES ESPECIALES DE LA MANIOBRA:
          </span>
          <p className="text-[7pt] text-slate-800 leading-snug m-0 font-medium">
            {data.notes || 'Se verificaron las condiciones de estabilidad del terreno, ausencia de grietas de tracción superficiales, cateos de interferencias aprobados y colocación de vallado de seguridad perimetral continuo con balizamiento reglamentario.'}
          </p>
        </div>

        {/* Firmas de Responsabilidad (Igual que ATS) */}
        <div className="avoid-break mt-2">
          <PdfSignatures
            compact={true}
            hideFooter={true}
            data={data}
            box1={!data.showSignatures || data.showSignatures.operator ? {
              title: 'OPERADOR / MAQUINISTA',
              subtitle: (data.operatorName || 'Operador de Excavación').toUpperCase(),
              signatureUrl: data.operatorSignature || null,
              isProfessional: false
            } : null}
            box2={!data.showSignatures || data.showSignatures.professional ? {
              title: finalRoleTitle,
              subtitle: (data.competentPersonName || data.professionalName || 'Firma y Sello').toUpperCase(),
              signatureUrl: data.competentPersonSignature || data.professionalSignature || null,
              stampUrl: data.professionalStamp || null,
              isProfessional: true,
              license: data.professionalLicense || null
            } : null}
            box3={!data.showSignatures || data.showSignatures.supervisor ? {
              title: 'SUPERVISIÓN / CAPATAZ DE OBRA',
              subtitle: (data.supervisorName || 'Aprobación de Frente').toUpperCase(),
              signatureUrl: data.supervisorSignature || null,
              isProfessional: false
            } : null}
          />
        </div>

        <PdfBrandingFooter />

        {/* Pie de página legal */}
        <div className="w-full text-center text-[6.5pt] text-slate-400 mt-3 font-medium border-t border-slate-200 pt-1.5">
          Permiso Oficial de Excavaciones y Zanjas • Conforme a Dec. 911/96 Cap. 10 y Res. SRT 550/11 • Generado por Asistente HYS
        </div>
      </div>
    </div>
  );
}
