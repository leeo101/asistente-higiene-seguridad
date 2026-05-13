import React from 'react';
import { ShieldCheck, Wind, AlertTriangle, Activity, Clock, MapPin, Building2, Calendar, User } from 'lucide-react';
import CompanyLogo from './CompanyLogo';
import PdfBrandingFooter from './PdfBrandingFooter';

export default function ConfinedSpacePdf({ data }: { data: any }): React.ReactElement | null {
    if (!data) return null;

    const gasReadings = data.gasMonitoring || { o2: '', lel: '', co: '', h2s: '', time: '' };

    // ObtenciÃ³n segura de firma profesional desde localStorage
    let actSignature = data.professionalSignature || data.signature || null;
    let actName = data.professionalName || null;
    let actLic = data.professionalLicense || data.license || null;

    if (!actSignature) {
        try {
            const lsPersonal = localStorage.getItem('personalData');
            const lsStamp = localStorage.getItem('signatureStampData');
            const legacySig = localStorage.getItem('capturedSignature');
            if (lsStamp) { actSignature = JSON.parse(lsStamp).signature; }
            else if (legacySig) { actSignature = legacySig; }
            if (lsPersonal) {
                const pd = JSON.parse(lsPersonal);
                actName = actName || pd.name;
                actLic = actLic || pd.license;
            }
        } catch (e) { }
    }

    // Chequeo de valores crÃ­ticos de gas
    const o2Val = parseFloat(gasReadings.o2);
    const lelVal = parseFloat(gasReadings.lel);
    const coVal = parseFloat(gasReadings.co);
    const h2sVal = parseFloat(gasReadings.h2s);
    const hasGasAlert =
        (!isNaN(o2Val) && (o2Val < 19.5 || o2Val > 23.5)) ||
        (!isNaN(lelVal) && lelVal >= 10) ||
        (!isNaN(coVal) && coVal >= 25) ||
        (!isNaN(h2sVal) && h2sVal >= 10);

    const getGasColor = (param: string, val: string) => {
        const v = parseFloat(val);
        if (isNaN(v)) return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
        if (param === 'o2') return (v >= 19.5 && v <= 23.5) ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
        if (param === 'lel') return v < 10 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
        if (param === 'co') return v < 25 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
        if (param === 'h2s') return v < 10 ? { bg: '#f0fdf4', color: '#15803d', border: '#86efac' } : { bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' };
        return { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' };
    };

    const ventilationText = typeof data.ventilation === 'object' && data.ventilation !== null
        ? Object.entries(data.ventilation).filter(([_, v]) => v).map(([k]) =>
            k === 'forced' ? 'Forzada' : k === 'natural' ? 'Natural' : 'Extractiva'
          ).join(', ') || 'No especificada'
        : data.ventilation || 'No especificada';

    return (
        <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <div
                id="pdf-content"
                className="pdf-container print-area"
                style={{
                    width: '100%', maxWidth: '210mm', minHeight: '297mm',
                    padding: '12mm 15mm', background: '#ffffff', color: '#1e293b',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.1)', borderRadius: '8px',
                    boxSizing: 'border-box', margin: '0 auto', fontSize: '9pt',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    borderTop: hasGasAlert ? '12px solid #dc2626' : '12px solid #f59e0b'
                }}
            >
                <style type="text/css" media="print">
                    {`
                        @page { size: A4 portrait; margin: 10mm; }
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; font-family: Helvetica, Arial, sans-serif; }
                        .no-print { display: none !important; }
                        .print-area {
                            box-shadow: none !important; margin: 0 !important; padding: 5mm !important;
                            width: 100% !important; max-width: none !important;
                            border-top: ${hasGasAlert ? '12px solid #dc2626' : '12px solid #f59e0b'} !important;
                            border-radius: 0 !important; min-height: auto !important; height: auto !important;
                        }
                    `}
                </style>

                {/* Header Tripartito */}
                <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px solid #e2e8f0', paddingBottom: '1.2rem', marginBottom: '1.5rem', width: '100%' }}>
                    <div style={{ flex: 1, textAlign: 'left' }}>
                        <p style={{ margin: 0, fontWeight: 800, fontSize: '0.65rem', textTransform: 'uppercase', color: '#64748b', letterSpacing: '0.08em' }}>Sistema de GestiÃ³n HSE</p>
                        <p style={{ margin: 0, fontWeight: 900, fontSize: '0.8rem', textTransform: 'uppercase', color: hasGasAlert ? '#dc2626' : '#d97706' }}>
                            {hasGasAlert ? 'âš  ALERTA: ATMÃ“SFERA PELIGROSA' : 'Permiso de Trabajo Especial'}
                        </p>
                    </div>

                    <div style={{ flex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                        <h1 style={{ margin: 0, fontWeight: 900, fontSize: '1.8rem', letterSpacing: '-0.02em', textTransform: 'uppercase', lineHeight: 1, color: '#0f172a' }}>ESPACIO CONFINADO</h1>
                        <div style={{ marginTop: '0.3rem', background: hasGasAlert ? '#dc2626' : '#f59e0b', color: 'white', padding: '0.2rem 0.8rem', borderRadius: '12px', fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em' }}>
                            PERMISO DE INGRESO â€” RES. SRT 95/03
                        </div>
                    </div>

                    <div style={{ flex: 1, textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem' }}>
                        <CompanyLogo style={{ height: '38px', width: 'auto', objectFit: 'contain', maxWidth: '120px' }} />
                    </div>
                </div>

                {/* IdentificaciÃ³n del Espacio */}
                <div style={{ border: hasGasAlert ? '1.5px solid #fca5a5' : '1px solid #fde68a', borderRadius: '6px', marginBottom: '1.5rem', overflow: 'hidden' }}>
                    <div style={{ padding: '1rem', background: hasGasAlert ? '#fef2f2' : '#fffbeb', borderBottom: hasGasAlert ? '1px solid #fca5a5' : '1px solid #fde68a' }}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, color: hasGasAlert ? '#dc2626' : '#d97706', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            IDENTIFICACIÃ“N DEL ESPACIO CONFINADO
                        </span>
                        <div style={{ fontWeight: 900, fontSize: '1.3rem', color: '#0f172a', marginTop: '0.3rem' }}>{data.spaceName || 'No especificado'}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', background: '#ffffff' }}>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MapPin size={12}/> UBICACIÃ“N / SECTOR</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.location || 'No especificada'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem', borderRight: '1px solid #e2e8f0' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Calendar size={12}/> FECHA</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.createdAt ? new Date(data.createdAt).toLocaleDateString('es-AR') : 'N/A'}</div>
                        </div>
                        <div style={{ padding: '0.75rem 1rem' }}>
                            <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><Clock size={12}/> DURACIÃ“N ESTIMADA</span>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#334155', marginTop: '0.2rem' }}>{data.duration || 'N/A'}</div>
                        </div>
                    </div>
                </div>

                {/* Monitoreo AtmosfÃ©rico */}
                <div style={{ marginBottom: '1.5rem', border: hasGasAlert ? '1.5px solid #fca5a5' : '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                    <div style={{ background: '#1e293b', padding: '0.6rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Activity size={16} color="#fff" />
                        <span style={{ fontWeight: 900, fontSize: '0.78rem', color: '#ffffff', textTransform: 'uppercase', letterSpacing: '0.04em' }}>MONITOREO ATMOSFÃ‰RICO OBLIGATORIO</span>
                        {hasGasAlert && (
                            <span style={{ marginLeft: 'auto', background: '#dc2626', color: '#fff', padding: '0.15rem 0.6rem', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 900 }}>âš  FUERA DE LÃMITES</span>
                        )}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', background: '#ffffff' }}>
                        {[
                            { key: 'o2', label: 'Oâ‚‚', unit: '%', val: gasReadings.o2, limit: '19.5 â€“ 23.5%' },
                            { key: 'lel', label: 'LEL', unit: '%', val: gasReadings.lel, limit: '< 10%' },
                            { key: 'co', label: 'CO', unit: 'ppm', val: gasReadings.co, limit: '< 25 ppm' },
                            { key: 'h2s', label: 'Hâ‚‚S', unit: 'ppm', val: gasReadings.h2s, limit: '< 10 ppm' },
                            { key: 'time', label: 'HORA', unit: '', val: gasReadings.time, limit: '' },
                        ].map((gas, idx) => {
                            const colors = gas.key !== 'time' ? getGasColor(gas.key, gas.val) : { bg: '#f8fafc', color: '#334155', border: '#e2e8f0' };
                            return (
                                <div key={gas.key} style={{ padding: '0.75rem 0.5rem', background: colors.bg, borderRight: idx < 4 ? '1px solid #e2e8f0' : 'none', textAlign: 'center', border: `1px solid ${colors.border}`, margin: '0.3rem', borderRadius: '6px' }}>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', display: 'block' }}>{gas.label}</span>
                                    <span style={{ fontSize: '1.4rem', fontWeight: 900, color: colors.color, display: 'block', lineHeight: 1.2 }}>{gas.val || '--'}</span>
                                    <span style={{ fontSize: '0.6rem', fontWeight: 700, color: '#94a3b8', display: 'block' }}>{gas.unit}</span>
                                    {gas.limit && <span style={{ fontSize: '0.55rem', color: '#94a3b8', display: 'block', marginTop: '0.2rem' }}>LÃ­m: {gas.limit}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* VentilaciÃ³n y Peligros */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ border: '1px solid #bfdbfe', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#1e40af', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <Wind size={15} color="#fff" />
                            <span style={{ fontWeight: 900, fontSize: '0.72rem', color: '#fff', textTransform: 'uppercase' }}>VENTILACIÃ“N</span>
                        </div>
                        <div style={{ padding: '0.8rem', background: '#eff6ff', fontSize: '0.85rem', fontWeight: 700, color: '#1e40af', minHeight: '50px' }}>
                            {ventilationText}
                        </div>
                    </div>

                    <div style={{ border: '1px solid #fca5a5', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#991b1b', padding: '0.5rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            <AlertTriangle size={15} color="#fff" />
                            <span style={{ fontWeight: 900, fontSize: '0.72rem', color: '#fff', textTransform: 'uppercase' }}>PELIGROS DETECTADOS</span>
                        </div>
                        <div style={{ padding: '0.8rem', background: '#fef2f2', display: 'flex', flexWrap: 'wrap', gap: '0.3rem', minHeight: '50px' }}>
                            {data.hazards?.length > 0 ? data.hazards.map((p, i) => (
                                <span key={i} style={{ background: '#fee2e2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700 }}>{p}</span>
                            )) : <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 600 }}>Ninguno identificado</span>}
                        </div>
                    </div>
                </div>

                {/* Observaciones */}
                {data.observations && (
                    <div style={{ marginBottom: '1.5rem', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{ background: '#334155', color: '#fff', padding: '0.5rem 1rem', fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            OBSERVACIONES Y CONCLUSIONES DEL INSPECTOR
                        </div>
                        <div style={{ padding: '0.8rem 1rem', fontSize: '0.85rem', color: '#334155', fontWeight: 600, lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#f8fafc' }}>
                            {data.observations}
                        </div>
                    </div>
                )}

                {/* Nota legal */}
                <div style={{ marginBottom: '1.5rem', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '6px', padding: '0.7rem 1rem', display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                    <AlertTriangle size={16} color="#d97706" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                    <p style={{ margin: 0, fontSize: '0.72rem', color: '#92400e', fontWeight: 700, lineHeight: 1.5 }}>
                        <strong>AVISO LEGAL:</strong> SegÃºn Res. SRT 95/03 â€” Anexo I. Este permiso es de validez Ãºnica por ingreso y caduca al finalizar el turno, al detectarse condiciones atmosfÃ©ricas fuera de lÃ­mite, o ante cualquier situaciÃ³n de emergencia. Prohibido el ingreso sin autorizaciÃ³n firmada.
                    </p>
                </div>

                {/* Firmas */}
        <div className="signature-container-row" style={{ marginTop: 'auto', paddingTop: '1.5rem', borderTop: '2px dashed #cbd5e1' }}>
          <div className="signature-item-box">
            <div className="signature-line" />
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>VIGÃA DE SEGURIDAD</p>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>Control y monitoreo continuo</p>
          </div>
          <div className="signature-item-box">
            <div className="signature-line" />
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>TRABAJADOR ENTRANTE</p>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>AceptaciÃ³n de condiciones</p>
          </div>
          <div className="signature-item-box">
            {actLic ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.5rem' }}>
                <img src={actLic} alt="Firma Autorizante" style={{ maxHeight: '50px', maxWidth: '100%', objectFit: 'contain' }} />
              </div>
            ) : null}
            <div className="signature-line" />
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.08em' }}>AUTORIZANTE / PROFESIONAL HSE</p>
            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: '#0f172a' }}>{actName || 'Especialista H&S'}</p>
            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>Mat: {actLic}</p>
          </div>
        </div>

                <PdfBrandingFooter />
            </div>
        </div>
    );
}
