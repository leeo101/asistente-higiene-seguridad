import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Indent, Outdent, Table as TableIcon, Minus, Undo2, Redo2,
  RemoveFormatting, Sparkles, AlertTriangle, AlertOctagon, Info, CheckCircle2,
  Type, Palette, Highlighter, ChevronDown
} from 'lucide-react';

interface ReportRichEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  templateType?: string;
}

export default function ReportRichEditor({
  value,
  onChange,
  placeholder = 'Escriba o pegue el contenido del informe aquí...',
  templateType = 'general'
}: ReportRichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [selectedFont, setSelectedFont] = useState('sans-serif');
  const [activeFormat, setActiveFormat] = useState({
    bold: false,
    italic: false,
    underline: false,
    strike: false,
    align: 'left'
  });

  // Inicializar contenido
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== value) {
        // Si el valor recibido no es HTML pero tiene texto plano, adaptarlo
        if (value && !/<\/?(p|div|h[1-6]|ul|ol|table|br)/i.test(value)) {
          const formatted = value
            .split(/\r?\n\r?\n/)
            .map(p => `<p>${p.replace(/\r?\n/g, '<br>') || '<br>'}</p>`)
            .join('');
          editorRef.current.innerHTML = formatted;
        } else {
          editorRef.current.innerHTML = value || '<p><br></p>';
        }
      }
      updateCounts();
    }
  }, []); // Solo al montar o sincronizar inicialmente

  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    const cleanText = text.trim();
    setCharCount(cleanText.length);
    setWordCount(cleanText ? cleanText.split(/\s+/).length : 0);
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    updateCounts();
  };

  const exec = (command: string, val: string | undefined = undefined) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const insertHtmlAtCursor = (htmlToInsert: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();
      const el = document.createElement('div');
      el.innerHTML = htmlToInsert;
      const frag = document.createDocumentFragment();
      let node: ChildNode | null;
      let lastNode: ChildNode | null = null;
      while ((node = el.firstChild)) {
        lastNode = frag.appendChild(node);
      }
      range.insertNode(frag);
      if (lastNode) {
        const newRange = range.cloneRange();
        newRange.setStartAfter(lastNode);
        newRange.collapse(true);
        sel.removeAllRanges();
        sel.addRange(newRange);
      }
    } else {
      editorRef.current.innerHTML += htmlToInsert;
    }
    handleInput();
  };

  const handleFontFamily = (font: string) => {
    setSelectedFont(font);
    exec('fontName', font);
  };

  const handleHeading = (tag: string) => {
    if (tag === 'p') {
      exec('formatBlock', '<p>');
    } else {
      exec('formatBlock', `<${tag}>`);
    }
  };

  const handleInsertTable = () => {
    const tableHtml = `
      <table style="width: 100%; border-collapse: collapse; margin: 1rem 0;">
        <thead>
          <tr style="background-color: #f1f5f9;">
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Elemento / Sector</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Condición Detectada</th>
            <th style="border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left;">Acción Requerida</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Sector A</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Conforme</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Mantenimiento preventivo</td>
          </tr>
          <tr>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Sector B</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Observación menor</td>
            <td style="border: 1px solid #cbd5e1; padding: 8px 12px;">Corrección en 48 hs</td>
          </tr>
        </tbody>
      </table>
      <p><br></p>
    `;
    insertHtmlAtCursor(tableHtml);
  };

  const handleInsertCallout = (type: 'info' | 'warning' | 'danger' | 'success') => {
    const titles = {
      info: 'ℹ️ Observación Técnica:',
      warning: '⚠️ Advertencia de Seguridad / Condición Insegura:',
      danger: '🚨 No Conformidad Crítica / Riesgo Grave:',
      success: '✅ Medida Correctiva Implementada:'
    };

    const calloutHtml = `
      <div class="report-callout report-callout-${type}" style="padding: 12px 16px; margin: 14px 0; border-radius: 8px; border-left: 4px solid ${
        type === 'info' ? '#3b82f6' : type === 'warning' ? '#f59e0b' : type === 'danger' ? '#ef4444' : '#10b981'
      }; background-color: ${
        type === 'info' ? '#eff6ff' : type === 'warning' ? '#fffbeb' : type === 'danger' ? '#fef2f2' : '#f0fdf4'
      };">
        <strong>${titles[type]}</strong>
        <p style="margin: 4px 0 0 0;">Describa aquí el detalle específico de la condición observada...</p>
      </div>
      <p><br></p>
    `;
    insertHtmlAtCursor(calloutHtml);
  };

  const handleInsertTemplate = (type: string) => {
    let tpl = '';
    if (type === 'general') {
      tpl = `
        <h2>1. OBJETIVO DE LA INSPECCIÓN</h2>
        <p>El presente informe tiene por finalidad relevar y documentar las condiciones de Higiene, Seguridad y Medio Ambiente de Trabajo en las instalaciones, verificando el cumplimiento de la normativa legal vigente.</p>
        
        <h2>2. MARCO NORMATIVO DE REFERENCIA</h2>
        <p>• Ley de Higiene y Seguridad en el Trabajo N° 19.587 y Decreto Reglamentario 351/79.</p>
        <p>• Ley de Riesgos del Trabajo N° 24.557.</p>
        
        <h2>3. RELEVAMIENTO DE CAMPO Y OBSERVACIONES</h2>
        <p>Durante la recorrida técnica por las distintas áreas operativas se constataron los siguientes puntos:</p>
        
        <div class="report-callout report-callout-warning">
          <strong>⚠️ Observación General:</strong>
          <p>Indicar sectores y riesgos identificados (eléctrico, orden y limpieza, protección contra incendios, ergonomía, etc.).</p>
        </div>

        <h2>4. MEDIDAS CORRECTIVAS Y PREVENTIVAS SUGERIDAS</h2>
        <p>Se recomienda implementar de forma prioritaria las siguientes acciones:</p>
        <ol>
          <li>Regularizar señalización y demarcación de sendas peatonales y salidas de emergencia.</li>
          <li>Verificar carga y accesibilidad de extintores portátiles.</li>
          <li>Capacitar al personal operativo en prácticas seguras de trabajo.</li>
        </ol>

        <h2>5. CONCLUSIÓN Y CIERRE</h2>
        <p>Las mejoras recomendadas deben ejecutarse dentro de los plazos coordinados para garantizar condiciones de trabajo seguras y saludables.</p>
        <p><br></p>
      `;
    } else if (type === 'accident') {
      tpl = `
        <h2>1. DESCRIPCIÓN DEL SUCESO</h2>
        <p>Detalle pormenorizado del acontecimiento: lugar exacto, tarea que se desarrollaba, herramientas o máquinas involucradas y secuencia cronológica de los hechos.</p>

        <h2>2. ANÁLISIS CAUSAL (MÉTODO DEL ÁRBOL DE CAUSAS)</h2>
        <p><strong>Causas Inmediatas (Actos y Condiciones Inseguras):</strong></p>
        <ul>
          <li>Condición insegura detectada: ...</li>
          <li>Acto inseguro / desvío de procedimiento: ...</li>
        </ul>
        <p><strong>Causas Básicas (Factores de Trabajo y Factores Personales):</strong></p>
        <ul>
          <li>Falta de procedimiento estándar o capacitación específica.</li>
        </ul>

        <div class="report-callout report-callout-danger">
          <strong>🚨 Severidad y Clasificación:</strong>
          <p>Evaluación de potencial de daño y tiempo estimado de recuperación.</p>
        </div>

        <h2>3. PLAN DE ACCIONES CORRECTIVAS</h2>
        <ol>
          <li>Readecuación de protecciones en fuente de riesgo.</li>
          <li>Actualización de Análisis de Trabajo Seguro (ATS).</li>
          <li>Charla de inducción operativa a todo el equipo de trabajo.</li>
        </ol>
        <p><br></p>
      `;
    } else if (type === 'training') {
      tpl = `
        <h2>1. TEMA Y ALCANCE DE LA CAPACITACIÓN</h2>
        <p>Objetivo instruccional: Transferir conocimientos teórico-prácticos para el desempeño seguro de las tareas asignadas.</p>

        <h2>2. CONTENIDOS DESARROLLADOS</h2>
        <ul>
          <li>Riesgos específicos de la actividad y métodos de prevención.</li>
          <li>Uso correcto, conservación y limpieza de los Elementos de Protección Personal (EPP).</li>
          <li>Protocolos de actuación ante emergencias y evacuación.</li>
        </ul>

        <h2>3. EVALUACIÓN DE ASIMILACIÓN Y CONCLUSIÓN</h2>
        <p>Se realizó consulta interactiva y práctica directa con los asistentes, verificando comprensión satisfactoria de los procedimientos.</p>
        <p><br></p>
      `;
    } else {
      tpl = `
        <h2>1. INTRODUCCIÓN Y RELEVAMIENTO</h2>
        <p>Detalle de la inspección técnica realizada en el establecimiento.</p>
        <h2>2. HALLAZGOS Y NO CONFORMIDADES</h2>
        <p>Descripción técnica de las desviaciones encontradas.</p>
        <h2>3. PLAN DE ADECUACIÓN</h2>
        <p>Medidas a implementar para subsanar los desvíos.</p>
        <p><br></p>
      `;
    }

    insertHtmlAtCursor(tpl);
  };

  return (
    <div className="report-rich-editor-wrapper w-full flex flex-col rounded-2xl border border-slate-700 bg-slate-900/90 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* BARRA DE HERRAMIENTAS ESTILO WORD */}
      <div className="word-ribbon-toolbar bg-slate-800/95 border-b border-slate-700 p-2 sm:p-3 flex flex-wrap items-center gap-1.5 sm:gap-2 select-none sticky top-0 z-30 shadow-md">
        
        {/* Deshacer / Rehacer */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={() => exec('undo')}
            title="Deshacer (Ctrl+Z)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <Undo2 size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('redo')}
            title="Rehacer (Ctrl+Y)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Formato de Títulos */}
        <div className="flex items-center border-r border-slate-700 pr-1.5 sm:pr-2">
          <select
            onChange={(e) => handleHeading(e.target.value)}
            defaultValue="p"
            className="bg-slate-900 text-slate-200 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            title="Estilo de párrafo"
          >
            <option value="p">Párrafo Normal</option>
            <option value="h1">Título Principal (H1)</option>
            <option value="h2">Subtítulo (H2)</option>
            <option value="h3">Sección (H3)</option>
          </select>
        </div>

        {/* Tipografía */}
        <div className="flex items-center border-r border-slate-700 pr-1.5 sm:pr-2">
          <select
            value={selectedFont}
            onChange={(e) => handleFontFamily(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs font-semibold px-2 py-1.5 rounded-lg border border-slate-700 focus:outline-none focus:border-amber-500 cursor-pointer"
            title="Fuente"
          >
            <option value="sans-serif">Inter / Sans-serif (Moderna)</option>
            <option value="serif">Times / Serif (Formal)</option>
            <option value="monospace">Courier (Técnica)</option>
            <option value="Arial">Arial</option>
            <option value="Calibri">Calibri</option>
          </select>
        </div>

        {/* Estilos Básicos: Negrita, Cursiva, Subrayado, Tachado */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={() => exec('bold')}
            title="Negrita (Ctrl+B)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors font-black"
          >
            <Bold size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('italic')}
            title="Cursiva (Ctrl+I)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors italic"
          >
            <Italic size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('underline')}
            title="Subrayado (Ctrl+U)"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors underline"
          >
            <Underline size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('strikeThrough')}
            title="Tachado"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors line-through"
          >
            <Strikethrough size={16} />
          </button>
        </div>

        {/* Colores de Texto */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1.5 sm:pr-2">
          <span title="Color de texto" className="flex items-center gap-1 text-slate-400 text-xs">
            <Palette size={14} />
          </span>
          <div className="flex items-center gap-1">
            {[
              { color: '#0f172a', label: 'Negro' },
              { color: '#1e40af', label: 'Azul' },
              { color: '#b91c1c', label: 'Rojo' },
              { color: '#047857', label: 'Verde' },
              { color: '#d97706', label: 'Ámbar' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => exec('foreColor', c.color)}
                title={`Texto ${c.label}`}
                style={{ backgroundColor: c.color }}
                className="w-4 h-4 rounded-full border border-slate-600 hover:scale-125 transition-transform"
              />
            ))}
          </div>
        </div>

        {/* Resaltador de Texto */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1.5 sm:pr-2">
          <span title="Resaltador" className="flex items-center gap-1 text-slate-400 text-xs">
            <Highlighter size={14} />
          </span>
          <div className="flex items-center gap-1">
            {[
              { color: '#fef08a', label: 'Amarillo' },
              { color: '#bbf7d0', label: 'Verde suave' },
              { color: '#bae6fd', label: 'Celeste' },
              { color: '#fecdd3', label: 'Rosa' },
              { color: 'transparent', label: 'Sin resaltado' }
            ].map(c => (
              <button
                key={c.color}
                type="button"
                onClick={() => exec('hiliteColor', c.color)}
                title={`Resaltar ${c.label}`}
                style={{ backgroundColor: c.color === 'transparent' ? '#334155' : c.color }}
                className="w-4 h-4 rounded-md border border-slate-600 hover:scale-125 transition-transform"
              />
            ))}
          </div>
        </div>

        {/* Alineación */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={() => exec('justifyLeft')}
            title="Alinear a la izquierda"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <AlignLeft size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyCenter')}
            title="Centrar"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <AlignCenter size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyRight')}
            title="Alinear a la derecha"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <AlignRight size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('justifyFull')}
            title="Justificar texto"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <AlignJustify size={16} />
          </button>
        </div>

        {/* Listas y Sangrías */}
        <div className="flex items-center gap-0.5 border-r border-slate-700 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={() => exec('insertUnorderedList')}
            title="Lista con viñetas"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('insertOrderedList')}
            title="Lista numerada"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <ListOrdered size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('outdent')}
            title="Disminuir sangría"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <Outdent size={16} />
          </button>
          <button
            type="button"
            onClick={() => exec('indent')}
            title="Aumentar sangría"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <Indent size={16} />
          </button>
        </div>

        {/* Inserción: Tablas, Líneas y Cajas de Alerta */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1.5 sm:pr-2">
          <button
            type="button"
            onClick={handleInsertTable}
            title="Insertar Tabla tipo Word"
            className="flex items-center gap-1 px-2 py-1 text-xs font-semibold bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            <TableIcon size={14} /> Tabla
          </button>
          <button
            type="button"
            onClick={() => exec('insertHorizontalRule')}
            title="Línea divisoria horizontal"
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Cajas de Aviso / Callouts Técnicos */}
        <div className="flex items-center gap-1 border-r border-slate-700 pr-1.5 sm:pr-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">Avisos:</span>
          <button
            type="button"
            onClick={() => handleInsertCallout('info')}
            title="Insertar Nota Técnica"
            className="p-1.5 text-blue-400 hover:bg-blue-950/60 rounded-lg transition-colors"
          >
            <Info size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleInsertCallout('warning')}
            title="Insertar Advertencia de Riesgo"
            className="p-1.5 text-amber-400 hover:bg-amber-950/60 rounded-lg transition-colors"
          >
            <AlertTriangle size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleInsertCallout('danger')}
            title="Insertar No Conformidad Crítica"
            className="p-1.5 text-red-400 hover:bg-red-950/60 rounded-lg transition-colors"
          >
            <AlertOctagon size={16} />
          </button>
          <button
            type="button"
            onClick={() => handleInsertCallout('success')}
            title="Insertar Medida Correctiva"
            className="p-1.5 text-emerald-400 hover:bg-emerald-950/60 rounded-lg transition-colors"
          >
            <CheckCircle2 size={16} />
          </button>
        </div>

        {/* Estructuras y Plantillas Rápidas */}
        <div className="flex items-center gap-1 ml-auto">
          <button
            type="button"
            onClick={() => handleInsertTemplate(templateType)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 rounded-lg shadow-sm transition-all"
            title="Insertar esquema estructurado sugerido para este tipo de informe"
          >
            <Sparkles size={14} /> Insertar Estructura
          </button>
          <button
            type="button"
            onClick={() => exec('removeFormat')}
            title="Limpiar formato"
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-700/80 rounded-lg transition-colors"
          >
            <RemoveFormatting size={16} />
          </button>
        </div>
      </div>

      {/* ÁREA DE EDICIÓN ESTILO HOJA DE DOCUMENTO WORD */}
      <div className="editor-canvas-container p-4 sm:p-8 bg-slate-950/80 flex justify-center items-start min-h-[480px] max-h-[750px] overflow-y-auto">
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          data-placeholder={placeholder}
          className="word-page-sheet w-full max-w-[820px] min-h-[420px] bg-white text-slate-900 rounded-lg shadow-2xl p-6 sm:p-10 outline-none transition-all"
          style={{
            fontFamily: selectedFont === 'serif' ? 'Georgia, serif' : selectedFont === 'monospace' ? 'Courier New, monospace' : 'Inter, system-ui, sans-serif',
            fontSize: '1rem',
            lineHeight: 1.65,
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)'
          }}
        />
      </div>

      {/* BARRA INFERIOR DE ESTADO Y MÉTRICAS */}
      <div className="editor-status-bar bg-slate-800/90 border-t border-slate-700/80 px-4 py-2 flex items-center justify-between text-xs text-slate-400 font-medium select-none">
        <div className="flex items-center gap-4">
          <span>Palabras: <strong className="text-slate-200">{wordCount}</strong></span>
          <span>Caracteres: <strong className="text-slate-200">{charCount}</strong></span>
          <span className="hidden sm:inline text-emerald-400 flex items-center gap-1">
            ● Editor enriquecido activo (Formato preservado para impresión)
          </span>
        </div>
        <div className="text-[11px] text-slate-400 italic">
          Tip: Presione Enter para dejar renglones; se mantendrán separados al imprimir.
        </div>
      </div>

      <style>{`
        .word-page-sheet:empty:before {
          content: attr(data-placeholder);
          color: #94a3b8;
          pointer-events: none;
          display: block;
        }
        .word-page-sheet p {
          margin-top: 0;
          margin-bottom: 0.85rem;
          min-height: 1.25em; /* Asegura que renglones vacíos no se colapsen */
        }
        .word-page-sheet p:empty,
        .word-page-sheet p > br:only-child {
          display: inline-block;
          min-height: 1.25em;
          width: 100%;
        }
        .word-page-sheet h1 {
          font-size: 1.5rem;
          font-weight: 800;
          margin-top: 1.25rem;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }
        .word-page-sheet h2 {
          font-size: 1.25rem;
          font-weight: 750;
          margin-top: 1.1rem;
          margin-bottom: 0.45rem;
          color: #1e293b;
        }
        .word-page-sheet h3 {
          font-size: 1.1rem;
          font-weight: 700;
          margin-top: 0.9rem;
          margin-bottom: 0.35rem;
          color: #334155;
        }
        .word-page-sheet ul {
          list-style-type: disc;
          margin: 0.5rem 0 1rem 1.75rem;
        }
        .word-page-sheet ol {
          list-style-type: decimal;
          margin: 0.5rem 0 1rem 1.75rem;
        }
        .word-page-sheet li {
          margin-bottom: 0.3rem;
        }
        .word-page-sheet table {
          width: 100%;
          border-collapse: collapse;
          margin: 1rem 0;
        }
        .word-page-sheet th, .word-page-sheet td {
          border: 1px solid #cbd5e1;
          padding: 8px 12px;
          text-align: left;
        }
        .word-page-sheet th {
          background-color: #f1f5f9;
        }
        .word-page-sheet .report-callout {
          padding: 10px 14px;
          margin: 12px 0;
          border-radius: 8px;
        }
      `}</style>
    </div>
  );
}
