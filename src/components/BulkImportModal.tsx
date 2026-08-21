import React, { useState } from 'react';
import { UploadSimple as Upload, FileX, CheckCircle, Warning as AlertTriangle, X, DownloadSimple as Download, ArrowRight } from '@phosphor-icons/react';
import { importExtinguishersFromExcel, downloadBulkImportTemplate, ExtinguisherImportRow, ImportResult } from '../utils/dataImporterExporter';
import toast from 'react-hot-toast';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportConfirmed: (items: ExtinguisherImportRow[]) => Promise<void> | void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImportConfirmed }) => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ImportResult<ExtinguisherImportRow> | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setLoading(true);

    try {
      const parseResult = await importExtinguishersFromExcel(selectedFile);
      setResult(parseResult);
      if (parseResult.importedRows.length > 0) {
        toast.success(`Se leyeron ${parseResult.importedRows.length} filas correctamente`);
      } else if (parseResult.errors.length > 0) {
        toast.error('Ocurrieron errores al parsear el archivo');
      }
    } catch (err) {
      toast.error('Error al abrir el archivo Excel');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    if (!result || result.importedRows.length === 0) {
      toast.error('No hay filas válidas para importar');
      return;
    }

    setLoading(true);
    try {
      await onImportConfirmed(result.importedRows);
      toast.success(`¡Carga masiva completada! ${result.importedRows.length} equipos agregados.`);
      onClose();
      setFile(null);
      setResult(null);
    } catch (err) {
      toast.error('Error al guardar los registros en el sistema');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Upload className="w-6 h-6" />
            <div>
              <h3 className="font-bold text-lg leading-tight">Carga Masiva de Extintores / Equipos</h3>
              <p className="text-xs text-blue-100">Importa inventarios completos desde archivos Excel (.xlsx) o CSV</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Plantilla Descargable Banner */}
          <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 rounded-xl p-4 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-200">¿No tenés el formato estándar?</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300">Descargá la plantilla Excel con las columnas requeridas y datos de muestra.</p>
            </div>
            <button
              onClick={() => downloadBulkImportTemplate()}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors whitespace-nowrap"
            >
              <Download className="w-4 h-4" />
              Descargar Plantilla
            </button>
          </div>

          {/* Area de Carga Drag & Drop */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors bg-slate-50 dark:bg-slate-800/50">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              id="excel-file-input"
              className="hidden"
            />
            <label htmlFor="excel-file-input" className="cursor-pointer flex flex-col items-center gap-2">
              <Upload className="w-10 h-10 text-blue-500 animate-bounce" />
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {file ? file.name : 'Haz clic o arrastra tu archivo Excel aquí'}
              </span>
              <span className="text-xs text-slate-500">Soporta formatos .xlsx y .csv</span>
            </label>
          </div>

          {/* Vista Previa y Errores */}
          {loading && (
            <div className="py-8 text-center text-slate-500 text-sm">
              Procesando archivo Excel...
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 p-3 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                  <div>
                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                      {result.importedRows.length}
                    </div>
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">Filas válidas listas</div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 p-3 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                  <div>
                    <div className="text-lg font-bold text-amber-700 dark:text-amber-300">
                      {result.errors.length}
                    </div>
                    <div className="text-xs text-amber-600 dark:text-amber-400">Errores / Advertencias</div>
                  </div>
                </div>
              </div>

              {/* Lista de vista previa de los primeros 5 elementos */}
              {result.importedRows.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    Vista previa de registros a importar ({result.importedRows.length} total)
                  </div>
                  <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs max-h-40 overflow-y-auto">
                    {result.importedRows.slice(0, 5).map((row, idx) => (
                      <div key={idx} className="p-2.5 flex items-center justify-between bg-white dark:bg-slate-900">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-100">{row.code}</span> — {row.type} ({row.capacity})
                          <div className="text-[11px] text-slate-500">{row.location}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          row.status === 'Operativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {row.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Errores encontrados */}
              {result.errors.length > 0 && (
                <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-lg p-3 text-xs space-y-1">
                  <div className="font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                    <FileX className="w-4 h-4" /> Errores detectados en las filas:
                  </div>
                  {result.errors.map((err, i) => (
                    <div key={i} className="text-rose-600 dark:text-rose-400">
                      • Fila {err.line}: {err.message}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-sm font-semibold transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={!result || result.importedRows.length === 0 || loading}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md transition-colors"
          >
            Confirmar Importación
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
