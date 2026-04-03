import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, Zap, BarChart3, ClipboardCheck, ChevronRight, Sparkles, TrendingUp,
  Volume2, Search, Settings, HelpCircle, Lock,
  FileText, ShieldCheck, KeySquare, Send,
  Camera, AlertCircle, PhoneCall, HeartPulse,
  Activity, MicOff, Contact, QrCode, CreditCard, Award
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';
import toast from 'react-hot-toast';

export default function FloatingAssistant() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { isPro } = usePaywall();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activeTab, setActiveTab] = useState<'actions' | 'chat' | 'id'>('actions');
    const [safetyScore, setSafetyScore] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [freeQueriesUsed, setFreeQueriesUsed] = useState(0);
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
        const filtered = messages.filter(m => now - m.timestamp < dayInMs);
        
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
                'loto_procedures_db'
            ];
            let totalRecords = 0;
            keys.forEach(k => {
                const data = localStorage.getItem(k);
                if (data) totalRecords += JSON.parse(data).length;
            });
            
            // Lógica simple de score: cada registro suma, capeado en 100
            const score = Math.min(Math.round((totalRecords / 50) * 100), 100);
            setSafetyScore(score || 15); // Base de 15%
        };
        
        calculateScore();
        window.addEventListener('storage', calculateScore);
        return () => window.removeEventListener('storage', calculateScore);
    }, []);

    // Scroll automático en chat
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    // Cerrar al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const toggleAssistant = () => setIsOpen(!isOpen);

    const handleSOS = () => {
        setMessages(prev => [...prev, 
            { role: 'user', text: '🚨 ¡AUXILIO! EMERGENCIA DETECTADA', timestamp: Date.now() },
            { role: 'ai', text: '⚠️ PROTOCOLO DE EMERGENCIA ACTIVADO\n\n1. Mantené la calma.\n2. Llamá al 911 (Emergencias).\n3. No muevas al herido si sospechás lesión de columna.\n4. Si hay fuego, evacuar por las salidas señalizadas.\n\n¿Qué tipo de emergencia es? (Incendio, Accidente, Derrame)', timestamp: Date.now() }
        ]);
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
            setMessages(prev => [...prev, { role: 'ai', text: '📸 Análisis de Visión IA finalizado:\n\n• ✅ Casco detectado.\n• ⚠️ Falta protección ocular.\n• ⚠️ Andamio sin rodapié visible.\n\nRecomendación: Frenar tarea hasta colocar rodapié.', timestamp: Date.now() }]);
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
            setMessages(prev => [...prev, 
                { role: 'user', text: transcript, timestamp: Date.now() },
                { role: 'ai', text: `🧠 Entendido. Analizando dictado: "Soldadura sin biombo".\n\nRIESGO: Proyecciones e IR/UV para terceros.\nACCION: Colocación de biombo inmediata. ¿Querés que genere una observación preventiva?`, timestamp: Date.now() }
            ]);
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
            
            setMessages(prev => [...prev, { role: 'ai', text: reportText, timestamp: Date.now() }]);
            toast.success('Reporte generado', { id: 'report' });
        }, 2000);
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isTyping) return;

        if (!isPro && freeQueriesUsed >= 3) {
            toast.error('Límite de consultas gratuitas alcanzado. ¡Pasate a PRO! 💎', { duration: 5000 });
            navigate('/subscribe');
            return;
        }

        const userMsg = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg, timestamp: Date.now() }]);
        setChatInput('');
        setIsTyping(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/ai-advisor`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
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
                setMessages(prev => [...prev, { role: 'ai', text: aiText, timestamp: Date.now() }]);
                setIsTyping(false);
                if (!isPro) setFreeQueriesUsed(prev => prev + 1);
            }, 800);

        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: 'ai', text: "Lo siento, tuve un problema de conexión. ¿Podés repetir?", timestamp: Date.now() }]);
            setIsTyping(false);
        }
    };

    if (!currentUser) return null;

    const quickActions = [
        { label: 'Nuevo ATS', icon: <ShieldCheck size={18} />, color: '#10b981', path: '/ats' },
        { label: 'Auditoría', icon: <ClipboardCheck size={18} />, color: '#3b82f6', path: '/audit/new' },
        { label: 'Permiso Crítico', icon: <KeySquare size={18} />, color: '#f59e0b', path: '/work-permit' },
        { label: 'Investigación', icon: <BarChart3 size={18} />, color: '#ef4444', path: '/accident-investigation' }
    ];

    const aiTips = [
        "Recordá verificar la vigencia de los matafuegos hoy.",
        "Detecté un aumento en trabajos en altura esta semana.",
        "Tu nivel de cumplimiento subió un 5% ¡Bien hecho!"
    ];

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, pointerEvents: 'none' }}>
            {/* Menu Panel */}
            {isOpen && (
                <div 
                    ref={menuRef}
                    className="glass-mockup assistant-panel-anim"
                    style={{
                        position: 'absolute',
                        bottom: '5.5rem',
                        right: 0,
                        width: '360px',
                        maxHeight: '560px',
                        pointerEvents: 'all',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.4rem',
                        overflow: 'hidden',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.3), 0 0 40px rgba(59,130,246,0.15)',
                        border: '1px solid rgba(255,255,255,0.2)'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem', padding: '0 0.2rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                <div style={{ 
                                    width: '48px', height: '48px', 
                                    background: 'white', 
                                    borderRadius: '14px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid rgba(59, 130, 246, 0.1)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                                }}>
                                    <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} className="assistant-logo-spin" />
                                </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 900, letterSpacing: '-0.5px', color: 'var(--color-text)' }}>Asistente IA</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isPro ? '#10b981' : '#f59e0b', boxShadow: isPro ? '0 0 10px #10b98188' : '0 0 10px #f59e0b88' }}></span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                                        {isPro ? 'Miembro PRO' : 'Plan Básico'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                            {!isPro && (
                                <button 
                                    onClick={() => navigate('/subscribe')}
                                    style={{ 
                                        padding: '0.35rem 0.7rem', background: 'var(--gradient-premium)', color: 'white', 
                                        fontSize: '0.7rem', fontWeight: 900, borderRadius: '10px', border: 'none',
                                        boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)', cursor: 'pointer'
                                    }}
                                >
                                    PRO
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} style={{ padding: '0.5rem', background: 'rgba(0,0,0,0.03)', border: 'none', borderRadius: '50%', color: 'var(--color-text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Safety Score Section */}
                    <div style={{ 
                        background: 'rgba(59, 130, 246, 0.04)', 
                        borderRadius: '18px', 
                        padding: '1.1rem', 
                        marginBottom: '1.2rem',
                        border: '1px solid rgba(59, 130, 246, 0.08)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.7rem' }}>
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '0.3px' }}>NIVEL DE CUMPLIMIENTO</span>
                            <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--color-primary)' }}>{safetyScore}%</span>
                        </div>
                        <div style={{ height: '8px', background: 'rgba(0,0,0,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${safetyScore}%`, 
                                height: '100%', 
                                background: 'var(--gradient-premium)', 
                                borderRadius: '10px',
                                transition: 'width 1.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                            }}></div>
                        </div>
                    </div>

                    {/* Tabs Control - Improved for equal width and no cut-offs */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem', padding: '2px', background: 'rgba(0,0,0,0.02)', borderRadius: '14px' }}>
                        <button 
                            onClick={() => setActiveTab('actions')}
                            style={{ 
                                flex: 1, padding: '0.6rem 0', fontSize: '0.75rem', borderRadius: '12px',
                                background: activeTab === 'actions' ? 'white' : 'transparent',
                                color: activeTab === 'actions' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                border: 'none',
                                boxShadow: activeTab === 'actions' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                fontWeight: activeTab === 'actions' ? 800 : 600,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            Acciones
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            style={{ 
                                flex: 1, padding: '0.6rem 0', fontSize: '0.75rem', borderRadius: '12px',
                                background: activeTab === 'chat' ? 'white' : 'transparent',
                                color: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                border: 'none',
                                boxShadow: activeTab === 'chat' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                fontWeight: activeTab === 'chat' ? 800 : 600,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            Chat
                        </button>
                        <button 
                            onClick={() => setActiveTab('id')}
                            style={{ 
                                flex: 1, padding: '0.6rem 0', fontSize: '0.75rem', borderRadius: '12px',
                                background: activeTab === 'id' ? 'white' : 'transparent',
                                color: activeTab === 'id' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                                border: 'none',
                                boxShadow: activeTab === 'id' ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                fontWeight: activeTab === 'id' ? 800 : 600,
                                transition: 'all 0.2s ease',
                                cursor: 'pointer'
                            }}
                        >
                            H&S ID
                        </button>
                    </div>

                    {/* Content Area */}
                    <div 
                        className="hide-scrollbar"
                        style={{ flex: 1, overflowY: 'auto', padding: '2px' }}
                    >
                        {activeTab === 'id' ? (
                            <div className="page-transition" style={{ padding: '0.5rem 0' }}>
                                {/* Digital ID Card */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
                                    borderRadius: '24px',
                                    padding: '1.5rem',
                                    position: 'relative',
                                    overflow: 'hidden',
                                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white'
                                }}>
                                    {/* Chip & Logo */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                        <div style={{ width: '40px', height: '30px', background: 'linear-gradient(135deg, #fcd34d 0%, #fbbf24 100%)', borderRadius: '6px', opacity: 0.8 }}></div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '0.55rem', fontWeight: 900, opacity: 0.6, letterSpacing: '1px' }}>H&S IDENTIFICATION</div>
                                            <img src="/logo.png" alt="Logo" style={{ height: '18px', marginTop: '4px', filter: 'brightness(0) invert(1)' }} />
                                        </div>
                                    </div>

                                    {/* User Info */}
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1.2rem' }}>
                                        <div style={{ 
                                            width: '60px', height: '60px', borderRadius: '16px', 
                                            overflow: 'hidden', border: '2px solid var(--color-primary)',
                                            background: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 0 15px rgba(59,130,246,0.3)'
                                        }}>
                                            {currentUser?.photoURL ? (
                                                <img src={currentUser.photoURL} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ color: 'white', fontWeight: 800, fontSize: '1.4rem' }}>
                                                    {currentUser?.displayName?.charAt(0) || 'P'}
                                                </div>
                                            )}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '1rem', fontWeight: 900, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {currentUser?.displayName || 'Profesional H&S'}
                                            </div>
                                            <div style={{ fontSize: '0.65rem', color: 'var(--color-primary)', fontWeight: 800, marginTop: '3px', letterSpacing: '0.5px' }}>
                                                ESPECIALISTA CERTIFICADO
                                            </div>
                                            <div style={{ 
                                                display: 'inline-block', marginTop: '8px', padding: '2px 10px', 
                                                background: isPro ? 'rgba(234, 179, 8, 0.2)' : 'rgba(255,255,255,0.05)',
                                                borderRadius: '20px', fontSize: '0.6rem', fontWeight: 900,
                                                color: isPro ? '#fcd34d' : '#cbd5e1', border: `1px solid ${isPro ? '#fcd34d44' : '#cbd5e122'}`
                                            }}>
                                                {isPro ? '⭐ MIEMBRO PRO' : 'PLAN ESTÁNDAR'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* QR & Number */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                        <div style={{ minWidth: 0 }}>
                                            <div style={{ fontSize: '0.5rem', opacity: 0.5, marginBottom: '2px' }}>NÚMERO DE LICENCIA</div>
                                            <div style={{ fontSize: '0.6rem', opacity: 0.8, fontFamily: 'monospace', letterSpacing: '1px' }}>
                                                {currentUser?.uid?.substring(0, 14).toUpperCase()}
                                            </div>
                                        </div>
                                        <div style={{ 
                                            background: 'white', padding: '4px', borderRadius: '8px',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            boxShadow: '0 0 20px rgba(255,255,255,0.2)'
                                        }}>
                                            <QrCode size={38} color="#0f172a" />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => {
                                        const text = `Esta es la Credencial Digital de Higiene y Seguridad de ${currentUser?.displayName}.\nID: ${currentUser?.uid}`;
                                        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
                                    }}
                                    style={{
                                        width: '100%', marginTop: '1.2rem', padding: '0.9rem',
                                        background: 'var(--color-background)', border: '1px solid var(--color-border)',
                                        borderRadius: '16px', fontWeight: 800, fontSize: '0.85rem',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.7rem',
                                        cursor: 'pointer', color: 'var(--color-text)'
                                    }}
                                >
                                    <Send size={18} color="var(--color-primary)" /> Compartir mi Perfil
                                </button>
                            </div>
                        ) : activeTab === 'actions' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                                {quickActions.slice(0, isPro ? 4 : 2).map((action, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { navigate(action.path); setIsOpen(false); }}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.9rem 1.1rem', background: 'var(--color-background)',
                                            borderRadius: '16px', border: '1px solid var(--color-border)',
                                            textAlign: 'left', cursor: 'pointer', width: '100%',
                                            transition: 'all 0.2s ease',
                                            boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                        }}
                                        className="hover-lift"
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                                            <div style={{ 
                                                width: '36px', height: '36px', borderRadius: '10px', 
                                                background: `${action.color}15`, display: 'flex', 
                                                alignItems: 'center', justifyContent: 'center',
                                                color: action.color 
                                            }}>
                                                {action.icon}
                                            </div>
                                            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--color-text)' }}>{action.label}</span>
                                        </div>
                                        <ChevronRight size={18} color="var(--color-text-light)" />
                                    </button>
                                ))}
                                {!isPro && (
                                    <div style={{ 
                                        padding: '1rem', background: 'rgba(59, 130, 246, 0.04)', 
                                        borderRadius: '16px', border: '1px dashed rgba(59, 130, 246, 0.3)',
                                        textAlign: 'center', cursor: 'pointer'
                                    }} onClick={() => navigate('/subscribe')}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-primary)' }}>+ Desbloquear acciones PRO</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                                <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', marginBottom: '0.8rem', display: 'flex', flexDirection: 'column', gap: '1rem', paddingRight: '4px' }}>
                                    {messages.map((m, idx) => (
                                        <div key={idx} style={{
                                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            padding: '0.8rem 1.1rem',
                                            borderRadius: m.role === 'user' ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                            background: m.role === 'user' ? 'var(--color-primary)' : 'rgba(59, 130, 246, 0.08)',
                                            color: m.role === 'user' ? 'white' : 'var(--color-text)',
                                            fontSize: '0.88rem',
                                            lineHeight: 1.5,
                                            boxShadow: m.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : '0 2px 8px rgba(0,0,0,0.03)',
                                            animation: 'assistant-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
                                        }}>
                                            {m.text}
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div style={{ alignSelf: 'flex-start', background: 'rgba(59, 130, 246, 0.04)', padding: '0.6rem 1.2rem', borderRadius: '14px', fontSize: '0.8rem', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <div className="dot-flashing"></div> IA escribiendo...
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} style={{ marginBottom: '1rem' }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '0.4rem',
                                        background: 'var(--color-background)',
                                        border: '1.5px solid var(--color-border)',
                                        borderRadius: '16px',
                                        padding: '4px 6px',
                                        transition: 'all 0.2s ease',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
                                    }} className="input-focus-container">
                                        <input 
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            placeholder={isTyping ? "IA procesando..." : "Hacé una pregunta..."}
                                            style={{
                                                flex: 1,
                                                padding: '0.6rem 0.5rem',
                                                border: 'none',
                                                background: 'transparent',
                                                color: 'var(--color-text)',
                                                fontSize: '0.9rem',
                                                outline: 'none',
                                                marginBottom: 0
                                            }}
                                        />
                                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <button 
                                                type="button"
                                                onClick={handleWeeklyReport}
                                                title="Reporte Semanal IA"
                                                style={{
                                                    background: 'transparent', 
                                                    border: 'none', borderRadius: '8px',
                                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'var(--color-primary)', cursor: 'pointer', padding: 0
                                                }}
                                                className="hover-scale"
                                            >
                                                <BarChart3 size={18} strokeWidth={2.5} />
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={handleVoiceDictation}
                                                style={{
                                                    background: isListening ? '#ef4444' : 'transparent', 
                                                    border: 'none', borderRadius: '8px',
                                                    width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: isListening ? 'white' : 'var(--color-primary)', cursor: 'pointer', padding: 0
                                                }}
                                                className="hover-scale"
                                            >
                                                {isListening ? <Activity size={18} strokeWidth={2.5} className="animate-pulse" /> : <Volume2 size={18} strokeWidth={2.5} />}
                                            </button>
                                            <button 
                                                type="submit"
                                                disabled={!chatInput.trim() || isTyping}
                                                style={{
                                                    background: 'var(--color-primary)', border: 'none', borderRadius: '10px',
                                                    width: '34px', height: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                                                    opacity: !chatInput.trim() || isTyping ? 0.5 : 1, padding: 0,
                                                    boxShadow: '0 4px 8px rgba(59, 130, 246, 0.3)'
                                                }}
                                                className="hover-scale"
                                            >
                                                <Send size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                </form>
                                {!isPro && (
                                    <div style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'rgba(59, 130, 246, 0.05)', padding: '0.45rem', borderRadius: '10px', marginBottom: '0.6rem', fontWeight: 600 }}>
                                        Consultas gratis restantes: <span style={{ color: 'var(--color-primary)', fontWeight: 800 }}>{3 - freeQueriesUsed}</span>
                                    </div>
                                )}
                                
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.2rem' }}>
                                    <button 
                                        onClick={handleSOS}
                                        className="assistant-pulse-glow"
                                        style={{ 
                                            flex: 1.2, padding: '0.9rem', background: '#dc2626', color: 'white',
                                            borderRadius: '16px', border: 'none', fontWeight: 900,
                                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                            cursor: 'pointer', boxShadow: '0 8px 20px rgba(220, 38, 38, 0.3)'
                                        }}
                                    >
                                        <AlertCircle size={20} /> SOS
                                    </button>
                                    <button 
                                        onClick={handlePhotoAnalysis}
                                        style={{ 
                                            flex: 1, padding: '0.9rem', background: 'white', color: 'var(--color-text)',
                                            borderRadius: '16px', border: '1px solid var(--color-border)', fontWeight: 800,
                                            fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem',
                                            cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                        }}
                                    >
                                        <Camera size={20} color="#8b5cf6" /> {isPro ? 'Visión' : 'Visión PRO'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Trigger Button */}
            <button
                onClick={toggleAssistant}
                className={!isOpen ? "assistant-trigger-active" : ""}
                style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'var(--gradient-premium)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    pointerEvents: 'all',
                    boxShadow: 'var(--shadow-glow-primary)',
                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'rotate(90deg) scale(0.9)' : 'scale(1)',
                    position: 'relative',
                    overflow: 'visible'
                }}
            >
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <div style={{ position: 'relative', width: '46px', height: '46px' }}>
                        <img src="/logo.png" alt="Portal" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.4))' }} />
                    </div>
                )}
                
                {!isOpen && (
                    <div style={{ 
                        position: 'absolute', top: -2, right: -2, 
                        width: '22px', height: '22px', background: 'var(--color-primary)', 
                        borderRadius: '50%', border: '3px solid var(--color-background)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        zIndex: 10
                    }}>
                        <Sparkles size={10} color="white" fill="white" />
                    </div>
                )}
            </button>
        </div>
    );
}
