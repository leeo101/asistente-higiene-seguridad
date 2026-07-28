import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, FileText, Search, User, ShieldCheck,
  CheckCheck, Download, Eye, Sparkles, MessageSquare, ArrowLeft,
  X, CheckCircle2, Clock, Crown
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { usePaywall } from '../hooks/usePaywall';
import toast from 'react-hot-toast';

interface Message {
  id: string;
  senderUid: string;
  senderName: string;
  senderRole?: string;
  text: string;
  timestamp: number;
  attachment?: {
    id: string;
    cat: string;
    title: string;
    subtitle?: string;
    typeLabel: string;
    date: string;
    publicUrl: string;
  };
}

interface Colleague {
  uid: string;
  name: string;
  profession: string;
  isOnline: boolean;
  avatar?: string;
}

export default function ProfessionalChat(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isPro, requirePro } = usePaywall();
  const [activeTab, setActiveTab] = useState<'chats' | 'contacts'>('chats');
  
  const [selectedColleague, setSelectedColleague] = useState<Colleague>({
    uid: 'colleague_demo_1',
    name: 'Ing. Carlos Mendoza',
    profession: 'Especialista EHS & Ergonomía',
    isOnline: true
  });

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem('hys_professional_chat_messages');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: 'msg-1',
        senderUid: 'colleague_demo_1',
        senderName: 'Ing. Carlos Mendoza',
        senderRole: 'Especialista EHS',
        text: '¡Hola! Te comparto la última evaluación de la Carga de Fuego para la planta 2.',
        timestamp: Date.now() - 3600000 * 2,
        attachment: {
          id: 'demo-fire-1',
          cat: 'fireload',
          title: 'Carga de Fuego — Planta Industrial Norte',
          subtitle: 'Sector Depósito A1',
          typeLabel: 'Carga de Fuego Dec 351/79',
          date: '28/07/2026',
          publicUrl: `${window.location.origin}/v/guest/fireload/demo-fire-1`
        }
      },
      {
        id: 'msg-2',
        senderUid: currentUser?.uid || 'user_me',
        senderName: 'Tú',
        senderRole: 'Lic. en Higiene y Seguridad',
        text: 'Excelente Carlos. Ya lo reviso y procedemos con la validación de extintores.',
        timestamp: Date.now() - 3600000 * 1
      }
    ];
  });

  const [inputText, setInputText] = useState('');
  const [showDocModal, setShowDocModal] = useState(false);
  const [userDocs, setUserDocs] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const colleaguesList: Colleague[] = [
    { uid: 'colleague_demo_1', name: 'Ing. Carlos Mendoza', profession: 'Especialista EHS & Ergonomía', isOnline: true },
    { uid: 'colleague_demo_2', name: 'Lic. Mariana Gómez', profession: 'Inspectora de Obra & Asesora HyS', isOnline: true },
    { uid: 'colleague_demo_3', name: 'Téc. Roberto Rossi', profession: 'Auditor ISO 45001', isOnline: false },
    { uid: 'colleague_demo_4', name: 'Ing. Esteban Juárez', profession: 'Prevencionista de Riesgos', isOnline: true }
  ];

  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user's generated documents for attachment modal
  const loadUserDocuments = () => {
    const safeParse = (key: string) => {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    };

    const ats = safeParse('ats_history').map((item: any) => ({
      id: item.id || `ats-${Date.now()}`,
      cat: 'ats',
      title: item.empresa || 'Análisis de Trabajo Seguro',
      subtitle: item.obra || 'Obra General',
      typeLabel: 'ATS',
      date: item.fecha || 'Reciente'
    }));

    const fireload = safeParse('fireload_history').map((item: any) => ({
      id: item.id || `fire-${Date.now()}`,
      cat: 'fireload',
      title: item.empresa || 'Carga de Fuego',
      subtitle: item.sector || 'Sector General',
      typeLabel: 'Carga de Fuego',
      date: item.createdAt || 'Reciente'
    }));

    const checklists = safeParse('tool_checklists_history').map((item: any) => ({
      id: item.id || `chk-${Date.now()}`,
      cat: 'checklist',
      title: item.equipo || 'Checklist de Inspección',
      subtitle: item.empresa || 'Empresa',
      typeLabel: 'Checklist',
      date: item.fecha || 'Reciente'
    }));

    const permits = safeParse('work_permits_history').map((item: any) => ({
      id: item.id || `pmt-${Date.now()}`,
      cat: 'permit',
      title: item.empresa || 'Permiso de Trabajo',
      subtitle: item.obra || 'Sector Alto Riesgo',
      typeLabel: 'Permiso de Trabajo',
      date: item.createdAt || 'Reciente'
    }));

    setUserDocs([...ats, ...fireload, ...checklists, ...permits]);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: inputText.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
  };

  const handleAttachDocument = (doc: any) => {
    setShowDocModal(false);

    const publicUrl = `${window.location.origin}/v/${currentUser?.uid || 'guest'}/${doc.cat}/${doc.id}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: `Te comparto el informe en PDF: "${doc.title}"`,
      timestamp: Date.now(),
      attachment: {
        id: doc.id,
        cat: doc.cat,
        title: doc.title,
        subtitle: doc.subtitle,
        typeLabel: doc.typeLabel,
        date: doc.date,
        publicUrl
      }
    };

    setMessages(prev => [...prev, newMsg]);
    toast.success('¡Informe adjuntado e ingresado al chat!');
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] p-3 sm:p-6 text-[var(--color-text)]">
      <div className="max-w-[1200px] mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white cursor-pointer"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--color-text)]">
                  Red de Comunicación entre Profesionales
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[0.7rem] font-bold uppercase border border-blue-500/30">
                  Chat & PDFs HyS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[var(--color-text-muted)] mt-0.5">
                Interactuá en tiempo real con otros colegas prevencionistas y enviá informes técnicos en PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-[calc(85vh-100px)] min-h-[600px] rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden shadow-2xl">
          
          {/* Left Panel: Contacts */}
          <div className="lg:col-span-4 border-r border-[var(--color-border)] flex flex-col bg-white/[0.02]">
            <div className="p-4 border-b border-[var(--color-border)] flex items-center justify-between">
              <span className="font-extrabold text-sm text-[var(--color-text)]">Colegas & Prevencionistas</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
                {colleaguesList.length} activos
              </span>
            </div>

            <div className="p-3">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  placeholder="Buscar prevencionista o matrícula..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1">
              {colleaguesList.map((c) => {
                const isSelected = selectedColleague.uid === c.uid;
                return (
                  <button
                    key={c.uid}
                    onClick={() => setSelectedColleague(c)}
                    className={`w-full p-3 rounded-2xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-blue-500/15 border-blue-500/40 shadow-md'
                        : 'bg-transparent border-transparent hover:bg-white/5'
                    }`}
                  >
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                        {c.name.charAt(0)}
                      </div>
                      {c.isOnline && (
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900 absolute bottom-0 right-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-extrabold text-xs text-[var(--color-text)] truncate">{c.name}</span>
                        <span className="text-[0.65rem] text-[var(--color-text-muted)]">Hoy</span>
                      </div>
                      <span className="text-[0.7rem] text-[var(--color-text-muted)] truncate block mt-0.5">
                        {c.profession}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Chat Area */}
          <div className="lg:col-span-8 flex flex-col bg-black/10 relative">
            
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md">
                  {selectedColleague.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[var(--color-text)] flex items-center gap-1.5">
                    {selectedColleague.name}
                    <ShieldCheck size={16} className="text-blue-400" />
                  </h3>
                  <p className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> En línea · {selectedColleague.profession}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  loadUserDocuments();
                  setShowDocModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all"
              >
                <Paperclip size={15} /> Adjuntar PDF / Informe
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
              {messages.map((m) => {
                const isMe = m.senderUid === (currentUser?.uid || 'user_me');
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] sm:max-w-[70%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <span className="text-[0.68rem] text-[var(--color-text-muted)] font-semibold mb-1 px-1">
                      {m.senderName} • {new Date(m.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div
                      className={`p-3.5 rounded-2xl shadow-md text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none'
                          : 'bg-white/10 text-[var(--color-text)] border border-white/10 rounded-bl-none'
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{m.text}</p>

                      {/* PDF Attachment Card inside Chat */}
                      {m.attachment && (
                        <div className="mt-3 p-3 rounded-xl bg-black/30 border border-white/20 text-white flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/30 text-blue-300">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-blue-400/20 text-blue-300 font-extrabold uppercase">
                                {m.attachment.typeLabel}
                              </span>
                              <h4 className="font-extrabold text-xs mt-1 truncate">{m.attachment.title}</h4>
                              <p className="text-[0.68rem] opacity-70 truncate">{m.attachment.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1 border-t border-white/10 pt-2">
                            <a
                              href={m.attachment.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-1.5 px-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[0.7rem] font-bold flex items-center justify-center gap-1 text-decoration-none transition-all"
                            >
                              <Eye size={13} /> Ver Documento PDF
                            </a>
                            <a
                              href={`${m.attachment.publicUrl}?print=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-1.5 px-2 rounded-lg bg-blue-500/40 hover:bg-blue-500/60 text-white text-[0.7rem] font-bold flex items-center justify-center gap-1 text-decoration-none transition-all"
                            >
                              <Download size={13} />
                            </a>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  loadUserDocuments();
                  setShowDocModal(true);
                }}
                className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 cursor-pointer transition-all"
                title="Adjuntar Informe HyS"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí un mensaje técnico o consulta..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-[var(--color-text)] placeholder-white/40 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none cursor-pointer shadow-md disabled:opacity-40 transition-all hover:scale-105 active:scale-95"
              >
                <Send size={18} />
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* Modal: Select Document to Attach */}
      {showDocModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--color-surface)] border border-blue-500/40 rounded-3xl p-6 max-w-[550px] w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={20} className="text-blue-400" />
                <h3 className="font-black text-lg text-[var(--color-text)]">
                  Seleccionar Informe para Adjuntar
                </h3>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1 text-white/60 hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-[var(--color-text-muted)] mb-4">
              Seleccioná un informe de tu historial para enviarlo como PDF verificado en la conversación.
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
              {userDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[var(--color-text-muted)]">
                  No tenés documentos guardados todavía. Podés crear un ATS, Carga de Fuego o Checklist y compartirlo acá.
                </div>
              ) : (
                userDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleAttachDocument(doc)}
                    className="p-3 rounded-2xl bg-white/5 hover:bg-blue-500/10 border border-white/10 hover:border-blue-500/40 text-left transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-blue-500/20 text-blue-400 shrink-0">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-extrabold uppercase">
                          {doc.typeLabel}
                        </span>
                        <h4 className="font-bold text-xs text-[var(--color-text)] truncate mt-0.5">{doc.title}</h4>
                        <span className="text-[0.68rem] text-[var(--color-text-muted)] truncate block">{doc.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-blue-400 group-hover:translate-x-1 transition-transform">
                      Adjuntar →
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
