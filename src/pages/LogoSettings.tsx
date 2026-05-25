import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X, CheckCircle, AlertCircle, Image as ImageIcon, Sparkles, ShieldCheck, Info, RefreshCw } from 'lucide-react';
import { usePaywall } from '../hooks/usePaywall';
import { useAuth } from '../contexts/AuthContext';
import { saveValue, listenToValue } from '../services/cloudSync';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';

const PRESET_PALETTES = [
    { name: 'Azul Oceano', primary: '#3B82F6', secondary: '#10B981' },
    { name: 'Rojo Seguridad', primary: '#EF4444', secondary: '#F59E0B' },
    { name: 'Verde Industria', primary: '#059669', secondary: '#0EA5E9' },
    { name: 'Naranja Alerta', primary: '#F97316', secondary: '#8B5CF6' },
    { name: 'Violeta Pro', primary: '#8B5CF6', secondary: '#06B6D4' },
    { name: 'Gris Acero', primary: '#475569', secondary: '#38BDF8' },
];

export default function LogoSettings(): React.ReactElement | null {
    const navigate = useNavigate();
    const { isPro } = usePaywall();
    const { currentUser } = useAuth();
    useDocumentTitle('Logo de Empresa');

    const [logo, setLogo] = useState(null);
    const [showLogo, setShowLogo] = useState(true);
    const [primaryColor, setPrimaryColor] = useState('#3B82F6');
    const [secondaryColor, setSecondaryColor] = useState('#10B981');
    const [isUploading, setIsUploading] = useState(false);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        const savedLogo = localStorage.getItem('companyLogo');
        const savedShowLogo = localStorage.getItem('showCompanyLogo');
        const savedPrimaryColor = localStorage.getItem('primaryColor');
        const savedSecondaryColor = localStorage.getItem('secondaryColor');

        if (savedLogo) setLogo(savedLogo);
        if (savedShowLogo !== null) setShowLogo(savedShowLogo === 'true');
        if (savedPrimaryColor) setPrimaryColor(savedPrimaryColor);
        if (savedSecondaryColor) setSecondaryColor(savedSecondaryColor);

        if (currentUser?.uid) {
            const unsubscribeLogo = listenToValue<string>(currentUser.uid, 'companyLogo', (val) => {
                setLogo(val);
                if (val) localStorage.setItem('companyLogo', val);
                else localStorage.removeItem('companyLogo');
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

    const handleFileChange = (file) => {
        if (!file) return;
        setIsUploading(true);
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor subí una imagen válida (PNG, JPG, SVG)');
            setIsUploading(false); return;
        }
        if (file.size > 500 * 1024) {
            toast.error('La imagen debe pesar menos de 500KB');
            setIsUploading(false); return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target!.result as string;
            setLogo(base64);
            localStorage.setItem('companyLogo', base64);
            if (currentUser?.uid) saveValue(currentUser.uid, 'companyLogo', base64);
            setIsUploading(false);
            toast.success('✅ Logo guardado exitosamente. Se aplicará a todos tus PDFs.');
        };
        reader.onerror = () => { toast.error('Error al leer la imagen'); setIsUploading(false); };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
    };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); setDragActive(true); };
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
        background: 'rgba(var(--color-surface-rgb), 0.5)',
        backdropFilter: 'blur(12px)',
        border: '1px solid var(--glass-border)',
        borderRadius: '24px',
        padding: '2rem',
        position: 'relative',
        overflow: 'hidden'
    };

    return (
        <div className="container animate-fade-in" style={{ maxWidth: '800px', paddingBottom: '4rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2.5rem' }}>
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        padding: '0.6rem', background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)', borderRadius: '12px',
                        cursor: 'pointer', color: 'var(--color-text)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, letterSpacing: '-0.5px' }}>Logo de Empresa</h1>
                    <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.9rem', fontWeight: 500 }}>Personalizá tus reportes profesionales</p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

                {/* ── LOGO CARD ── */}
                <div style={cardStyle}>
                    {/* Decorative glows */}
                    <div style={{ position: 'absolute', top: '-30px', right: '-30px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(56, 189, 248, 0.08)', filter: 'blur(30px)', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', bottom: '-40px', left: '-40px', width: '180px', height: '180px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.06)', filter: 'blur(40px)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{
                                width: '52px', height: '52px',
                                background: 'linear-gradient(135deg, #38bdf8, #3b82f6)',
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', boxShadow: '0 8px 20px rgba(56, 189, 248, 0.3)'
                            }}>
                                <ImageIcon size={26} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.3px' }}>Identidad Visual</h2>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Cargá el logo que aparecerá en el encabezado de todos tus documentos.</p>
                            </div>
                        </div>

                        {logo ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                {/* Logo Preview */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', gap: '2rem',
                                    background: 'var(--color-background)',
                                    padding: '1.8rem', borderRadius: '20px',
                                    border: '1px solid var(--color-border)',
                                    flexWrap: 'wrap'
                                }}>
                                    <div style={{
                                        width: '150px', height: '150px', background: 'white',
                                        border: '2px solid rgba(56, 189, 248, 0.3)', borderRadius: '20px',
                                        padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        boxShadow: '0 8px 25px rgba(56, 189, 248, 0.1)', flexShrink: 0
                                    }}>
                                        <img src={logo} alt="Preview" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: '200px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#10b981', marginBottom: '0.8rem' }}>
                                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', padding: '4px', display: 'flex' }}>
                                                <CheckCircle size={18} />
                                            </div>
                                            <span style={{ fontWeight: 900, fontSize: '1rem' }}>Logo Configurado</span>
                                        </div>
                                        <p style={{ margin: '0 0 1.5rem 0', fontSize: '0.88rem', color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
                                            Tu logo está listo. Se incluirá automáticamente en la esquina superior derecha de cada PDF que generes con la plataforma.
                                        </p>
                                        <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
                                            <button
                                                onClick={() => document.getElementById('logo-file-input').click()}
                                                style={{
                                                    padding: '0.7rem 1.4rem',
                                                    background: 'linear-gradient(90deg, #38bdf8, #3b82f6)',
                                                    color: 'white', border: 'none', borderRadius: '12px',
                                                    fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    boxShadow: '0 6px 15px rgba(56, 189, 248, 0.3)',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                                            >
                                                <Upload size={16} /> Cambiar Logo
                                            </button>
                                            <button
                                                onClick={removeLogo}
                                                style={{
                                                    padding: '0.7rem 1.4rem',
                                                    background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                                                    border: '1px solid rgba(239,68,68,0.25)',
                                                    borderRadius: '12px', fontSize: '0.9rem', fontWeight: 700,
                                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                            >
                                                <X size={16} /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Visibility */}
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: showLogo ? 'rgba(16,185,129,0.06)' : 'rgba(var(--color-surface-rgb), 0.3)',
                                    padding: '1.2rem 1.5rem', borderRadius: '18px',
                                    border: `1px solid ${showLogo ? 'rgba(16,185,129,0.2)' : 'var(--color-border)'}`,
                                    transition: 'all 0.3s'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <div style={{
                                            width: '44px', height: '44px',
                                            background: showLogo ? 'rgba(16,185,129,0.12)' : 'var(--color-background)',
                                            borderRadius: '14px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'all 0.3s'
                                        }}>
                                            {showLogo ? <ShieldCheck size={22} color="#10b981" /> : <X size={22} color="var(--color-text-secondary)" />}
                                        </div>
                                        <div>
                                            <span style={{ display: 'block', fontWeight: 900, fontSize: '1rem', color: showLogo ? '#059669' : 'var(--color-text)' }}>
                                                {showLogo ? 'Visible en todos los PDFs' : 'Oculto en los PDFs'}
                                            </span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>
                                                Usá este interruptor para mostrar u ocultar el logo globalmente.
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={toggleShowLogo}
                                        style={{
                                            width: '58px', height: '32px', borderRadius: '30px', border: 'none',
                                            background: showLogo ? '#10b981' : 'var(--color-border)',
                                            position: 'relative', cursor: 'pointer', transition: 'all 0.35s',
                                            flexShrink: 0,
                                            boxShadow: showLogo ? '0 0 18px rgba(16,185,129,0.35)' : 'none'
                                        }}
                                    >
                                        <div style={{
                                            width: '24px', height: '24px', background: 'white', borderRadius: '50%',
                                            position: 'absolute', top: '4px', left: showLogo ? '30px' : '4px',
                                            transition: 'all 0.35s cubic-bezier(0.18, 0.89, 0.32, 1.28)',
                                            boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
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
                                onClick={() => document.getElementById('logo-file-input').click()}
                                style={{
                                    width: '100%', padding: '4rem 2rem', boxSizing: 'border-box',
                                    border: `3px dashed ${dragActive ? '#38bdf8' : 'rgba(56, 189, 248, 0.25)'}`,
                                    background: dragActive ? 'rgba(56, 189, 248, 0.08)' : 'rgba(56, 189, 248, 0.02)',
                                    borderRadius: '24px',
                                    color: 'var(--color-primary)', textAlign: 'center',
                                    cursor: isUploading ? 'wait' : 'pointer',
                                    transition: 'all 0.3s ease',
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.2rem'
                                }}
                                onMouseOver={e => { if (!dragActive) { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.05)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.4)'; } }}
                                onMouseOut={e => { if (!dragActive) { e.currentTarget.style.background = 'rgba(56, 189, 248, 0.02)'; e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)'; } }}
                            >
                                <div style={{
                                    width: '90px', height: '90px',
                                    background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15), rgba(139, 92, 246, 0.15))',
                                    borderRadius: '50%',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '2px solid rgba(56, 189, 248, 0.2)',
                                    boxShadow: dragActive ? '0 0 30px rgba(56, 189, 248, 0.3)' : 'none',
                                    transition: 'all 0.3s'
                                }}>
                                    {isUploading
                                        ? <RefreshCw size={36} style={{ animation: 'spin 1s linear infinite' }} />
                                        : <Upload size={36} />
                                    }
                                </div>
                                <div>
                                    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.3rem', fontWeight: 900 }}>
                                        {dragActive ? '¡Soltá aquí tu logo!' : 'Arrastrá tu logo acá'}
                                    </h3>
                                    <p style={{ margin: 0, fontSize: '0.92rem', color: 'var(--color-text-secondary)' }}>
                                        O hacé clic para seleccionar un archivo de tu equipo
                                    </p>
                                    <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                                        {['PNG', 'JPG', 'SVG'].map(fmt => (
                                            <span key={fmt} style={{
                                                fontSize: '0.75rem', fontWeight: 700,
                                                background: 'rgba(56, 189, 248, 0.1)',
                                                color: 'var(--color-primary)',
                                                padding: '0.3rem 0.8rem', borderRadius: '20px',
                                                border: '1px solid rgba(56, 189, 248, 0.2)'
                                            }}>{fmt}</span>
                                        ))}
                                        <span style={{
                                            fontSize: '0.75rem', fontWeight: 700,
                                            background: 'var(--color-background)',
                                            color: 'var(--color-text-secondary)',
                                            padding: '0.3rem 0.8rem', borderRadius: '20px',
                                            border: '1px solid var(--color-border)'
                                        }}>Máx. 500KB</span>
                                    </div>
                                </div>
                            </div>
                        )}
                        <input id="logo-file-input" type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} style={{ display: 'none' }} />
                    </div>
                </div>

                {/* ── COLORS CARD ── */}
                <div style={cardStyle}>
                    <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: `${primaryColor}15`, filter: 'blur(25px)', pointerEvents: 'none' }} />

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
                            <div style={{
                                width: '52px', height: '52px',
                                background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
                                borderRadius: '16px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', boxShadow: `0 8px 20px ${primaryColor}40`,
                                transition: 'all 0.3s'
                            }}>
                                <Sparkles size={26} />
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900, letterSpacing: '-0.3px' }}>Colores Corporativos</h2>
                                <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>Definí la paleta de colores para tu cuenta y documentos.</p>
                            </div>
                        </div>

                        {/* Color Pickers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                            {[
                                { label: 'Color Primario', type: 'primary' as const, value: primaryColor, desc: 'Botones principales, encabezados y acentos.' },
                                { label: 'Color Secundario', type: 'secondary' as const, value: secondaryColor, desc: 'Acciones de éxito, confirmaciones y alertas positivas.' }
                            ].map(({ label, type, value, desc }) => (
                                <div key={type} style={{
                                    background: 'var(--color-background)',
                                    border: '1px solid var(--color-border)',
                                    borderRadius: '18px',
                                    padding: '1.2rem',
                                    transition: 'border-color 0.3s'
                                }}>
                                    <label style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '1rem' }}>{label}</label>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.8rem' }}>
                                        <div style={{
                                            width: '56px', height: '56px', borderRadius: '16px',
                                            background: value, flexShrink: 0,
                                            boxShadow: `0 6px 18px ${value}40`,
                                            overflow: 'hidden', border: '2px solid rgba(255,255,255,0.15)',
                                            cursor: 'pointer', position: 'relative'
                                        }}>
                                            <input
                                                type="color" value={value}
                                                onChange={(e) => handleColorChange(type, e.target.value)}
                                                style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', height: '100%', cursor: 'pointer', border: 'none' }}
                                            />
                                        </div>
                                        <div>
                                            <span style={{
                                                fontFamily: 'monospace', fontWeight: 800, fontSize: '1rem',
                                                color: 'var(--color-text)',
                                                display: 'block', marginBottom: '2px'
                                            }}>{value.toUpperCase()}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>Haz clic para cambiar</span>
                                        </div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--color-text-secondary)', lineHeight: 1.5 }}>{desc}</p>
                                </div>
                            ))}
                        </div>

                        {/* Preset Palettes */}
                        <div style={{ marginBottom: '1.5rem' }}>
                            <p style={{ margin: '0 0 1rem 0', fontSize: '0.82rem', fontWeight: 800, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Paletas Predefinidas</p>
                            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                                {PRESET_PALETTES.map((palette) => (
                                    <button
                                        key={palette.name}
                                        onClick={() => applyPalette(palette)}
                                        title={palette.name}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.5rem 0.9rem',
                                            background: 'var(--color-background)',
                                            border: `2px solid ${primaryColor === palette.primary ? palette.primary : 'var(--color-border)'}`,
                                            borderRadius: '20px', cursor: 'pointer',
                                            fontWeight: primaryColor === palette.primary ? 800 : 600,
                                            fontSize: '0.8rem',
                                            color: primaryColor === palette.primary ? palette.primary : 'var(--color-text-secondary)',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = palette.primary}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = primaryColor === palette.primary ? palette.primary : 'var(--color-border)'}
                                    >
                                        <span style={{ display: 'flex', gap: '3px' }}>
                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: palette.primary, display: 'inline-block' }} />
                                            <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: palette.secondary, display: 'inline-block' }} />
                                        </span>
                                        {palette.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            onClick={resetColors}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.6rem 1.2rem', fontSize: '0.85rem',
                                color: 'var(--color-text-secondary)', background: 'var(--color-background)',
                                border: '1px solid var(--color-border)', borderRadius: '12px',
                                cursor: 'pointer', fontWeight: 700, transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--color-surface)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--color-background)'}
                        >
                            <RefreshCw size={15} /> Restablecer colores por defecto
                        </button>
                    </div>
                </div>

                {/* ── INFO CARDS ── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
                    <div style={{
                        ...cardStyle, padding: '1.5rem',
                        background: 'rgba(56, 189, 248, 0.05)',
                        border: '1px solid rgba(56, 189, 248, 0.15)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: 'var(--color-primary)' }}>
                            <div style={{ background: 'rgba(56, 189, 248, 0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <Info size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>Impacto en Reportes</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                            El logo se insertará en la cabecera de <strong>todos los documentos</strong> generados, incluyendo ATS, Investigaciones, Mapas de Riesgo y más. Usá un fondo transparente para un resultado óptimo.
                        </p>
                    </div>

                    <div style={{
                        ...cardStyle, padding: '1.5rem',
                        background: isPro ? 'rgba(16,185,129,0.05)' : 'rgba(251,191,36,0.06)',
                        border: `1px solid ${isPro ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem', color: isPro ? '#10b981' : '#f59e0b' }}>
                            <div style={{ background: isPro ? 'rgba(16,185,129,0.1)' : 'rgba(251,191,36,0.1)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
                                <Sparkles size={20} />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 900 }}>{isPro ? 'Beneficio PRO Activado ✓' : 'Función Exclusiva PRO'}</h3>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-secondary)', lineHeight: 1.7 }}>
                            {isPro
                                ? 'Como usuario PRO, tenés habilitada la personalización completa. Tu logo aparecerá en alta calidad en todas las descargas.'
                                : 'La personalización de reportes con logo propio es una característica premium. Subilo ahora para ver cómo queda y activá PRO cuando estés listo.'}
                        </p>
                        {!isPro && (
                            <button
                                onClick={() => navigate('/subscribe')}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    marginTop: '1rem', padding: '0.7rem 1.2rem',
                                    background: 'linear-gradient(90deg, #f59e0b, #f97316)',
                                    color: 'white', border: 'none', borderRadius: '12px',
                                    fontSize: '0.88rem', fontWeight: 800, cursor: 'pointer',
                                    boxShadow: '0 6px 15px rgba(245, 158, 11, 0.3)',
                                    transition: 'all 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'none'}
                            >
                                <Sparkles size={16} /> Activar Versión Pro
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
