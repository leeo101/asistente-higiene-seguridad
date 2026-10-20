import React, { useState } from 'react';
import {
  FileText, Download, Printer, Eye, Lightning, Fire,
  ShieldCheck, HardHat, Check, X, ArrowRight, Sparkle
} from '@phosphor-icons/react';
import GroundingProtocolPdf from '../GroundingProtocolPdf';
import FireLoadPdfGenerator from '../FireLoadPdfGenerator';
import ATSPdfGenerator from '../ATSPdfGenerator';
import PPEReceiptPdfGenerator from '../PPEReceiptPdfGenerator';
import {
  SAMPLE_GROUNDING_PROTOCOL,
  SAMPLE_FIRE_LOAD_DATA,
  SAMPLE_ATS_DATA,
  SAMPLE_PPE_RECEIPT_DATA
} from '../../data/samplePdfDocuments';
import { printElementAsDocument } from '../../utils/pdfHelper';

type DocType = 'pat' | 'fire' | 'ats' | 'ppe';

interface SamplePdfsSectionProps {
  onStart: () => void;
}

export default function SamplePdfsSection({ onStart }: SamplePdfsSectionProps): React.ReactElement {
  const [activeDoc, setActiveDoc] = useState<DocType | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  const sampleDocs = [
    {
      id: 'pat' as DocType,
      title: 'Protocolo Puesta a Tierra',
      norm: 'Res. SRT 900/15',
      badgeColor: 'from-amber-500 to-amber-600',
      badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      icon: <Lightning size={24} weight="duotone" className="text-amber-400" />,
      desc: 'Medición de jabalinas con telurímetro, cálculo de resistencia admisible (<10 Ω), verificación de diferenciales y dictamen reglamentario AEA 90364.',
      highlights: [
        'Formato oficial SRT Anexo I y II',
        'Certificado de calibración de instrumental INTI',
        'Tabla de continuidad de masas y disyuntores'
      ],
      pdfElementId: 'sample-pdf-pat'
    },
    {
      id: 'fire' as DocType,
      title: 'Estudio de Carga de Fuego',
      norm: 'Dec. 351/79 Anexo VII',
      badgeColor: 'from-orange-500 to-red-600',
      badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
      icon: <Fire size={24} weight="duotone" className="text-orange-400" />,
      desc: 'Cálculo de poder calorífico, madera equivalente en kg/m², resistencia al fuego requerida (F30/F60/F90) y potencial extintor mínimo.',
      highlights: [
        'Cálculo ponderado según Ley 19.587',
        'Matriz de potencial extintor nominal',
        'Exigencia de hidrantes y rociadores'
      ],
      pdfElementId: 'sample-pdf-fire'
    },
    {
      id: 'ats' as DocType,
      title: 'ATS con Cálculo de Caída',
      norm: 'Res. SRT 61/23 · Dec. 911',
      badgeColor: 'from-emerald-500 to-teal-600',
      badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
      icon: <ShieldCheck size={24} weight="duotone" className="text-emerald-400" />,
      desc: 'Análisis de Trabajo Seguro en altura con cálculo de Distancia Libre de Caída (DLC = 4.80 m), firmas digitales por QR y checklist operativo.',
      highlights: [
        'Cálculo de DLC con disipador de energía',
        'Verificación de punto de anclaje (22 kN)',
        'Firmas de capataz, operario y profesional'
      ],
      pdfElementId: 'sample-pdf-ats'
    },
    {
      id: 'ppe' as DocType,
      title: 'Constancia de Entrega de EPP',
      norm: 'Res. SRT 299/11',
      badgeColor: 'from-blue-500 to-indigo-600',
      badgeBg: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
      icon: <HardHat size={24} weight="duotone" className="text-blue-400" />,
      desc: 'Planilla oficial exigible por ART con certificación bajo normas IRAM, número de entrega, firma de recepción del trabajador y acuse legal.',
      highlights: [
        'Certificación IRAM 3610 / 3620 / 3630',
        'Control de vida útil y recambio',
        'Declaración jurada y validez judicial'
      ],
      pdfElementId: 'sample-pdf-ppe'
    }
  ];

  const handlePrint = async (elementId: string, title: string) => {
    setIsPrinting(true);
    try {
      await printElementAsDocument(elementId, title, false);
    } catch (err) {
      console.error('Error al imprimir muestra:', err);
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <section id="muestras-pdf" className="py-24 px-4 sm:px-8 max-w-7xl mx-auto border-t border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-blue-400 text-xs font-bold uppercase tracking-wider bg-blue-500/10 border border-blue-500/20 px-3 py-1 rounded-full inline-flex items-center gap-1.5">
          <Sparkle size={13} weight="fill" /> Calidad de Impresión Vectorial
        </span>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          Informes Técnicos y PDFs de Muestra
        </h2>
        <p className="text-sm sm:text-base text-slate-300">
          Comprobá la calidad visual, foliado, doble membrete y rigor normativo de los documentos generados con el Asistente H&S antes de registrarte.
        </p>
      </div>

      {/* Grid de las 4 tarjetas de muestra */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {sampleDocs.map((doc) => (
          <div
            key={doc.id}
            className="bg-slate-900/70 rounded-2xl border border-white/10 p-6 flex flex-col justify-between hover:border-blue-500/50 hover:shadow-xl hover:shadow-blue-500/10 transition-all group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 group-hover:scale-110 transition-transform">
                  {doc.icon}
                </div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-wider ${doc.badgeBg}`}>
                  {doc.norm}
                </span>
              </div>

              <h3 className="text-base font-bold text-white mb-2 group-hover:text-blue-300 transition-colors">
                {doc.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mb-4">
                {doc.desc}
              </p>

              <ul className="space-y-2 mb-6 border-t border-white/5 pt-4 text-[11px] text-slate-300">
                {doc.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check size={13} className="text-emerald-400 shrink-0" weight="bold" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => setActiveDoc(doc.id)}
                className="w-full py-2.5 px-3 bg-white/5 hover:bg-white/10 text-white text-xs font-bold rounded-xl border border-white/15 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Eye size={15} weight="bold" />
                <span>Ver Muestra en Pantalla</span>
              </button>
              <button
                onClick={() => handlePrint(doc.pdfElementId, doc.title)}
                disabled={isPrinting}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer border-none"
              >
                <Printer size={15} weight="bold" />
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal de Vista Previa de Muestra */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-[980px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header del Modal */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 select-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
                  <FileText size={20} weight="duotone" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                    {sampleDocs.find(d => d.id === activeDoc)?.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Formato oficial A4 · Respaldo normativo argentino con QR y firmas digitales
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const current = sampleDocs.find(d => d.id === activeDoc);
                    if (current) handlePrint(current.pdfElementId, current.title);
                  }}
                  disabled={isPrinting}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-500/20 transition-all cursor-pointer border-none"
                >
                  <Printer size={16} weight="bold" />
                  <span>Imprimir / Guardar PDF</span>
                </button>
                <button
                  onClick={() => setActiveDoc(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-none bg-transparent"
                  title="Cerrar vista previa"
                >
                  <X size={20} weight="bold" />
                </button>
              </div>
            </div>

            {/* Selector de pestañas dentro del modal */}
            <div className="flex items-center gap-2 px-6 py-2.5 bg-slate-950/50 border-b border-slate-800 overflow-x-auto text-xs">
              {sampleDocs.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDoc(doc.id)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer border-none ${
                    activeDoc === doc.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {doc.title}
                </button>
              ))}
            </div>

            {/* Contenedor del Documento con Scroll */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/80 flex justify-center">
              <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl p-4 sm:p-6 text-slate-900 border border-slate-300">
                {activeDoc === 'pat' && (
                  <GroundingProtocolPdf
                    data={SAMPLE_GROUNDING_PROTOCOL}
                    customId="sample-pdf-pat-modal"
                  />
                )}
                {activeDoc === 'fire' && (
                  <FireLoadPdfGenerator
                    data={SAMPLE_FIRE_LOAD_DATA}
                    customId="sample-pdf-fire-modal"
                  />
                )}
                {activeDoc === 'ats' && (
                  <ATSPdfGenerator
                    atsData={SAMPLE_ATS_DATA}
                    pdfElementId="sample-pdf-ats-modal"
                  />
                )}
                {activeDoc === 'ppe' && (
                  <PPEReceiptPdfGenerator
                    receiptData={SAMPLE_PPE_RECEIPT_DATA.receiptData}
                    items={SAMPLE_PPE_RECEIPT_DATA.items}
                    customId="sample-pdf-ppe-modal"
                  />
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <Check size={14} weight="bold" /> Compatible con cualquier impresora o exportador a PDF
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveDoc(null)}
                  className="px-3 py-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                >
                  Cerrar
                </button>
                <button
                  onClick={onStart}
                  className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer border-none"
                >
                  <span>Crear el Mío Gratis</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Elementos ocultos offscreen para descarga directa */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px', width: '210mm' }}>
        <div id="sample-pdf-pat">
          <GroundingProtocolPdf data={SAMPLE_GROUNDING_PROTOCOL} customId="sample-pdf-pat-print" />
        </div>
        <div id="sample-pdf-fire">
          <FireLoadPdfGenerator data={SAMPLE_FIRE_LOAD_DATA} customId="sample-pdf-fire-print" />
        </div>
        <div id="sample-pdf-ats">
          <ATSPdfGenerator atsData={SAMPLE_ATS_DATA} pdfElementId="sample-pdf-ats-print" />
        </div>
        <div id="sample-pdf-ppe">
          <PPEReceiptPdfGenerator
            receiptData={SAMPLE_PPE_RECEIPT_DATA.receiptData}
            items={SAMPLE_PPE_RECEIPT_DATA.items}
            customId="sample-pdf-ppe-print"
          />
        </div>
      </div>
    </section>
  );
}
