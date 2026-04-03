import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  X, Zap, BarChart3, ClipboardCheck,
  ChevronRight, Sparkles, TrendingUp,
  Volume2, Search, Settings, HelpCircle, Lock,
  FileText, ShieldCheck, KeySquare, Send 
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
    const [activeTab, setActiveTab] = useState<'actions' | 'chat'>('actions');
    const [safetyScore, setSafetyScore] = useState(0);
    const [chatInput, setChatInput] = useState('');
    const [messages, setMessages] = useState<{ role: 'ai' | 'user'; text: string }[]>([
        { role: 'ai', text: '¡Hola! ¿En qué puedo ayudarte con la seguridad hoy?' }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [freeQueriesUsed, setFreeQueriesUsed] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);
    const chatEndRef = useRef<HTMLDivElement>(null);

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

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!chatInput.trim() || isTyping) return;

        if (!isPro && freeQueriesUsed >= 3) {
            toast.error('Límite de consultas gratuitas alcanzado. ¡Pasate a PRO! 💎', { duration: 5000 });
            navigate('/subscribe');
            return;
        }

        const userMsg = chatInput.trim();
        setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
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
                setMessages(prev => [...prev, { role: 'ai', text: aiText }]);
                setIsTyping(false);
                if (!isPro) setFreeQueriesUsed(prev => prev + 1);
            }, 800);

        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: 'ai', text: "Lo siento, tuve un problema de conexión. ¿Podés repetir?" }]);
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
                        bottom: '4.5rem',
                        right: 0,
                        width: '320px',
                        maxHeight: '480px',
                        pointerEvents: 'all',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '1.2rem',
                        overflow: 'hidden'
                    }}
                >
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                <div style={{ 
                                    width: '40px', height: '40px', 
                                    background: 'rgba(255,255,255,0.05)', 
                                    borderRadius: '12px', 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    border: '1px solid var(--color-border)',
                                    boxShadow: 'var(--shadow-sm)'
                                }}>
                                    <img src="/logo.png" alt="Logo" style={{ width: '28px', height: '28px', objectFit: 'contain' }} className="assistant-logo-spin" />
                                </div>
                            <div>
                                <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 900, letterSpacing: '-0.3px' }}>Asistente IA</h4>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: isPro ? '#10b981' : '#f59e0b' }}></span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                        {isPro ? 'PRO Activo' : 'Básico'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            {!isPro && (
                                <button 
                                    onClick={() => navigate('/subscribe')}
                                    style={{ 
                                        padding: '0.3rem 0.6rem', background: 'var(--gradient-premium)', color: 'white', 
                                        fontSize: '0.65rem', fontWeight: 900, borderRadius: '8px', border: 'none',
                                        boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)'
                                    }}
                                >
                                    PRO
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} style={{ padding: '0.4rem', background: 'transparent', border: 'none', color: 'var(--color-text-muted)', cursor: 'pointer', boxShadow: 'none' }}>
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Safety Score Section */}
                    <div style={{ 
                        background: 'rgba(59, 130, 246, 0.05)', 
                        borderRadius: '16px', 
                        padding: '1rem', 
                        marginBottom: '1.2rem',
                        border: '1px solid rgba(59, 130, 246, 0.1)'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>NIVEL DE PREVENCIÓN (HYS)</span>
                            <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--color-primary)' }}>{safetyScore}%</span>
                        </div>
                        <div style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ 
                                width: `${safetyScore}%`, 
                                height: '100%', 
                                background: 'var(--gradient-premium)', 
                                borderRadius: '10px',
                                transition: 'width 1s ease-out'
                            }}></div>
                        </div>
                    </div>

                    {/* Tabs Control */}
                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.2rem' }}>
                        <button 
                            onClick={() => setActiveTab('actions')}
                            style={{ 
                                flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '10px',
                                background: activeTab === 'actions' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'actions' ? 'white' : 'var(--color-text-muted)',
                                border: '1px solid',
                                borderColor: activeTab === 'actions' ? 'var(--color-primary)' : 'var(--color-border)',
                                fontWeight: 800
                            }}
                        >
                            Acciones
                        </button>
                        <button 
                            onClick={() => setActiveTab('chat')}
                            style={{ 
                                flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '10px',
                                background: activeTab === 'chat' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'chat' ? 'white' : 'var(--color-text-muted)',
                                border: '1px solid',
                                borderColor: activeTab === 'chat' ? 'var(--color-primary)' : 'var(--color-border)',
                                fontWeight: 800
                            }}
                        >
                            Chat IA
                        </button>
                    </div>

                    {/* Content Area */}
                    <div 
                        className="hide-scrollbar"
                        style={{ flex: 1, overflowY: 'auto' }}
                    >
                        {activeTab === 'actions' ? (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.6rem' }}>
                                {quickActions.slice(0, isPro ? 4 : 2).map((action, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { navigate(action.path); setIsOpen(false); }}
                                        style={{ 
                                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                            padding: '0.8rem', background: 'var(--color-background)',
                                            borderRadius: '12px', border: '1px solid var(--color-border)',
                                            textAlign: 'left', cursor: 'pointer', width: '100%'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                            <div style={{ color: action.color }}>{action.icon}</div>
                                            <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{action.label}</span>
                                        </div>
                                        <ChevronRight size={16} color="var(--color-text-muted)" />
                                    </button>
                                ))}
                                {!isPro && (
                                    <div style={{ 
                                        padding: '0.8rem', background: 'rgba(59, 130, 246, 0.05)', 
                                        borderRadius: '12px', border: '1px dashed rgba(59, 130, 246, 0.3)',
                                        textAlign: 'center', cursor: 'pointer'
                                    }} onClick={() => navigate('/subscribe')}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>+ Desbloquear acciones PRO</span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                                <div className="hide-scrollbar" style={{ flex: 1, overflowY: 'auto', marginBottom: '1rem', display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                    {messages.map((m, idx) => (
                                        <div key={idx} style={{
                                            alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                                            maxWidth: '85%',
                                            padding: '0.7rem 1rem',
                                            borderRadius: m.role === 'user' ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                                            background: m.role === 'user' ? 'var(--color-primary)' : 'rgba(59, 130, 246, 0.08)',
                                            color: m.role === 'user' ? 'white' : 'var(--color-text)',
                                            fontSize: '0.82rem',
                                            lineHeight: 1.4,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                                            animation: 'assistant-slide-up 0.3s ease-out'
                                        }}>
                                            {m.text}
                                        </div>
                                    ))}
                                    {isTyping && (
                                        <div style={{ alignSelf: 'flex-start', background: 'rgba(59, 130, 246, 0.05)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                            IA escribiendo...
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                <form onSubmit={handleSendMessage} style={{ position: 'relative', display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                    <input 
                                        type="text"
                                        value={chatInput}
                                        onChange={(e) => setChatInput(e.target.value)}
                                        placeholder="Hacé una pregunta..."
                                        style={{
                                            flex: 1,
                                            padding: '0.6rem 2.8rem 0.6rem 1rem',
                                            borderRadius: '12px',
                                            border: '1px solid var(--color-border)',
                                            background: 'var(--color-background)',
                                            color: 'var(--color-text)',
                                            fontSize: '0.85rem',
                                            outline: 'none'
                                        }}
                                    />
                                    <button 
                                        type="submit"
                                        disabled={!chatInput.trim() || isTyping}
                                        style={{
                                            position: 'absolute', right: '5px', top: '50%', transform: 'translateY(-50%)',
                                            background: 'var(--color-primary)', border: 'none', borderRadius: '8px',
                                            width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            color: 'white', cursor: 'pointer', transition: 'all 0.2s',
                                            opacity: !chatInput.trim() || isTyping ? 0.5 : 1
                                        }}
                                    >
                                        <Send size={16} />
                                    </button>
                                </form>
                                {!isPro && (
                                    <div style={{ fontSize: '0.65rem', textAlign: 'center', color: 'var(--color-text-muted)', background: 'rgba(0,0,0,0.02)', padding: '0.4rem', borderRadius: '6px' }}>
                                        Consultas gratis restantes: {3 - freeQueriesUsed}
                                    </div>
                                )}
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
                    <div style={{ position: 'relative', width: '38px', height: '38px' }}>
                        <img src="/logo.png" alt="Portal" style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }} />
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
