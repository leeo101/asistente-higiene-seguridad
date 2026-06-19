import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, Image as ImageIcon, Sparkles, ShieldCheck, Info, RefreshCw, Palette } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { saveValue, listenToValue } from '../services/cloudSync';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PRESET_PALETTES = [
    { name: 'Océano', primary: '#3B82F6', secondary: '#10B981' },
    { name: 'Seguridad', primary: '#EF4444', secondary: '#F59E0B' },
    { name: 'Industrial', primary: '#059669', secondary: '#0EA5E9' },
    { name: 'Alerta', primary: '#F97316', secondary: '#8B5CF6' },
    { name: 'Profesional', primary: '#8B5CF6', secondary: '#06B6D4' },
    { name: 'Acero', primary: '#475569', secondary: '#38BDF8' },
];

export default function LogoSettings(): React.ReactElement | null {
    const navigate = useNavigate();
    const { isPro } = usePaywall();
    const { currentUser } = useAuth();
    useDocumentTitle('Identidad Visual');

    const [logo, setLogo] = useState<string | null>(null);
    const [showLogo, setShowLogo] = useState(true);
    const [primaryColor, setPrimaryColor] = useState('#3B82F6');
    const [secondaryColor, setSecondaryColor] = useState('#10B981');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const savedLogo = localStorage.getItem('companyLogo');
        const savedShowLogo = localStorage.getItem('showCompanyLogo');
        const savedPrimaryColor = localStorage.getItem('primaryColor');
        const savedSecondaryColor = localStorage.getItem('secondaryColor');

        if (savedLogo && savedLogo !== 'null' && savedLogo !== 'undefined') setLogo(savedLogo);
        if (savedShowLogo !== null) setShowLogo(savedShowLogo === 'true');
        if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
        if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);

        if (currentUser?.uid) {
            const unsubscribeLogo = listenToValue<string>(currentUser.uid, 'companyLogo', (val) => {
                if (val && val !== 'null' && val !== 'undefined') {
                    setLogo(val);
                    localStorage.setItem('companyLogo', val);
                } else {
                    setLogo(null);
                    localStorage.removeItem('companyLogo');
                }
            });
            const unsubscribeShow = listenToValue<boolean>(currentUser.uid, 'showCompanyLogo', (val) => {
                const normalized = val === null ? true : val;
                setShowLogo(normalized);
                localStorage.setItem('showCompanyLogo', String(normalized));
            });
            const unsubscribePrimary = listenToValue<string>(currentUser.uid, 'primaryColor', (val) => {
                if (val) { setPrimaryColor(val); localStorage.setItem('primaryColor', val); }
            });
            const unsubscribeSecondary = listenToValue<string>(currentUser.uid, 'secondaryColor', (val) => {
                if (val) { setSecondaryColor(val); localStorage.setItem('secondaryColor', val); }
            });
            return () => { unsubscribeLogo(); unsubscribeShow(); unsubscribePrimary(); unsubscribeSecondary(); };
        }
    }, [currentUser]);

    const handleFileChange = (file: File | undefined) => {
        if (!file) return;
        setIsUploading(true);
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor subí una imagen válida (PNG, JPG, SVG)');
            setIsUploading(false); return;
        }
        if (file.size > 1024 * 1024) {
            toast.error('La imagen debe pesar menos de 1MB');
            setIsUploading(false); return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target!.result as string;
            setLogo(base64);
            localStorage.setItem('companyLogo', base64);
            if (currentUser?.uid) saveValue(currentUser.uid, 'companyLogo', base64);
            setIsUploading(false);
            toast.success('Logo guardado exitosamente.');
        };
        reader.onerror = () => { toast.error('Error al leer la imagen'); setIsUploading(false); };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
    const handleDragLeave = () => setDragActive(false);

    const removeLogo = () => {
        setLogo(null); localStorage.removeItem('companyLogo');
        if (currentUser?.uid) saveValue(currentUser.uid, 'companyLogo', null);
        toast.success('Logo eliminado');
    };

    const toggleShowLogo = () => {
        const newValue = !showLogo; setShowLogo(newValue);
        localStorage.setItem('showCompanyLogo', String(newValue));
        if (currentUser?.uid) saveValue(currentUser.uid, 'showCompanyLogo', newValue);
        toast.success(newValue ? 'Logo activado en PDFs' : 'Logo desactivado en PDFs');
    };

    const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
        if (type === 'primary') {
            setPrimaryColor(value); localStorage.setItem('primaryColor', value);
            if (currentUser?.uid) saveValue(currentUser.uid, 'primaryColor', value);
        } else {
            setSecondaryColor(value); localStorage.setItem('secondaryColor', value);
            if (currentUser?.uid) saveValue(currentUser.uid, 'secondaryColor', value);
        }
    };

    const resetColors = () => {
        const defPrimary = '#3B82F6'; const defSecondary = '#10B981';
        setPrimaryColor(defPrimary); setSecondaryColor(defSecondary);
        localStorage.removeItem('primaryColor'); localStorage.removeItem('secondaryColor');
        if (currentUser?.uid) {
            saveValue(currentUser.uid, 'primaryColor', null);
            saveValue(currentUser.uid, 'secondaryColor', null);
        }
        toast.success('Colores restablecidos por defecto');
    };

    const applyPalette = (palette: typeof PRESET_PALETTES[0]) => {
        handleColorChange('primary', palette.primary);
        handleColorChange('secondary', palette.secondary);
        toast.success(`Paleta "${palette.name}" aplicada`);
    };

    const cardStyle: React.CSSProperties = {
        background: 'var(--color-surface)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px',
        padding: isMobile ? '1.5rem' : '2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
    };

    if (!isPro) {
        return (
            <div className="container animate-fade-in" style={{ maxWidth: '850px', paddingBottom: '5rem', textAlign: 'center', marginTop: isMobile ? '3rem' : '6rem' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', background: 'var(--color-surface)', padding: isMobile ? '2.5rem 1.5rem' : '4rem 2rem', borderRadius: '32px', border: '1px solid var(--color-border)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
                    <ShieldCheck size={isMobile ? 56 : 72} color="var(--color-primary)" strokeWidth={1.5} style={{ marginBottom: '1rem' }} />
                    <h1 className="gradient-text" style={{ fontSize: isMobile ? '2rem' : '2.5rem', margin: 0, fontWeight: 900, letterSpacing: '-1px' }}>Exclusivo Premium</h1>
                    <p style={{ color: 'var(--color-text-secondary)', fontSize: isMobile ? '0.95rem' : '1.1rem', maxWidth: '400px', lineHeight: 1.6 }}>
                        La personalización de la identidad visual con logo y colores corporativos es una característica del plan Pro.
                    </p>
                    <button onClick={() => navigate('/subscribe')} className="primary-btn" style={{ padding: isMobile ? '0.8rem 2rem' : '1rem 2.5rem', borderRadius: '16px', marginTop: '1.5rem', fontWeight: 800, fontSize: isMobile ? '1rem' : '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', width: isMobile ? '100%' : 'auto', justifyContent: 'center' }}>
                        <Sparkles size={20} /> Mejorar a Pro
                    </button>
                    <></>
                </div>
            </div>
        )
    }

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '850px', paddingBottom: '5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '3rem' }}>
                <></>
                <div>
                    <h1 className="gradient-text" style={{ margin: 0, fontSize: '2rem', fontWeight: 900, letterSpacing: '-0.8px' }}>
                        Identidad Visual
                    </h1>
                    <p style={{ margin: '0.3rem 0 0 0', color: 'var(--color-text-secondary)', fontSize: '0.95rem', fontWeight: 500 }}>
                        Personalizá tus reportes profesionales con una estética premium
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>

                {/* ── LOGO CARD ── */}
                <div style={cardStyle}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '250px', height: '250px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.04)', filter: 'blur(50px)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                            <div style={{
                                width: '56px', height: '56px',
                                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.2), rgba(59, 130, 246, 0.2))',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: '18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: '#38bdf8', boxShadow: '0 8px 20px rgba(56, 189, 248, 0.15)'
                            }}>
                                <ImageIcon size={28} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--color-text)' }}>Logo de Empresa</h2>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Este logo se insertará en alta calidad en la cabecera de tus PDFs.</p>
                            </div>
                        </div>

                        {logo ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                                {/* Logo Preview */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '2.5rem',
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: isMobile ? '1.5rem' : '2rem', borderRadius: '24px',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    flexDirection: isMobile ? 'column' : 'row'
                                }}>
                                    <div style={{
                                        width: isMobile ? '100%' : '180px', height: isMobile ? '160px' : '180px', background: '#ffffff',
                                        borderRadius: '24px', padding: '1.5rem', 
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)', flexShrink: 0,
                                        position: 'relative'
                                    }}>
                                        <div style={{ position: 'absolute', inset: 0, borderRadius: '24px', border: '1px solid rgba(0,0,0,0.1)' }} />
                                        <img src={logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', color: '#10b981', marginBottom: '1rem' }}>
                                            <CheckCircle size={22} />
                                            <span style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.3px' }}>Logo Configurado</span>
                                        </div>
                                        <p style={{ margin: '0 0 2rem 0', fontSize: '0.95rem', color: 'var(--color-text-secondary)', lineHeight: 1.6, textAlign: isMobile ? 'center' : 'left' }}>
                                            Tu logo ha sido optimizado y está listo para ser incluido en todos los reportes generados.
                                        </p>
                                        <div style={{ display: 'flex', gap: '1rem', flexDirection: isMobile ? 'column' : 'row' }}>
                                            <button
                                                onClick={() => document.getElementById('logo-file-input')?.click()}
                                                style={{
                                                    padding: '0.8rem 1.6rem',
                                                    background: 'var(--color-text)', color: 'var(--color-background)', 
                                                    border: 'none', borderRadius: '14px',
                                                    fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center',
                                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,255,255,0.2)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >
                                                <Upload size={18} /> Cambiar Logo
                                            </button>
                                            <button
                                                onClick={removeLogo}
                                                style={{
                                                    padding: '0.8rem 1.6rem',
                                                    background: 'transparent', color: '#ef4444',
                                                    border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '14px',
                                                    fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.6rem', justifyContent: 'center',
                                                    transition: 'all 0.3s'
                                                }}
                                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'; }}
                                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                                            >
                                                <X size={18} /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Visibility */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: showLogo ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',
                                    padding: '1.5rem 2rem', borderRadius: '20px',
                                    border: `1px solid ${showLogo ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                    transition: 'all 0.4s ease'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
                                        <div style={{
                                            width: '48px', height: '48px',
                                            background: showLogo ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)',
                                            borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.4s'
                                        }}>
                                            {showLogo ? <ShieldCheck size={24} color="#10b981" /> : <X size={24} color="var(--color-text-secondary)" />}
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontWeight: 800, fontSize: '1.05rem', color: showLogo ? '#10b981' : 'var(--color-text)' }}>
                                                {showLogo ? 'Visible en documentos' : 'Oculto temporalmente'}
                                            </span>
                                            <span style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                                {showLogo ? 'El logo se incluirá en cada PDF generado.' : 'No se mostrará el logo en los PDFs.'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleShowLogo}
                                        style={{
                                            width: '64px', height: '34px', borderRadius: '34px', border: 'none',
                                            background: showLogo ? '#10b981' : 'rgba(255,255,255,0.1)',
                                            position: 'relative', cursor: 'pointer', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                            flexShrink: 0,
                                        }}
                                    >
                                        <div style={{
                                            width: '26px', height: '26px', background: 'white', borderRadius: '50%',
                                            position: 'absolute', top: '4px', left: showLogo ? '34px' : '4px',
                                            transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                        }} />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Drop Zone */
                            <div
                                onDrop={handleDrop}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onClick={() => document.getElementById('logo-file-input')?.click()}
                                style={{
                                    width: '100%', padding: isMobile ? '3rem 1.5rem' : '5rem 2rem', boxSizing: 'border-box',
                                    border: `2px dashed ${dragActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                                    background: dragActive ? 'rgba(56, 189, 248, 0.05)' : 'rgba(0, 0, 0, 0.2)',
                                    borderRadius: '24px',
                                    textAlign: 'center',
                                    cursor: isUploading ? 'wait' : 'pointer',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem',
                                    position: 'relative', overflow: 'hidden'
                                }}
                                onMouseOver={e => { if (!dragActive) { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)'; } }}
                                onMouseOut={e => { if (!dragActive) { e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)'; e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'; } }}
                            >
                                <div style={{
                                    width: '100px', height: '100px',
                                    background: 'rgba(255, 255, 255, 0.03)',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(255, 255, 255, 0.08)',
                                    boxShadow: dragActive ? '0 0 40px rgba(56, 189, 248, 0.2)' : '0 10px 30px rgba(0,0,0,0.2)',
                                    transition: 'all 0.4s',
                                    color: dragActive ? '#38bdf8' : 'var(--color-text)'
                                }}>
                                    {isUploading
                                        ? <RefreshCw size={40} style={{ animation: 'spin 1.5s linear infinite' }} />
                                        : <Upload size={40} strokeWidth={1.5} />
                                    }
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 0.8rem 0', fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                                        {dragActive ? '¡Soltalo!' : 'Subí tu logo acá'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                                        Arrastrá una imagen o hacé clic para buscar en tus archivos
                                    </p>
                                    <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '0.8rem', flexWrap: 'wrap' }}>
                                        {['PNG', 'JPG', 'SVG'].map(fmt => (
                                            <span key={fmt} style={{
                                                fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.5px',
                                                background: 'rgba(255, 255, 255, 0.05)',
                                                color: 'var(--color-text)',
                                                padding: '0.4rem 1rem', borderRadius: '30px',
                                                border: '1px solid rgba(255, 255, 255, 0.1)'
                                            }}>{fmt}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                        <input id="logo-file-input" type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* ── COLORS CARD ── */}
                <div style={cardStyle}>
                    <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '200px', height: '200px', borderRadius: '50%', background: `${primaryColor}10`, filter: 'blur(40px)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '2.5rem' }}>
                            <div style={{
                                width: '56px', height: '56px',
                                background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
                                border: `1px solid ${primaryColor}50`,
                                borderRadius: '18px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: primaryColor, boxShadow: `0 8px 20px ${primaryColor}20`,
                                transition: 'all 0.4s'
                            }}>
                                <Palette size={28} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.3px', color: 'var(--color-text)' }}>Colores Corporativos</h2>
                                <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>Definí la paleta de colores para tu experiencia en la plataforma.</p>
                            </div>
                        </div>

                        {/* Color Pickers */}
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '2rem', marginBottom: '2.5rem' }}>
                            {[
                                { label: 'Primario', type: 'primary' as const, value: primaryColor, desc: 'Acentos, botones y encabezados.' },
                                { label: 'Secundario', type: 'secondary' as const, value: secondaryColor, desc: 'Notificaciones, éxitos y gráficos.' }
                            ].map(({ label, type, value, desc }) => (
                                <div key={type} style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    borderRadius: '20px',
                                    padding: '1.5rem',
                                    transition: 'all 0.3s ease'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
                                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}>
                                    <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '1.2rem' }}>{label}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', marginBottom: '1rem' }}>
                                        <div style={{
                                            width: '64px', height: '64px', borderRadius: '50%',
                                            background: value, flexShrink: 0,
                                            boxShadow: `0 10px 25px ${value}40`,
                                            overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)',
                                            cursor: 'pointer', position: 'relative',
                                            transition: 'transform 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}>
                                            <input
                                                type="color" value={value}
                                                onChange={(e) => handleColorChange(type, e.target.value)}
                                                style={{ opacity: 0, position: 'absolute', inset: 0, width: '200%', height: '200%', cursor: 'pointer', border: 'none', transform: 'translate(-25%, -25%)' }}
                                            />
                                        </div>
                                        <div>
                                            <span style={{
                                                fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem',
                                                color: 'var(--color-text)',
                                                display: 'block', marginBottom: '4px'
                                            }}>{value.toUpperCase()}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>Clic para cambiar</span>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Preset Palettes */}
                        <div style={{ marginBottom: '2rem' }}>
                            <p style={{ margin: '0 0 1.2rem 0', fontSize: '0.85rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Inspiración</p>
                            <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                {PRESET_PALETTES.map((palette) => (
                                    <button
                                        key={palette.name}
                                        onClick={() => applyPalette(palette)}
                                        title={palette.name}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.8rem',
                                            padding: '0.6rem 1.2rem',
                                            background: 'rgba(255,255,255,0.03)',
                                            border: `1px solid ${primaryColor === palette.primary ? palette.primary : 'rgba(255,255,255,0.08)'}`,
                                            borderRadius: '30px', cursor: 'pointer',
                                            fontWeight: primaryColor === palette.primary ? 800 : 600,
                                            fontSize: '0.85rem',
                                            color: primaryColor === palette.primary ? '#fff' : 'var(--color-text-secondary)',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: primaryColor === palette.primary ? `0 4px 15px ${palette.primary}30` : 'none'
                                        }}
                                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.transform = 'none'; }}
                                    >
                                        <span style={{ display: 'flex', gap: '0' }}>
                                            <span style={{ width: '14px', height: '14px', borderRadius: '50% 0 0 50%', background: palette.primary, display: 'inline-block' }} />
                                            <span style={{ width: '14px', height: '14px', borderRadius: '0 50% 50% 0', background: palette.secondary, display: 'inline-block' }} />
                                        </span>
                                        {palette.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={resetColors}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.6rem',
                                padding: '0.8rem 1.5rem', fontSize: '0.9rem',
                                color: 'var(--color-text)', background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px',
                                cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                        >
                            <RefreshCw size={16} /> Restaurar Por Defecto
                        </button>
                    </div>
                </div>

                {/* ── INFO CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
                    <div style={{
                        ...cardStyle, padding: '1.8rem',
                        background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.05), rgba(59, 130, 246, 0.05))',
                        border: '1px solid rgba(56, 189, 248, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', color: '#38bdf8' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.15)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
                                <Info size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>Marca en Reportes</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                            El logo se insertará en la esquina superior de <strong>todos los documentos</strong> generados (Investigaciones, Análisis, Checklists). Recomendamos usar formato PNG con fondo transparente.
                        </p>
                    </div>

                    <div style={{
                        ...cardStyle, padding: '1.8rem',
                        background: isPro ? 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))' : 'linear-gradient(135deg, rgba(251,191,36,0.05), rgba(217,119,6,0.05))',
                        border: `1px solid ${isPro ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.2rem', color: isPro ? '#10b981' : '#f59e0b' }}>
                            <div style={{ background: isPro ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)', padding: '0.6rem', borderRadius: '12px', display: 'flex' }}>
                                <Sparkles size={22} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900 }}>{isPro ? 'Beneficio PRO Activado' : 'Función Exclusiva PRO'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                            {isPro
                                ? 'Como usuario PRO, tu identidad visual completa y los logos de alta definición están desbloqueados sin límites de agua.'
                                : 'La personalización de reportes es una característica premium. Activa la membresía PRO para habilitar esta estética en tus PDFs.'}
                        </p>
                        {!isPro && (
                            <button
                                onClick={() => navigate('/subscribe')}
                                style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                    marginTop: '1.5rem', padding: '0.8rem 1.4rem', width: '100%',
                                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                                    color: 'white', border: 'none', borderRadius: '14px',
                                    fontSize: '0.95rem', fontWeight: 800, cursor: 'pointer',
                                    boxShadow: '0 8px 20px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 25px rgba(245, 158, 11, 0.4)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)'; }}
                            >
                                <Sparkles size={18} /> Activar Versión Pro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
