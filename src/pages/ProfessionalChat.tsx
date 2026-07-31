import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, FileText, Search, User, ShieldCheck,
  CheckCheck, Download, Eye, Sparkles, MessageSquare, ArrowLeft,
  X, CheckCircle2, Clock, Crown, UserPlus, Mail, IdCard, ChevronLeft
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
  email?: string;
  license?: string;
  isOnline: boolean;
  avatar?: string;
}

const DEFAULT_COLLEAGUES: Colleague[] = [
  { uid: 'colleague_demo_1', name: 'Ing. Carlos Mendoza', profession: 'Especialista EHS & Ergonomía', email: 'carlos.mendoza@hys.com', license: 'MP-4821', isOnline: true },
  { uid: 'colleague_demo_2', name: 'Lic. Mariana Gómez', profession: 'Inspectora de Obra & Asesora HyS', email: 'mariana.gomez@hys.com', license: 'MP-8910', isOnline: true },
  { uid: 'colleague_demo_3', name: 'Téc. Roberto Rossi', profession: 'Auditor ISO 45001', email: 'roberto.rossi@hys.com', license: 'MP-1244', isOnline: false },
  { uid: 'colleague_demo_4', name: 'Ing. Esteban Juárez', profession: 'Prevencionista de Riesgos', email: 'esteban.juarez@hys.com', license: 'MP-6723', isOnline: true }
];

export default function ProfessionalChat(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isPro, requirePro } = usePaywall();

  // Mobile navigation state
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  // Contacts list initialized from localStorage + defaults
  const [contacts, setContacts] = useState<Colleague[]>(() => {
    try {
      const saved = localStorage.getItem('hys_professional_contacts');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_COLLEAGUES;
  });

  const [selectedColleague, setSelectedColleague] = useState<Colleague>(contacts[0] || DEFAULT_COLLEAGUES[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Add Contact Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newContactForm, setNewContactForm] = useState({
    name: '',
    email: '',
    license: '',
    profession: 'Lic. en Higiene y Seguridad'
  });

  // Messages state
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

  // Save contacts to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_contacts', JSON.stringify(contacts));
    } catch (e) {
      console.error(e);
    }
  }, [contacts]);

  // Save messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_chat_messages', JSON.stringify(messages));
    } catch (e) {
      console.error(e);
    }
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Filter contacts by search query (name, email, license, or profession)
  const filteredContacts = contacts.filter((c) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.license && c.license.toLowerCase().includes(q)) ||
      c.profession.toLowerCase().includes(q)
    );
  });

  // Handle adding a new contact by email or matrícula
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactForm.name.trim() || (!newContactForm.email.trim() && !newContactForm.license.trim())) {
      toast.error('Por favor ingresá el nombre y al menos el correo electrónico o la matrícula.');
      return;
    }

    const newContact: Colleague = {
      uid: `contact_${Date.now()}`,
      name: newContactForm.name.trim(),
      profession: newContactForm.profession.trim() || 'Profesional HyS',
      email: newContactForm.email.trim(),
      license: newContactForm.license.trim(),
      isOnline: true
    };

    setContacts(prev => [newContact, ...prev]);
    setSelectedColleague(newContact);
    setShowAddModal(false);
    setNewContactForm({ name: '', email: '', license: '', profession: 'Lic. en Higiene y Seguridad' });
    setMobileView('chat');
    toast.success(`¡Contacto ${newContact.name} guardado con éxito!`);
  };

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
    <div className="min-h-screen bg-[var(--color-background)] pt-20 sm:pt-24 pb-12 px-3 sm:px-6 text-[var(--color-text)]">
      <div className="max-w-[1240px] mx-auto">
        
        {/* Header con margen superior corregido para no quedar debajo de la barra */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-300 dark:hover:bg-slate-700 transition-all text-slate-800 dark:text-slate-100 cursor-pointer shadow-sm"
              title="Volver al Inicio"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight m-0">
                  Red de Comunicación entre Profesionales
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 text-[0.7rem] font-black uppercase border border-blue-500/30">
                  Chat & PDFs HyS
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 font-medium m-0">
                Interactuá en tiempo real con colegas prevencionistas, buscá por correo o matrícula y compartí informes en PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Main Grid — Layout responsivo (Vista Móvil adaptable + Desktop 12 columnas) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 lg:gap-4 h-[calc(88vh-110px)] min-h-[580px] rounded-3xl border border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xl">
          
          {/* Panel Izquierdo: Lista de Contactos (En móvil se oculta si mobileView === 'chat') */}
          <div className={`${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'} lg:col-span-4 border-r border-slate-200 dark:border-slate-800 flex-col bg-slate-50/70 dark:bg-slate-900/90 h-full`}>
            
            {/* Contact Header + Botón Añadir Contacto */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 bg-white dark:bg-slate-900">
              <div>
                <span className="font-black text-sm text-slate-900 dark:text-white block">Directorio de Contactos</span>
                <span className="text-[0.7rem] text-slate-500 dark:text-slate-400 font-semibold">
                  {filteredContacts.length} profesional(es)
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all hover:scale-105"
                title="Agregar contacto por Correo o Matrícula"
              >
                <UserPlus size={15} /> + Nuevo Contacto
              </button>
            </div>

            {/* Input de Búsqueda por Nombre, Correo o Matrícula */}
            <div className="p-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por correo, matrícula o nombre..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Contactos con Alto Contraste */}
            <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5 custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No se encontraron contactos con ese correo, matrícula o nombre.
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="block mx-auto mt-3 px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs border-none cursor-pointer"
                  >
                    + Agregar este contacto
                  </button>
                </div>
              ) : (
                filteredContacts.map((c) => {
                  const isSelected = selectedColleague.uid === c.uid;
                  return (
                    <button
                      key={c.uid}
                      onClick={() => {
                        setSelectedColleague(c);
                        setMobileView('chat');
                      }}
                      className={`w-full p-3 rounded-2xl text-left transition-all border flex items-center gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-blue-600/10 dark:bg-blue-500/20 border-blue-500/50 shadow-sm ring-1 ring-blue-500/30'
                          : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        {c.isOnline && (
                          <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 absolute bottom-0 right-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">{c.name}</span>
                          <span className="text-[0.65rem] font-bold text-slate-400 shrink-0">Activo</span>
                        </div>
                        <span className="text-[0.7rem] font-semibold text-slate-600 dark:text-slate-300 truncate block mt-0.5">
                          {c.profession}
                        </span>
                        {(c.email || c.license) && (
                          <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-slate-500 dark:text-slate-400 flex-wrap">
                            {c.email && <span className="truncate max-w-[130px]" title={c.email}>✉️ {c.email}</span>}
                            {c.license && <span className="font-bold text-emerald-600 dark:text-emerald-400">🪪 {c.license}</span>}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Panel Derecho: Área de Chat (En móvil se oculta si mobileView === 'contacts') */}
          <div className={`${mobileView === 'contacts' ? 'hidden lg:flex' : 'flex'} lg:col-span-8 flex-col bg-slate-100/60 dark:bg-slate-950/60 h-full relative`}>
            
            {/* Header del Chat Activo */}
            <div className="p-3.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botón Volver a Contactos para vista Móvil */}
                <button
                  onClick={() => setMobileView('contacts')}
                  className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 cursor-pointer shrink-0"
                  title="Volver a la lista de contactos"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center font-black text-white text-sm shadow-md shrink-0">
                  {selectedColleague.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1.5 m-0 truncate">
                    {selectedColleague.name}
                    <ShieldCheck size={16} className="text-blue-500 shrink-0" />
                  </h3>
                  <div className="flex items-center gap-2 text-[0.7rem] text-slate-500 dark:text-slate-400 font-medium truncate mt-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> En línea
                    </span>
                    <span className="truncate">• {selectedColleague.profession}</span>
                    {selectedColleague.license && (
                      <span className="hidden sm:inline font-bold text-blue-600 dark:text-blue-400">• Mat. {selectedColleague.license}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Botón VIBRANTE "Adjuntar PDF / Informe" */}
              <button
                onClick={() => {
                  loadUserDocuments();
                  setShowDocModal(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-lg border-none cursor-pointer transition-all hover:scale-105 shrink-0"
              >
                <Paperclip size={15} /> <span className="hidden sm:inline">Adjuntar</span> PDF / Informe
              </button>
            </div>

            {/* Mensajes del Chat con Alto Contraste */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 flex flex-col gap-3 custom-scrollbar">
              {messages.map((m) => {
                const isMe = m.senderUid === (currentUser?.uid || 'user_me');
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[90%] sm:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                  >
                    <span className="text-[0.68rem] text-slate-500 dark:text-slate-400 font-bold mb-1 px-1">
                      {m.senderName} • {new Date(m.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div
                      className={`p-3.5 rounded-2xl shadow-md text-xs sm:text-sm leading-relaxed ${
                        isMe
                          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-br-none font-medium'
                          : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none font-medium'
                      }`}
                    >
                      <p className="m-0 whitespace-pre-wrap">{m.text}</p>

                      {/* Tarjeta de Informe PDF adjunto dentro del Chat */}
                      {m.attachment && (
                        <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white border border-slate-700 flex flex-col gap-2 shadow-inner">
                          <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-blue-500/20 text-blue-400 shrink-0">
                              <FileText size={20} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-blue-500/30 text-blue-300 font-black uppercase">
                                {m.attachment.typeLabel}
                              </span>
                              <h4 className="font-extrabold text-xs mt-1 text-white truncate m-0">{m.attachment.title}</h4>
                              <p className="text-[0.68rem] text-slate-300 truncate m-0">{m.attachment.subtitle}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 mt-1 border-t border-slate-800 pt-2">
                            <a
                              href={m.attachment.publicUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[0.72rem] font-extrabold flex items-center justify-center gap-1.5 text-decoration-none transition-all shadow-sm"
                            >
                              <Eye size={14} /> Ver Documento PDF
                            </a>
                            <a
                              href={`${m.attachment.publicUrl}?print=true`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[0.72rem] font-extrabold flex items-center justify-center gap-1 text-decoration-none transition-all shadow-sm"
                              title="Descargar / Imprimir"
                            >
                              <Download size={14} />
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

            {/* Input Form — Responsivo para celular */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  loadUserDocuments();
                  setShowDocModal(true);
                }}
                className="p-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white border-none cursor-pointer transition-all shadow-md shrink-0 flex items-center justify-center"
                title="Adjuntar Informe PDF"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Escribí un mensaje técnico o consulta..."
                className="flex-1 px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-base sm:text-sm font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white border-none cursor-pointer shadow-md disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
                title="Enviar mensaje"
              >
                <Send size={18} />
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* Modal: Agregar Nuevo Contacto por Correo o Matrícula */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-[480px] w-full shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={22} className="text-emerald-500" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white m-0">
                  Agregar Nuevo Contacto
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
              Ingresá el correo electrónico o la matrícula del profesional prevencionista para añadirlo a tu directorio de contactos.
            </p>

            <form onSubmit={handleAddContactSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Nombre Completo *
                </label>
                <input
                  required
                  type="text"
                  value={newContactForm.name}
                  onChange={(e) => setNewContactForm({ ...newContactForm, name: e.target.value })}
                  placeholder="Ej: Lic. Juan Pérez"
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      value={newContactForm.email}
                      onChange={(e) => setNewContactForm({ ...newContactForm, email: e.target.value })}
                      placeholder="colega@hys.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                    Nº de Matrícula
                  </label>
                  <div className="relative">
                    <IdCard size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={newContactForm.license}
                      onChange={(e) => setNewContactForm({ ...newContactForm, license: e.target.value })}
                      placeholder="MP-12948"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Especialidad / Profesión
                </label>
                <input
                  type="text"
                  value={newContactForm.profession}
                  onChange={(e) => setNewContactForm({ ...newContactForm, profession: e.target.value })}
                  placeholder="Ej: Asesor HyS / Auditor Carga de Fuego"
                  className="w-full p-3 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs border-none cursor-pointer hover:bg-slate-300 dark:hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs border-none cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                >
                  <UserPlus size={16} /> Guardar Contacto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Seleccionar Documento / Informe PDF para Adjuntar */}
      {showDocModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-800 rounded-3xl p-6 max-w-[550px] w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText size={22} className="text-emerald-500" />
                <h3 className="font-black text-lg text-slate-900 dark:text-white m-0">
                  Seleccionar Informe PDF para Adjuntar
                </h3>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 font-medium">
              Seleccioná un informe de tu historial (ATS, Carga de Fuego, Checklist o Permiso) para enviarlo como PDF verificado en la conversación.
            </p>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
              {userDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400 font-medium">
                  No tenés documentos guardados en tu historial todavía. Podés crear un ATS, Carga de Fuego o Checklist y compartirlo acá.
                </div>
              ) : (
                userDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleAttachDocument(doc)}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 text-left transition-all flex items-center justify-between cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-black uppercase">
                          {doc.typeLabel}
                        </span>
                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate mt-1 m-0">{doc.title}</h4>
                        <span className="text-[0.68rem] text-slate-500 dark:text-slate-400 truncate block mt-0.5">{doc.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1.5 rounded-xl group-hover:scale-105 transition-transform shrink-0">
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
