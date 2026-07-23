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

  const iconSizes = { sm: 14, md: 18, lg: 22 }[size];

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <button
        type="button"
        onClick={toggleListening}
        disabled={isProcessingAI}
        title={isListening ? 'Detener dictado' : placeholder}
        className={`relative flex items-center justify-center transition-all duration-300 cursor-pointer outline-none border ${buttonSizeClasses} ${
          isListening
            ? 'bg-red-500 text-white border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse'
            : isProcessingAI
            ? 'bg-purple-500/20 text-purple-400 border-purple-500/30 cursor-wait'
            : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border-slate-700 hover:border-slate-600 shadow-sm'
        }`}
      >
        {isProcessingAI ? (
          <Loader2 size={iconSizes} className="animate-spin text-purple-400" />
        ) : isListening ? (
          <MicOff size={iconSizes} className="animate-bounce" />
        ) : (
          <Mic size={iconSizes} className="transition-transform group-hover:scale-110" />
        )}

        {enableAI && !isListening && !isProcessingAI && (
          <Sparkles size={10} className="absolute -top-1 -right-1 text-amber-400 fill-amber-400" />
        )}
      </button>
    </div>
  );
}
