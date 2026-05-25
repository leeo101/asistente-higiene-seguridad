import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Download, Trash2, Edit, AlertCircle, Building2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import { db } from '../firebase';
import { collection, query, getDocs, deleteDoc, doc, orderBy } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

interface Legajo {
  id: string;
  companyName: string;
  cuit: string;
  date: string;
  updatedAt: number;
}

export default function Legajos() {
  const [legajos, setLegajos] = useState<Legajo[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const { isPro } = usePaywall();
  const isAdmin = currentUser?.email === 'enzorodriguez31@gmail.com';
  const hasAccess = isPro || isAdmin;
  const navigate = useNavigate();

  useEffect(() => {
    fetchLegajos();
  }, [currentUser]);

  const fetchLegajos = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const q = query(collection(db, 'users', currentUser.uid, 'legajos'), orderBy('updatedAt', 'desc'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Legajo[];
      setLegajos(data);
    } catch (error) {
      console.error("Error fetching legajos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!currentUser || !window.confirm('¿Estás seguro de eliminar este Legajo Técnico? Esta acción no se puede deshacer.')) return;
    try {
      await deleteDoc(doc(db, 'users', currentUser.uid, 'legajos', id));
      setLegajos(legajos.filter(l => l.id !== id));
    } catch (error) {
      console.error("Error deleting legajo:", error);
      alert("Hubo un error al eliminar el legajo.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Building2 className="w-8 h-8 text-blue-600" />
            Gestión de Legajos Técnicos
          </h1>
          <p className="text-slate-500 mt-1">Decreto 351/79 - Ley 19.587</p>
        </div>
        <button
          onClick={() => {
            if (!hasAccess) {
              navigate('/subscription');
              return;
            }
            navigate('/legajos/nuevo');
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium shadow-sm shadow-blue-200"
        >
          <Plus className="w-5 h-5" />
          Nuevo Legajo
        </button>
      </div>

      {!hasAccess && (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800">Función Exclusiva PRO</h3>
            <p className="text-amber-700 text-sm mt-1">
              El módulo de Legajos Técnicos es una herramienta avanzada para profesionales. 
              Actualizá tu cuenta para crear, gestionar y exportar legajos en PDF de manera ilimitada.
            </p>
            <button 
              onClick={() => navigate('/subscription')}
              className="mt-3 px-4 py-1.5 bg-amber-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-amber-700 transition-colors"
            >
              Mejorar a PRO
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : legajos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <FileText className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-1">No hay legajos técnicos</h3>
          <p className="text-slate-500">Crea tu primer legajo para empezar a gestionar a tus clientes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {legajos.map((legajo) => (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              key={legajo.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-800 text-lg line-clamp-1">{legajo.companyName || 'Empresa Sin Nombre'}</h3>
                  <p className="text-sm text-slate-500 font-mono mt-1">CUIT: {legajo.cuit || '-'}</p>
                </div>
                <div className="bg-blue-50 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              
              <div className="text-sm text-slate-600 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Actualizado: {new Date(legajo.updatedAt).toLocaleDateString()}
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-100">
                <button 
                  onClick={() => navigate(`/legajos/editar/${legajo.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg transition-colors font-medium text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Editar
                </button>
                <button 
                  onClick={() => navigate(`/legajos/pdf/${legajo.id}`)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors font-medium text-sm"
                >
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button 
                  onClick={() => handleDelete(legajo.id)}
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
