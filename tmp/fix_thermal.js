const fs = require('fs');
let c = fs.readFileSync('src/pages/ThermalStress.tsx', 'utf8');

// Build old string with actual \r\n line endings that match the file
const CRLF = '\r\n';
const oldLines = [
    "                            <div style={{ padding: '2rem', textAlign: 'center' }}>",
    "                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>",
    "                                    \u00cdndice TGBH Calculado",
    "                                </div>",
    "                                <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text)', marginBottom: '1.5rem' }}>",
    "                                    {resultados.tgbh !== null ? `${resultados.tgbh}\u00b0C` : '--'}",
    "                                </div>",
    "",
    "                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.5rem', marginBottom: '2rem' }}>",
    "                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 1.5rem', background: 'var(--color-background)', borderRadius: '12px', border: '1px solid var(--color-border)' }}>",
    "                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>Carga Solar Activa:</span>",
    "                                        <span style={{ fontWeight: 800, color: formData.cargaSolar ? '#f97316' : 'var(--color-text)' }}>{formData.cargaSolar ? 'S\u00cd' : 'NO'}</span>",
    "                                    </div>",
    "                                </div>",
    "                        </div>"
];
const oldStr = oldLines.join(CRLF);

const newLines = [
    "                            <div style={{ padding: '1.5rem', textAlign: 'center' }}>",
    "                                <div style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.5rem' }}>",
    "                                    \u00cdndice TGBH Calculado",
    "                                </div>",
    "                                <div style={{ fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: 'var(--color-text)', marginBottom: '1.2rem' }}>",
    "                                    {resultados.tgbh !== null ? `${resultados.tgbh}\u00b0C` : '--'}",
    "                                </div>",
    "                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>",
    "                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem', background: 'rgba(245,158,11,0.08)', borderRadius: '10px', border: '1px solid rgba(245,158,11,0.2)' }}>",
    "                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#d97706', marginBottom: '0.2rem' }}>VLA (Acci\u00f3n)</span>",
    "                                        <span style={{ fontWeight: 900, color: '#d97706' }}>{resultados.vla !== null ? `${resultados.vla}\u00b0C` : '--'}</span>",
    "                                    </div>",
    "                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0.6rem', background: 'rgba(239,68,68,0.08)', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>",
    "                                        <span style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: '#dc2626', marginBottom: '0.2rem' }}>VLE (L\u00edmite)</span>",
    "                                        <span style={{ fontWeight: 900, color: '#dc2626' }}>{resultados.vle !== null ? `${resultados.vle}\u00b0C` : '--'}</span>",
    "                                    </div>",
    "                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0.8rem', background: 'var(--color-background)', borderRadius: '10px', border: '1px solid var(--color-border)', gridColumn: '1 / -1' }}>",
    "                                        <span style={{ color: 'var(--color-text-muted)', fontWeight: 600, fontSize: '0.82rem' }}>Carga Solar:</span>",
    "                                        <span style={{ fontWeight: 800, color: formData.cargaSolar ? '#f97316' : 'var(--color-text)', fontSize: '0.82rem' }}>{formData.cargaSolar ? 'S\u00cd' : 'NO'}</span>",
    "                                    </div>",
    "                                </div>",
    "                                {resultados.admisible !== null ? (",
    "                                    <div style={{",
    "                                        padding: '1.2rem', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.8rem',",
    "                                        background: !resultados.admisible ? 'rgba(239,68,68,0.1)' : (resultados.enVLA ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)'),",
    "                                        color: !resultados.admisible ? '#dc2626' : (resultados.enVLA ? '#d97706' : '#059669'),",
    "                                        border: `2px solid ${!resultados.admisible ? '#ef4444' : (resultados.enVLA ? '#f59e0b' : '#10b981')}`",
    "                                    }}>",
    "                                        {!resultados.admisible ? <TriangleAlert size={28} /> : (resultados.enVLA ? <Info size={28} /> : <CheckCircle2 size={28} />)}",
    "                                        <div style={{ textAlign: 'left' }}>",
    "                                            <div style={{ fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase' }}>",
    "                                                {!resultados.admisible ? 'RIESGO T\u00c9RMICO' : (resultados.enVLA ? 'ZONA DE ALERTA' : 'ADMISIBLE')}",
    "                                            </div>",
    "                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, opacity: 0.9 }}>",
    "                                                {!resultados.admisible ? 'Supera VLE. Rotaci\u00f3n urgente (Res. 30/2023).' : (resultados.enVLA ? 'Supera VLA: monitoreo personal obligatorio.' : 'Bajo VLA. Condici\u00f3n segura.')}",
    "                                            </div>",
    "                                        </div>",
    "                                    </div>",
    "                                ) : (",
    "                                    <div style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-background)', color: 'var(--color-text-muted)', border: '1px dashed var(--color-border)' }}>",
    "                                        <Info size={24} style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />",
    "                                        <p style={{ margin: 0, fontSize: '0.85rem' }}>Ingres\u00e1 temperaturas de globo y bulbo h\u00famedo.</p>",
    "                                    </div>",
    "                                )}",
    "                                {!formData.aclimatado && resultados.tgbh !== null && (",
    "                                    <div style={{ marginTop: '0.8rem', padding: '0.7rem 1rem', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '12px', textAlign: 'left' }}>",
    "                                        <div style={{ fontSize: '0.7rem', fontWeight: 900, color: '#d97706', marginBottom: '0.25rem' }}>\u26a0\ufe0f ACLIMATACI\u00d3N PENDIENTE (Res. 30/2023)</div>",
    "                                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Plan progresivo de 5-14 d\u00edas antes de exposici\u00f3n total al calor.</p>",
    "                                    </div>",
    "                                )}",
    "                            </div>",
    "                        </div>"
];
const newStr = newLines.join(CRLF);

console.log('Found old pattern:', c.includes(oldStr));
if (c.includes(oldStr)) {
    c = c.replace(oldStr, newStr);
    fs.writeFileSync('src/pages/ThermalStress.tsx', c, 'utf8');
    console.log('File updated successfully!');
} else {
    // Debug: show lines 343-357 raw
    const lines = c.split('\n');
    console.log('Lines 343-357:');
    lines.slice(343, 357).forEach((l, i) => {
        console.log((i+344) + ': ' + JSON.stringify(l));
    });
}
