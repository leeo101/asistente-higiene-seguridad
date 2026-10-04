import React from 'react';
import { X, Printer, Download, Eye, FileText } from 'lucide-react';
import ProfessionalReportPdfGenerator from '../ProfessionalReportPdfGenerator';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportData: any;
  onPrint: () => void;
}

export default function ReportPreviewModal({
  isOpen,
  onClose,
  reportData,
  onPrint
}: ReportPreviewModalProps) {
  if (!isOpen || !reportData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-[960px] h-[92vh] flex flex-col bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header del Modal */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/80 bg-slate-800/90 select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
              <FileText size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Vista Previa de Impresión
              </h2>
              <p className="text-xs text-slate-400">
                Visualización idéntica al documento A4 final impreso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onPrint}
              className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Printer size={16} /> Imprimir / PDF
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Contenedor del Documento con Scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/70 flex justify-center">
          <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            <ProfessionalReportPdfGenerator currentReport={reportData} customId="pdf-modal-preview" />
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-6 py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-xs text-slate-400">
          <span>Formato estándar A4 vertical • Renglones y párrafos preservados</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Volver a la edición
          </button>
        </div>
      </div>
    </div>
  );
}
