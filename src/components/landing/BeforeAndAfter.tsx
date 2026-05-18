import React from 'react';
import { FileX, MicrosoftExcelLogo, Clock, Checks, ShieldCheck, Sparkle as Sparkles, MagicWand, FilePdf } from '@phosphor-icons/react';

export default function BeforeAndAfter() {
    return (
        <div style={{ padding: '5rem 1.2rem', background: '#020617', position: 'relative', overflow: 'hidden' }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
                <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 1rem', background: 'rgba(168, 85, 247, 0.1)', border: '1px solid rgba(168, 85, 247, 0.2)', borderRadius: '100px', marginBottom: '1rem' }}>
                        <MagicWand size={16} color="#c084fc" />
                        <span style={{ color: '#c084fc', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>El problema de la industria</span>
                    </div>
                    <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, fontFamily: 'var(--font-heading)' }}>
                        Hacer prevención no debería <br/><span style={{ color: 'rgba(255,255,255,0.4)' }}>ser un trabajo burocrático.</span>
                    </h2>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                    
                    {/* El Pasado */}
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.03)', 
                        border: '1px solid rgba(239, 68, 68, 0.1)', 
                        borderRadius: '24px', 
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#ef4444' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#f87171', margin: 0 }}>El Pasado</h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                                <MicrosoftExcelLogo size={24} color="#f87171" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Planillas de Excel desactualizadas</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                                <FileX size={24} color="#f87171" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Pérdida de documentos y firmas</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.6)' }}>
                                <Clock size={24} color="#f87171" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 500 }}>Horas de escritorio redactando</span>
                            </div>
                        </div>

                        <div style={{ 
                            marginTop: 'auto',
                            padding: '1.5rem', 
                            background: 'rgba(0,0,0,0.3)', 
                            borderRadius: '16px',
                            border: '1px dashed rgba(239, 68, 68, 0.2)',
                            color: 'rgba(255,255,255,0.4)',
                            fontSize: '0.9rem',
                            textAlign: 'center',
                            fontWeight: 600
                        }}>
                            ❌ 2-3 horas perdidas al día
                        </div>
                    </div>

                    {/* El Futuro */}
                    <div style={{ 
                        background: 'linear-gradient(180deg, rgba(59, 130, 246, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)', 
                        borderRadius: '24px', 
                        padding: '2rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1.5rem',
                        position: 'relative',
                        overflow: 'hidden',
                        boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.1)'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #3b82f6, #a855f7)' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            Con Asistente H&S <Sparkles color="#60a5fa" weight="fill" />
                        </h3>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                                <Sparkles size={24} color="#60a5fa" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>IA que redacta por ti en segundos</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                                <FilePdf size={24} color="#60a5fa" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>PDFs hermosos con firmas integradas</span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: 'rgba(255,255,255,0.9)' }}>
                                <ShieldCheck size={24} color="#60a5fa" weight="duotone" />
                                <span style={{ fontSize: '1rem', fontWeight: 600 }}>Cumplimiento normativo automático</span>
                            </div>
                        </div>

                        <div style={{ 
                            marginTop: 'auto',
                            padding: '1.5rem', 
                            background: 'linear-gradient(135deg, #1e40af, #6b21a8)', 
                            borderRadius: '16px',
                            color: 'white',
                            fontSize: '1rem',
                            textAlign: 'center',
                            fontWeight: 800,
                            boxShadow: '0 10px 20px -5px rgba(0,0,0,0.5)'
                        }}>
                            ✅ Todo desde el celular en la obra
                        </div>
                    </div>

                </div>
            </div>
            
            {/* Glow effects */}
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(59,130,246,0.05) 0%, rgba(0,0,0,0) 70%)', pointerEvents: 'none', zIndex: 0 }} />
        </div>
    );
}
