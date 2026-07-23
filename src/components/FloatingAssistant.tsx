import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  X, Zap, BarChart3, ClipboardCheck, ChevronRight, Sparkles, TrendingUp,
  Volume2, Search, Settings, HelpCircle, Lock,
  FileText, ShieldCheck, KeySquare, Send,
  Camera, AlertCircle, PhoneCall, HeartPulse,
  Activity, Mic, MicOff, Contact, QrCode, CreditCard, Award } from
'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';
import GlobalQRScanner from './GlobalQRScanner';
import { auth } from '../firebase';

export default function FloatingAssistant() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeTab, setActiveTab] = useState<'actions' | 'chat' | 'id'>('actions');
  const [safetyScore, setSafetyScore] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [freeQueriesUsed, setFreeQueriesUsed] = useState(0);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Tipado de mensajes con timestamp
  interface Message {
    role: 'ai' | 'user';
    text: string;
    timestamp: number;
  }

  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('ai_assistant_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Limpiar mensajes de más de 24 horas al cargar
        const dayInMs = 24 * 60 * 60 * 1000;
        const now = Date.now();
        return parsed.filter((m: Message) => now - m.timestamp < dayInMs);
      } catch (e) {
        return [{ role: 'ai', text: '¡Hola! ¿En qué puedo ayudarte con la seguridad hoy?', timestamp: Date.now() }];
      }
    }
    return [{ role: 'ai', text: '¡Hola! ¿En qué puedo ayudarte con la seguridad hoy?', timestamp: Date.now() }];
  });

  // Guardar mensajes y limpiar antiguos periódicamente
  useEffect(() => {
    const dayInMs = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const filtered = messages.filter((m) => now - m.timestamp < dayInMs);

    // Si se filtraron mensajes, actualizamos el estado
    if (filtered.length !== messages.length) {
      setMessages(filtered);
    }

    localStorage.setItem('ai_assistant_messages', JSON.stringify(filtered));
  }, [messages]);

  // Calcular un "Safety Pulse" (Score) basado en datos locales
  useEffect(() => {
    const calculateScore = () => {
      const keys = [
      'ats_history', 'inspections_history',
      'work_permits_history', 'ehs_audits_db',
      'loto_procedures_db'];

      let totalRecords = 0;
      keys.forEach((k) => {
        const data = localStorage.getItem(k);
        if (data) totalRecords += JSON.parse(data).length;
      });

      // Lógica simple de score: cada registro suma, capeado en 100
      const score = Math.min(Math.round(totalRecords / 50 * 100), 100);
      setSafetyScore(score || 15); // Base de 15%
    };

    calculateScore();
    window.addEventListener('storage', calculateScore);
    return () => window.removeEventListener('storage', calculateScore);
  }, []);

  // Scroll automático en chat
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeTab]);

  // Cerrar al hacer clic fuera y bloquear scroll en móvil
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      if (isMobile) {
        document.body.classList.add('no-scroll');
        document.documentElement.classList.add('no-scroll');
      }
    } else {
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.body.classList.remove('no-scroll');
      document.documentElement.classList.remove('no-scroll');
    };
  }, [isOpen, isMobile]);

  const toggleAssistant = () => setIsOpen(!isOpen);

  const handleSOS = () => {
    setMessages((prev) => [...prev,
    { role: 'user', text: '🚨 ¡AUXILIO! EMERGENCIA DETECTADA', timestamp: Date.now() },
    { role: 'ai', text: '⚠️ PROTOCOLO DE EMERGENCIA ACTIVADO\n\n1. Mantené la calma.\n2. Llamá al 911 (Emergencias).\n3. No muevas al herido si sospechás lesión de columna.\n4. Si hay fuego, evacuar por las salidas señalizadas.\n\n¿Qué tipo de emergencia es? (Incendio, Accidente, Derrame)', timestamp: Date.now() }]
    );
    setActiveTab('chat');
    toast.error('Protocolo S.O.S Activado', { icon: '🚨', duration: 5000 });
  };

  const handlePhotoAnalysis = () => {
    if (!isPro) {
      toast.error('Análisis Visual con IA es una función PRO 💎');
      navigate('/subscribe');
      return;
    }

    // Simulación de selección de foto
    toast.loading('Analizando imagen con Visión IA...', { id: 'vision' });

    setTimeout(() => {
      setMessages((prev) => [...prev, { role: 'ai', text: '📸 Análisis de Visión IA finalizado:\n\n• ✅ Casco detectado.\n• ⚠️ Falta protección ocular.\n• ⚠️ Andamio sin rodapié visible.\n\nRecomendación: Frenar tarea hasta colocar rodapié.', timestamp: Date.now() }]);
      toast.success('Análisis finalizado', { id: 'vision' });
    }, 2000);
  };

  const handleVoiceDictation = () => {
    if (!isPro) {
      toast.error('Dictado de Campo con IA es una función PRO 💎');
      navigate('/subscribe');
      return;
    }

    setIsListening(true);
    toast('🎤 Escuchando dictado de riesgo...', { icon: '🎙️' });

    setTimeout(() => {
      setIsListening(false);
      const transcript = "En el sector 4 hay un operario soldando sin biombo";
      setMessages((prev) => [...prev,
      { role: 'user', text: transcript, timestamp: Date.now() },
      { role: 'ai', text: `🧠 Entendido. Analizando dictado: "Soldadura sin biombo".\n\nRIESGO: Proyecciones e IR/UV para terceros.\nACCION: Colocación de biombo inmediata. ¿Querés que genere una observación preventiva?`, timestamp: Date.now() }]
      );
    }, 3000);
  };

  const handleWeeklyReport = () => {
    if (!isPro) {
      toast.error('Los Reportes Gerenciales IA son una función PRO 💎');
      navigate('/subscribe');
      return;
    }

    toast.loading('Escaneando base de datos semanal...', { id: 'report' });

    setTimeout(() => {
      // Lógica de escaneo real de localStorage
      const atsCount = JSON.parse(localStorage.getItem('ats_history') || '[]').length;
      const accidentCount = JSON.parse(localStorage.getItem('accident_history') || '[]').length;
      const inspCount = JSON.parse(localStorage.getItem('inspections_history') || '[]').length;

      const reportText = `📊 REPORTE GERENCIAL SEMANAL (IA)\n\n• Gestión: ${atsCount} ATS generados.\n• Control: ${inspCount} Inspecciones realizadas.\n• Seguridad: ${accidentCount} Accidentes reportados.\n\n💡 CONCLUSIÓN IA: "La actividad preventiva es estable. Se recomienda reforzar la supervisión en tareas de altura debido al incremento de ATS en dicha categoría."\n\n¿Querés que exporte este resumen a PDF comercial?`;

      setMessages((prev) => [...prev, { role: 'ai', text: reportText, timestamp: Date.now() }]);
      toast.success('Reporte generado', { id: 'report' });
    }, 2000);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    if (!isPro) {
      toast.error('El Asistente Virtual IA es exclusivo para suscripciones PRO 💎', { duration: 5000 });
      navigate('/subscribe');
      return;
    }

    const userMsg = chatInput.trim();
    setMessages((prev) => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-advisor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await auth.currentUser?.getIdToken(true)}`
        },
        body: JSON.stringify({
          taskDescription: userMsg,
          country: 'argentina',
          isChat: true // Flag para que el backend sepa que es respuesta corta
        })
      });

      const data = await response.json();

      // Simular respuesta natural si falla la API o para debug inicial
      const aiText = data.recomendaciones ? data.recomendaciones[0] : "Entendido. Recordá siempre verificar tus EPP antes de comenzar.";

      setTimeout(() => {
        setMessages((prev) => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }]);
        setIsTyping(false);
        if (!isPro) setFreeQueriesUsed((prev) => prev + 1);
      }, 800);

    } catch (err) {
      console.error("Chat Error:", err);
      setMessages((prev) => [...prev, { role: 'ai', text: "Lo siento, tuve un problema de conexión. ¿Podés repetir?", timestamp: Date.now() }]);
      setIsTyping(false);
    }
  };

  if (!currentUser) return null;

  const quickActions = [
  { label: 'Nuevo ATS', icon: <ShieldCheck size={18} />, color: '#10b981', path: '/ats' },
  { label: 'Auditoría', icon: <ClipboardCheck size={18} />, color: '#3b82f6', path: '/audit/new' },
  { label: 'Permiso Crítico', icon: <KeySquare size={18} />, color: '#f59e0b', path: '/work-permit' },
  { label: 'Investigación', icon: <BarChart3 size={18} />, color: '#ef4444', path: '/accident-investigation' }];


  const getContextualTips = () => {
    const path = location.pathname;
    if (path.includes('/ats')) {
      return [
        "Sugerir riesgos para trabajo en altura",
        "Medidas preventivas para excavaciones",
        "EPP obligatorio en zonas operativas"
      ];
    }
    if (path.includes('/loto')) {
      return [
        "Verificación de energía cero",
        "Pasos para colocación de candados",
        "Procedimiento de desbloqueo seguro"
      ];
    }
    if (path.includes('/fire-load')) {
      return [
        "Poder calorífico por tipo de material",
        "Resistencia al fuego requerida (F30/F60)",
        "Distribución de extintores según superficie"
      ];
    }
    if (path.includes('/working-at-height')) {
      return [
        "Puntos de anclaje normados (22 KN)",
        "Inspección previa de arnés de seguridad",
        "Checklist para montaje de andamios"
      ];
    }
    if (path.includes('/confined-space')) {
      return [
        "Medición de atmósfera (Oxígeno y LEL)",
        "Vigía en exterior y comunicación",
        "Plan de rescate para espacio confinado"
      ];
    }
    if (path.includes('/extintores') || path.includes('/extinguisher')) {
      return [
        "Presión del manómetro en rango verde",
        "Control de tarjeta de inspección",
        "Distancia máxima de recorrido"
      ];
    }
    return [
      "Recordá verificar la vigencia de los matafuegos hoy",
      "Resumen semanal de siniestralidad",
      "Consultar marco legal local vigente"
    ];
  };

  const aiTips = getContextualTips();


  return (
    <>
            {/* Menu Panel - Moved outside so it can be freely centered */}
            {isOpen &&
      <div
        style={{
          ...(isMobile ? {
            bottom: '0',
            left: '0',
            width: '100vw',
            transform: 'none'
          } : {
            bottom: 'calc(2rem + 5rem)',
            right: '2rem',
            width: '360px'
          })
        }} className="fixed z-[10000] pointer-events-[none] flex flex-col">
        
                    <div
          ref={menuRef}
          className="assistant-panel-anim w-[100%] pointer-events-[all] flex flex-col p-[1.2rem] overflow-y-auto bg-[var(--color-surface)] box-shadow-[var(--shadow-lg),_0_0_40px_rgba(59,130,246,0.08)] border-[1px_solid_var(--color-border)] rounded-[24px]"
          style={{
            maxHeight: isMobile ? '88vh' : 'calc(100vh - 120px)',
            height: isMobile ? '88vh' : '540px',
            borderRadius: isMobile ? '24px 24px 0 0' : '24px',
            borderBottom: isMobile ? 'none' : '1px solid var(--color-border)',
            boxSizing: 'border-box'
          }}>
          
                    {/* Header */}
                    <div className="flex items-center justify-between mb-[1.2rem] px-1">
                        <div className="flex items-center gap-[0.9rem]">
                                <div className="w-[48px] h-[48px] bg-[white] rounded-[14px] flex items-center justify-center border-[1px_solid_rgba(59,_130,_246,_0.1)] box-shadow-[0_4px_12px_rgba(0,0,0,0.08)]">






                
                                    <img src="/logo.png" alt="Logo" className="assistant-logo-spin w-[32px] h-[32px] object-fit-[contain]" />
                                </div>
                            <div>
                                <h4 className="m-[0] text-[1.05rem] font-[900] letter-spacing-[-0.5px] text-[var(--color-text)]">Asistente IA</h4>
                                <div className="flex items-center gap-[0.4rem]">
                                    <span style={{ background: isPro ? '#10b981' : '#f59e0b', boxShadow: isPro ? '0 0 10px #10b98188' : '0 0 10px #f59e0b88' }} className="w-[8px] h-[8px] rounded-[50%]"></span>
                                    <span className="text-[0.75rem] text-[var(--color-text-muted)] font-[700]">
                                        {isPro ? 'Miembro PRO' : 'Plan Básico'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-[0.6rem] items-center">
                            {!isPro &&
              <button
                onClick={() => navigate('/subscribe')} className="p-[0.35rem_0.7rem] bg-[var(--gradient-premium)] text-[white] text-[0.7rem] font-[900] rounded-[10px] border-none box-shadow-[0_4px_12px_rgba(59,_130,_246,_0.4)] cursor-pointer">





                
                                    PRO
                                </button>
              }
                            <button onClick={() => setIsOpen(false)} className="p-[0.5rem] bg-[rgba(0,0,0,0.03)] border-none rounded-[50%] text-[var(--color-text-muted)] cursor-pointer flex items-center justify-center">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Safety Score Section */}
                    {activeTab !== 'chat' && (
                      <div className="bg-[rgba(59,_130,_246,_0.04)] rounded-[18px] p-[0.9rem] mb-[1rem] border-[1px_solid_rgba(59,_130,_246,_0.08)]">
                        <div className="flex justify-between items-center mb-[0.5rem]">
                            <span style={{ letterSpacing: '0.3px' }} className="text-[0.72rem] font-[800] text-[var(--color-primary)]">NIVEL DE CUMPLIMIENTO</span>
                            <span className="text-[0.95rem] font-[900] text-[var(--color-primary)]">{safetyScore}%</span>
                        </div>
                        <div className="h-[7px] bg-[rgba(0,0,0,0.06)] rounded-[10px] overflow-hidden">
                            <div style={{ width: `${safetyScore}%` }} className="h-[100%] bg-[var(--gradient-premium)] rounded-[10px] transition-[width_1.2s_cubic-bezier(0.34,_1.56,_0.64,_1)]"></div>
                        </div>
                      </div>
                    )}

                    {/* Tabs Control */}
                    <div className="flex gap-1 mb-[1.2rem] p-[3px] bg-[rgba(0,0,0,0.04)] dark:bg-[rgba(255,255,255,0.04)] rounded-[14px]">
                        {(['actions', 'chat', 'id'] as const).map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                              background: activeTab === tab ? 'var(--color-surface)' : 'transparent',
                              color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-muted)',
                              boxShadow: activeTab === tab ? '0 2px 8px rgba(0,0,0,0.12)' : 'none',
                              fontWeight: activeTab === tab ? 800 : 600,
                            }}
                            className="flex-1 py-[0.55rem] text-[0.75rem] rounded-[11px] border-none transition-all duration-200 cursor-pointer">
                            {tab === 'actions' ? 'Acciones' : tab === 'chat' ? 'Chat' : 'H&S ID'}
                          </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div
            className={`hide-scrollbar flex-1 min-h-0 flex flex-col ${activeTab !== 'chat' ? 'overflow-y-auto' : 'overflow-hidden'}`}>

            
                        {activeTab === 'id' ?
            <div className="page-transition p-[0.5rem_0]">
                                {/* Digital ID Card */}
                                <div className="bg-[linear-gradient(135deg,_#1e293b_0%,_#0f172a_100%)] rounded-[24px] p-[1.5rem] relative overflow-[hidden] box-shadow-[0_20px_40px_rgba(0,0,0,0.3)] border-[1px_solid_rgba(255,255,255,0.1)] text-[white]">








                
                                    {/* Chip & Logo */}
                                    <div className="flex justify-between items-start mb-[1.5rem]">
                                        <div className="w-[40px] h-[30px] bg-[linear-gradient(135deg,_#fcd34d_0%,_#fbbf24_100%)] rounded-[6px] opacity-80"></div>
                                        <div className="text-right">
                                            <div style={{ letterSpacing: '1px' }} className="text-[0.55rem] font-[900] opacity-60">H&S IDENTIFICATION</div>
                                            <img src="/logo.png" alt="Logo" className="h-[18px] mt-[4px]" style={{ filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div className="flex gap-[1rem] items-center mb-[1.2rem]">
                                        <div className="w-[60px] h-[60px] rounded-[16px] overflow-[hidden] border-[2px_solid_var(--color-primary)] bg-[#1e293b] flex items-center justify-center box-shadow-[0_0_15px_rgba(59,130,246,0.3)]">




                    
                                            {currentUser?.photoURL ?
                    <img src={currentUser.photoURL} alt="Profile" className="w-[100%] h-[100%] object-fit-[cover]" /> :

                    <div className="text-[white] font-[800] text-[1.4rem]">
                                                    {currentUser?.displayName?.charAt(0) || 'P'}
                                                </div>
                    }
                                        </div>
                                        <div className="flex-[1] min-width-[0]">
                                            <div className="text-[1rem] font-[900] line-height-[1.1] white-space-[nowrap] overflow-[hidden] text-overflow-[ellipsis]">
                                                {currentUser?.displayName || 'Profesional H&S'}
                                            </div>
                                            <div className="text-[0.65rem] text-[var(--color-primary)] font-[800] mt-[3px] letter-spacing-[0.5px]">
                                                ESPECIALISTA CERTIFICADO
                                            </div>
                                            <div style={{

                      background: isPro ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)',

                      color: isPro ? '#fcd34d' : '#cbd5e1', border: `1px solid ${isPro ? '#fcd34d44' : '#cbd5e122'}`
                    }} className="inline-block mt-[8px] p-[2px_10px] rounded-[20px] text-[0.6rem] font-[900]">
                                                {isPro ? '⭐ MIEMBRO PRO' : 'PLAN ESTÁNDAR'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR & Number */}
                                    <div className="flex justify-between items-end pt-[1rem]" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div className="min-width-[0]">
                                            <div className="text-[0.5rem] opacity-[0.5] mb-[2px]">NÚMERO DE LICENCIA</div>
                                            <div className="text-[0.6rem] opacity-[0.8] font-family-[monospace] letter-spacing-[1px]">
                                                {currentUser?.uid?.substring(0, 14).toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="bg-[white] p-[4px] rounded-[8px] flex items-center justify-center box-shadow-[0_0_20px_rgba(255,255,255,0.2)]">



                    
                                            <QrCode size={38} color="#0f172a" />
                                        </div>
                                    </div>
                                </div>

                                <button
                onClick={() => {
                  const text = `Esta es la Credencial Digital de Higiene y Seguridad de ${currentUser?.displayName}.\nID: ${currentUser?.uid}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                }} className="w-[100%] mt-[1.2rem] p-[0.9rem] bg-[var(--color-background)] border-[1px_solid_var(--color-border)] rounded-[16px] font-[800] text-[0.85rem] flex items-center justify-center gap-[0.7rem] cursor-pointer text-[var(--color-text)]">







                
                                    <Send size={18} color="var(--color-primary)" /> Compartir mi Perfil
                                </button>
                            </div> :
            activeTab === 'actions' ?
            <div className="grid grid-template-columns-[1fr] gap-[0.75rem]">
                                {quickActions.slice(0, isPro ? 4 : 2).map((action, i) =>
              <button
                key={i}
                onClick={() => {navigate(action.path);setIsOpen(false);}}








                className="hover-lift flex items-center justify-space-between p-[0.9rem_1.1rem] bg-[var(--color-background)] rounded-[16px] border-[1px_solid_var(--color-border)] text-left cursor-pointer w-[100%] transition-[all_0.2s_ease] box-shadow-[0_2px_4px_rgba(0,0,0,0.02)]">
                
                                        <div className="flex items-center gap-[0.9rem]">
                                            <div style={{

                    background: `${action.color}15`,

                    color: action.color
                  }} className="w-[36px] h-[36px] rounded-[10px] flex items-center justify-center">
                                                {action.icon}
                                            </div>
                                            <span className="font-[800] text-[0.9rem] text-[var(--color-text)]">{action.label}</span>
                                        </div>
                                        <ChevronRight size={18} color="var(--color-text-light)" />
                                    </button>
              )}
                                {!isPro && (
                                  <div
                                    onClick={() => navigate('/subscribe')} className="p-[1rem] bg-[rgba(59,_130,_246,_0.04)] rounded-[16px] border-[1px_dashed_rgba(59,_130,_246,_0.3)] text-center cursor-pointer">
                                    <span className="text-[0.8rem] font-[800] text-[var(--color-primary)]">+ Desbloquear acciones PRO</span>
                                  </div>
                                )}
                            </div> :

            <div className="flex flex-col flex-1 min-h-[320px]">
                                <div className="hide-scrollbar flex-1 min-h-[180px] max-h-[360px] overflow-y-auto mb-[0.6rem] flex flex-col gap-[1rem] pr-[4px] pb-[0.5rem]">
                                    {messages.map((m, idx) => (
                                        <div key={idx} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start' }} className="flex gap-[0.5rem] max-w-[90%] animation-[fadeIn_0.3s_ease]">
                                            {m.role === 'ai' && (
                                                <div className="w-[30px] h-[30px] rounded-[50%] bg-[var(--gradient-premium)] flex-shrink-0 flex items-center justify-center box-shadow-[0_4px_10px_rgba(59,_130,_246,_0.2)]">
                                                    <img src="/logo.png" alt="IA" className="w-[18px] h-[18px] filter-[brightness(0)_invert(1)]" />
                                                </div>
                                            )}
                                            <div style={{
                                                borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
                                                background: m.role === 'user' ? 'var(--color-primary)' : 'var(--color-surface)',
                                                color: m.role === 'user' ? '#ffffff' : 'var(--color-text)',
                                                border: m.role === 'user' ? 'none' : '1px solid var(--color-border)',
                                                boxShadow: m.role === 'user' ? '0 6px 14px rgba(59, 130, 246, 0.25)' : 'var(--shadow-sm)'
                                            }} className="p-[0.75rem_1rem] text-[0.85rem] leading-relaxed whitespace-pre-wrap font-medium">
                                                {m.text}
                                            </div>
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div className="flex gap-[0.5rem] align-self-[flex-start] max-w-[88%] animation-[fadeIn_0.3s_ease]">
                                            <div className="w-[30px] h-[30px] rounded-[50%] bg-[var(--gradient-premium)] flex-shrink-0 flex items-center justify-center box-shadow-[0_4px_10px_rgba(59,_130,_246,_0.2)]">
                                                <img src="/logo.png" alt="IA" className="w-[18px] h-[18px] filter-[brightness(0)_invert(1)]" />
                                            </div>
                                            <div className="p-[0.75rem_1rem] rounded-[4px_18px_18px_18px] bg-[var(--color-surface)] border-[1px_solid_var(--color-border)] flex items-center gap-[0.5rem]">
                                                <div className="dot-flashing transform-[scale(0.8)]"></div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Chips de sugerencias ultra compactos */}
                                <div className="hide-scrollbar flex gap-1.5 overflow-x-auto mb-2 pb-1 flex-nowrap" style={{ WebkitOverflowScrolling: 'touch' }}>
                                    {aiTips.map((tip, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setChatInput(tip)}
                                            className="flex-shrink-0 whitespace-nowrap px-3 py-1 bg-[var(--color-background)] border border-[var(--color-border)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] rounded-full text-[0.7rem] font-semibold text-[var(--color-text-muted)] cursor-pointer transition-all"
                                        >
                                            {tip}
                                        </button>
                                    ))}
                                </div>

                                <form onSubmit={handleSendMessage} className="mb-2 w-full">
                                    <div
                                      className="flex items-center gap-1 rounded-[12px] p-1 w-full transition-all bg-[var(--color-surface)] border border-[var(--color-border)] focus-within:border-[var(--color-primary)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 shadow-sm"
                                    >
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder={isTyping ? 'La IA está pensando...' : 'Preguntale algo a la IA...'}
                                            disabled={isTyping}
                                            className="flex-1 min-w-0 h-[34px] py-0 px-2 border-none bg-transparent text-[var(--color-text)] text-[0.85rem] outline-none font-medium placeholder:text-[var(--color-text-muted)]" />
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                            <button
                                                type="button" onClick={handleWeeklyReport} title="Reporte Semanal IA"
                                                style={{ background: '#3b82f6' }}
                                                className="border-none rounded-[8px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer p-0 transition-transform hover:scale-105 active:scale-95 shadow-sm text-white">
                                                <BarChart3 size={16} strokeWidth={2.5} color="#ffffff" className="w-4 h-4 text-white flex-shrink-0" style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', display: 'block' }} />
                                            </button>
                                            <button
                                                type="button" onClick={handleVoiceDictation} title="Dictar por Voz"
                                                style={{ background: isListening ? '#dc2626' : '#10b981' }}
                                                className="border-none rounded-[8px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer p-0 transition-transform hover:scale-105 active:scale-95 shadow-sm text-white">
                                                {isListening ? (
                                                  <Activity size={16} color="#ffffff" className="animate-pulse w-4 h-4 text-white flex-shrink-0" style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', display: 'block' }} />
                                                ) : (
                                                  <Mic size={16} strokeWidth={2.5} color="#ffffff" className="w-4 h-4 text-white flex-shrink-0" style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', display: 'block' }} />
                                                )}
                                            </button>
                                            <button
                                                type="submit" disabled={!chatInput.trim() || isTyping}
                                                style={{
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                    opacity: !chatInput.trim() || isTyping ? 0.45 : 1,
                                                }}
                                                className="border-none rounded-[8px] w-[34px] h-[34px] flex items-center justify-center cursor-pointer transition-transform p-0 flex-shrink-0 hover:scale-105 active:scale-95 shadow-sm text-white">
                                                <Send size={16} strokeWidth={2.5} color="#ffffff" className="w-4 h-4 text-white flex-shrink-0 ml-[1px]" style={{ width: '16px', height: '16px', minWidth: '16px', minHeight: '16px', display: 'block' }} />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                 
                                <div className="flex gap-1.5 w-full mt-1">
                                    <button
                                        onClick={handleSOS}
                                        className="flex-1 py-1 px-1.5 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-md border-none font-black text-[0.68rem] flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all">
                                        <AlertCircle size={13} color="#ffffff" className="flex-shrink-0" /> S.O.S
                                    </button>
                                    <button
                                        onClick={() => setIsScannerOpen(true)}
                                        className="flex-1 py-1 px-1.5 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-md border-none font-extrabold text-[0.68rem] flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all">
                                        <QrCode size={13} color="#ffffff" className="flex-shrink-0" /> Escáner
                                    </button>
                                    <button
                                        onClick={handlePhotoAnalysis}
                                        className="flex-1 py-1 px-1.5 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-md border-none font-extrabold text-[0.68rem] flex items-center justify-center gap-1 cursor-pointer shadow-sm transition-all">
                                        <Camera size={13} color="#ffffff" className="flex-shrink-0" /> {isPro ? 'Visión' : 'PRO'}
                                    </button>
                                </div>
                            </div>
            }
                    </div>
                </div>
            </div>
      }
            
            {isScannerOpen && <GlobalQRScanner onClose={() => setIsScannerOpen(false)} />}

            {/* Backdrop for mobile to click outside and close easily */}
            {isOpen && isMobile &&
      <div

        onClick={() => setIsOpen(false)} className="fixed inset-[0] bg-[rgba(0,0,0,0.4)] z-[9998] backdrop-filter-[blur(2px)]" />

      }

            <div style={{ bottom: isMobile ? '5.5rem' : '2rem', right: isMobile ? '1rem' : '2rem' }} className="fixed z-[9999] pointer-events-[none] transition-[bottom_0.3s_ease]">
                {/* Main Trigger Button */}
                <button
          onClick={toggleAssistant}
          className={`w-[64px] h-[64px] rounded-[50%] bg-[var(--gradient-premium)] border-[1px_solid_rgba(255,255,255,0.2)] flex items-center justify-center text-[white] cursor-pointer pointer-events-[all] box-shadow-[var(--shadow-glow-primary)] transition-[all_0.5s_cubic-bezier(0.175,_0.885,_0.32,_1.275)] relative overflow-[visible] ${!isOpen ? "assistant-trigger-active" : ""}`}
          style={{













            transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)'


          }}>
          
                {isOpen ?
          <X size={28} /> :

          <div className="relative w-[46px] h-[46px]">
                        <img src="/logo.png" alt="Portal" className="w-[100%] h-[100%] object-fit-[contain] filter-[drop-shadow(0_0_10px_rgba(255,255,255,0.4))]" />
                    </div>
          }
                
                {!isOpen &&
          <div style={{
            top: -2, right: -2




          }} className="absolute w-[22px] h-[22px] bg-[var(--color-primary)] rounded-[50%] border-[3px_solid_var(--color-background)] flex items-center justify-center z-[10]">
                        <Sparkles size={10} color="white" fill="white" />
                    </div>
          }
            </button>
            </div>
        </>);

}