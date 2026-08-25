import React, { useState, useEffect } from 'react';
import { Microphone, Stop, Check, X, Sparkle, Copy } from '@phosphor-icons/react';
import { toast } from 'react-hot-toast';

interface VoiceInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyText: (text: string) => void;
  fieldLabel?: string;
}

export default function VoiceInputModal({
  isOpen,
  onClose,
  onApplyText,
  fieldLabel = 'Campo de Inspección'
}: VoiceInputModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [formattedText, setFormattedText] = useState('');
  const [isFormatting, setIsFormatting] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recog = new SpeechRecognition();
        recog.continuous = true;
        recog.interimResults = true;
        recog.lang = 'es-ES';

        recog.onresult = (event: any) => {
          let currentResult = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentResult += event.results[i][0].transcript;
          }
          setTranscript((prev) => (prev ? prev + ' ' + currentResult : currentResult));
        };

        recog.onerror = (err: any) => {
          console.error('[SPEECH_RECOGNITION] Error:', err);
          setIsListening(false);
        };

        recog.onend = () => {
          setIsListening(false);
        };

        setRecognition(recog);
      }
    }
  }, []);

  if (!isOpen) return null;

  const handleStartListening = () => {
    if (!recognition) {
      toast.error('Tu navegador no soporta dictado por voz Speech Recognition.');
      return;
    }
    setTranscript('');
    setFormattedText('');
    try {
      recognition.start();
      setIsListening(true);
      toast.success('Escuchando dictado en campo...');
    } catch (e) {
      console.error(e);
    }
  };

  const handleStopListening = () => {
    if (recognition && isListening) {
      recognition.stop();
      setIsListening(false);
    }
  };

  const handleFormatWithAI = () => {
    if (!transcript.trim()) return;
    setIsFormatting(true);
    // Simulación de formateo profesional EHS asistido por IA
    setTimeout(() => {
      const formatted = `[INSPECCIÓN DE CAMPO - OBSERVACIÓN REGISTRADA POR VOZ]\n• Hallazgo: ${transcript.trim()}\n• Recomendación Técnica: Realizar verificación de cumplimiento según norma ISO 45001 / OSHA e implementar acción correctiva inmediata.\n• Fecha y Hora: ${new Date().toLocaleString()}`;
      setFormattedText(formatted);
      setIsFormatting(false);
      toast.success('Texto estructurado con formato EHS profesional');
    }, 1000);
  };

  const handleApply = () => {
    const finalContent = formattedText || transcript;
    if (!finalContent.trim()) {
      toast.error('No hay texto dictado para aplicar');
      return;
    }
    onApplyText(finalContent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Microphone size={22} className="text-rose-400" />
            <h3 className="font-bold text-lg text-white">Dictado Manos Libres en Campo</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <p className="text-slate-300 text-xs">
          Dicta los hallazgos para el campo: <strong className="text-blue-400">{fieldLabel}</strong>.
        </p>

        {/* Dynamic Controls */}
        <div className="flex items-center justify-center gap-4 py-4 bg-slate-950/60 rounded-xl border border-slate-800">
          {!isListening ? (
            <button
              onClick={handleStartListening}
              className="px-5 py-3 rounded-full bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all scale-105"
            >
              <Microphone size={20} /> Iniciar Dictado
            </button>
          ) : (
            <button
              onClick={handleStopListening}
              className="px-5 py-3 rounded-full bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-sm flex items-center gap-2 border border-rose-500/50 animate-pulse"
            >
              <Stop size={20} className="text-rose-500" /> Detener Dictado
            </button>
          )}
        </div>

        {/* Raw Transcript */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-slate-400">Transcripción en vivo:</label>
          <textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            placeholder="El dictado aparecerá aquí..."
            rows={3}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* AI Formatted Text */}
        {transcript && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <button
                onClick={handleFormatWithAI}
                disabled={isFormatting}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5"
              >
                <Sparkle size={16} /> Formatear como Informe Técnico EHS
              </button>
            </div>

            {formattedText && (
              <textarea
                value={formattedText}
                onChange={(e) => setFormattedText(e.target.value)}
                rows={4}
                className="w-full bg-slate-950/80 border border-indigo-500/40 rounded-xl p-3 text-xs text-indigo-200 font-mono focus:outline-none"
              />
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleApply}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-md"
          >
            <Check size={16} /> Aplicar Texto
          </button>
        </div>
      </div>
    </div>
  );
}
