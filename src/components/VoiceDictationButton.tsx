import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { API_BASE_URL } from '../config';

interface VoiceDictationButtonProps {
  onTranscript: (text: string) => void;
  onSmartExtract?: (fields: Record<string, string>) => void;
  placeholder?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  enableAI?: boolean;
}

export default function VoiceDictationButton({
  onTranscript,
  onSmartExtract,
  placeholder = 'Dictar por voz...',
  className = '',
  size = 'md',
  enableAI = false,
}: VoiceDictationButtonProps) {
  const { currentUser } = useAuth();
  const { isPro, requirePro } = usePaywall();
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'es-AR';

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }

      const text = finalTranscript || interimTranscript;
      if (text.trim()) {
        onTranscript(text.trim());

        if (finalTranscript.trim() && enableAI && onSmartExtract) {
          processSmartAI(finalTranscript.trim());
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('[VoiceDictation] Error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast.error('Permiso de micrófono denegado en el navegador');
      } else if (event.error !== 'no-speech') {
        toast.error('No se pudo procesar el audio');
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, [onTranscript, enableAI, onSmartExtract]);

  const processSmartAI = async (spokenText: string) => {
    if (!currentUser || !onSmartExtract) return;
    if (!isPro) {
      requirePro(() => {});
      return;
    }
    setIsProcessingAI(true);
    const toastId = toast.loading('IA estructurando datos dictados...');

    try {
      const token = await currentUser.getIdToken(true);
      const res = await fetch(`${API_BASE_URL}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content: `Eres un estructurador de datos EHS. Analiza la siguiente frase dictada por el usuario y extrae los datos relevantes en formato JSON sin formato adicional con llaves "empresa", "obra", "sector", "tarea", "riesgo", "medida".`
            },
            {
              role: 'user',
              content: spokenText
            }
          ]
        })
      });

      if (res.ok) {
        const data = await res.json();
        const content = data.response || data.content || '';
        const match = content.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          onSmartExtract(parsed);
          toast.success('¡Campos completados por IA!', { id: toastId });
        } else {
          toast.dismiss(toastId);
        }
      } else {
        toast.dismiss(toastId);
      }
    } catch (err) {
      console.error('[VoiceDictation] AI process error:', err);
      toast.dismiss(toastId);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Tu navegador no soporta reconocimiento de voz por hardware');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
        toast('Escuchando dictado...', { icon: '🎙️', duration: 3000 });
      } catch (err) {
        console.error('[VoiceDictation] Start error:', err);
      }
    }
  };

  const buttonSizeClasses = {
    sm: 'w-8 h-8 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-sm',
    lg: 'w-12 h-12 rounded-2xl text-base',
  }[size];

  const iconSizes = { sm: 16, md: 18, lg: 22 }[size];

  const getButtonStyle = (): React.CSSProperties => {
    const dim = size === 'sm' ? '34px' : size === 'lg' ? '46px' : '40px';
    const rad = size === 'sm' ? '8px' : '12px';

    if (isListening) {
      return {
        background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
        color: '#ffffff',
        border: '1px solid #fca5a5',
        boxShadow: '0 4px 15px rgba(239, 68, 68, 0.5)',
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        borderRadius: rad,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        outline: 'none',
      };
    }
    if (isProcessingAI) {
      return {
        background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
        color: '#ffffff',
        border: '1px solid #c4b5fd',
        boxShadow: '0 4px 15px rgba(139, 92, 246, 0.4)',
        width: dim,
        height: dim,
        minWidth: dim,
        minHeight: dim,
        borderRadius: rad,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'wait',
        outline: 'none',
      };
    }
    return {
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: '#ffffff',
      border: '1px solid #6ee7b7',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.4)',
      width: dim,
      height: dim,
      minWidth: dim,
      minHeight: dim,
      borderRadius: rad,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      outline: 'none',
    };
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessingAI}
        title={isListening ? 'Detener dictado' : 'Dictar por voz 🎙️'}
        style={getButtonStyle()}
        className="hover:scale-105 active:scale-95 transition-transform"
      >
        {isProcessingAI ? (
          <Loader2 size={iconSizes} color="#ffffff" className="animate-spin" style={{ stroke: '#ffffff', color: '#ffffff' }} />
        ) : isListening ? (
          <MicOff size={iconSizes} color="#ffffff" className="animate-bounce" style={{ stroke: '#ffffff', color: '#ffffff' }} />
        ) : (
          <div className="flex items-center justify-center">
            <svg 
              width={iconSizes} 
              height={iconSizes} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#ffffff" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              style={{ 
                width: `${iconSizes}px`, 
                height: `${iconSizes}px`, 
                minWidth: `${iconSizes}px`, 
                minHeight: `${iconSizes}px`, 
                stroke: '#ffffff', 
                color: '#ffffff', 
                display: 'block' 
              }}
            >
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" y1="19" x2="12" y2="22" />
            </svg>
          </div>
        )}

        {enableAI && !isListening && !isProcessingAI && (
          <Sparkles size={11} color="#fde047" style={{ position: 'absolute', top: '-3px', right: '-3px', stroke: '#fde047', fill: '#fde047' }} />
        )}
      </button>
    </div>
  );
}
