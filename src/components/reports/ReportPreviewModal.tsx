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
        <div className="flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-4 border-b border-slate-700/80 bg-slate-800/90 select-none">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-1.5 sm:p-2 bg-amber-500/20 text-amber-400 rounded-xl shrink-0">
              <FileText size={18} className="sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-lg font-bold text-white leading-tight truncate">
                Vista Previa de Impresión
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-400 hidden sm:block">
                Visualización idéntica al documento A4 final impreso
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={onPrint}
              className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 rounded-xl shadow-lg shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
            >
              <Printer size={15} />
              <span>Imprimir / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-700/60 rounded-xl transition-colors cursor-pointer"
              title="Cerrar vista previa"
            >
              <X size={18} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Contenedor del Documento con Scroll */}
        <div className="flex-1 overflow-y-auto overflow-x-auto p-1.5 sm:p-8 bg-slate-950/70 flex justify-center">
          <div className="w-full max-w-[210mm] bg-white rounded-lg shadow-2xl overflow-hidden border border-slate-300">
            <ProfessionalReportPdfGenerator currentReport={reportData} customId="pdf-modal-preview" />
          </div>
        </div>

        {/* Footer del Modal */}
        <div className="px-3 sm:px-6 py-2 sm:py-3 border-t border-slate-700/80 bg-slate-800/90 flex items-center justify-between text-[11px] sm:text-xs text-slate-400">
          <span className="truncate pr-2">A4 Vertical • Formato preservado</span>
          <button
            onClick={onClose}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors cursor-pointer shrink-0 font-medium"
          >
            Volver a la edición
          </button>
        </div>
      </div>
    </div>
  );
}
