import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, Bot, ArrowRight, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const steps = [
    {
        id: 'nav',
        title: 'Navegación Intuitiva',
        description: 'En el menú lateral encontrarás todos los módulos del sistema agrupados por categorías: Gestión, Auditorías, Campo e IA.',
        icon: <Compass size={32} className="text-blue-500" />
    },
    {
        id: 'search',
        title: 'Búsqueda Global Ultrarrápida',
        description: 'Presioná Ctrl + K o hacé clic en la barra superior para buscar al instante cualquier módulo, trabajador o documento.',
        icon: <Search size={32} className="text-emerald-500" />
    },
    {
        id: 'ai',
        title: 'Tu Asistente Experto (IA)',
        description: 'EmergencyBot y el Asesor IA están listos para responder dudas normativas o generar un plan de acción en segundos.',
        icon: <Bot size={32} className="text-purple-500" />
    }
];

export default function OnboardingTour() {
    const [isVisible, setIsVisible] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        const isCompleted = localStorage.getItem('onboarding_completed_v1');
        if (!isCompleted) {
            // Small delay so it doesn't jump immediately on load
            const timer = setTimeout(() => setIsVisible(true), 1500);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(c => c + 1);
        } else {
            handleComplete();
        }
    };

    const handleComplete = () => {
        setIsVisible(false);
        localStorage.setItem('onboarding_completed_v1', 'true');
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[24px] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
                >
                    {/* Header Decoration */}
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/20 to-transparent dark:from-blue-500/10 pointer-events-none" />
                    
                    <button 
                        onClick={handleComplete}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors z-10"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-8 pt-10 flex flex-col items-center text-center relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center justify-center mb-6 relative">
                            {steps[currentStep].icon}
                            {currentStep === 0 && <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} className="absolute -top-1 -right-1 text-yellow-400"><Sparkles size={16} /></motion.div>}
                        </div>

                        <motion.div
                            key={currentStep}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mb-4 m-0">
                                {steps[currentStep].title}
                            </h2>
                            <p className="text-slate-600 dark:text-slate-400 leading-relaxed m-0 text-lg">
                                {steps[currentStep].description}
                            </p>
                        </motion.div>
                    </div>

                    {/* Footer / Controls */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                        {/* Progress indicators */}
                        <div className="flex gap-2">
                            {steps.map((_, idx) => (
                                <div 
                                    key={idx}
                                    className={`h-2.5 rounded-full transition-all duration-300 ${idx === currentStep ? 'w-8 bg-blue-500' : 'w-2.5 bg-slate-300 dark:bg-slate-700'}`}
                                />
                            ))}
                        </div>

                        <button 
                            onClick={handleNext}
                            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-[0_4px_14px_rgba(37,99,235,0.4)] cursor-pointer"
                        >
                            {currentStep === steps.length - 1 ? 'Empezar' : 'Siguiente'}
                            {currentStep < steps.length - 1 && <ArrowRight size={18} />}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
