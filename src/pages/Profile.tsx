import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Settings, PenTool, Database, Shield, LogOut, ChevronRight, Trash2, AlertCircle, Share2, Copy, Check, CreditCard, Upload, CheckCircle, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';
import { useDocumentTitle } from '../hooks/useDocumentTitle';
import { getCountryNormativa } from '../data/legislationData';

export default function Profile(): React.ReactElement | null {
  const navigate = useNavigate();
  const { isPro } = usePaywall();
  useDocumentTitle('Mi Perfil');
  const [linkCopied, setLinkCopied] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [userData, setUserData] = useState({
    name: 'Usuario',
    license: '---',
    photo: null,
    profession: ''
  });

  const [isSubscribed, setIsSubscribed] = useState(false);

  const [userCountry, setUserCountry] = useState('argentina');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedData = localStorage.getItem('personalData');
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setUserData(parsed);
        setUserCountry(parsed.country || 'argentina');
      }
      const proStatus = isPro;
      setIsSubscribed(proStatus);
    }
  }, [isPro]);

  const countryNorms = getCountryNormativa(userCountry);

  const menuItems = [
  { id: 'data', label: 'Datos Personales', icon: <User />, path: '/personal-data' },
  { id: 'signature', label: 'Firma y Sello', icon: <PenTool />, path: '/signature-stamp' },
  { id: 'subscription', label: 'Suscripción', icon: <CreditCard />, path: '/subscribe' },
  { id: 'settings', label: 'Configuración', icon: <Settings />, path: '/settings' },
  { id: 'privacy', label: 'Seguridad', icon: <Shield />, path: '/security' }];


  const { logout, deleteAccount } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    const confirmStr = "ELIMINAR MI CUENTA";
    const userInput = prompt(`¿Estás seguro de que quieres eliminar tu cuenta permanentemente? Esta acción NO se puede deshacer.\n\nEscribe "${confirmStr}" para confirmar:`);

    if (userInput === confirmStr) {
      try {
        await deleteAccount();
        localStorage.clear(); // Limpiar todo el rastro local
        toast.success("Cuenta eliminada con éxito. Lamentamos verte partir.");
        navigate('/login');
      } catch (error) {
        console.error("Error al eliminar cuenta:", error);
        toast.error("Hubo un error al intentar eliminar la cuenta. Por favor, intenta cerrar sesión e ingresar de nuevo antes de reintentar.");
      }
    }
  };

  return (
    <div className="container animate-fade-in max-w-[600px] pb-[4rem]">
            <div className="flex items-center gap-[1rem] mb-[2rem]">
                <></>
                <h1 className="gradient-text m-[0] text-[1.8rem] font-[900] letter-spacing-[-0.5px]">Perfil Profesional</h1>
            </div>

            <div className="card text-center bg-[linear-gradient(180deg,_var(--color-surface)_0%,_rgba(var(--color-surface-rgb),_0.5)_100%)] border-[1px_solid_var(--glass-border)] backdrop-filter-[blur(12px)] relative overflow-[hidden]" style={{

        padding: isMobile ? '2rem 1.5rem' : '3rem 2rem'





      }}>
                {/* Decorative background blur */}
                <div className="absolute top-[-50px] left-[50%] transform-[translateX(-50%)] w-[200px] h-[200px] bg-[rgba(56,_189,_248,_0.15)] filter-[blur(40px)] rounded-[50%] z-[0] pointer-events-[none]" />











        

                <div className="relative z-[1]">
                    <img
            src="/logo.png"
            alt="Logo de Asistente HYS" className="w-[auto] h-[40px] m-[0_auto_2rem_auto] block filter-[drop-shadow(0_4px_6px_rgba(0,0,0,0.05))]" />







          
                    <div style={{



            background: userData.photo ? 'transparent' : 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 100%)',









            border: userData.photo ? '4px solid var(--color-surface)' : '4px solid var(--color-surface)'

          }} className="w-[110px] h-[110px] rounded-[50%] m-[0_auto_1.5rem] flex items-center justify-center text-[3rem] text-[#ffffff] font-[900] box-shadow-[0_10px_25px_rgba(56,_189,_248,_0.3)] overflow-[hidden] outline-[2px_solid_rgba(56,_189,_248,_0.3)]">
                        {userData.photo ?
            <img src={userData.photo} alt="Foto de Perfil" className="w-[100%] h-[100%] object-fit-[cover]" /> :

            (userData.name || 'U').charAt(0)
            }
                    </div>
                    <h2 className="m-[0_0_0.5rem_0] text-[1.8rem] font-[900] letter-spacing-[-0.5px]">{userData.name || 'Usuario'}</h2>
                    {userData.profession &&
          <p className="m-[0_0_0.8rem_0] text-[var(--color-primary)] font-[800] text-[1.1rem]">{userData.profession}</p>
          }
                    <div className="flex items-center justify-center gap-[0.8rem] mb-[0.5rem]">
                        <p className="m-[0] text-[var(--color-text-secondary)] text-[0.95rem] font-[600]">Matrícula: {userData.license || '---'}</p>
                        <span style={{




              background: isSubscribed ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              color: isSubscribed ? '#10b981' : '#ef4444',
              border: `1px solid ${isSubscribed ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`





            }} className="p-[0.3rem_0.8rem] rounded-[20px] text-[0.75rem] font-[800] uppercase letter-spacing-[0.5px] flex items-center gap-[4px]">
                            {isSubscribed && <CheckCircle size={14} />}
                            {isSubscribed ? 'Versión Pro' : 'Básico'}
                        </span>
                    </div>
                    
                    {!isSubscribed &&
          <div style={{

            padding: isMobile ? '1.2rem' : '1.5rem'




          }} className="mt-[2rem] bg-[linear-gradient(135deg,_rgba(56,_189,_248,_0.08),_rgba(139,_92,_246,_0.08))] rounded-[20px] border-[1px_solid_rgba(56,_189,_248,_0.2)] box-shadow-[0_10px_30px_rgba(56,_189,_248,_0.05)]">
                            <div className="flex items-center justify-center gap-[8px] mb-[0.5rem]">
                                <Shield size={20} color="#38bdf8" />
                                <h3 className="text-[1.2rem] m-[0] text-[var(--color-primary)] font-[800]">Desbloquea Todo el Potencial</h3>
                            </div>
                            <p className="text-[0.9rem] text-[var(--color-text-secondary)] mb-[1.5rem] font-[500]">
                                Genera reportes PDF sin límites, usa plantillas avanzadas y guarda todo en la nube.
                            </p>
                            <button
              onClick={() => navigate('/subscribe')}

















              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 12px 25px rgba(56, 189, 248, 0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(56, 189, 248, 0.3)';
              }} className="w-[100%] p-[1rem] bg-[linear-gradient(90deg,_#38bdf8,_#8b5cf6)] text-[#ffffff] border-none rounded-[14px] text-[1.05rem] font-[800] cursor-pointer box-shadow-[0_8px_20px_rgba(56,_189,_248,_0.3)] transition-[all_0.3s_ease] flex items-center justify-center gap-[8px]">
              
                                <CreditCard size={20} /> Activar Versión Pro
                            </button>
                        </div>
          }
                </div>
            </div>

            <div style={{


        gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)'

      }} className="mt-[1.5rem] grid gap-[1rem]">
                {menuItems.map((item, idx) =>
        <div
          key={item.id}
          onClick={() => navigate(item.path)}
          style={{











            gridColumn: !isMobile && idx === 0 ? 'span 2' : 'span 1'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
            e.currentTarget.style.transform = 'translateY(-4px)';
            e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.1)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.02)';
            e.currentTarget.style.transform = 'none';
            e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.05)';
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)';
          }} className="flex items-center gap-[1.2rem] p-[1.5rem] cursor-pointer bg-[rgba(255,_255,_255,_0.02)] backdrop-filter-[blur(12px)] border-[1px_solid_rgba(255,_255,_255,_0.05)] transition-[all_0.3s_cubic-bezier(0.4,_0,_0.2,_1)] rounded-[24px] box-shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
          
                        <div className="bg-[linear-gradient(135deg,_rgba(56,_189,_248,_0.15),_rgba(59,_130,_246,_0.15))] p-[0.8rem] rounded-[16px] text-[var(--color-primary)] flex items-center justify-center box-shadow-[0_4px_10px_rgba(56,_189,_248,_0.1)]">








            
                            {item.icon}
                        </div>
                        <div className="flex-[1]">
                            <span className="block font-[800] text-[1.1rem] text-[var(--color-text)] letter-spacing-[-0.3px]">{item.label}</span>
                            <span className="block text-[0.85rem] text-[var(--color-text-secondary)] mt-[0.2rem]">Gestionar {item.label.toLowerCase()}</span>
                        </div>
                        <div className="w-[32px] h-[32px] rounded-[50%] bg-[rgba(255,255,255,0.03)] flex items-center justify-center text-[var(--color-text-secondary)]">




            
                            <ChevronRight size={18} />
                        </div>
                    </div>
        )}
            </div>

            {/* ─── Invitar a un Colega ─────────────────────── */}
            <div className="card mt-[1.5rem] bg-[linear-gradient(135deg,_rgba(37,_99,_235,_0.08),_rgba(16,_185,_129,_0.08))] border-[1px_solid_rgba(37,_99,_235,_0.15)] rounded-[24px] relative overflow-[hidden]" style={{

        padding: isMobile ? '1.5rem' : '1.8rem'





      }}>
                <div className="absolute top-[-20px] right-[-20px] w-[100px] h-[100px] bg-[rgba(16,_185,_129,_0.1)] filter-[blur(30px)] rounded-[50%] z-[0]" />









        
                
                <div className="relative z-[1]">
                    <div className="flex items-center gap-[1rem] mb-[1rem]">
                        <div className="w-[48px] h-[48px] bg-[rgba(37,_99,_235,_0.15)] rounded-[14px] flex items-center justify-center text-[var(--color-primary)] flex-shrink-[0] box-shadow-[0_4px_10px_rgba(37,_99,_235,_0.1)]">







              
                            <Share2 size={24} />
                        </div>
                        <div>
                            <h3 className="m-[0] font-[900] text-[1.1rem] text-[var(--color-text)]">Invitar a un Colega</h3>
                            <p className="m-[0] text-[0.85rem] text-[var(--color-text-secondary)] font-[500]">Compartir esta herramienta gratuita</p>
                        </div>
                    </div>
                    <p className="text-[0.9rem] text-[var(--color-text-secondary)] mb-[1.5rem] line-height-[1.6] font-[500]">
                        ¿Tenés colegas de Higiene y Seguridad? Invitalos a usar la plataforma — es completamente <strong>gratuita</strong>.
                    </p>
                    <div style={{ flexDirection: isMobile ? 'column' : 'row' }} className="flex gap-[1rem]">
                        <a
              href={`https://wa.me/?text=${encodeURIComponent(`🛡️ ¡Hola! Te comparto esta plataforma gratuita para profesionales de Higiene y Seguridad.\n\n*Asistente HYS* te permite:\n🔥 Calcular Carga de Fuego (${countryNorms.fire})\n💡 Estudios de Iluminación\n📋 Hacer ATS y Matrices de Riesgo\n🤖 Consultar la IA legal\n\n¡Y todo gratis!\n🔗 https://asistentehs.com`)}`}
              target="_blank" rel="noreferrer"









              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'none'} className="flex-[1] flex items-center justify-center gap-[0.6rem] p-[1rem] bg-[#25D366] text-[#ffffff] rounded-[14px] font-[800] text-[0.95rem] text-decoration-[none] box-shadow-[0_8px_15px_rgba(37,211,102,0.25)] transition-[all_0.3s_ease]">
              
                            <Share2 size={18} /> Invitar por WhatsApp
                        </a>
                        <button
              onClick={() => {
                navigator.clipboard.writeText('https://asistentehs.com').catch(() => {});
                setLinkCopied(true);
                setTimeout(() => setLinkCopied(false), 2500);
              }}
              style={{


                background: linkCopied ? '#dcfce7' : 'var(--color-surface)',
                border: `1px solid ${linkCopied ? '#86efac' : 'var(--color-border)'}`,

                color: linkCopied ? '#16a34a' : 'var(--color-text)'



              }}
              onMouseEnter={(e) => !linkCopied && (e.currentTarget.style.background = 'var(--color-surface-hover)')}
              onMouseLeave={(e) => !linkCopied && (e.currentTarget.style.background = 'var(--color-surface)')} className="flex items-center justify-center gap-[0.5rem] p-[1rem] rounded-[14px] font-[700] text-[0.9rem] cursor-pointer transition-[all_0.2s] white-space-[nowrap] box-shadow-[0_4px_6px_rgba(0,0,0,0.02)]">
              
                            {linkCopied ? <Check size={18} /> : <Copy size={18} />}
                            {linkCopied ? '¡Copiado!' : 'Copiar link'}
                        </button>
                    </div>
                </div>
            </div>

            <button
        onClick={handleLogout}

















        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.12)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
          e.currentTarget.style.transform = 'none';
        }} className="w-[100%] p-[1.2rem] bg-[rgba(239,_68,_68,_0.08)] border-[1px_solid_rgba(239,_68,_68,_0.2)] rounded-[16px] text-[#ef4444] font-[800] text-[1rem] flex items-center justify-center gap-[0.8rem] mt-[2rem] cursor-pointer transition-[all_0.3s_ease]">
        
                <LogOut size={22} /> Cerrar Sesión
            </button>

            <button
        onClick={handleDeleteAccount}

















        onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-secondary)'} className="w-[100%] p-[1rem] bg-[transparent] border-none text-[var(--color-text-secondary)] text-[0.85rem] font-[600] flex items-center justify-center gap-[0.5rem] mt-[1.5rem] cursor-pointer transition-[color_0.2s] text-decoration-[underline]">
        
                <Trash2 size={16} /> Eliminar mi cuenta permanentemente
            </button>
        </div>);

}