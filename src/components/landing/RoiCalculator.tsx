import React, { useState } from 'react';
import { TrendUp, Clock, CurrencyDollar } from '@phosphor-icons/react';

export default function RoiCalculator() {
    const [reportsPerWeek, setReportsPerWeek] = useState(15);
    
    // Assuming each manual report takes 45 mins, and AI takes 5 mins.
    // Savings = 40 mins per report.
    const savedMinutesPerWeek = reportsPerWeek * 40;
    const savedHoursPerMonth = Math.round((savedMinutesPerWeek * 4) / 60);
    const savedMoney = savedHoursPerMonth * 15; // Assuming $15/hr value for a professional

    return (
        <div style={{ padding: '4rem 1.2rem', background: '#020617', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: '800px', margin: '0 auto', background: 'rgba(255,255,255,0.02)', borderRadius: '32px', border: '1px solid rgba(255,255,255,0.05)', padding: 'clamp(2rem, 5vw, 4rem)', position: 'relative', overflow: 'hidden' }}>
                
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '300px', height: '100px', background: 'radial-gradient(ellipse, rgba(52, 211, 153, 0.15) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none' }} />

                <div style={{ textAlign: 'center', marginBottom: '3rem', position: 'relative', zIndex: 1 }}>
                    <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 900, color: 'white', margin: '0 0 1rem', fontFamily: 'var(--font-heading)' }}>
                        Calcula tu <span style={{ color: '#34d399' }}>Ahorro Real</span>
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.1rem', margin: 0, maxWidth: '500px', marginInline: 'auto' }}>
                        Descubre cuánto tiempo (y dinero) te ahorrarás automatizando tu papelería de obra.
                    </p>
                </div>

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'flex-end' }}>
                        <label style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>Informes / ATS por semana</label>
                        <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>{reportsPerWeek}</span>
                    </div>

                    <input 
                        type="range" 
                        aria-label="Cantidad de informes o ATS por semana" 
                        min="1" 
                        max="50" 
                        value={reportsPerWeek} 
                        onChange={(e) => setReportsPerWeek(parseInt(e.target.value))}
                        style={{
                            width: '100%',
                            appearance: 'none',
                            height: '8px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '4px',
                            outline: 'none',
                            marginBottom: '3rem',
                            cursor: 'pointer'
                        }}
                    />
                    <style>{`
                        input[type=range]::-webkit-slider-thumb {
                            appearance: none;
                            width: 28px;
                            height: 28px;
                            border-radius: 50%;
                            background: #34d399;
                            cursor: pointer;
                            box-shadow: 0 0 20px rgba(52, 211, 153, 0.5);
                            border: 3px solid #020617;
                        }
                    `}</style>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                        <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center' }}>
                            <Clock size={32} color="#34d399" weight="duotone" style={{ margin: '0 auto 1rem' }} />
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Tiempo Ahorrado</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>{savedHoursPerMonth} <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>hrs/mes</span></div>
                        </div>

                        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: '20px', padding: '1.5rem', textAlign: 'center' }}>
                            <CurrencyDollar size={32} color="#60a5fa" weight="duotone" style={{ margin: '0 auto 1rem' }} />
                            <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Valor Generado</div>
                            <div style={{ fontSize: '2rem', fontWeight: 900, color: 'white' }}>${savedMoney} <span style={{ fontSize: '1.2rem', color: 'rgba(255,255,255,0.5)' }}>/mes</span></div>
                        </div>
                    </div>
                    
                    <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0 }}>
                            <TrendUp size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.3rem' }} />
                            Con este volumen, la suscripción se paga sola en el primer día de uso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
