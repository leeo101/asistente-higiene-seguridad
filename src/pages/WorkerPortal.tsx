import React, { useState, useEffect } from 'react';
import { 
  Search, UserCircle, Activity, ShieldCheck, FileText, AlertCircle, Award, 
  CheckCircle2, XCircle, Printer, Share2, HardHat, RefreshCw, FileCheck, Building2, Briefcase
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import AnimatedPage from '../components/AnimatedPage';
import toast from 'react-hot-toast';

export default function WorkerPortal() {
  const { dni: urlDni } = useParams();
  const navigate = useNavigate();
  const [dniInput, setDniInput] = useState(urlDni || '');
  const [searchedDni, setSearchedDni] = useState(urlDni || '');
  const [loading, setLoading] = useState(false);
  const [workerData, setWorkerData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'medical' | 'trainings' | 'ppe' | 'docs'>('medical');

  useEffect(() => {
    if (searchedDni) {
      fetchWorkerData(searchedDni);
    }
  }, [searchedDni]);

  const fetchWorkerData = async (dniToSearch: string) => {
    const cleanDni = dniToSearch.trim().replace(/\./g, '');
    if (!cleanDni) return;

    setLoading(true);
    try {
      // 1. Get Medical Aptitudes from localStorage
      const medDataStr = localStorage.getItem('ehs_medical_db');
      const medData = medDataStr ? JSON.parse(medDataStr) : [];
      const workerAptitudes = medData.filter((m: any) => m.dni && m.dni.replace(/\./g, '') === cleanDni);

      // 2. Get Trainings from localStorage
      const trainDataStr = localStorage.getItem('training_history');
      const trainData = trainDataStr ? JSON.parse(trainDataStr) : [];
      const workerTrainings: any[] = [];
      trainData.forEach((t: any) => {
        if (t.attendees && Array.isArray(t.attendees)) {
          t.attendees.forEach((att: any) => {
            const attDni = (typeof att === 'object' ? att.dni : att)?.toString().replace(/\./g, '');
            if (attDni && attDni.includes(cleanDni)) {
              workerTrainings.push({
                ...t,
                attendeeData: typeof att === 'object' ? att : { name: att }
              });
            }
          });
        }
      });

      // 3. Get PPE Deliveries from localStorage
      const ppeDataStr = localStorage.getItem('ppe_deliveries_db');
      const ppeData = ppeDataStr ? JSON.parse(ppeDataStr) : [];
      const workerPpe = ppeData.filter((p: any) => p.dni && p.dni.replace(/\./g, '') === cleanDni);

      // 4. Get Legajo Info from localStorage & Firestore
      let legajoInfo: any = null;
      const legajosCacheStr = localStorage.getItem('legajos_cache');
      if (legajosCacheStr) {
        try {
          const legajos = JSON.parse(legajosCacheStr);
          legajoInfo = legajos.find((l: any) => l.dni && l.dni.replace(/\./g, '') === cleanDni);
        } catch (e) {
          console.error("Error reading legajos cache", e);
        }
      }

      // Try Firestore query if logged in and missing legajo
      if (!legajoInfo && auth.currentUser) {
        try {
          const legajosRef = collection(db, 'users', auth.currentUser.uid, 'legajos');
          const q = query(legajosRef, where('dni', '==', cleanDni));
          const snapshot = await getDocs(q);
          if (!snapshot.empty) {
            legajoInfo = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
          }
        } catch (e) {
          console.warn("Firestore legajo query skipped:", e);
        }
      }

      // Determine Worker Name & Details
      const name = legajoInfo?.name || 
        (workerAptitudes.length > 0 ? workerAptitudes[0].workerName : null) || 
        (workerTrainings.length > 0 ? workerTrainings[0].attendeeData?.name : null) || 
        'Trabajador Registrado';

      const jobTitle = legajoInfo?.jobTitle || legajoInfo?.puesto || workerAptitudes[0]?.jobTitle || 'Operario / Especialista';
      const company = legajoInfo?.company || legajoInfo?.empresa || 'Empresa General';
      const fileNumber = legajoInfo?.fileNumber || legajoInfo?.legajo || `LEG-${cleanDni.slice(-4)}`;

      // Status check
      const hasValidMedical = workerAptitudes.some((a: any) => 
        (a.result === 'apto' || a.result === 'preexistencias') && 
        new Date(a.expirationDate) > new Date()
      );

      const hasPreexistencias = workerAptitudes.some((a: any) => a.result === 'preexistencias');

      let status = 'HABILITADO';
      if (workerAptitudes.length === 0 && workerTrainings.length === 0 && !legajoInfo) {
        setWorkerData(null);
      } else if (!hasValidMedical && workerAptitudes.length > 0) {
        status = 'NO HABILITADO';
      } else if (hasPreexistencias) {
        status = 'HABILITADO CON RESTRICCIÓN';
      }

      setWorkerData({
        name,
        dni: cleanDni,
        jobTitle,
        company,
        fileNumber,
        photo: legajoInfo?.photo || null,
        emergencyContact: legajoInfo?.emergencyContact || legajoInfo?.telefono || 'No especificado',
        bloodType: legajoInfo?.bloodType || 'A+',
        status,
        aptitudes: workerAptitudes,
        trainings: workerTrainings,
        ppe: workerPpe,
        legajo: legajoInfo
      });
    } catch (err) {
      console.error("Error fetching worker data:", err);
      toast.error("Error al cargar los datos del trabajador");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (dniInput.trim()) {
      navigate(`/worker-portal/${dniInput.trim()}`);
      setSearchedDni(dniInput.trim());
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `Ficha de Habilitación - ${workerData?.name}`,
        text: `Consultá el estado de habilitación laboral de ${workerData?.name} (DNI: ${workerData?.dni})`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Enlace copiado al portapapeles");
    }
  };

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 pt-28 sm:pt-32 pb-16 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          
          {/* Header Icon & Title */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-2xl flex items-center justify-center mx-auto text-blue-600 shadow-sm">
              <ShieldCheck size={32} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white m-0">
              Portal del Trabajador
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto">
              Consulta de credencial digital, aptitud médica y capacitaciones
            </p>
          </div>

          {/* Formulario de Búsqueda con padding exacto e icono Lupa separado */}
          <div className="max-w-xl mx-auto">
            <form onSubmit={handleSearch} className="flex items-center gap-3 w-full">
              {/* Contenedor del Input */}
              <div className="relative flex-1">
                {/* Lupa centrada a la izquierda */}
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none flex items-center justify-center z-10">
                  <Search size={20} />
                </div>

                {/* Input con padding-left forzado para evitar superposición con "Ingrese" */}
                <input 
                  type="text" 
                  placeholder="Ingrese el DNI del trabajador..." 
                  value={dniInput}
                  onChange={(e) => setDniInput(e.target.value)}
                  style={{ paddingLeft: '48px', paddingRight: '16px' }}
                  className="w-full h-12 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 outline-none text-slate-900 dark:text-white font-medium transition-all text-sm shadow-sm"
                />
              </div>

              {/* Botón Buscar al lado externo del cuadro de texto con color Azul */}
              <button 
                type="submit" 
                disabled={loading}
                className="h-12 px-6 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl text-sm transition-all cursor-pointer border-none flex items-center justify-center gap-2 shadow-sm shrink-0">
                {loading ? <RefreshCw size={16} className="animate-spin" /> : null}
                <span>Buscar</span>
              </button>
            </form>
          </div>

          {/* Loading Indicator */}
          {loading && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 text-center space-y-3 animate-pulse max-w-xl mx-auto">
              <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mx-auto" />
            </div>
          )}

          {/* No Results */}
          {searchedDni && !workerData && !loading && (
            <div className="text-center py-10 px-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm max-w-xl mx-auto space-y-3">
              <AlertCircle size={40} className="mx-auto text-slate-400" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 m-0">No se encontraron registros</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                No hay aptitudes médicas ni capacitaciones vinculadas al DNI <strong>{searchedDni}</strong>.
              </p>
            </div>
          )}

          {/* Worker Profile Card */}
          {workerData && !loading && (
            <div className="space-y-5">
              
              {/* Profile Card Header */}
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  
                  {/* Photo Avatar */}
                  <div className="shrink-0">
                    {workerData.photo ? (
                      <img 
                        src={workerData.photo} 
                        alt={workerData.name} 
                        className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shadow-sm"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                        {workerData.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Info Details */}
                  <div className="flex-1 text-center sm:text-left space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white m-0">
                          {workerData.name}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                          {workerData.jobTitle} • {workerData.company}
                        </p>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {workerData.status === 'HABILITADO' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 text-xs font-bold uppercase">
                            <CheckCircle2 size={14} />
                            <span>Habilitado</span>
                          </span>
                        )}
                        {workerData.status === 'HABILITADO CON RESTRICCIÓN' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800 text-xs font-bold uppercase">
                            <AlertCircle size={14} />
                            <span>Con Restricción</span>
                          </span>
                        )}
                        {workerData.status === 'NO HABILITADO' && (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800 text-xs font-bold uppercase">
                            <XCircle size={14} />
                            <span>No Habilitado</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs border-t border-slate-100 dark:border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block">DNI</span>
                        <strong className="text-slate-700 dark:text-slate-200">{workerData.dni}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Legajo</span>
                        <strong className="text-slate-700 dark:text-slate-200">{workerData.fileNumber}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Grupo Sanguíneo</span>
                        <strong className="text-slate-700 dark:text-slate-200">{workerData.bloodType}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Print & Share Actions */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-700/60 no-print">
                  <button
                    onClick={handleShare}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-none">
                    <Share2 size={14} />
                    <span>Compartir</span>
                  </button>
                  <button
                    onClick={handlePrint}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer border-none shadow-sm">
                    <Printer size={14} />
                    <span>Imprimir Carnet</span>
                  </button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 p-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 no-print">
                <button
                  onClick={() => setActiveTab('medical')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    activeTab === 'medical' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  <Activity size={15} />
                  <span>Aptitud Médica ({workerData.aptitudes.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('trainings')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    activeTab === 'trainings' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  <Award size={15} />
                  <span>Capacitaciones ({workerData.trainings.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('ppe')}
                  className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer border-none ${
                    activeTab === 'ppe' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}>
                  <HardHat size={15} />
                  <span>EPP ({workerData.ppe.length})</span>
                </button>
              </div>

              {/* Tab 1: Medical Aptitude */}
              {activeTab === 'medical' && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5 m-0">
                    <Activity size={16} className="text-green-600" />
                    <span>Aptitud Médica</span>
                  </h3>

                  {workerData.aptitudes.length > 0 ? (
                    <div className="space-y-3">
                      {workerData.aptitudes.map((apt: any, i: number) => {
                        const isExpired = new Date(apt.expirationDate) < new Date();
                        return (
                          <div 
                            key={i} 
                            className={`p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border-l-4 ${
                              isExpired ? 'border-red-500' : 'border-green-500'
                            } border-t border-r border-b border-slate-200 dark:border-slate-700/80 space-y-2`}>
                            
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                                {apt.examType === 'pre' ? 'Examen Preocupacional' : 'Examen Periódico'}
                              </span>

                              <span className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                apt.result === 'apto' ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' :
                                apt.result === 'preexistencias' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300' :
                                'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                              }`}>
                                {apt.result === 'apto' ? 'APTO' : apt.result === 'preexistencias' ? 'APTO CON PREEXISTENCIAS' : 'NO APTO'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                              <span>Vencimiento: <strong className={isExpired ? 'text-red-600 dark:text-red-400 font-bold' : 'text-slate-700 dark:text-slate-200'}>{new Date(apt.expirationDate).toLocaleDateString('es-AR')}</strong></span>
                              <span>{apt.clinic || 'Clínica Laboral'}</span>
                            </div>

                            {apt.observations && (
                              <div className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 p-2 rounded border border-amber-200 dark:border-amber-800/50 mt-1">
                                <strong>Obs:</strong> {apt.observations}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs text-center py-4">Sin registros médicos.</p>
                  )}
                </div>
              )}

              {/* Tab 2: Trainings */}
              {activeTab === 'trainings' && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5 m-0">
                    <Award size={16} className="text-blue-600" />
                    <span>Capacitaciones Realizadas</span>
                  </h3>

                  {workerData.trainings.length > 0 ? (
                    <div className="space-y-2">
                      {workerData.trainings.map((t: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{t.topic || 'Capacitación H&S'}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">{new Date(t.date).toLocaleDateString('es-AR')} • {t.duration || 1} hs</div>
                          </div>
                          <span className="text-green-600 dark:text-green-400 text-[11px] font-bold">Acreditado</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs text-center py-4">Sin capacitaciones registradas.</p>
                  )}
                </div>
              )}

              {/* Tab 3: PPE */}
              {activeTab === 'ppe' && (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2.5 m-0">
                    <HardHat size={16} className="text-amber-600" />
                    <span>EPP Entregados</span>
                  </h3>

                  {workerData.ppe.length > 0 ? (
                    <div className="space-y-2">
                      {workerData.ppe.map((p: any, i: number) => (
                        <div key={i} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/80 flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">{p.equipmentName || 'Indumentaria y Calzado'}</div>
                            <div className="text-slate-400 text-[11px] mt-0.5">Entrega: {new Date(p.deliveryDate || Date.now()).toLocaleDateString('es-AR')}</div>
                          </div>
                          <span className="text-blue-600 dark:text-blue-400 text-[11px] font-bold">Entregado</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-400 text-xs text-center py-4">Sin entregas de EPP registradas.</p>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </AnimatedPage>
  );
}
