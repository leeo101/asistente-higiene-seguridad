import React from 'react';
import {
  Truck, CheckCircle2, AlertOctagon, User, Calendar, Clock,
  Shield, MapPin, Gauge, ShieldCheck, AlertTriangle
} from 'lucide-react';
import DualPdfHeader from './DualPdfHeader';
import PdfSignatures from './PdfSignatures';
import PdfBrandingFooter from './PdfBrandingFooter';
import { DAILY_INSPECTION_ITEMS } from '../data/forkliftSrt960Data';

interface ForkliftInspectionPdfProps {
  data: any;
  vehicle?: any;
  driver?: any;
  customId?: string;
}

export default function ForkliftInspectionPdf({
  data,
  vehicle,
  driver,
  customId = 'pdf-forklift-inspection'
}: ForkliftInspectionPdfProps): React.ReactElement | null {
  if (!data) return null;

  const responses = data.responses || {};
  const isBlocked = Boolean(data.hasCriticalFailure);

  // Stats calculation
  const totalItems = DAILY_INSPECTION_ITEMS.length;
  const conformitiesCount = Object.values(responses).filter(v => v === 'conforme').length;
  const nonConformitiesCount = Object.values(responses).filter(v => v === 'no_conforme').length;
  const evaluatedCount = conformitiesCount + nonConformitiesCount;
  const complianceRate = evaluatedCount > 0 ? Math.round((conformitiesCount / evaluatedCount) * 100) : 100;

  // Professional role
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
            .inspection-table tr {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          `}
        </style>

        {/* Encabezado Oficial */}
        <DualPdfHeader
          title="PLANILLA OFICIAL DE CONTROL PRE-OPERACIONAL"
          subtitle="Verificación Diaria Obligatoria de Autoelevadores — Resolución S.R.T. N° 960/15 Anexo III"
          normBadge="RES. S.R.T. 960/15 · ART. 6"
          normBadgeColor="amber"
          normBadgeIcon={<Truck size={12} />}
          documentId={data.id || `CHK-${Date.now()}`}
          establishmentName={data.companyName || vehicle?.sectorLocation || 'Establecimiento Operativo'}
          date={data.date ? new Date(data.date).toLocaleDateString('es-AR') : new Date().toLocaleDateString('es-AR')}
          className="mb-3"
        />

        {/* Banner de Resultado Operativo */}
        <div className={`p-2 rounded-lg mb-2.5 flex items-center justify-between border avoid-break ${
          isBlocked 
            ? 'bg-rose-50 border-rose-400 text-rose-950' 
            : 'bg-emerald-50 border-emerald-400 text-emerald-950'
        }`}>
          <div className="flex items-center gap-2">
            {isBlocked ? (
              <AlertOctagon size={20} className="text-rose-600 shrink-0" />
            ) : (
              <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            )}
            <div>
              <span className="text-[8pt] font-black uppercase tracking-wider block">
                {isBlocked 
                  ? 'EQUIPO INMOVILIZADO — PROHIBICIÓN ESTRICTA DE OPERAR (ART. 6 RES. SRT 960/15)' 
                  : 'EQUIPO LIBERADO Y APTO PARA OPERACIÓN SEGURA DE CARGA Y ESTIBA'}
              </span>
              <span className="text-[6.8pt] font-medium opacity-90">
                {isBlocked 
                  ? 'Se han detectado no conformidades en componentes críticos de seguridad. Reparación técnica obligatoria antes de operar.' 
                  : 'Todos los dispositivos de seguridad activa y componentes críticos se encuentran operativos y conformes.'}
              </span>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[6.5pt] font-bold uppercase block text-slate-500">Cumplimiento</span>
            <span className={`text-sm font-black ${isBlocked ? 'text-rose-600' : 'text-emerald-600'}`}>
              {complianceRate}%
            </span>
          </div>
        </div>

        {/* Metadatos: Datos del Autoelevador y Conductor */}
        <div className="border border-slate-300 rounded-lg mb-2.5 w-full overflow-hidden shadow-xs text-slate-900 avoid-break">
          <div className="grid grid-cols-4 bg-slate-50 border-b border-slate-200 text-[6.5pt] p-1.5 px-3 font-extrabold uppercase text-slate-600 tracking-wider">
            <div className="flex items-center gap-1"><Truck size={10} className="text-amber-600" /> AUTOELEVADOR</div>
            <div className="flex items-center gap-1"><User size={10} className="text-blue-600" /> CONDUCTOR HABILITADO</div>
            <div className="flex items-center gap-1"><Gauge size={10} className="text-purple-600" /> HORÓMETRO / TURNO</div>
            <div className="flex items-center gap-1"><MapPin size={10} className="text-rose-600" /> SECTOR / PLANTA</div>
          </div>
          <div className="grid grid-cols-4 bg-white p-2 px-3 text-[7.5pt] font-semibold divide-x divide-slate-200">
            <div>
              <div className="font-black text-[9pt] text-slate-900 leading-tight">
                {data.vehicleCode || vehicle?.internalCode || 'AE-01'}
              </div>
              <div className="text-[6.5pt] text-slate-500 mt-0.5 truncate">
                {vehicle?.brand || 'Autoelevador'} {vehicle?.model || ''} ({vehicle?.year || '2024'})
              </div>
              <div className="text-[6pt] text-slate-400 font-mono">
                Cap.: {vehicle?.capacityKg || 2500} kg | Serie: {vehicle?.serialNumber || 'S/N'}
              </div>
            </div>

            <div className="pl-3">
              <div className="font-black text-slate-900 leading-tight truncate">
                {data.driverName || driver?.fullName || 'Conductor Designado'}
              </div>
              <div className="text-[6.5pt] text-slate-500 mt-0.5">
                DNI: {driver?.dni || '-'} | CUIL: {data.driverCuil || driver?.cuil || '-'}
              </div>
              <div className="text-[6pt] text-emerald-700 font-bold">
                Carnet Res. 960: {driver?.licenseNumber || 'HAB-SRT-960'}
              </div>
            </div>

            <div className="pl-3">
              <div className="font-black text-slate-900 leading-tight">
                {data.startHours || vehicle?.currentHours || 0} hs
              </div>
              <div className="text-[6.5pt] text-slate-500 mt-0.5 uppercase font-bold">
                Turno: <span className="text-amber-700">{data.shift || 'Mañana'}</span>
              </div>
              <div className="text-[6pt] text-slate-400">
                Fecha: {data.date || new Date().toISOString().split('T')[0]}
              </div>
            </div>

            <div className="pl-3">
              <div className="font-bold text-slate-900 leading-tight truncate">
                {data.sectorLocation || vehicle?.sectorLocation || 'Depósito Central'}
              </div>
              <div className="text-[6.5pt] text-slate-500 mt-0.5">
                Extintor: {vehicle?.fireExtinguisherNumber || 'EXT-01'}
              </div>
              <div className="text-[6pt] text-slate-400">
                Venc. Ext.: {vehicle?.fireExtinguisherExpiry || '-'}
              </div>
            </div>
          </div>
        </div>

        {/* TABLA OFICIAL DE PUNTOS DE CONTROL TÉCNICO (RES. SRT 960/15) */}
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1 pb-0.5 border-b-2 border-slate-800 avoid-break">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-3.5 bg-amber-600 rounded-xs"></div>
              <h3 className="text-[7.5pt] font-black text-slate-900 uppercase tracking-wider m-0">
                VERIFICACIÓN TÉCNICA OBLIGATORIA PRE-OPERACIONAL
              </h3>
            </div>
            <span className="text-[6.2pt] font-mono text-slate-500 font-bold">
              15 PUNTOS DE CONTROL REGISTRADOS
            </span>
          </div>

          <table 
            className="inspection-table w-full border-collapse border border-slate-300 text-[6.8pt]"
            style={{ tableLayout: 'fixed', width: '100%', boxSizing: 'border-box' }}
          >
            <colgroup>
              <col style={{ width: '4%' }} />
              <col style={{ width: '30%' }} />
              <col style={{ width: '51%' }} />
              <col style={{ width: '15%' }} />
            </colgroup>
            <thead>
              <tr className="bg-slate-900 text-white font-extrabold text-[6.5pt] uppercase tracking-wider">
                <th className="p-1 text-center border border-slate-800">#</th>
                <th className="p-1 text-left px-2 border border-slate-800">Ítem de Inspección</th>
                <th className="p-1 text-left px-2 border border-slate-800">Criterio Reglamentario de Aceptación</th>
                <th className="p-1 text-center border border-slate-800">Dictamen</th>
              </tr>
            </thead>
            <tbody>
              {DAILY_INSPECTION_ITEMS.map((item, idx) => {
                const val = responses[item.id] || 'conforme';
                const isFail = val === 'no_conforme';
                const isNa = val === 'no_aplica';

                return (
                  <tr key={item.id} className="striped-row border-b border-slate-200">
                    <td className="p-1 text-center font-bold text-slate-400 font-mono border-r border-slate-200">
                      {idx + 1}
                    </td>
                    <td className="p-1 px-2 font-bold text-slate-900 border-r border-slate-200 leading-tight">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span>{item.title}</span>
                        {item.isCritical && (
                          <span className="text-[5.5pt] px-1 py-0.2 rounded font-black uppercase bg-red-100 text-red-700 border border-red-200">
                            CRÍTICO
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-1 px-2 text-slate-600 border-r border-slate-200 leading-snug" style={{ wordBreak: 'break-word' }}>
                      {item.description}
                    </td>
                    <td className="p-1 text-center font-black">
                      {isFail ? (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[6pt] bg-rose-100 text-rose-800 border border-rose-300">
                          <AlertTriangle size={8} /> NO CONFORME
                        </span>
                      ) : isNa ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[6pt] bg-slate-100 text-slate-600">
                          • N/A
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[6pt] bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 size={8} /> CONFORME
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Observaciones del Turno */}
        <div className="avoid-break border border-slate-200 rounded-lg p-2.5 bg-slate-50/60 mb-2.5">
          <span className="text-[6pt] font-black text-slate-600 uppercase block mb-0.5 tracking-wider">
            OBSERVACIONES DEL TURNO / HALLAZGOS TÉCNICOS DETECTADOS:
          </span>
          <p className="text-[7pt] text-slate-800 leading-snug m-0 font-medium">
            {data.observations || 'Sin observaciones operativas adicionales. Se verificó el funcionamiento correcto de todos los dispositivos de seguridad activa y pasiva antes del inicio del turno.'}
          </p>
        </div>

        {/* Firmas de Responsabilidad */}
        <div className="avoid-break mt-2">
          <PdfSignatures
            compact={true}
            hideFooter={true}
            data={data}
            box1={!data.showSignatures || data.showSignatures.driver ? {
              title: 'CONDUCTOR HABILITADO',
              subtitle: (data.driverName || driver?.fullName || 'Firma de Conductor').toUpperCase(),
              signatureUrl: data.driverSignature || null,
              isProfessional: false
            } : null}
            box2={!data.showSignatures || data.showSignatures.professional ? {
              title: finalRoleTitle,
              subtitle: (data.professionalName || 'Firma y Sello').toUpperCase(),
              signatureUrl: data.professionalSignature || null,
              stampUrl: data.professionalStamp || null,
              isProfessional: true,
              license: data.professionalLicense || null
            } : null}
            box3={!data.showSignatures || data.showSignatures.supervisor ? {
              title: 'SUPERVISIÓN / RESPONSABLE PLANTA',
              subtitle: (data.supervisorName || 'Aprobación de Turno').toUpperCase(),
              signatureUrl: data.supervisorSignature || null,
              isProfessional: false
            } : null}
          />
        </div>

        <PdfBrandingFooter />

        {/* Pie de página legal */}
        <div className="w-full text-center text-[6.5pt] text-slate-400 mt-3 font-medium border-t border-slate-200 pt-1.5">
          Registro Oficial Obligatorio Res. S.R.T. N° 960/15 Art. 6 • Conservación mínima 12 meses • Generado por Asistente HYS
        </div>
      </div>
    </div>
  );
}
