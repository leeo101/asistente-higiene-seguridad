import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Sparkles, ShieldCheck, Info } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { saveValue } from '../services/cloudSync';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

export default function LogoSettings(): React.ReactElement | null {
    const navigate = useNavigate();
    const { isPro } = usePaywall();
    const { currentUser } = useAuth();
    useDocumentTitle('Logo de Empresa');
    
    const [logo, setLogo] = useState(null);
    const [showLogo, setShowLogo] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        const savedLogo = localStorage.getItem('companyLogo');
        const savedShowLogo = localStorage.getItem('showCompanyLogo');
        if (savedLogo) setLogo(savedLogo);
        if (savedShowLogo !== null) setShowLogo(savedShowLogo === 'true');
    }, []);

    const handleFileChange = (file) => {
        if (!file) return;
        setIsUploading(true);

        if (!file.type.startsWith('image/')) {
            toast.error('Por favor subí una imagen válida (PNG, JPG, SVG)');
            setIsUploading(false);
            return;
        }

        if (file.size > 500 * 1024) {
            toast.error('La imagen debe pesar menos de 500KB');
            setIsUploading(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target!.result as string;
            setLogo(base64);
            localStorage.setItem('companyLogo', base64);
            if (currentUser?.uid) {
                saveValue(currentUser.uid, 'companyLogo', base64);
            }
            setIsUploading(false);
            toast.success('✅ Logo guardado exitosamente. Se aplicará a todos tus PDFs.');
        };
        reader.onerror = () => {
            toast.error('Error al leer la imagen');
            setIsUploading(false);
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileChange(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = () => {
        setDragActive(false);
    };

    const removeLogo = () => {
        setLogo(null);
        localStorage.removeItem('companyLogo');
        if (currentUser?.uid) {
            saveValue(currentUser.uid, 'companyLogo', null);
        }
        toast.success('Logo eliminado');
    };

    const toggleShowLogo = () => {
        const newValue = !showLogo;
        setShowLogo(newValue);
        localStorage.setItem('showCompanyLogo', String(newValue));
        if (currentUser?.uid) {
            saveValue(currentUser.uid, 'showCompanyLogo', newValue);
        }
        toast.success(newValue ? 'Logo activado en PDFs' : 'Logo desactivado en PDFs');
    };

    return (
        <div className="container" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <button 
                    onClick={() => navigate(-1)} 
                    style={{ 
                        padding: '0.6rem', 
                        background: 'var(--color-surface)', 
                        border: '1px solid var(--color-border)', 
                        borderRadius: '12px',
                        cursor: 'pointer', 
                        color: 'var(--color-text)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Logo de Empresa</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem', fontWeight: 500 }}>Personalizá tus reportes profesionales</p>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }}>
                {/* Main Card */}
                <div className="card" style={{ padding: '2rem', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(37,99,235,0.03)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(37,99,235,0.02)', pointerEvents: 'none' }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                        <div style={{ 
                            width: '48px', height: '48px', 
                            background: 'var(--gradient-premium)', 
                            borderRadius: '14px', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            color: 'white', boxShadow: '0 8px 16px rgba(37,99,235,0.2)' 
                        }}>
                            <ImageIcon size={24} />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Identidad Visual</h2>
                            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>Cargá el logo que aparecerá en el encabezado de todos tus documentos.</p>
                        </div>
                    </div>

                    {logo ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '2rem',
                                background: 'var(--color-background)',
                                padding: '1.5rem',
                                borderRadius: '20px',
                                border: '1px solid var(--color-border)',
                                boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.02)',
                                flexWrap: 'wrap'
                            }}>
                                <div style={{ 
                                    width: '140px', 
                                    height: '140px', 
                                    background: 'white', 
                                    border: '1px solid var(--color-border)', 
                                    borderRadius: '16px', 
                                    padding: '12px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                                    flexShrink: 0
                                }}>
                                    <img src={logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                </div>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', marginBottom: '0.5rem' }}>
                                        <CheckCircle size={18} />
                                        <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>Logo Configurado</span>
                                    </div>
                                    <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
                                        Tu logo está listo. Se incluirá automáticamente en la esquina superior derecha de cada PDF que generes con la plataforma.
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.8rem' }}>
                                        <button 
                                            onClick={() => document.getElementById('logo-file-input').click()} 
                                            style={{ 
                                                padding: '0.6rem 1.2rem', 
                                                background: 'var(--color-primary)', 
                                                color: 'white', 
                                                border: 'none', 
                                                borderRadius: '10px', 
                                                fontSize: '0.85rem', 
                                                fontWeight: 800, 
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Upload size={16} /> Cambiar
                                        </button>
                                        <button 
                                            onClick={removeLogo} 
                                            style={{ 
                                                padding: '0.6rem 1.2rem', 
                                                background: 'rgba(239,68,68,0.08)', 
                                                color: '#ef4444', 
                                                border: '1px solid rgba(239,68,68,0.2)', 
                                                borderRadius: '10px', 
                                                fontSize: '0.85rem', 
                                                fontWeight: 700, 
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                background: showLogo ? 'rgba(16,185,129,0.05)' : 'rgba(156,163,175,0.05)', 
                                padding: '1.2rem 1.5rem', 
                                borderRadius: '16px', 
                                border: `1px solid ${showLogo ? 'rgba(16,185,129,0.2)' : 'rgba(156,163,175,0.2)'}`,
                                transition: 'all 0.3s'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                    <div style={{ 
                                        width: '40px', height: '40px', 
                                        background: showLogo ? 'rgba(16,185,129,0.1)' : 'rgba(156,163,175,0.1)', 
                                        borderRadius: '50%', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center' 
                                    }}>
                                        {showLogo ? <ShieldCheck size={20} color="#10b981" /> : <X size={20} color="#9ca3af" />}
                                    </div>
                                    <div>
                                        <span style={{ display: 'block', fontWeight: 800, fontSize: '1rem', color: showLogo ? '#059669' : '#4b5563' }}>
                                            {showLogo ? 'Visible en todos los PDFs' : 'Oculto en los PDFs'}
                                        </span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            Usá este interruptor para mostrar u ocultar el logo globalmente.
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleShowLogo}
                                    style={{
                                        width: '56px', height: '30px', borderRadius: '30px', border: 'none',
                                        background: showLogo ? '#10b981' : '#9ca3af',
                                        position: 'relative', cursor: 'pointer', transition: 'all 0.3s',
                                        boxShadow: showLogo ? '0 0 15px rgba(16,185,129,0.3)' : 'none'
                                    }}
                                >
                                    <div style={{ 
                                        width: '22px', height: '22px', background: 'white', borderRadius: '50%', 
                                        position: 'absolute', top: '4px', left: showLogo ? '30px' : '4px', 
                                        transition: 'all 0.3s cubic-bezier(0.18, 0.89, 0.32, 1.28)', 
                                        boxShadow: '0 2px 5px rgba(0,0,0,0.2)' 
                                    }} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onClick={() => document.getElementById('logo-file-input').click()}
                            style={{ 
                                width: '100%', 
                                padding: '4rem 2rem', 
                                border: `3px dashed ${dragActive ? 'var(--color-primary)' : 'rgba(37,99,235,0.15)'}`, 
                                background: dragActive ? 'rgba(37,99,235,0.05)' : 'rgba(37,99,235,0.01)', 
                                borderRadius: '24px', 
                                color: 'var(--color-primary)', 
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '1rem'
                            }}
                            onMouseOver={e => { if(!dragActive) { e.currentTarget.style.background = 'rgba(37,99,235,0.03)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.3)'; } }}
                            onMouseOut={e => { if(!dragActive) { e.currentTarget.style.background = 'rgba(37,99,235,0.01)'; e.currentTarget.style.borderColor = 'rgba(37,99,235,0.15)'; } }}
                        >
                            <div style={{ 
                                width: '70px', height: '70px', 
                                background: 'rgba(37,99,235,0.1)', 
                                borderRadius: '50%', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                marginBottom: '0.5rem'
                            }}>
                                <Upload size={32} />
                            </div>
                            <div>
                                <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', fontWeight: 800 }}>Arrastrá tu logo acá</h3>
                                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>O hacé clic para seleccionar un archivo de tu equipo</p>
                                <p style={{ marginTop: '1rem', fontSize: '0.75rem', background: 'var(--color-surface)', padding: '0.4rem 1rem', borderRadius: '20px', display: 'inline-block', border: '1px solid var(--color-border)' }}>PNG, JPG o SVG - Máximo 500KB</p>
                            </div>
                        </div>
                    )}
                    <input id="logo-file-input" type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} style={{ display: 'none' }} />
                </div>

                {/* Info Box */}
                <div style={{ 
                    display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' 
                }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <Info size={20} />
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>Impacto en Reportes</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            El logo se insertará en la cabecera de todos los documentos generados, incluyendo ATS, Investigaciones, Mapas de Riesgo y más. Asegurate de que el logo tenga un fondo transparente para un resultado óptimo.
                        </p>
                    </div>

                    <div className="card" style={{ 
                        padding: '1.5rem', 
                        background: isPro ? 'rgba(16,185,129,0.04)' : 'rgba(251,191,36,0.06)',
                        border: `1px solid ${isPro ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.15)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: isPro ? '#10b981' : '#f59e0b' }}>
                            <Sparkles size={20} />
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800 }}>{isPro ? 'Beneficio PRO Activado' : 'Función Exclusiva PRO'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                            {isPro 
                                ? 'Como usuario PRO, tenés habilitada la personalización completa. Tu logo aparecerá en alta calidad en todas las descargas.' 
                                : 'La personalización de reportes con logo propio es una característica premium. Subilo ahora para ver cómo queda y activá PRO cuando estés listo.'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
