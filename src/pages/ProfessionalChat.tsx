import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, FileText, Search, User, ShieldCheck,
  CheckCheck, Download, Eye, Sparkles, MessageSquare, ArrowLeft,
  X, CheckCircle2, Clock, Crown, UserPlus, Mail, IdCard, ChevronLeft,
  ExternalLink, AlertCircle, Phone, Lock, Check
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
  read?: boolean;
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
  email: string;
  license?: string;
  isOnline: boolean;
  avatar?: string;
  lastMsg?: string;
  lastTime?: string;
  unreadCount?: number;
}

// Contactos iniciales registrados demostrativos
const DEFAULT_REGISTERED_USERS: Colleague[] = [
  { uid: 'colleague_demo_1', name: 'Ing. Carlos Mendoza', profession: 'Especialista EHS & Ergonomía', email: 'carlos.mendoza@hys.com', license: 'MP-4821', isOnline: true, lastMsg: 'Te compartí la evaluación de Carga de Fuego.', lastTime: '14:20', unreadCount: 0 },
  { uid: 'colleague_demo_2', name: 'Lic. Mariana Gómez', profession: 'Inspectora de Obra & Asesora HyS', email: 'mariana.gomez@hys.com', license: 'MP-8910', isOnline: true, lastMsg: 'Perfecto, ya reviso el permiso de trabajo.', lastTime: '12:15', unreadCount: 0 },
  { uid: 'colleague_demo_3', name: 'Téc. Roberto Rossi', profession: 'Auditor ISO 45001', email: 'roberto.rossi@hys.com', license: 'MP-1244', isOnline: false, lastMsg: 'Revisé la lista de extintores.', lastTime: 'Ayer', unreadCount: 0 },
  { uid: 'colleague_demo_4', name: 'Ing. Esteban Juárez', profession: 'Prevencionista de Riesgos', email: 'esteban.juarez@hys.com', license: 'MP-6723', isOnline: true, lastMsg: '¿Tienen la planilla de ATS?', lastTime: 'Ayer', unreadCount: 0 }
];

export default function ProfessionalChat(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isPro, loading, requirePro } = usePaywall();

  // Bloqueo PRO — solo usuarios con suscripción activa pueden usar la Mensajería
  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  // Vista móvil ('contacts' o 'chat')
  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');

  // Cargar lista de contactos desde localStorage + defaults
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
    return DEFAULT_REGISTERED_USERS;
  });

  const [selectedColleague, setSelectedColleague] = useState<Colleague>(contacts[0] || DEFAULT_REGISTERED_USERS[0]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Agregar Contacto
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  // Modal Adjuntar Documentos
  const [showDocModal, setShowDocModal] = useState(false);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  // Estado de Mensajes
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem('hys_professional_chat_messages_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    
    return {
      'colleague_demo_1': [
        {
          id: 'msg-1',
          senderUid: 'colleague_demo_1',
          senderName: 'Ing. Carlos Mendoza',
          senderRole: 'Especialista EHS',
          text: '¡Hola! Te comparto la última evaluación de Carga de Fuego para la Planta 2.',
          timestamp: Date.now() - 3600000 * 2,
          read: true,
          attachment: {
            id: 'demo-fire-1',
            cat: 'fireload',
            title: 'Carga de Fuego — Planta Industrial Norte',
            subtitle: 'Sector Depósito A1',
            typeLabel: 'Carga de Fuego Dec 351/79',
            date: '28/08/2026',
            publicUrl: `${window.location.origin}/v/guest/fireload/demo-fire-1`
          }
        },
        {
          id: 'msg-2',
          senderUid: currentUser?.uid || 'user_me',
          senderName: 'Tú',
          senderRole: 'Lic. en Higiene y Seguridad',
          text: 'Excelente Carlos. Ya lo reviso y procedemos con la validación.',
          timestamp: Date.now() - 3600000 * 1,
          read: true
        }
      ]
    };
  });

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Persistir contactos
  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_contacts', JSON.stringify(contacts));
    } catch (e) {}
  }, [contacts]);

  // Persistir mensajes
  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_chat_messages_map', JSON.stringify(messages));
    } catch (e) {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Obtener mensajes de la conversación activa
  const activeMessages = messages[selectedColleague.uid] || [];

  // Obtener correos registrados en la plataforma
  const getRegisteredEmails = (): string[] => {
    const emails: Set<string> = new Set();
    DEFAULT_REGISTERED_USERS.forEach(u => emails.add(u.email.toLowerCase()));
    if (currentUser?.email) emails.add(currentUser.email.toLowerCase());

    try {
      const legajos = JSON.parse(localStorage.getItem('legajos_cache') || '[]');
      legajos.forEach((l: any) => {
        if (l.email) emails.add(String(l.email).toLowerCase().trim());
      });
    } catch (e) {}

    try {
      const personal = JSON.parse(localStorage.getItem('personalData') || '{}');
      if (personal.email) emails.add(String(personal.email).toLowerCase().trim());
    } catch (e) {}

    return Array.from(emails);
  };

  // Filtrar contactos
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

  // Validar y agregar nuevo contacto por correo registrado
  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.toLowerCase().trim();

    if (!cleanEmail) {
      toast.error('Por favor ingresá un correo electrónico.');
      return;
    }

    const existsAlready = contacts.find(c => c.email.toLowerCase() === cleanEmail);
    if (existsAlready) {
      setSelectedColleague(existsAlready);
      setShowAddModal(false);
      setInputEmail('');
      setMobileView('chat');
      toast.success(`Contacto ${existsAlready.name} seleccionado.`);
      return;
    }

    const registeredEmails = getRegisteredEmails();
    const isRegistered = registeredEmails.includes(cleanEmail);

    if (!isRegistered) {
      toast.error('🛑 Este correo no pertenece a un usuario registrado en la plataforma. Solo podés chatear con usuarios registrados.', { duration: 5000 });
      return;
    }

    let foundName = cleanEmail.split('@')[0].replace(/\./g, ' ');
    foundName = foundName.charAt(0).toUpperCase() + foundName.slice(1);
    let foundProfession = 'Profesional HyS Registrado';

    try {
      const legajos = JSON.parse(localStorage.getItem('legajos_cache') || '[]');
      const foundLeg = legajos.find((l: any) => String(l.email).toLowerCase().trim() === cleanEmail);
      if (foundLeg) {
        if (foundLeg.name) foundName = foundLeg.name;
        if (foundLeg.jobTitle || foundLeg.puesto) foundProfession = foundLeg.jobTitle || foundLeg.puesto;
      }
    } catch (e) {}

    const newContact: Colleague = {
      uid: `contact_${Date.now()}`,
      name: foundName,
      profession: foundProfession,
      email: cleanEmail,
      isOnline: true,
      lastMsg: 'Chat iniciado',
      lastTime: 'Ahora'
    };

    setContacts(prev => [newContact, ...prev]);
    setSelectedColleague(newContact);
    setShowAddModal(false);
    setInputEmail('');
    setMobileView('chat');
    toast.success(`¡Contacto ${newContact.name} agregado exitosamente! 🎉`);
  };

  // Cargar documentos para adjuntar en PDF
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

    const medicals = safeParse('ehs_medical_db').map((item: any) => ({
      id: item.id || `med-${Date.now()}`,
      cat: 'medical',
      title: `Aptitud Médica - ${item.workerName}`,
      subtitle: `DNI: ${item.dni} • ${item.result}`,
      typeLabel: 'Aptitud Médica',
      date: item.examDate || 'Reciente'
    }));

    setUserDocs([...ats, ...fireload, ...checklists, ...medicals]);
  };

  // Enviar mensaje en el chat
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: inputText.trim(),
      timestamp: Date.now(),
      read: true
    };

    const colleagueUid = selectedColleague.uid;
    setMessages(prev => ({
      ...prev,
      [colleagueUid]: [...(prev[colleagueUid] || []), newMsg]
    }));

    setContacts(prev => prev.map(c => c.uid === colleagueUid ? {
      ...c,
      lastMsg: inputText.trim(),
      lastTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    } : c));

    setInputText('');
  };

  // Enviar correo electrónico directamente
  const handleSendEmailDirectly = () => {
    if (!selectedColleague.email) {
      toast.error('Este contacto no posee un correo registrado.');
      return;
    }
    const subject = encodeURIComponent(`Asistente H&S — Consulta de ${currentUser?.displayName || 'Profesional HyS'}`);
    const body = encodeURIComponent(`Hola ${selectedColleague.name},\n\nTe contacto desde la plataforma Asistente H&S para coordinar tareas técnicas de prevención e higiene laboral.\n\nSaludos cordiales.`);
    window.open(`mailto:${selectedColleague.email}?subject=${subject}&body=${body}`, '_blank');
  };

  // Adjuntar documento PDF
  const handleAttachDocument = (doc: any) => {
    setShowDocModal(false);

    const publicUrl = `${window.location.origin}/v/${currentUser?.uid || 'guest'}/${doc.cat}/${doc.id}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: `Te comparto el informe oficial en PDF: "${doc.title}"`,
      timestamp: Date.now(),
      read: true,
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

    const colleagueUid = selectedColleague.uid;
    setMessages(prev => ({
      ...prev,
      [colleagueUid]: [...(prev[colleagueUid] || []), newMsg]
    }));

    setContacts(prev => prev.map(c => c.uid === colleagueUid ? {
      ...c,
      lastMsg: `📎 Documento PDF: ${doc.title}`,
      lastTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    } : c));

    toast.success('¡Informe PDF adjuntado e ingresado al chat!');
  };

  return (
    <div className="min-h-screen bg-slate-950 pt-24 sm:pt-28 pb-8 px-2 sm:px-6 text-slate-100">
      <div className="max-w-[1400px] mx-auto">
        
        {/* Header de la Página con Espaciado Adecuado para la Navbar */}
        <div className="flex items-center justify-between gap-4 mb-5 px-2 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/')}
              className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-white hover:bg-slate-800 cursor-pointer shadow-md transition-all"
              title="Volver al Inicio"
            >
              <ArrowLeft size={22} className="text-white" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight m-0">
                  Chat de HyS
                </h1>
                <span className="px-3 py-1 rounded-full bg-emerald-600/90 text-white text-[0.7rem] font-black uppercase tracking-wider shadow-sm border border-emerald-500/40">
                  Red de Comunicación
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 font-medium mt-1 m-0">
                Mensajería directa entre usuarios registrados por correo electrónico. Intercambio seguro de informes en PDF.
              </p>
            </div>
          </div>
        </div>

        {/* Layout de Mensajería — 100% de Ancho, Sin Espacios Blancos */}
        <div className="w-full flex flex-col lg:flex-row border border-slate-800 bg-slate-900 rounded-3xl overflow-hidden shadow-2xl h-[calc(86vh-110px)] min-h-[600px]">
          
          {/* PANEL IZQUIERDO: Directorio de Contactos (Ancho Fijo en Desktop) */}
          <div className={`${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 xl:w-96 flex-col bg-slate-900 border-r border-slate-800 shrink-0 h-full`}>
            
            {/* Header Directorio */}
            <div className="p-4 bg-slate-950 text-white flex items-center justify-between gap-2 border-b border-slate-800">
              <div>
                <span className="font-black text-sm text-white block uppercase tracking-wider">Contactos Registrados</span>
                <span className="text-[0.7rem] text-emerald-400 font-bold">
                  {filteredContacts.length} usuarios activos
                </span>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all hover:scale-105"
                title="Agregar nuevo chat introduciendo el correo registrado"
              >
                <UserPlus size={16} className="text-slate-950" />
                <span className="font-black text-slate-950">+ Correo</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="p-3 bg-slate-900 border-b border-slate-800">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por correo o nombre..."
                  className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-bold text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white border-none bg-transparent cursor-pointer p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Lista de Contactos */}
            <div className="flex-1 overflow-y-auto p-2.5 flex flex-col gap-2 custom-scrollbar bg-slate-900">
              {filteredContacts.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400 font-semibold space-y-2">
                  <p className="m-0">No se encontraron chats con ese correo o nombre.</p>
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs border-none cursor-pointer shadow-md"
                  >
                    + Iniciar chat introduciendo correo
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
                          ? 'bg-emerald-500/20 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                          : 'bg-slate-800/80 border-slate-700/60 hover:bg-slate-800 text-slate-200'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-black text-white text-base shadow-sm">
                          {c.name.charAt(0)}
                        </div>
                        {c.isOnline && (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 absolute bottom-0 right-0 shadow-xs" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-xs text-white truncate">{c.name}</span>
                          <span className="text-[0.65rem] font-bold text-slate-400 shrink-0">{c.lastTime || 'Hoy'}</span>
                        </div>
                        
                        <div className="text-[0.7rem] font-bold text-emerald-400 truncate mt-0.5 flex items-center gap-1">
                          <Mail size={11} className="shrink-0 text-emerald-400" />
                          <span className="truncate">{c.email}</span>
                        </div>

                        <p className="text-[0.72rem] font-medium text-slate-300 truncate m-0 mt-1 flex items-center gap-1">
                          <CheckCheck size={13} className="text-blue-400 shrink-0" />
                          <span className="truncate">{c.lastMsg || c.profession}</span>
                        </p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* PANEL DERECHO: Área de Conversación (Ocupa 100% del Ancho Restante) */}
          <div className={`${mobileView === 'contacts' ? 'hidden lg:flex' : 'flex'} flex-1 flex-col bg-slate-950 h-full relative`}>
            
            {/* Header del Chat Activo */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shadow-md shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                {/* Botón Volver en Vista Móvil */}
                <button
                  onClick={() => setMobileView('contacts')}
                  className="lg:hidden p-2 rounded-xl bg-slate-800 text-white border border-slate-700 cursor-pointer shrink-0"
                  title="Volver a la lista de contactos"
                >
                  <ChevronLeft size={20} />
                </button>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center font-black text-white text-base shadow-sm shrink-0">
                  {selectedColleague.name.charAt(0)}
                </div>

                <div className="min-w-0">
                  <h3 className="font-black text-sm text-white flex items-center gap-1.5 m-0 truncate">
                    {selectedColleague.name}
                    <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
                  </h3>
                  <div className="flex items-center gap-2 text-[0.72rem] text-slate-300 font-medium truncate mt-0.5">
                    <span className="text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> En línea
                    </span>
                    <span className="truncate text-slate-400">• {selectedColleague.email}</span>
                  </div>
                </div>
              </div>

              {/* Botones de Acción Superior */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleSendEmailDirectly}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-1.5 border border-slate-700 cursor-pointer transition-all"
                  title="Enviar correo electrónico directo"
                >
                  <Mail size={15} className="text-blue-400" /> <span className="hidden sm:inline">Mandar Email</span>
                </button>

                <button
                  onClick={() => {
                    loadUserDocuments();
                    setShowDocModal(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all"
                  title="Adjuntar informe técnico en PDF"
                >
                  <Paperclip size={15} /> <span className="hidden sm:inline">Adjuntar PDF</span>
                </button>
              </div>
            </div>

            {/* Mensajes del Chat */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3.5 custom-scrollbar bg-slate-950">
              {activeMessages.length === 0 ? (
                <div className="m-auto text-center p-6 bg-slate-900 rounded-2xl border border-slate-800 max-w-sm shadow-xl">
                  <MessageSquare size={36} className="text-emerald-500 mx-auto mb-2" />
                  <h4 className="font-black text-sm text-white m-0">Inicio de Conversación</h4>
                  <p className="text-xs text-slate-400 font-medium mt-1">
                    Escribí un mensaje técnico o adjuntá un informe PDF para coordinar tareas con {selectedColleague.name}.
                  </p>
                </div>
              ) : (
                activeMessages.map((m) => {
                  const isMe = m.senderUid === (currentUser?.uid || 'user_me');
                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col max-w-[88%] sm:max-w-[75%] ${isMe ? 'self-end items-end' : 'self-start items-start'}`}
                    >
                      <div className="flex items-center gap-1.5 text-[0.68rem] font-bold text-slate-400 mb-1 px-1">
                        <span>{m.senderName}</span>
                        <span>•</span>
                        <span>{new Date(m.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>

                      <div
                        className={`p-4 rounded-2xl shadow-md text-xs sm:text-sm leading-relaxed font-medium ${
                          isMe
                            ? 'bg-emerald-700 text-white rounded-br-none'
                            : 'bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none'
                        }`}
                      >
                        <p className="m-0 whitespace-pre-wrap">{m.text}</p>

                        {/* Tarjeta de Documento PDF Adjunto */}
                        {m.attachment && (
                          <div className="mt-3 p-3.5 rounded-xl bg-slate-900 text-white border border-slate-700 flex flex-col gap-2 shadow-inner">
                            <div className="flex items-center gap-3">
                              <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                                <FileText size={22} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 font-black uppercase">
                                  {m.attachment.typeLabel}
                                </span>
                                <h4 className="font-extrabold text-xs mt-1 text-white truncate m-0">{m.attachment.title}</h4>
                                <p className="text-[0.68rem] text-slate-300 truncate m-0">{m.attachment.subtitle}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 mt-2 border-t border-slate-800 pt-2.5">
                              <a
                                href={m.attachment.publicUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[0.72rem] font-black flex items-center justify-center gap-1.5 text-decoration-none shadow-sm"
                              >
                                <Eye size={14} /> Ver PDF
                              </a>
                              <a
                                href={`${m.attachment.publicUrl}?print=true`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[0.72rem] font-black flex items-center justify-center gap-1 text-decoration-none shadow-sm"
                                title="Descargar / Imprimir"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-end gap-1 mt-1.5 text-[0.65rem] text-slate-300">
                          <CheckCheck size={14} className="text-blue-400" />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar de Envío de Mensajes */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-slate-900 border-t border-slate-800 flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => {
                  loadUserDocuments();
                  setShowDocModal(true);
                }}
                className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer shadow-md shrink-0 flex items-center justify-center"
                title="Adjuntar informe PDF"
              >
                <Paperclip size={18} />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={`Escribí un mensaje a ${selectedColleague.name}...`}
                className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-semibold text-white placeholder-slate-400 outline-none focus:ring-2 focus:ring-emerald-500 shadow-inner"
              />

              <button
                type="submit"
                disabled={!inputText.trim()}
                className="p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white border-none cursor-pointer shadow-md disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
                title="Enviar mensaje"
              >
                <Send size={18} />
              </button>
            </form>

          </div>

        </div>

      </div>

      {/* MODAL: Agregar Nuevo Contacto por Correo Registrado */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-[480px] w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 font-bold">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="font-black text-base text-white m-0">
                    Iniciar Chat por Correo
                  </h3>
                  <p className="text-xs text-slate-400 font-bold m-0">Validación de usuario registrado</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-300 font-medium">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-400" />
              <span>
                Por seguridad, solo podés iniciar chat con usuarios que posean un correo electrónico registrado en la plataforma.
              </span>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-white uppercase mb-1.5">
                  Correo Electrónico del Usuario *
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    required
                    type="email"
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
                    placeholder="ejemplo: carlos.mendoza@hys.com"
                    className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-800 border border-slate-700 text-sm font-bold text-white placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs border border-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs border-none cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <UserPlus size={16} /> Validar y Abrir Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjuntar Informe PDF */}
      {showDocModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-[550px] w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText size={22} className="text-emerald-400" />
                <h3 className="font-black text-base text-white m-0">
                  Adjuntar Informe PDF al Chat
                </h3>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
              {userDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 font-bold">
                  No tenés informes guardados en tu historial. Creá un ATS, Carga de Fuego o Checklist para adjuntarlo acá.
                </div>
              ) : (
                userDocs.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => handleAttachDocument(doc)}
                    className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-emerald-500 text-left transition-all flex items-center justify-between cursor-pointer shadow-sm group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black uppercase">
                          {doc.typeLabel}
                        </span>
                        <h4 className="font-extrabold text-xs text-white truncate mt-1 m-0">{doc.title}</h4>
                        <span className="text-[0.68rem] text-slate-400 truncate block mt-0.5">{doc.subtitle}</span>
                      </div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-xl group-hover:scale-105 transition-transform shrink-0">
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
