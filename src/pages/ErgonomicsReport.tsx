import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { ArrowLeft, Printer, Share2, CheckCircle2, FileEdit } from 'lucide-react';
import ShareModal from '../components/ShareModal';
import { usePaywall } from '../hooks/usePaywall';
import { toast } from 'react-hot-toast';
import ErgonomicsPdfGenerator from '../components/ErgonomicsPdfGenerator';

export default function ErgonomicsReport(): React.ReactElement | null {
  const { requirePro } = usePaywall();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [signature, setSignature] = useState<any>(null);
  const [showShare, setShowShare] = useState(false);
  const [showSignatures, setShowSignatures] = useState({
    operator: true,
    supervisor: true,
    professional: true
  });

  useEffect(() => {
    window.scrollTo(0, 0);
    const id = searchParams.get('id');
    const history = JSON.parse(localStorage.getItem('ergonomics_history') || '[]');
    const found = history.find((item: any) => String(item.id) === String(id));
    if (found) {
      setData(found);
    }

    const savedProfile = localStorage.getItem('personalData');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {}
    }

    const sig = localStorage.getItem('signatureStampData');
    if (sig) {
      try {
        setSignature(JSON.parse(sig));
      } catch (e) {}
    }
  }, [searchParams]);

  if (!data) {
    return (
      <div className="container max-w-[800px] mx-auto py-16 text-center">
        <h3 className="text-xl font-bold mb-4">Estudio ergonómico no encontrado</h3>
        <button
          onClick={() => navigate('/ergonomics')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm"
        >
          Volver a Ergonomía
        </button>
      </div>
    );
  }

  const handlePrint = () => {
    requirePro(() => {
      const element = document.getElementById('pdf-content');
      if (!element) {
        toast.error('No se pudo generar el documento para imprimir.');
        return;
      }
      document.body.classList.add('printing-isolated');
      element.classList.add('isolated-print-target');

      const cleanup = () => {
        document.body.classList.remove('printing-isolated');
        element.classList.remove('isolated-print-target');
        window.removeEventListener('afterprint', cleanup);
        window.removeEventListener('focus', cleanup);
      };

      window.addEventListener('afterprint', cleanup);
      window.addEventListener('focus', cleanup);
      setTimeout(cleanup, 1500);
      window.print();
    });
  };

  return (
    <div className="container pb-32 max-w-[1000px] mx-auto">
      <ShareModal
        isOpen={showShare}
        open={showShare}
        onClose={() => setShowShare(false)}
        title={`Protocolo Ergonómico Res. SRT 886/15 – ${data.empresa}`}
        text={`📋 Protocolo de Ergonomía Laboral (Res. SRT 886/15)\n🏢 Empresa: ${data.empresa}\n📍 Sector: ${data.sector}\n🪑 Puesto: ${data.puesto}\n⚠️ Nivel de Riesgo: ${data.nivelRiesgoGlobal || data.riesgo || 'N/A'}\n\nGenerado con Asistente H&S`}
        rawMessage={`📋 Protocolo de Ergonomía Laboral (Res. SRT 886/15)\n🏢 Empresa: ${data.empresa}\n📍 Sector: ${data.sector}\n🪑 Puesto: ${data.puesto}\n⚠️ Nivel de Riesgo: ${data.nivelRiesgoGlobal || data.riesgo || 'N/A'}\n\nGenerado con Asistente H&S`}
        elementIdToPrint="pdf-content"
        fileName={`Protocolo_Ergonomia_Res_SRT_886_15_${(data.empresa || 'empresa').replace(/\s+/g, '_')}.pdf`}
      />

      {/* Barra de Navegación Superior */}
      <div className="no-print my-6 flex justify-between items-center flex-wrap gap-4">
        <button
          onClick={() => navigate('/ergonomics')}
          className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={18} /> Volver al listado
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/ergonomics-form', { state: { editData: data } })}
            className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <FileEdit size={14} /> Editar Estudio
          </button>
        </div>
      </div>

      {/* Selector de Firmas (no imprime) */}
      <div className="no-print mb-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center gap-6 flex-wrap">
        <span className="text-xs font-black text-slate-500 uppercase">INCLUIR FIRMAS EN EL REPORTE:</span>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showSignatures.operator}
            onChange={(e) => setShowSignatures((s) => ({ ...s, operator: e.target.checked }))}
            className="accent-blue-600"
          />
          Operador / Trabajador
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showSignatures.supervisor}
            onChange={(e) => setShowSignatures((s) => ({ ...s, supervisor: e.target.checked }))}
            className="accent-blue-600"
          />
          Supervisor / Empleador
        </label>
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={showSignatures.professional}
            onChange={(e) => setShowSignatures((s) => ({ ...s, professional: e.target.checked }))}
            className="accent-blue-600"
          />
          Profesional Actuante
        </label>
      </div>

      {/* Protocolo Oficial Generado */}
      <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4">
        <ErgonomicsPdfGenerator
          data={data}
          profile={profile}
          signature={signature}
          showSignatures={showSignatures}
        />
      </div>

      {/* Floating Action Bar */}
      <div className="no-print floating-action-bar">
        <button
          onClick={() => toast.success('Estudio guardado en tu dispositivo')}
          className="btn-floating-action bg-[#36B37E] text-white"
        >
          <CheckCircle2 size={18} /> GUARDADO
        </button>
        <button
          onClick={() => requirePro(() => setShowShare(true))}
          className="btn-floating-action bg-[#0052CC] text-white"
        >
          <Share2 size={18} /> COMPARTIR
        </button>
        <button
          onClick={handlePrint}
          className="btn-floating-action bg-[#FF8B00] text-white"
        >
          <Printer size={18} /> IMPRIMIR PDF
        </button>
      </div>
    </div>
  );
}