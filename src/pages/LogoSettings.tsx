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
{ name: 'Acero', primary: '#475569', secondary: '#38BDF8' }];


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
        if (val) {setPrimaryColor(val);localStorage.setItem('primaryColor', val);}
      });
      const unsubscribeSecondary = listenToValue<string>(currentUser.uid, 'secondaryColor', (val) => {
        if (val) {setSecondaryColor(val);localStorage.setItem('secondaryColor', val);}
      });
      return () => {unsubscribeLogo();unsubscribeShow();unsubscribePrimary();unsubscribeSecondary();};
    }
  }, [currentUser]);

  const handleFileChange = (file: File | undefined) => {
    if (!file) return;
    setIsUploading(true);
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor subí una imagen válida (PNG, JPG, SVG)');
      setIsUploading(false);return;
    }
    if (file.size > 1024 * 1024) {
      toast.error('La imagen debe pesar menos de 1MB');
      setIsUploading(false);return;
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
    reader.onerror = () => {toast.error('Error al leer la imagen');setIsUploading(false);};
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();e.stopPropagation();setDragActive(false);
    if (e.dataTransfer.files?.[0]) handleFileChange(e.dataTransfer.files[0]);
  };
  const handleDragOver = (e: React.DragEvent) => {e.preventDefault();e.stopPropagation();setDragActive(true);};
  const handleDragLeave = () => setDragActive(false);

  const removeLogo = () => {
    setLogo(null);localStorage.removeItem('companyLogo');
    if (currentUser?.uid) saveValue(currentUser.uid, 'companyLogo', null);
    toast.success('Logo eliminado');
  };

  const toggleShowLogo = () => {
    const newValue = !showLogo;setShowLogo(newValue);
    localStorage.setItem('showCompanyLogo', String(newValue));
    if (currentUser?.uid) saveValue(currentUser.uid, 'showCompanyLogo', newValue);
    toast.success(newValue ? 'Logo activado en PDFs' : 'Logo desactivado en PDFs');
  };

  const handleColorChange = (type: 'primary' | 'secondary', value: string) => {
    if (type === 'primary') {
      setPrimaryColor(value);localStorage.setItem('primaryColor', value);
      if (currentUser?.uid) saveValue(currentUser.uid, 'primaryColor', value);
    } else {
      setSecondaryColor(value);localStorage.setItem('secondaryColor', value);
      if (currentUser?.uid) saveValue(currentUser.uid, 'secondaryColor', value);
    }
  };

  const resetColors = () => {
    const defPrimary = '#3B82F6';const defSecondary = '#10B981';
    setPrimaryColor(defPrimary);setSecondaryColor(defSecondary);
    localStorage.removeItem('primaryColor');localStorage.removeItem('secondaryColor');
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
      <div className="container animate-fade-in max-w-[850px] pb-[5rem] text-center" style={{ marginTop: isMobile ? '3rem' : '6rem' }}>
                <div style={{ padding: isMobile ? '2.5rem 1.5rem' : '4rem 2rem' }} className="flex flex-col items-center gap-[1rem] bg-[var(--color-surface)] rounded-[32px] border-[1px_solid_var(--color-border)] box-shadow-[0_20px_40px_rgba(0,0,0,0.1)]">
                    <ShieldCheck size={isMobile ? 56 : 72} color="var(--color-primary)" strokeWidth={1.5} className="mb-[1rem]" />
                    <h1 className="gradient-text m-[0] font-[900] letter-spacing-[-1px]" style={{ fontSize: isMobile ? '2rem' : '2.5rem' }}>Exclusivo Premium</h1>
                    <p style={{ fontSize: isMobile ? '0.95rem' : '1.1rem' }} className="text-[var(--color-text-secondary)] max-w-[400px] line-height-[1.6]">
                        La personalización de la identidad visual con logo y colores corporativos es una característica del plan Pro.
                    </p>
                    <button onClick={() => navigate('/subscribe')} className="primary-btn rounded-[16px] mt-[1.5rem] font-[800] flex items-center gap-[0.5rem] justify-center" style={{ padding: isMobile ? '0.8rem 2rem' : '1rem 2.5rem', fontSize: isMobile ? '1rem' : '1.1rem', width: isMobile ? '100%' : 'auto' }}>
                        <Sparkles size={20} /> Mejorar a Pro
                    </button>
                    <></>
                </div>
            </div>);

  }

  return (
    <div className="container animate-fade-in max-w-[850px] pb-[5rem]">
            {/* Header */}
            <div className="flex items-center gap-[1.2rem] mb-[3rem]">
                <></>
                <div>
                    <h1 className="gradient-text m-[0] text-[2rem] font-[900] letter-spacing-[-0.8px]">
                        Identidad Visual
                    </h1>
                    <p className="m-[0.3rem_0_0_0] text-[var(--color-text-secondary)] text-[0.95rem] font-[500]">
                        Personalizá tus reportes profesionales con una estética premium
                    </p>
                </div>
            </div>

            <div className="flex flex-col gap-[2.5rem]">

                {/* ── LOGO CARD ── */}
                <div style={cardStyle}>
                    <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-[50%] bg-[rgba(56,_189,_248,_0.05)] filter-[blur(40px)] pointer-events-[none]" />
                    <div className="absolute bottom-[-50px] left-[-50px] w-[250px] h-[250px] rounded-[50%] bg-[rgba(139,_92,_246,_0.04)] filter-[blur(50px)] pointer-events-[none]" />

                    <div className="relative z-[1]">
                        <div className="flex items-center gap-[1.2rem] mb-[2.5rem]">
                            <div className="w-[56px] h-[56px] bg-[linear-gradient(135deg,_rgba(56,_189,_248,_0.2),_rgba(59,_130,_246,_0.2))] border-[1px_solid_rgba(56,_189,_248,_0.3)] rounded-[18px] flex items-center justify-center text-[#38bdf8] box-shadow-[0_8px_20px_rgba(56,_189,_248,_0.15)]">






                
                                <ImageIcon size={28} />
                            </div>
                            <div>
                                <h2 className="m-[0] text-[1.4rem] font-[800] letter-spacing-[-0.3px] text-[var(--color-text)]">Logo de Empresa</h2>
                                <p className="m-[0.2rem_0_0_0] text-[0.9rem] text-[var(--color-text-secondary)]">Este logo se insertará en alta calidad en la cabecera de tus PDFs.</p>
                            </div>
                        </div>

                        {logo ?
            <div className="flex flex-col gap-[2rem]">
                                {/* Logo Preview */}
                                <div style={{


                padding: isMobile ? '1.5rem' : '2rem',

                flexDirection: isMobile ? 'column' : 'row'
              }} className="flex items-center gap-[2.5rem] bg-[rgba(255,255,255,0.02)] rounded-[24px] border-[1px_solid_rgba(255,255,255,0.06)]">
                                    <div style={{
                  width: isMobile ? '100%' : '180px', height: isMobile ? '160px' : '180px'




                }} className="bg-[#ffffff] rounded-[24px] p-[1.5rem] flex items-center justify-center box-shadow-[0_20px_40px_rgba(0,0,0,0.2)] flex-shrink-[0] relative">
                                        <div className="absolute inset-[0] rounded-[24px] border-[1px_solid_rgba(0,0,0,0.1)]" />
                                        <img src={logo} alt="Preview" className="max-w-[100%] max-height-[100%] object-fit-[contain]" />
                                    </div>
                                    <div className="flex-[1] min-width-[200px]">
                                        <div className="flex items-center gap-[0.8rem] text-[#10b981] mb-[1rem]">
                                            <CheckCircle size={22} />
                                            <span className="font-[800] text-[1.1rem] letter-spacing-[-0.3px]">Logo Configurado</span>
                                        </div>
                                        <p style={{ textAlign: isMobile ? 'center' : 'left' }} className="m-[0_0_2rem_0] text-[0.95rem] text-[var(--color-text-secondary)] line-height-[1.6]">
                                            Tu logo ha sido optimizado y está listo para ser incluido en todos los reportes generados.
                                        </p>
                                        <div style={{ flexDirection: isMobile ? 'column' : 'row' }} className="flex gap-[1rem]">
                                            <button
                      onClick={() => document.getElementById('logo-file-input')?.click()}








                      onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 10px 25px rgba(255,255,255,0.2)';}}
                      onMouseLeave={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = 'none';}} className="p-[0.8rem_1.6rem] bg-[var(--color-text)] text-[var(--color-background)] border-none rounded-[14px] text-[0.95rem] font-[800] cursor-pointer flex items-center gap-[0.6rem] justify-center transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
                      
                                                <Upload size={18} /> Cambiar Logo
                                            </button>
                                            <button
                      onClick={removeLogo}








                      onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';}}
                      onMouseLeave={(e) => {e.currentTarget.style.background = 'transparent';}} className="p-[0.8rem_1.6rem] bg-[transparent] text-[#ef4444] border-[1px_solid_rgba(239,_68,_68,_0.2)] rounded-[14px] text-[0.95rem] font-[700] cursor-pointer flex items-center gap-[0.6rem] justify-center transition-[all_0.3s]">
                      
                                                <X size={18} /> Eliminar
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Toggle Visibility */}
                                <div style={{

                background: showLogo ? 'rgba(16,185,129,0.04)' : 'rgba(255,255,255,0.02)',

                border: `1px solid ${showLogo ? 'rgba(16,185,129,0.2)' : 'rgba(255,255,255,0.06)'}`

              }} className="flex items-center justify-space-between p-[1.5rem_2rem] rounded-[20px] transition-[all_0.4s_ease]">
                                    <div className="flex items-center gap-[1.2rem]">
                                        <div style={{

                    background: showLogo ? 'rgba(16,185,129,0.1)' : 'rgba(255,255,255,0.05)'



                  }} className="w-[48px] h-[48px] rounded-[14px] flex items-center justify-center transition-[all_0.4s]">
                                            {showLogo ? <ShieldCheck size={24} color="#10b981" /> : <X size={24} color="var(--color-text-secondary)" />}
                                        </div>
                                        <div>
                                            <span style={{ color: showLogo ? '#10b981' : 'var(--color-text)' }} className="block font-[800] text-[1.05rem]">
                                                {showLogo ? 'Visible en documentos' : 'Oculto temporalmente'}
                                            </span>
                                            <span className="text-[0.85rem] text-[var(--color-text-secondary)]">
                                                {showLogo ? 'El logo se incluirá en cada PDF generado.' : 'No se mostrará el logo en los PDFs.'}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                  onClick={toggleShowLogo}
                  style={{

                    background: showLogo ? '#10b981' : 'rgba(255,255,255,0.1)'


                  }} className="w-[64px] h-[34px] rounded-[34px] border-none relative cursor-pointer transition-[all_0.4s_cubic-bezier(0.4,_0,_0.2,_1)] flex-shrink-[0]">
                  
                                        <div style={{

                    left: showLogo ? '34px' : '4px'


                  }} className="w-[26px] h-[26px] bg-[white] rounded-[50%] absolute top-[4px] transition-[all_0.4s_cubic-bezier(0.34,_1.56,_0.64,_1)] box-shadow-[0_2px_8px_rgba(0,0,0,0.3)]" />
                                    </button>
                                </div>
                            </div> : (

            /* Drop Zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('logo-file-input')?.click()}
              style={{
                padding: isMobile ? '3rem 1.5rem' : '5rem 2rem',
                border: `2px dashed ${dragActive ? '#38bdf8' : 'rgba(255, 255, 255, 0.15)'}`,
                background: dragActive ? 'rgba(56, 189, 248, 0.05)' : 'rgba(0, 0, 0, 0.2)',


                cursor: isUploading ? 'wait' : 'pointer'



              }}
              onMouseOver={(e) => {if (!dragActive) {e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.3)';}}}
              onMouseOut={(e) => {if (!dragActive) {e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';}}} className="w-[100%] box-sizing-[border-box] rounded-[24px] text-center transition-[all_0.4s_cubic-bezier(0.4,_0,_0.2,_1)] flex flex-col items-center gap-[1.5rem] relative overflow-[hidden]">
              
                                <div style={{





                boxShadow: dragActive ? '0 0 40px rgba(56, 189, 248, 0.2)' : '0 10px 30px rgba(0,0,0,0.2)',

                color: dragActive ? '#38bdf8' : 'var(--color-text)'
              }} className="w-[100px] h-[100px] bg-[rgba(255,_255,_255,_0.03)] rounded-[50%] flex items-center justify-center border-[1px_solid_rgba(255,_255,_255,_0.08)] transition-[all_0.4s]">
                                    {isUploading ?
                <RefreshCw size={40} className="animation-[spin_1.5s_linear_infinite]" /> :
                <Upload size={40} strokeWidth={1.5} />
                }
                                </div>
                                <div>
                                    <h3 className="m-[0_0_0.8rem_0] text-[1.4rem] font-[800] letter-spacing-[-0.5px]">
                                        {dragActive ? '¡Soltalo!' : 'Subí tu logo acá'}
                                    </h3>
                                    <p className="m-[0] text-[0.95rem] text-[var(--color-text-secondary)] font-[500]">
                                        Arrastrá una imagen o hacé clic para buscar en tus archivos
                                    </p>
                                    <div className="mt-[1.5rem] flex justify-center gap-[0.8rem] flex-wrap">
                                        {['PNG', 'JPG', 'SVG'].map((fmt) =>
                  <span key={fmt} className="text-[0.75rem] font-[800] letter-spacing-[0.5px] bg-[rgba(255,_255,_255,_0.05)] text-[var(--color-text)] p-[0.4rem_1rem] rounded-[30px] border-[1px_solid_rgba(255,_255,_255,_0.1)]">





                    {fmt}</span>
                  )}
                                    </div>
                                </div>
                            </div>)
            }
                        <input id="logo-file-input" type="file" accept="image/*" onChange={(e) => handleFileChange(e.target.files?.[0])} className="none" />
                    </div>
                </div>

                {/* ── COLORS CARD ── */}
                <div style={cardStyle}>
                    <div style={{ background: `${primaryColor}10` }} className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] rounded-[50%] filter-[blur(40px)] pointer-events-[none]" />

                    <div className="relative z-[1]">
                        <div className="flex items-center gap-[1.2rem] mb-[2.5rem]">
                            <div style={{

                background: `linear-gradient(135deg, ${primaryColor}30, ${secondaryColor}30)`,
                border: `1px solid ${primaryColor}50`,


                color: primaryColor, boxShadow: `0 8px 20px ${primaryColor}20`

              }} className="w-[56px] h-[56px] rounded-[18px] flex items-center justify-center transition-[all_0.4s]">
                                <Palette size={28} />
                            </div>
                            <div>
                                <h2 className="m-[0] text-[1.4rem] font-[800] letter-spacing-[-0.3px] text-[var(--color-text)]">Colores Corporativos</h2>
                                <p className="m-[0.2rem_0_0_0] text-[0.9rem] text-[var(--color-text-secondary)]">Definí la paleta de colores para tu experiencia en la plataforma.</p>
                            </div>
                        </div>

                        {/* Color Pickers */}
                        <div style={{ gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr' }} className="grid gap-[2rem] mb-[2.5rem]">
                            {[
              { label: 'Primario', type: 'primary' as const, value: primaryColor, desc: 'Acentos, botones y encabezados.' },
              { label: 'Secundario', type: 'secondary' as const, value: secondaryColor, desc: 'Notificaciones, éxitos y gráficos.' }].
              map(({ label, type, value, desc }) =>
              <div key={type}






              onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'} className="bg-[rgba(255,255,255,0.02)] border-[1px_solid_rgba(255,255,255,0.06)] rounded-[20px] p-[1.5rem] transition-[all_0.3s_ease]">
                                    <label className="font-[800] text-[0.85rem] text-[var(--color-text-secondary)] uppercase letter-spacing-[1px] block mb-[1.2rem]">{label}</label>
                                    <div className="flex items-center gap-[1.2rem] mb-[1rem]">
                                        <div style={{

                    background: value,
                    boxShadow: `0 10px 25px ${value}40`



                  }}
                  onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'} className="w-[64px] h-[64px] rounded-[50%] flex-shrink-[0] overflow-[hidden] border-[3px_solid_rgba(255,255,255,0.2)] cursor-pointer relative transition-[transform_0.2s]">
                                            <input
                      type="color" value={value}
                      onChange={(e) => handleColorChange(type, e.target.value)} className="opacity-[0] absolute inset-[0] w-[200%] h-[200%] cursor-pointer border-none transform-[translate(-25%,_-25%)]" />

                    
                                        </div>
                                        <div>
                                            <span className="font-family-[monospace] font-[800] text-[1.1rem] text-[var(--color-text)] block mb-[4px]">



                      {value.toUpperCase()}</span>
                                            <span className="text-[0.8rem] text-[var(--color-text-secondary)]">Clic para cambiar</span>
                                        </div>
                                    </div>
                                    <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)] line-height-[1.5]">{desc}</p>
                                </div>
              )}
                        </div>

                        {/* Preset Palettes */}
                        <div className="mb-8">
                            <p className="m-[0_0_1.2rem_0] text-[0.85rem] font-[800] text-[var(--color-text-secondary)] uppercase letter-spacing-[1px]">Inspiración</p>
                            <div className="flex gap-[0.8rem] flex-wrap">
                                {PRESET_PALETTES.map((palette) =>
                <button
                  key={palette.name}
                  onClick={() => applyPalette(palette)}
                  title={palette.name}
                  style={{



                    border: `1px solid ${primaryColor === palette.primary ? palette.primary : 'rgba(255,255,255,0.08)'}`,

                    fontWeight: primaryColor === palette.primary ? 800 : 600,

                    color: primaryColor === palette.primary ? '#fff' : 'var(--color-text-secondary)',

                    boxShadow: primaryColor === palette.primary ? `0 4px 15px ${palette.primary}30` : 'none'
                  }}
                  onMouseEnter={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.06)';e.currentTarget.style.transform = 'translateY(-2px)';}}
                  onMouseLeave={(e) => {e.currentTarget.style.background = 'rgba(255,255,255,0.03)';e.currentTarget.style.transform = 'none';}} className="flex items-center gap-[0.8rem] p-[0.6rem_1.2rem] bg-[rgba(255,255,255,0.03)] rounded-[30px] cursor-pointer text-[0.85rem] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
                  
                                        <span className="flex gap-[0]">
                                            <span style={{ background: palette.primary }} className="w-[14px] h-[14px] rounded-[50%_0_0_50%] inline-block" />
                                            <span style={{ background: palette.secondary }} className="w-[14px] h-[14px] rounded-[0_50%_50%_0] inline-block" />
                                        </span>
                                        {palette.name}
                                    </button>
                )}
                            </div>
                        </div>

                        <button
              onClick={resetColors}







              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} className="flex items-center gap-[0.6rem] p-[0.8rem_1.5rem] text-[0.9rem] text-[var(--color-text)] bg-[rgba(255,255,255,0.05)] border-[1px_solid_rgba(255,255,255,0.1)] rounded-[14px] cursor-pointer font-[700] transition-[all_0.2s]">
              
                            <RefreshCw size={16} /> Restaurar Por Defecto
                        </button>
                    </div>
                </div>

                {/* ── INFO CARDS ── */}
                <div className="grid grid-template-columns-[repeat(auto-fit,_minmax(280px,_1fr))] gap-[1.5rem]">
                    <div style={{
            ...cardStyle


          }} className="p-[1.8rem] bg-[linear-gradient(135deg,_rgba(56,_189,_248,_0.05),_rgba(59,_130,_246,_0.05))] border-[1px_solid_rgba(56,_189,_248,_0.15)]">
                        <div className="flex items-center gap-[1rem] mb-[1.2rem] text-[#38bdf8]">
                            <div className="bg-[rgba(56,_189,_248,_0.15)] p-[0.6rem] rounded-[12px] flex">
                                <Info size={22} />
                            </div>
                            <h3 className="m-[0] text-[1.05rem] font-[900]">Marca en Reportes</h3>
                        </div>
                        <p className="m-[0] text-[0.9rem] text-[var(--color-text-secondary)] line-height-[1.7]">
                            El logo se insertará en la esquina superior de <strong>todos los documentos</strong> generados (Investigaciones, Análisis, Checklists). Recomendamos usar formato PNG con fondo transparente.
                        </p>
                    </div>

                    <div style={{
            ...cardStyle,
            background: isPro ? 'linear-gradient(135deg, rgba(16,185,129,0.05), rgba(5,150,105,0.05))' : 'linear-gradient(135deg, rgba(251,191,36,0.05), rgba(217,119,6,0.05))',
            border: `1px solid ${isPro ? 'rgba(16,185,129,0.2)' : 'rgba(251,191,36,0.2)'}`
          }} className="p-[1.8rem]">
                        <div style={{ color: isPro ? '#10b981' : '#f59e0b' }} className="flex items-center gap-[1rem] mb-[1.2rem]">
                            <div style={{ background: isPro ? 'rgba(16,185,129,0.15)' : 'rgba(251,191,36,0.15)' }} className="p-[0.6rem] rounded-[12px] flex">
                                <Sparkles size={22} />
                            </div>
                            <h3 className="m-[0] text-[1.05rem] font-[900]">{isPro ? 'Beneficio PRO Activado' : 'Función Exclusiva PRO'}</h3>
                        </div>
                        <p className="m-[0] text-[0.9rem] text-[var(--color-text-secondary)] line-height-[1.7]">
                            {isPro ?
              'Como usuario PRO, tu identidad visual completa y los logos de alta definición están desbloqueados sin límites de agua.' :
              'La personalización de reportes es una característica premium. Activa la membresía PRO para habilitar esta estética en tus PDFs.'}
                        </p>
                        {!isPro &&
            <button
              onClick={() => navigate('/subscribe')}









              onMouseEnter={(e) => {e.currentTarget.style.transform = 'translateY(-2px)';e.currentTarget.style.boxShadow = '0 12px 25px rgba(245, 158, 11, 0.4)';}}
              onMouseLeave={(e) => {e.currentTarget.style.transform = 'none';e.currentTarget.style.boxShadow = '0 8px 20px rgba(245, 158, 11, 0.3)';}} className="flex items-center justify-center gap-[0.6rem] mt-[1.5rem] p-[0.8rem_1.4rem] w-[100%] bg-[linear-gradient(135deg,_#f59e0b,_#d97706)] text-[white] border-none rounded-[14px] text-[0.95rem] font-[800] cursor-pointer box-shadow-[0_8px_20px_rgba(245,_158,_11,_0.3)] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)]">
              
                                <Sparkles size={18} /> Activar Versión Pro
                            </button>
            }
                    </div>
                </div>
            </div>
        </div>);

}