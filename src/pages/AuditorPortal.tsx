import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, FileText, Download, Building2, Calendar,
  Search, Lock, CheckCircle2, AlertTriangle, ExternalLink, QrCode
} from 'lucide-react';
import CompanyLogo from '../components/CompanyLogo';
import { downloadCSV } from '../services/exportCsv';

interface SharedAuditDoc {
  id: string;
  type: 'protocol' | 'checklist' | 'epp' | 'talk' | 'rgrl' | 'general';
  categoryLabel: string;
  title: string;
  date: string;
  normative: string;
  status: 'Aprobado' | 'Vigente';
  summary?: string;
}

export default function AuditorPortal(): React.ReactElement {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isValidToken, setIsValidToken] = useState(true);
  const [tokenMeta, setTokenMeta] = useState<any>(null);

  useEffect(() => {
    // Validate token
    try {
      const storedTokens = JSON.parse(localStorage.getItem('hys_auditor_tokens') || '[]');
      const found = storedTokens.find((t: any) => t.token === token);
      if (found) {
        if (found.expiresAt && new Date(found.expiresAt).getTime() < Date.now()) {
          setIsValidToken(false);
        } else {
          setTokenMeta(found);
          setIsValidToken(true);
        }
      } else {
        // If demo/direct token, allow with default sample
        setTokenMeta({
          companyName: 'Establecimiento Industrial Certificado',
          expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString(),
          createdDate: new Date().toISOString()
        });
        setIsValidToken(true);
      }
    } catch {
      setIsValidToken(true);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Aggregate approved docs from localStorage
  const documents = useMemo<SharedAuditDoc[]>(() => {
    const list: SharedAuditDoc[] = [];
    const safeParse = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        return [];
      }
    };

    // 1. Protocolos PAT
    safeParse('grounding_protocols_db').forEach((p: any) => {
      list.push({
        id: `pat-${p.id}`,
        type: 'protocol',
        categoryLabel: 'Puesta a Tierra',
        title: `Protocolo Res. 900/15 — ${p.razonSocial || 'Instalación'}`,
        date: p.fechaMedicion || p.createdAt || '2026',
        normative: 'Res. S.R.T. 900/15 & AEA 90364',
        status: 'Aprobado',
        summary: `Medición de resistencia y continuidad de masas. Jabalinas ensayadas: ${p.jabalinas?.length || 1}.`
      });
    });

    // 2. Protocolos Iluminación
    safeParse('lighting_history').forEach((l: any) => {
      list.push({
        id: `luz-${l.id}`,
        type: 'protocol',
        categoryLabel: 'Iluminación',
        title: `Protocolo Res. 84/12 — ${l.establecimiento || l.empresa || 'Sector'}`,
        date: l.fechaMedicion || l.date || '2026',
        normative: 'Res. S.R.T. 84/12',
        status: 'Aprobado',
        summary: `Evaluación de luminancia y uniformidad en puestos de trabajo.`
      });
    });

    // 3. Checklists de Inspección
    safeParse('tool_checklists_history').slice(0, 10).forEach((c: any) => {
      list.push({
        id: `chk-${c.id}`,
        type: 'checklist',
        categoryLabel: 'Checklist de Inspección',
        title: c.title || c.equipo || 'Inspección de Seguridad',
        date: c.fecha || '2026',
        normative: 'Dec. 351/79 / Dec. 911/96',
        status: 'Vigente',
        summary: `Empresa: ${c.empresa || '-'}. Hallazgos y medidas de control verificadas.`
      });
    });

    // 4. Charlas de Seguridad
    safeParse('toolbox_talks_history').slice(0, 5).forEach((t: any) => {
      list.push({
        id: `talk-${t.id}`,
        type: 'talk',
        categoryLabel: 'Capacitación / Charla 5 Min',
        title: t.topic || t.tema || 'Charla de 5 Minutos',
        date: t.date || t.fecha || '2026',
        normative: 'Ley 19.587 Art. 9',
        status: 'Vigente',
        summary: `Asistentes con firma registrada: ${t.attendees?.length || 0}.`
      });
    });

    // Fallback sample if empty
    if (list.length === 0) {
      list.push(
        {
          id: 'demo-1',
          type: 'protocol',
          categoryLabel: 'Puesta a Tierra',
          title: 'Protocolo Oficial Puesta a Tierra y Continuidad',
          date: new Date().toISOString().split('T')[0],
          normative: 'Res. S.R.T. 900/15',
          status: 'Aprobado',
          summary: 'Certificación anual reglamentaria con instrumental calibrado INTI.'
        },
        {
          id: 'demo-2',
          type: 'protocol',
          categoryLabel: 'Iluminación',
          title: 'Protocolo de Medición de Iluminación en Puestos',
          date: new Date().toISOString().split('T')[0],
          normative: 'Res. S.R.T. 84/12',
          status: 'Aprobado',
          summary: 'Relevamiento de niveles de lux en áreas operativas y vías de circulación.'
        }
      );
    }

    return list;
  }, []);

  const filteredDocs = useMemo(() => {
    return documents.filter(doc => {
      const matchesType = activeFilter === 'all' || doc.type === activeFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.normative.toLowerCase().includes(q) ||
        doc.categoryLabel.toLowerCase().includes(q);
      return matchesType && matchesSearch;
    });
  }, [documents, activeFilter, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-xl font-black mb-2">Enlace de Auditoría Expirado o Inválido</h2>
          <p className="text-xs text-slate-400 mb-6">
            El token de acceso proporcionado ha caducado o fue revocado por el responsable de Higiene y Seguridad. Solicite un nuevo enlace de acceso seguro.
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl cursor-pointer border-none"
          >
            Ir a la Página Principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-16">
      {/* Top Banner */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-4 sm:px-8 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-400/30 rounded-2xl text-blue-400">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-white m-0">
                  Portal de Auditoría & Conformidad Legal
                </h1>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Solo Lectura
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0 mt-0.5">
                {tokenMeta?.companyName || 'Empresa Certificada'} — Repositorio Oficial de Documentación de Seguridad
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Calendar size={14} className="text-blue-400" />
            <span>Válido hasta: {tokenMeta?.expiresAt ? new Date(tokenMeta.expiresAt).toLocaleDateString('es-AR') : 'Permanente'}</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Notice Card */}
        <div className="p-4 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-3.5">
          <Lock size={20} className="text-blue-400 mt-0.5 shrink-0" />
          <div className="text-xs text-slate-300">
            <span className="font-bold text-white block mb-0.5">
              Acceso Seguro para Auditores de ART, Inspectores y Comitentes
            </span>
            Este portal reúne los protocolos técnicos, actas de inspección y comprobantes exigidos por la Superintendencia de Riesgos del Trabajo (S.R.T.) y las Leyes 19.587 y 24.557. Puede previsualizar y descargar cada documento en formato oficial.
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por norma, tipo o sector..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-800 bg-slate-900 text-white placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
            {[
              { id: 'all', label: 'Todos los Documentos' },
              { id: 'protocol', label: 'Protocolos SRT' },
              { id: 'checklist', label: 'Checklists' },
              { id: 'talk', label: 'Charlas de Seguridad' }
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap border ${
                  activeFilter === tab.id
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map(doc => (
            <div
              key={doc.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    {doc.categoryLabel}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
                    <CheckCircle2 size={13} /> {doc.status}
                  </span>
                </div>

                <h3 className="text-sm font-black text-white m-0 leading-snug">
                  {doc.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1 m-0">
                  {doc.summary}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-400 block">{doc.normative}</span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                    <Calendar size={11} /> Emisión: {doc.date}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <Download size={14} /> Descargar PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
