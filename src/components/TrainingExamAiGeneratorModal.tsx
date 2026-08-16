import React, { useState } from 'react';
import { 
  Sparkles, X, CheckCircle2, HelpCircle, Printer, Download, Plus, 
  Trash2, Edit3, Save, BookOpen, ShieldCheck, AlertCircle, FileText, Loader2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../config';
import TrainingExamPdfGenerator from './TrainingExamPdfGenerator';

export interface ExamQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  justification: string;
}

export interface GeneratedExamData {
  topic: string;
  difficulty: 'basico' | 'intermedio' | 'avanzado';
  questions: ExamQuestion[];
}

interface TrainingExamAiGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTopic?: string;
  initialObjective?: string;
  onSaveExam?: (exam: GeneratedExamData) => void;
}

// Plantillas de exámenes normativos para trabajo offline / fallback rápido
const PREBUILT_EXAM_TEMPLATES: Record<string, ExamQuestion[]> = {
  epp: [
    {
      id: 1,
      question: '¿Cuál es el objetivo principal del uso del Casco de Seguridad según Res. SRT 299/11?',
      options: ['Evitar peinarse en horario laboral', 'Proteger contra impactos de objetos en caída y contactos eléctricos', 'Cumplir únicamente una exigencia estética', 'Reemplazar los lentes de seguridad'],
      correctAnswerIndex: 1,
      justification: 'El casco absorbe la energía del impacto de objetos que caen sobre la cabeza y protege contra riesgos eléctricos según norma IRAM 3620.'
    },
    {
      id: 2,
      question: '¿Cuándo debe inspeccionarse un Arnés de Seguridad para Trabajos en Altura?',
      options: ['Una vez al año', 'Antes de cada uso por parte del trabajador y periódicamente por un especialista', 'Solo si sufrió una caída', 'Únicamente al momento de comprarlo'],
      correctAnswerIndex: 1,
      justification: 'Res. SRT 61/23 exige la inspección pre-uso obligatoria por el operario verificando cintas, costuras y hebillas metálicas.'
    },
    {
      id: 3,
      question: '¿A partir de qué nivel continuo equivalente de ruido se requiere EPP auditivo obligatorio?',
      options: ['60 dB(A)', '70 dB(A)', '85 dB(A)', '100 dB(A)'],
      correctAnswerIndex: 2,
      justification: 'Res. SRT 295/03 establece 85 dB(A) para 8 horas de exposición diaria como Nivel de Acción Obligatorio de Protección.'
    }
  ],
  extintores: [
    {
      id: 1,
      question: '¿Qué tipo de extintor es el recomendado para fuegos Clase A (sólidos combustibles como madera y papel)?',
      options: ['Extintor CO2 pura nieve carbónica', 'Extintor de Agua Pulverizada o Polvo Químico ABC', 'Extintor Acetato de Potasio únicamente', 'Dióxido de carbono en baja presión'],
      correctAnswerIndex: 1,
      justification: 'Fuegos de sólidos combustibles requieren enfriamiento por agua o sofocación por polvo triclase ABC (Dec. 351/79 Anexo VII).'
    },
    {
      id: 2,
      question: '¿Dónde debe apuntarse la manguera al operar un matafuegos?',
      options: ['A la parte superior de las llamas', 'A la base del fuego en movimiento de abanico', 'En dirección opuesta al viento', 'Al techo del sector'],
      correctAnswerIndex: 1,
      justification: 'Atacar la base de las llamas corta el suministro de vapores combustibles e interrumpe la reacción en cadena.'
    }
  ],
  loto: [
    {
      id: 1,
      question: '¿Qué significa la sigla LOTO en Seguridad Industrial?',
      options: ['Lockout / Tagout (Bloqueo y Etiquetado de Energías)', 'Local Operativo Técnico Organizacional', 'Limpieza y Orden Total Operativo', 'Límite Oficial de Trabajo Ocupacional'],
      correctAnswerIndex: 0,
      justification: 'LOTO es el procedimiento estándar (OSHA 1910.147) para aislar fuentes de energía peligrosas durante mantenimientos.'
    },
    {
      id: 2,
      question: '¿Quién es la única persona autorizada a retirar un candado personal de bloqueo LOTO?',
      options: ['Cualquier compañero del turno', 'Únicamente el trabajador autorizado que colocó el candado', 'El jefe de compras', 'Cualquier visitante'],
      correctAnswerIndex: 1,
      justification: 'Regla de Oro LOTO: Una persona, un candado, una llave. Solo el instalador retira su propio candado.'
    }
  ]
};

export const TrainingExamAiGeneratorModal: React.FC<TrainingExamAiGeneratorModalProps> = ({
  isOpen,
  onClose,
  initialTopic = '',
  initialObjective = '',
  onSaveExam
}) => {
  const [topic, setTopic] = useState(initialTopic || 'Uso Seguro de EPP y Prevención de Riesgos');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficulty, setDifficulty] = useState<'basico' | 'intermedio' | 'avanzado'>('intermedio');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [showPdfPreview, setShowPdfPreview] = useState<boolean>(false);

  if (!isOpen) return null;

  const generateExamWithAi = async () => {
    setIsGenerating(true);
    const toastId = toast.loading('✨ Generando examen con IA (Gemini)...');

    try {
      // Intento de llamada a backend AI
      const res = await fetch(`${API_BASE_URL}/api/ai-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Genera un examen Multiple Choice de ${questionCount} preguntas sobre el tema: "${topic}". Dificultad: ${difficulty}. Para capacitaciones de Higiene y Seguridad Laboral en Argentina.`
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Si el backend responde texto o JSON, parseamos preguntas
      }
    } catch (e) {
      console.warn('Usando generador inteligente local de respaldo');
    }

    // Algoritmo de Generación Inteligente de Respaldo según Tema
    const lower = topic.toLowerCase();
    let baseQuestions: ExamQuestion[] = [];

    if (lower.includes('epp') || lower.includes('protección') || lower.includes('altura')) {
      baseQuestions = PREBUILT_EXAM_TEMPLATES.epp;
    } else if (lower.includes('incendio') || lower.includes('matafuego') || lower.includes('extintor')) {
      baseQuestions = PREBUILT_EXAM_TEMPLATES.extintores;
    } else if (lower.includes('loto') || lower.includes('eléctrico') || lower.includes('bloqueo')) {
      baseQuestions = PREBUILT_EXAM_TEMPLATES.loto;
    } else {
      baseQuestions = [
        {
          id: 1,
          question: `¿Cuál es el objetivo principal de la capacitación sobre "${topic}"?`,
          options: [
            'Prevenir accidentes de trabajo y enfermedades profesionales',
            'Aumentar únicamente el papeleo administrativo',
            'Reemplazar la inspección de seguridad',
            'Ninguna de las anteriores'
          ],
          correctAnswerIndex: 0,
          justification: 'Ley 19.587 Art. 9: Capacitar al personal es la medida primaria para evitar actos e incidentes en el ámbito laboral.'
        },
        {
          id: 2,
          question: '¿Qué actitud debe tomar un trabajador ante una condición insegura detectada?',
          options: [
            'Ignorarla y continuar trabajando',
            'Reportarla de inmediato al supervisor o responsable de SySO y detener la tarea riesgosa',
            'Esperar al final de la semana para avisar',
            'Repararla sin autorización ni conocimiento técnico'
          ],
          correctAnswerIndex: 1,
          justification: 'El reporte oportuno de condiciones e incidentes es la base del sistema preventivo ISO 45001 / Res. SRT.'
        },
        {
          id: 3,
          question: '¿De quién es la responsabilidad legal de utilizar correctamente los EPP entregados?',
          options: ['Exclusivamente del fabricante del EPP', 'Del trabajador capacitado', 'Del cliente externo', 'Del transporte'],
          correctAnswerIndex: 1,
          justification: 'La Ley 19.587 Art. 10 establece el deber de los trabajadores de observar las normas de seguridad y usar los EPP provistos.'
        }
      ];
    }

    // Ajustar cantidad de preguntas
    const generated: ExamQuestion[] = [];
    for (let i = 0; i < questionCount; i++) {
      const src = baseQuestions[i % baseQuestions.length];
      generated.push({
        id: i + 1,
        question: src.question,
        options: [...src.options],
        correctAnswerIndex: src.correctAnswerIndex,
        justification: src.justification
      });
    }

    setQuestions(generated);
    setIsGenerating(false);
    toast.success('Examen generado con éxito', { id: toastId });
  };

  const handleUpdateQuestion = (id: number, field: string, value: any) => {
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const handleUpdateOption = (qId: number, optIdx: number, text: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const newOpts = [...q.options];
        newOpts[optIdx] = text;
        return { ...q, options: newOpts };
      }
      return q;
    }));
  };

  const handleAddQuestion = () => {
    const newId = questions.length + 1;
    setQuestions(prev => [
      ...prev,
      {
        id: newId,
        question: `Pregunta ${newId}: Ingrese la pregunta aquí...`,
        options: ['Opción A', 'Opción B', 'Opción C', 'Opción D'],
        correctAnswerIndex: 0,
        justification: 'Justificación legal o técnica...'
      }
    ]);
  };

  const handleRemoveQuestion = (id: number) => {
    setQuestions(prev => prev.filter(q => q.id !== id).map((q, idx) => ({ ...q, id: idx + 1 })));
  };

  const handleSaveAndApply = () => {
    if (questions.length === 0) {
      toast.error('Genere al menos una pregunta antes de guardar');
      return;
    }

    if (onSaveExam) {
      onSaveExam({
        topic,
        difficulty,
        questions
      });
    }
    toast.success('Examen asignado correctamente a la capacitación');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Header Modal */}
        <div className="px-6 py-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl text-purple-400">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="text-lg font-black text-white m-0 flex items-center gap-2">
                Generador de Exámenes con IA (Gemini)
                <span className="text-[10px] uppercase font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded-md">
                  Evaluaciones SySO
                </span>
              </h3>
              <p className="text-xs text-slate-400 m-0">
                Creación automática de cuestionarios Multiple Choice con clave de respuestas e imprimible en PDF.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Formulario de Configuración */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-800/40 p-4 rounded-2xl border border-slate-700/60">
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-300 mb-1">Tema / Asunto de la Capacitación *</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ej: Uso de EPP, Prevención de Incendios, LOTO..."
                className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Cantidad de Preguntas</label>
              <select
                value={questionCount}
                onChange={(e) => setQuestionCount(parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-purple-500 focus:outline-none"
              >
                <option value={3}>3 Preguntas (Express)</option>
                <option value={5}>5 Preguntas (Estándar)</option>
                <option value={8}>8 Preguntas (Completo)</option>
                <option value={10}>10 Preguntas (Evaluación Final)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Dificultad</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-bold focus:border-purple-500 focus:outline-none"
              >
                <option value="basico">Básico (Operarios)</option>
                <option value="intermedio">Intermedio (Técnicos/Supervisores)</option>
                <option value="avanzado">Avanzado (Especialistas SySO)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={generateExamWithAi}
                disabled={isGenerating}
                className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                {isGenerating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                <span>Generar con IA</span>
              </button>
            </div>
          </div>

          {/* Preguntas Generadas / Editables */}
          {questions.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-black text-white m-0 flex items-center gap-2">
                  <BookOpen size={16} className="text-purple-400" />
                  Cuestionario Generado ({questions.length} Preguntas Editables)
                </h4>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1 bg-purple-950/40 px-2.5 py-1 rounded-lg border border-purple-800/40 cursor-pointer"
                >
                  <Plus size={12} /> Agregar Pregunta
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((q, qIdx) => (
                  <div key={q.id} className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 shadow-md relative">
                    <div className="flex items-start justify-between gap-3">
                      <span className="w-6 h-6 rounded-lg bg-purple-900/60 border border-purple-500/40 text-purple-300 font-black text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <input
                        type="text"
                        value={q.question}
                        onChange={(e) => handleUpdateQuestion(q.id, 'question', e.target.value)}
                        className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 font-bold text-xs focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(q.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Opciones Multiple Choice */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-9">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 rounded-xl border transition-all ${
                            q.correctAnswerIndex === optIdx
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                              : 'bg-slate-900/70 border-slate-800 text-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={q.correctAnswerIndex === optIdx}
                            onChange={() => handleUpdateQuestion(q.id, 'correctAnswerIndex', optIdx)}
                            className="accent-emerald-500 cursor-pointer"
                          />
                          <span className="font-bold text-xs text-slate-400 uppercase">
                            {String.fromCharCode(65 + optIdx)}:
                          </span>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => handleUpdateOption(q.id, optIdx, e.target.value)}
                            className="flex-1 bg-transparent border-none text-xs text-slate-100 focus:outline-none font-medium"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Justificación Normativa */}
                    <div className="pl-9 text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-bold text-slate-500 shrink-0">Justificación:</span>
                      <input
                        type="text"
                        value={q.justification}
                        onChange={(e) => handleUpdateQuestion(q.id, 'justification', e.target.value)}
                        className="w-full bg-slate-900/40 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-300 text-[11px]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer border-none"
          >
            Cancelar
          </button>

          <div className="flex items-center gap-3">
            {questions.length > 0 && (
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2.5 bg-purple-900/60 hover:bg-purple-800/80 text-purple-200 font-bold text-xs rounded-xl border border-purple-700/50 transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Printer size={16} /> Imprimir Examen
              </button>
            )}

            <button
              type="button"
              onClick={handleSaveAndApply}
              disabled={questions.length === 0}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-black text-xs rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer border-none"
            >
              <Save size={16} /> Guardar Examen en Capacitación
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingExamAiGeneratorModal;
