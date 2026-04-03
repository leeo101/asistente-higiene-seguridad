import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bot, X, Plus, Mic, Shield, Zap, 
  MessageSquare, BarChart3, ClipboardCheck, 
  ChevronRight, Sparkles, TrendingUp,
  Volume2, Search, Settings, HelpCircle, Lock
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

export default function FloatingAssistant() {
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useAuth();
    const { isPro } = usePaywall();
    const [isOpen, setIsOpen] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [activeTab, setActiveTab] = useState<'actions' | 'insights'>('actions');
    const [safetyScore, setSafetyScore] = useState(0);
    const menuRef = useRef<HTMLDivElement>(null);

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

    const handleVoiceClick = () => {
        if (!isPro) {
            toast.error('Función exclusiva para usuarios PRO 💎', {
                duration: 4000
            });
            navigate('/subscribe');
            return;
        }
        setIsListening(true);
        toast('🎙️ Escuchando... (Simulación de dictado para campo)', {
            icon: '🎤',
            duration: 3000
        });
        setTimeout(() => {
            setIsListening(false);
            toast.success('IA: "Entendido, preparé un borrador de Inspección en tus borradores."', {
                duration: 4000
            });
        }, 3000);
    };

    if (!currentUser) return null;

    const quickActions = [
        { label: 'Nuevo ATS', icon: <Shield size={18} />, color: '#10b981', path: '/ats/new' },
        { label: 'Auditoría', icon: <ClipboardCheck size={18} />, color: '#3b82f6', path: '/audit/new' },
        { label: 'Permiso Crítico', icon: <Zap size={18} />, color: '#f59e0b', path: '/work-permit/new' },
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
                    className="glass-mockup"
                    style={{
                        position: 'absolute',
                        bottom: '4.5rem',
                        right: 0,
                        width: '320px',
                        maxHeight: '480px',
                        pointerEvents: 'all',
                        animation: 'dropdown-in 0.4s cubic-bezier(0.18, 0.89, 0.32, 1.28) forwards',
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
                                background: 'var(--gradient-premium)', 
                                borderRadius: '12px', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 8px 20px rgba(59, 130, 246, 0.3)'
                            }}>
                                <Bot color="white" size={22} />
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
                            onClick={() => setActiveTab('insights')}
                            style={{ 
                                flex: 1, padding: '0.5rem', fontSize: '0.75rem', borderRadius: '10px',
                                background: activeTab === 'insights' ? 'var(--color-primary)' : 'transparent',
                                color: activeTab === 'insights' ? 'white' : 'var(--color-text-muted)',
                                border: '1px solid',
                                borderColor: activeTab === 'insights' ? 'var(--color-primary)' : 'var(--color-border)',
                                fontWeight: 800
                            }}
                        >
                            Insights IA
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
                                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--color-primary)' }}>+ Desbloquear 15 acciones más (PRO)</span>
                                    </div>
                                )}
                                <button 
                                    onClick={handleVoiceClick}
                                    style={{ 
                                        marginTop: '0.5rem',
                                        display: 'flex', alignItems: 'center', gap: '0.8rem',
                                        padding: '1rem', background: isPro ? 'var(--gradient-premium)' : 'rgba(100, 116, 139, 0.1)',
                                        borderRadius: '12px', border: isPro ? 'none' : '1px solid var(--color-border)', color: isPro ? 'white' : 'var(--color-text-muted)',
                                        cursor: 'pointer', width: '100%', position: 'relative',
                                        overflow: 'hidden'
                                    }}
                                >
                                    {isListening ? (
                                         <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.1)', animation: 'assistant-glow 1s infinite' }} />
                                    ) : null}
                                    {isPro ? <Volume2 size={20} /> : <Lock size={18} />}
                                    <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>
                                        {isListening ? 'Escuchando Obra...' : isPro ? 'Dictado de Campo' : 'Dictado de Campo (PRO)'}
                                    </span>
                                    <Sparkles size={14} style={{ marginLeft: 'auto' }} />
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                {aiTips.slice(0, isPro ? 3 : 1).map((tip, i) => (
                                    <div key={i} style={{ 
                                        display: 'flex', gap: '0.8rem', padding: '0.8rem', 
                                        background: 'rgba(59, 130, 246, 0.05)', borderRadius: '12px',
                                        borderLeft: '3px solid var(--color-primary)'
                                    }}>
                                        <Zap size={16} color="var(--color-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text)', lineHeight: 1.4 }}>{tip}</p>
                                    </div>
                                ))}
                                <div style={{ 
                                    marginTop: '1rem', padding: '1rem', borderRadius: '12px', 
                                    background: 'rgba(0,0,0,0.02)', border: '1px dashed var(--color-border)',
                                    textAlign: 'center'
                                }}>
                                    <HelpCircle size={24} color="var(--color-text-muted)" style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                                        Preguntame algo sobre la normativa vigente o tus reportes.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Main Trigger Button */}
            <button
                onClick={toggleAssistant}
                style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: 'var(--gradient-premium)',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    cursor: 'pointer',
                    pointerEvents: 'all',
                    boxShadow: isOpen ? '0 0 0 10px rgba(59, 130, 246, 0.1)' : '0 10px 25px rgba(59, 130, 246, 0.4)',
                    transition: 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    transform: isOpen ? 'rotate(90deg) scale(0.95)' : 'rotate(0) scale(1)',
                    animation: isOpen ? 'none' : 'assistant-glow 3s infinite'
                }}
            >
                {isOpen ? <X size={28} /> : <Bot size={28} />}
                
                {!isOpen && (
                    <div style={{ 
                        position: 'absolute', top: -5, right: -5, 
                        width: '20px', height: '20px', background: '#ef4444', 
                        borderRadius: '50%', border: '3px solid #fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'white', animation: 'pulse-soft 1.5s infinite' }} />
                    </div>
                )}
            </button>
        </div>
    );
}
