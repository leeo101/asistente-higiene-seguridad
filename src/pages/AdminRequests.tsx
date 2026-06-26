import { useNavigate } from 'react-router-dom';
import React, { useEffect, useState } from 'react';
import { UserPlus, Trash2, Mail, Phone, Briefcase, RefreshCw, AlertCircle, ArrowLeft } from 'lucide-react';
import { getErrorMessage } from '../utils/errorUtils';

import toast from 'react-hot-toast';

export default function AdminRequests(): React.ReactElement | null {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
      const fetchUrl = isLocal ? `http://${window.location.hostname}:3001/api/admin/requests` : '/api/admin/requests';

      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error('Error al cargar solicitudes');
      const data = await response.json();
      setRequests(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleDelete = async (id) => {
    const toastId = toast(
      <div className="flex items-center gap-[0.8rem]">
                <span className="text-[0.9rem]">¿Eliminar esta solicitud?</span>
                <button
          onClick={async () => {
            toast.dismiss(toastId);
            try {
              const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.');
              const fetchUrl = isLocal ? `http://${window.location.hostname}:3001/api/admin/requests/${id}` : `/api/admin/requests/${id}`;
              const response = await fetch(fetchUrl, { method: 'DELETE' });
              if (!response.ok) throw new Error('Error al eliminar');
              setRequests(requests.filter((req) => req.id !== id));
              toast.success('Solicitud eliminada');
            } catch (err) {
              toast.error(getErrorMessage(err));
            }
          }} className="bg-[#ef4444] text-[#ffffff] border-none rounded-[8px] p-[0.3rem_0.7rem] cursor-pointer font-[800] text-[0.8rem]">

          Eliminar</button>
            </div>,
      { duration: 5000, icon: '🗑️' }
    );
  };

  return (
    <div className="container pb-20">
            <header className="header flex items-center justify-space-between">
                <div className="flex items-center gap-4">
                    <></>
                    <div className="icon-wrapper">
                        <UserPlus className="text-primary" size={24} />
                    </div>
                    <div>
                        <h1 className="header-title">Solicitudes de Acceso</h1>
                        <p className="header-subtitle">Usuarios esperando aprobación</p>
                    </div>
                </div>
                <button
          onClick={fetchRequests}
          className="btn-secondary p-[0.5rem] w-[auto] rounded-[50%]"

          title="Actualizar lista">
          
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </header>

            <h2 className="text-[1.2rem] font-[800] mb-[1rem] flex items-center gap-[0.5rem]">
                <UserPlus size={20} className="text-primary" /> Solicitudes Pendientes
            </h2>

            {error &&
      <div className="card bg-[rgba(239,_68,_68,_0.1)] border-[1px_solid_rgba(239,_68,_68,_0.3)] flex gap-[0.8rem] text-[#ef4444]">
                    <AlertCircle size={24} />
                    <p>{error}</p>
                </div>
      }

            {!loading && !error && requests.length === 0 &&
      <div className="card text-center p-[3rem_1rem]">
                    <UserPlus size={48} className="m-[0_auto_1rem_auto] text-[var(--color-text-muted)] opacity-[0.5]" />
                    <h3 className="mb-[0.5rem]">No hay solicitudes pendientes</h3>
                    <p className="text-[var(--color-text-muted)]">Cuando un usuario pida acceso dándolo de alta, aparecerá aquí.</p>
                </div>
      }

            {!loading && !error && requests.length > 0 &&
      <div className="grid gap-[1rem] grid-template-columns-[repeat(auto-fill,_minmax(300px,_1fr))]">
                    {requests.map((req) =>
        <div key={req.id} className="card p-[1.25rem]">
                            <div className="flex justify-space-between items-start mb-[1rem]">
                                <div>
                                    <h3 className="m-[0] text-[1.1rem]">{req.name}</h3>
                                    <span className="text-[0.8rem] text-[var(--color-text-muted)]">
                                        {new Date(req.date).toLocaleDateString('es-AR')}
                                    </span>
                                </div>
                                <button
              onClick={() => handleDelete(req.id)}








              title="Eliminar solicitud" className="bg-[rgba(239,_68,_68,_0.1)] text-[#ef4444] border-none p-[0.5rem] rounded-[8px] cursor-pointer">
              
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <div className="flex flex-col gap-[0.8rem]">
                                <div className="flex items-center gap-[0.5rem] text-[var(--color-text-muted)]">
                                    <Mail size={16} />
                                    <a href={`mailto:${req.email}`} className="text-[var(--color-primary)] text-decoration-[none]">{req.email}</a>
                                </div>
                                {req.profession &&
            <div className="flex items-center gap-[0.5rem] text-[var(--color-text-muted)]">
                                        <Briefcase size={16} />
                                        <span>{req.profession}</span>
                                    </div>
            }
                                {req.phone &&
            <div className="flex items-center gap-[0.5rem] text-[var(--color-text-muted)]">
                                        <Phone size={16} />
                                        <a href={`tel:${req.phone}`} className="text-[var(--color-primary)]">{req.phone}</a>
                                    </div>
            }
                            </div>
                        </div>
        )}
                </div>
      }
        </div>);

}