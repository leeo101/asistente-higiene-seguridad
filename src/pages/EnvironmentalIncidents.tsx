import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Leaf, Plus, Search, FileText, Eye, Edit3, Trash2, ArrowLeft,
  AlertTriangle, Camera, CheckCircle2, XCircle, Droplets, Wind, Share2,
  Link as LinkIcon } from
'lucide-react';
import Breadcrumbs from '../components/Breadcrumbs';
import PremiumHeader from '../components/PremiumHeader';
import ConfirmModal from '../components/ConfirmModal';
import ShareModal from '../components/ShareModal';
import EnvironmentalIncidentPdf from '../components/EnvironmentalIncidentPdf';
import EmptyStateIllustrated from '../components/EmptyStateIllustrated';
import toast from 'react-hot-toast';

const INCIDENT_TYPES = ['Derrame / Fuga', 'Emisión a la Atmósfera', 'Gestión Inadecuada de Residuos', 'Queja de la Comunidad', 'Ruido Ambiental', 'Incendio / Explosión', 'Otro'];
const SEVERITIES = [
{ label: 'Leve', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
{ label: 'Moderado', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
{ label: 'Grave', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' },
{ label: 'Crítico', color: 'text-red-800 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' }];

const STATUSES = ['Reportado', 'En Investigación', 'Cerrado'];

export default function EnvironmentalIncidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [view, setView] = useState<'list' | 'form' | 'detail'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentIncident, setCurrentIncident] = useState<any>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [shareItem, setShareItem] = useState<any>(null);

  // Form states
  const [formData, setFormData] = useState<any>({
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    area: '',
    type: 'Derrame / Fuga',
    severity: 'Leve',
    agent: '',
    volume: '',
    description: '',
    immediateActions: '',
    affectedMedia: [],
    status: 'Reportado',
    photos: []
  });

  // File input ref
  const fileRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const loadData = () => {
      const saved = localStorage.getItem('environmental_incidents_db');
      if (saved) setIncidents(JSON.parse(saved));
    };
    loadData();
  }, []);

  const saveIncidents = (data: any[]) => {
    localStorage.setItem('environmental_incidents_db', JSON.stringify(data));
    setIncidents(data);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setFormData((prev) => ({ ...prev, photos: [...(prev.photos || []), reader.result] }));
        }
      };
      reader.readAsDataURL(file);
    });
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleRemovePhoto = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      photos: prev.photos.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleMediaChange = (media: string) => {
    setFormData((prev) => {
      const list = prev.affectedMedia || [];
      if (list.includes(media)) return { ...prev, affectedMedia: list.filter((m: string) => m !== media) };
      return { ...prev, affectedMedia: [...list, media] };
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    let newIncidents = [...incidents];
    if (currentIncident && currentIncident.id) {
      newIncidents = newIncidents.map((inc) => inc.id === currentIncident.id ? { ...formData, id: currentIncident.id, updatedAt: new Date().toISOString() } : inc);
      toast.success('Incidente actualizado');
    } else {
      const newIncident = {
        ...formData,
        id: `E-INC-${Date.now().toString().slice(-6)}`,
        createdAt: new Date().toISOString(),
        capaId: null
      };
      newIncidents.unshift(newIncident);
      toast.success('Incidente registrado');
    }

    saveIncidents(newIncidents);
    setView('list');
  };

  const handleDelete = () => {
    if (confirmDelete) {
      saveIncidents(incidents.filter((inc) => inc.id !== confirmDelete));
      toast.success('Incidente eliminado');
      setConfirmDelete(null);
      setView('list');
    }
  };

  const createCapa = (incident: any) => {
    // Enviar al módulo CAPA pasando datos del incidente
    const draftCapa = {
      title: `Acción por Incidente Ambiental: ${incident.type}`,
      description: `Relacionado al incidente ${incident.id} ocurrido el ${incident.date} en ${incident.location}.\nDescripción original: ${incident.description}`,
      origin: 'Incidente Ambiental',
      sourceId: incident.id,
      status: 'Draft'
    };
    // Lo mandamos al formulario de CAPA pre-completado (si CAPAManager lo soporta via localStorage o state)
    // Por simplicidad, navegamos con state
    navigate('/capa-manager', { state: { draftCapa, fromIncident: incident.id } });
  };

  const filteredIncidents = incidents.filter((inc) =>
  inc.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  inc.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  inc.type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: incidents.length,
    open: incidents.filter((i) => i.status !== 'Cerrado').length,
    critical: incidents.filter((i) => i.severity === 'Crítico' || i.severity === 'Grave').length,
    closed: incidents.filter((i) => i.status === 'Cerrado').length
  };

  // --- Render List View ---
  if (view === 'list') {
    return (
      <div className={`container mx-auto px-4 pt-24 pb-12`}>
                <ShareModal
          isOpen={!!shareItem}
          open={!!shareItem}
          onClose={() => setShareItem(null)}
          title="Incidente Ambiental"
          text={`Incidente ${shareItem?.id} - ${shareItem?.type}`}
          rawMessage={`Incidente ${shareItem?.id} - ${shareItem?.type}`}
          elementIdToPrint="pdf-content-hidden"
          fileName={`Incidente_${shareItem?.id || 'Env'}.pdf`} />
        
                
                <div className="ats-pdf-offscreen">
                    {shareItem && <EnvironmentalIncidentPdf report={shareItem} />}
                </div>

                <Breadcrumbs />
                
                <PremiumHeader
          title="Incidentes Ambientales"
          subtitle="Registro y seguimiento según ISO 14001"
          icon={<Leaf size={32} color="#ffffff" />}
          color="linear-gradient(135deg, #10b981 0%, #059669 100%)">
          
                    <button onClick={() => {
            setFormData({
              date: new Date().toISOString().split('T')[0],
              time: '', location: '', area: '', type: 'Derrame / Fuga', severity: 'Leve',
              agent: '', volume: '', description: '', immediateActions: '', affectedMedia: [], status: 'Reportado', photos: []
            });
            setCurrentIncident(null);
            setView('form');
          }} className="flex items-center gap-2 bg-white text-emerald-600 px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-50 transition-colors shadow-sm">
                        <Plus size={20} /> Nuevo Incidente
                    </button>
                </PremiumHeader>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500">
                            <Leaf size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-500">Total</div>
                            <div className="text-2xl font-black">{stats.total}</div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-500">Abiertos</div>
                            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{stats.open}</div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-500">Críticos/Graves</div>
                            <div className="text-2xl font-black text-red-600 dark:text-red-400">{stats.critical}</div>
                        </div>
                    </div>
                    <div className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-500">
                            <CheckCircle2 size={24} />
                        </div>
                        <div>
                            <div className="text-sm font-bold text-slate-500">Cerrados</div>
                            <div className="text-2xl font-black text-green-600 dark:text-green-400">{stats.closed}</div>
                        </div>
                    </div>
                </div>

                <div className="mb-6 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
            type="text"
            placeholder="Buscar incidentes por ubicación, tipo o ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none" />
          
                </div>

                {filteredIncidents.length === 0 ?
        <EmptyStateIllustrated
          icon={<Leaf size={48} />}
          title="Sin Incidentes Ambientales"
          description="No se encontraron registros. Podés reportar un nuevo incidente arriba."
          onAction={() => setView('form')} /> :


        <div className="flex flex-col gap-4">
                        {filteredIncidents.map((inc) => {
            const sevConfig = SEVERITIES.find((s) => s.label === inc.severity) || SEVERITIES[0];
            return (
              <div key={inc.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:shadow-md">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${sevConfig.bg} ${sevConfig.color}`}>
                                            {inc.type.includes('Derrame') ? <Droplets size={24} /> : inc.type.includes('Emisión') ? <Wind size={24} /> : <AlertTriangle size={24} />}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-bold text-slate-900 dark:text-white m-0 text-lg">{inc.type}</h3>
                                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${sevConfig.bg} ${sevConfig.color}`}>{inc.severity}</span>
                                            </div>
                                            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-3 flex-wrap">
                                                <span><strong className="text-slate-700 dark:text-slate-300">ID:</strong> {inc.id}</span>
                                                <span>•</span>
                                                <span><strong className="text-slate-700 dark:text-slate-300">Ubicación:</strong> {inc.location}</span>
                                                <span>•</span>
                                                <span><strong className="text-slate-700 dark:text-slate-300">Fecha:</strong> {new Date(inc.date).toLocaleDateString('es-AR')}</span>
                                            </div>
                                            {inc.capaId &&
                    <div className="mt-2 text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                                    <LinkIcon size={12} /> Vinculado a CAPA: {inc.capaId}
                                                </div>
                    }
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <div className="text-sm font-bold text-slate-500 mr-2">
                                            {inc.status}
                                        </div>
                                        <button onClick={() => {setCurrentIncident(inc);setFormData(inc);setView('form');}} className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors" title="Editar">
                                            <Edit3 size={18} />
                                        </button>
                                        <button onClick={() => setShareItem(inc)} className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors" title="Exportar PDF">
                                            <FileText size={18} />
                                        </button>
                                        <button onClick={() => setConfirmDelete(inc.id)} className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors" title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>);

          })}
                    </div>
        }
                
                <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="¿Eliminar registro?"
          message="Se borrará permanentemente este reporte de incidente."
          iconEmoji="🗑️" />
        
            </div>);

  }

  // --- Render Form View ---
  return (
    <div className={`container mx-auto px-4 pt-24 pb-12 max-w-4xl`}>
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => setView('list')} className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-3xl font-black text-slate-900 dark:text-white m-0">
                    {currentIncident ? 'Editar Incidente' : 'Reportar Incidente'}
                </h1>
            </div>

            <form onSubmit={handleSave} className="bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 md:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Fecha</label>
                        <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Hora</label>
                        <input type="time" required value={formData.time} onChange={(e) => setFormData({ ...formData, time: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ubicación / Sector</label>
                        <input type="text" required placeholder="Ej. Depósito de Químicos" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Área Responsable</label>
                        <input type="text" placeholder="Ej. Mantenimiento" value={formData.area} onChange={(e) => setFormData({ ...formData, area: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none" />
                    </div>
                </div>

                <div className="mb-8 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><AlertTriangle className="text-emerald-500" /> Clasificación del Incidente</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Tipo de Incidente</label>
                            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none">
                                {INCIDENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Gravedad Estimada</label>
                            <select value={formData.severity} onChange={(e) => setFormData({ ...formData, severity: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none">
                                {SEVERITIES.map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Sustancia / Agente</label>
                            <input type="text" placeholder="Ej. Aceite Hidráulico" value={formData.agent} onChange={(e) => setFormData({ ...formData, agent: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Volumen Estimado</label>
                            <input type="text" placeholder="Ej. 50 Litros" value={formData.volume} onChange={(e) => setFormData({ ...formData, volume: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none" />
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Medio Afectado (Seleccionar múltiples)</label>
                        <div className="flex gap-3 flex-wrap">
                            {['Aire', 'Agua (Superficial/Subterránea)', 'Suelo', 'Flora/Fauna'].map((m) =>
              <button
                type="button"
                key={m}
                onClick={() => handleMediaChange(m)}
                className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${formData.affectedMedia.includes(m) ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                
                                    {m}
                                </button>
              )}
                        </div>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Descripción Detallada</label>
                    <textarea required rows={4} placeholder="¿Qué sucedió? ¿Cómo se detectó?" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Acciones Inmediatas de Contención</label>
                    <textarea rows={3} placeholder="¿Qué se hizo inmediatamente para contener el impacto?" value={formData.immediateActions} onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none resize-none" />
                </div>

                {/* Evidencia Fotográfica */}
                <div className="mb-8">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex justify-between items-center">
                        Registro Fotográfico
                        <button type="button" onClick={() => fileRef.current?.click()} className="text-emerald-600 flex items-center gap-1 text-sm bg-emerald-50 px-3 py-1 rounded-lg hover:bg-emerald-100 transition-colors">
                            <Camera size={16} /> Agregar Foto
                        </button>
                    </label>
                    <input type="file" accept="image/*" multiple ref={fileRef} onChange={handlePhotoUpload} className="none" />
                    
                    {formData.photos?.length > 0 ?
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-4">
                            {formData.photos.map((photo: string, idx: number) =>
            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 shadow-sm group">
                                    <img src={photo} alt="Evidencia" className="w-full h-full object-cover" />
                                    <button type="button" onClick={() => handleRemovePhoto(idx)} className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-md">
                                        <XCircle size={16} />
                                    </button>
                                </div>
            )}
                        </div> :

          <div className="text-center p-8 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-900/50 mt-4">
                            <Camera size={32} className="mx-auto text-slate-400 mb-2" />
                            <p className="text-sm text-slate-500">Sin fotos adjuntas. Hacé click en "Agregar Foto" para subir evidencia.</p>
                        </div>
          }
                </div>

                <hr className="border-slate-100 dark:border-slate-700 my-8" />

                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <label className="font-bold text-slate-700 dark:text-slate-300">Estado del Incidente:</label>
                        <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none">
                            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto">
                        {currentIncident && !currentIncident.capaId &&
            <button type="button" onClick={() => createCapa(currentIncident)} className="flex-1 md:flex-none px-6 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-2">
                                <LinkIcon size={18} /> Derivar a CAPA
                            </button>
            }
                        <button type="submit" className="flex-1 md:flex-none px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition-colors flex items-center justify-center shadow-lg shadow-emerald-500/30">
                            Guardar Registro
                        </button>
                    </div>
                </div>
            </form>
        </div>);

}