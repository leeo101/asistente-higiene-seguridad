import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send, Paperclip, FileText, Search, ShieldCheck,
  CheckCheck, Download, Eye, ArrowLeft,
  X, UserPlus, Mail, ChevronLeft,
  AlertCircle, Lock, Check, Clock, Home
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
  delivered?: boolean;
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
  lastSeen?: string;
  avatarColor?: string;
  lastMsg?: string;
  lastTime?: string;
  unreadCount?: number;
}

const DEFAULT_REGISTERED_USERS: Colleague[] = [
  {
    uid: 'colleague_demo_1',
    name: 'Ing. Carlos Mendoza',
    profession: 'Especialista EHS & Ergonomía',
    email: 'carlos.mendoza@hys.com',
    license: 'MP-4821',
    isOnline: true,
    lastSeen: 'En línea ahora',
    avatarColor: 'from-[#00a884] to-[#008069]',
    lastMsg: 'Te compartí la evaluación de Carga de Fuego.',
    lastTime: '14:20',
    unreadCount: 1
  },
  {
    uid: 'colleague_demo_2',
    name: 'Lic. Mariana Gómez',
    profession: 'Inspectora de Obra & Asesora HyS',
    email: 'mariana.gomez@hys.com',
    license: 'MP-8910',
    isOnline: true,
    lastSeen: 'En línea ahora',
    avatarColor: 'from-teal-500 to-emerald-700',
    lastMsg: 'Perfecto, ya reviso el Programa de Seguridad.',
    lastTime: '12:15',
    unreadCount: 0
  },
  {
    uid: 'colleague_demo_3',
    name: 'Téc. Roberto Rossi',
    profession: 'Auditor ISO 45001',
    email: 'roberto.rossi@hys.com',
    license: 'MP-1244',
    isOnline: false,
    lastSeen: 'últ. vez hoy a las 11:45',
    avatarColor: 'from-slate-600 to-slate-800',
    lastMsg: 'Revisé la planilla de control de extintores.',
    lastTime: '11:45',
    unreadCount: 0
  },
  {
    uid: 'colleague_demo_4',
    name: 'Ing. Esteban Juárez',
    profession: 'Prevencionista de Riesgos en Obra',
    email: 'esteban.juarez@hys.com',
    license: 'MP-6723',
    isOnline: true,
    lastSeen: 'En línea ahora',
    avatarColor: 'from-emerald-600 to-green-800',
    lastMsg: '¿Tienen listo el ATS firmado para montaje?',
    lastTime: 'Ayer',
    unreadCount: 2
  },
  {
    uid: 'colleague_demo_5',
    name: 'Lic. Valeria Paz',
    profession: 'Especialista en Medio Ambiente y Residuos',
    email: 'valeria.paz@hys.com',
    license: 'MP-5512',
    isOnline: false,
    lastSeen: 'últ. vez ayer a las 19:20',
    avatarColor: 'from-slate-600 to-slate-800',
    lastMsg: 'Mañana cargo el manifiesto de residuos peligrosos.',
    lastTime: 'Ayer',
    unreadCount: 0
  },
  {
    uid: 'colleague_demo_6',
    name: 'Ing. Marcos Silva',
    profession: 'Consultor Eléctrico & LOTO (Res. 900/15)',
    email: 'marcos.silva@hys.com',
    license: 'MP-3190',
    isOnline: false,
    lastSeen: 'últ. vez hace 2 días',
    avatarColor: 'from-slate-600 to-slate-800',
    lastMsg: 'Protocolo de puesta a tierra finalizado.',
    lastTime: 'Lun',
    unreadCount: 0
  }
];

const QUICK_REPLIES = [
  '✅ Recibido, ya reviso el informe PDF.',
  '📋 ¿Me podés compartir el ATS firmado de hoy?',
  '👷‍♂️ Programa de Seguridad aprobado para presentar en ART.',
  '⚠️ Recordá adjuntar las fotos de evidencia del sector.'
];

export default function ProfessionalChat(): React.ReactElement {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { isPro, loading } = usePaywall();

  useEffect(() => {
    if (!loading && !isPro) {
      window.dispatchEvent(new CustomEvent('show-paywall'));
      navigate('/');
    }
  }, [isPro, loading, navigate]);

  const [mobileView, setMobileView] = useState<'contacts' | 'chat'>('contacts');
  const [contactFilter, setContactFilter] = useState<'all' | 'online' | 'offline' | 'unread'>('all');
  const [typingColleagueId, setTypingColleagueId] = useState<string | null>(null);

  // Cargar contactos combinando defaults actualizados (con estados En línea y Desconectados reales)
  const [contacts, setContacts] = useState<Colleague[]>(() => {
    try {
      const saved = localStorage.getItem('hys_professional_contacts');
      if (saved) {
        const parsed: Colleague[] = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const defaultMap = new Map(DEFAULT_REGISTERED_USERS.map(d => [d.uid, d]));
          const updatedExisting = parsed.map(c => {
            const def = defaultMap.get(c.uid);
            if (def) {
              return {
                ...c,
                isOnline: def.isOnline,
                lastSeen: def.lastSeen,
                avatarColor: def.avatarColor,
                license: c.license || def.license
              };
            }
            return c;
          });
          const existingUids = new Set(updatedExisting.map(c => c.uid));
          const missingDefaults = DEFAULT_REGISTERED_USERS.filter(d => !existingUids.has(d.uid));
          return [...updatedExisting, ...missingDefaults];
        }
      }
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_REGISTERED_USERS;
  });

  // selectedColleague puede ser null cuando el usuario vuelve hacia atrás a la vista general de contactos
  const [selectedColleague, setSelectedColleague] = useState<Colleague | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Agregar Contacto
  const [showAddModal, setShowAddModal] = useState(false);
  const [inputEmail, setInputEmail] = useState('');

  // Modal Adjuntar Documentos
  const [showDocModal, setShowDocModal] = useState(false);
  const [userDocs, setUserDocs] = useState<any[]>([]);

  // Referencias para el manejo del botón "Atrás" físico del celular y del navegador en PC
  const stateRef = useRef({
    selectedColleague,
    mobileView,
    showAddModal,
    showDocModal
  });
  useEffect(() => {
    stateRef.current = { selectedColleague, mobileView, showAddModal, showDocModal };
  }, [selectedColleague, mobileView, showAddModal, showDocModal]);

  // Interceptar el botón "Atrás" del navegador en PC y el botón físico/gesto "Atrás" del celular
  useEffect(() => {
    // Empujar un estado base al entrar a Mensajería PRO para que "Atrás" no saque de la página
    window.history.pushState({ hysMessengerPage: 'root' }, '');

    const handlePopState = () => {
      const current = stateRef.current;

      // 1. Si hay un modal abierto, cerrarlo primero y mantenerse en Mensajería
      if (current.showAddModal || current.showDocModal) {
        setShowAddModal(false);
        setShowDocModal(false);
        window.history.pushState({ hysMessengerPage: 'root' }, '');
        return;
      }

      // 2. Si hay un chat abierto (en PC o en celular), volver a la lista de contactos sin salir de Mensajería
      if (current.selectedColleague !== null || current.mobileView === 'chat') {
        setSelectedColleague(null);
        setMobileView('contacts');
        window.history.pushState({ hysMessengerPage: 'root' }, '');
        return;
      }

      // 3. Si ya estaba en la lista de contactos sin chat activo, volver a empujar el estado para no salir por accidente
      window.history.pushState({ hysMessengerPage: 'root' }, '');
      toast('Estás en la bandeja principal de Mensajería PRO. Usá "Salir al Inicio" arriba si querés ir al menú principal.', {
        id: 'back-guard-toast',
        duration: 2500
      });
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  // Función unificada para el botón "Hacia Atrás" dentro de la interfaz
  const handleBackStep = () => {
    if (showAddModal || showDocModal) {
      setShowAddModal(false);
      setShowDocModal(false);
      return;
    }
    if (selectedColleague !== null || mobileView === 'chat') {
      setSelectedColleague(null);
      setMobileView('contacts');
      return;
    }
    navigate('/');
  };

  // Estado de Mensajes
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem('hys_professional_chat_messages_map');
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      colleague_demo_1: [
        {
          id: 'msg-1',
          senderUid: 'colleague_demo_1',
          senderName: 'Ing. Carlos Mendoza',
          senderRole: 'Especialista EHS',
          text: '¡Hola colega! Te comparto la última evaluación de Carga de Fuego de la Planta 2 para tu visado técnico.',
          timestamp: Date.now() - 3600000 * 2,
          read: true,
          attachment: {
            id: 'demo-fire-1',
            cat: 'fireload',
            title: 'Carga de Fuego — Planta Industrial Norte',
            subtitle: 'Sector Depósito A1 • Dec. 351/79 Anexo VII',
            typeLabel: 'PDF • Carga de Fuego',
            date: 'Hoy',
            publicUrl: `${window.location.origin}/v/guest/fireload/demo-fire-1`
          }
        },
        {
          id: 'msg-2',
          senderUid: currentUser?.uid || 'user_me',
          senderName: 'Tú',
          senderRole: 'Lic. en Higiene y Seguridad',
          text: '¡Excelente Carlos! Ya lo abro desde acá y verifico los resultados de resistencia al fuego.',
          timestamp: Date.now() - 3600000 * 1,
          read: true
        }
      ],
      colleague_demo_2: [
        {
          id: 'msg-201',
          senderUid: 'colleague_demo_2',
          senderName: 'Lic. Mariana Gómez',
          senderRole: 'Inspectora de Obra',
          text: 'Buen día, cuando tengas listo el Programa de Seguridad Res. 51/97 pasámelo por acá así lo presentamos en la ART.',
          timestamp: Date.now() - 3600000 * 3,
          read: true
        }
      ],
      colleague_demo_3: [
        {
          id: 'msg-301',
          senderUid: 'colleague_demo_3',
          senderName: 'Téc. Roberto Rossi',
          senderRole: 'Auditor ISO 45001',
          text: 'Te dejé cargada la planilla de control de extintores antes de desconectarme. Mañana a primera hora la vemos.',
          timestamp: Date.now() - 3600000 * 5,
          read: true
        }
      ]
    };
  });

  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_contacts', JSON.stringify(contacts));
    } catch (e) {}
  }, [contacts]);

  useEffect(() => {
    try {
      localStorage.setItem('hys_professional_chat_messages_map', JSON.stringify(messages));
    } catch (e) {}
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedColleague?.uid, typingColleagueId]);

  const activeMessages = selectedColleague ? messages[selectedColleague.uid] || [] : [];

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

  const onlineCount = contacts.filter(c => c.isOnline).length;
  const offlineCount = contacts.filter(c => !c.isOnline).length;
  const unreadTotalCount = contacts.filter(c => (c.unreadCount || 0) > 0).length;

  const filteredContacts = contacts.filter(c => {
    if (contactFilter === 'online' && !c.isOnline) return false;
    if (contactFilter === 'offline' && c.isOnline) return false;
    if (contactFilter === 'unread' && (!c.unreadCount || c.unreadCount <= 0)) return false;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.license && c.license.toLowerCase().includes(q)) ||
      c.profession.toLowerCase().includes(q)
    );
  });

  const handleSelectContact = (c: Colleague) => {
    setSelectedColleague(c);
    setMobileView('chat');
    window.history.pushState({ hysMessengerPage: 'chat', colleagueUid: c.uid }, '');
    if (c.unreadCount && c.unreadCount > 0) {
      setContacts(prev => prev.map(item => (item.uid === c.uid ? { ...item, unreadCount: 0 } : item)));
    }
  };

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = inputEmail.toLowerCase().trim();

    if (!cleanEmail) {
      toast.error('Por favor ingresá un correo electrónico.');
      return;
    }

    const existsAlready = contacts.find(c => c.email.toLowerCase() === cleanEmail);
    if (existsAlready) {
      handleSelectContact(existsAlready);
      setShowAddModal(false);
      setInputEmail('');
      toast.success(`Chat con ${existsAlready.name} abierto.`);
      return;
    }

    const registeredEmails = getRegisteredEmails();
    const isRegistered = registeredEmails.includes(cleanEmail);

    if (!isRegistered) {
      toast.error(
        '🛑 Este correo no pertenece a un usuario registrado en la plataforma. Solo podés chatear con colegas registrados.',
        { duration: 5000 }
      );
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
      lastSeen: 'En línea ahora',
      avatarColor: 'from-[#00a884] to-[#008069]',
      lastMsg: 'Chat iniciado',
      lastTime: 'Ahora',
      unreadCount: 0
    };

    setContacts(prev => [newContact, ...prev]);
    handleSelectContact(newContact);
    setShowAddModal(false);
    setInputEmail('');
    toast.success(`¡Contacto ${newContact.name} agregado a Mensajería PRO!`);
  };

  const loadUserDocuments = () => {
    const safeParse = (key: string) => {
      try {
        return JSON.parse(localStorage.getItem(key) || '[]');
      } catch {
        return [];
      }
    };

    const constructionPrograms = safeParse('construction_safety_programs_db').map((item: any) => ({
      id: item.id || `obra-${Date.now()}`,
      cat: 'construction',
      title: `Programa de Seguridad — ${item.contractorName || 'Obra'}`,
      subtitle: `${item.siteAddress || 'Obra'} • ${item.programNumber || 'Res. 51/97'}`,
      typeLabel: 'Programa Obra SRT',
      date: item.startDate || 'Reciente'
    }));

    const ats = safeParse('ats_history').map((item: any) => ({
      id: item.id || `ats-${Date.now()}`,
      cat: 'ats',
      title: item.empresa || 'Análisis de Trabajo Seguro',
      subtitle: `${item.obra || 'Obra General'} • ${item.tarea || 'ATS'}`,
      typeLabel: 'ATS',
      date: item.fecha || 'Reciente'
    }));

    const fireload = safeParse('fireload_history').map((item: any) => ({
      id: item.id || `fire-${Date.now()}`,
      cat: 'fireload',
      title: item.empresa || 'Estudio de Carga de Fuego',
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
      title: `Aptitud Médica — ${item.workerName}`,
      subtitle: `DNI: ${item.dni} • ${item.result}`,
      typeLabel: 'Aptitud Médica',
      date: item.examDate || 'Reciente'
    }));

    setUserDocs([...constructionPrograms, ...ats, ...fireload, ...checklists, ...medicals]);
  };

  const triggerSimulatedReply = (colleague: Colleague, isAttachment: boolean) => {
    // Si el colega NO está en línea, no responde en vivo
    if (!colleague.isOnline) return;
    if (!colleague.uid.startsWith('colleague_demo_')) return;

    setTypingColleagueId(colleague.uid);
    setTimeout(() => {
      setTypingColleagueId(null);
      const replyText = isAttachment
        ? `¡Recibido el documento PDF! Ya lo descargo para revisarlo y dejarte la conformidad firmada. 👍`
        : `Perfecto, recibido. Estoy en línea por acá para coordinar la documentación de Higiene y Seguridad.`;
      const replyMsg: Message = {
        id: `msg-reply-${Date.now()}`,
        senderUid: colleague.uid,
        senderName: colleague.name,
        senderRole: colleague.profession,
        text: replyText,
        timestamp: Date.now(),
        read: true
      };
      setMessages(prev => ({
        ...prev,
        [colleague.uid]: [...(prev[colleague.uid] || []), replyMsg]
      }));
      setContacts(prev =>
        prev.map(c =>
          c.uid === colleague.uid
            ? {
                ...c,
                lastMsg: replyText,
                lastTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
              }
            : c
        )
      );
    }, 1500);
  };

  const sendTextMessage = (rawText: string) => {
    if (!selectedColleague) return;
    const trimmed = rawText.trim();
    if (!trimmed) return;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: trimmed,
      timestamp: Date.now(),
      read: selectedColleague.isOnline,
      delivered: selectedColleague.isOnline
    };

    const colleague = selectedColleague;
    setMessages(prev => ({
      ...prev,
      [colleague.uid]: [...(prev[colleague.uid] || []), newMsg]
    }));

    setContacts(prev =>
      prev.map(c =>
        c.uid === colleague.uid
          ? {
              ...c,
              lastMsg: trimmed,
              lastTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            }
          : c
      )
    );

    setInputText('');
    triggerSimulatedReply(colleague, false);
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    sendTextMessage(inputText);
  };

  const handleSendEmailDirectly = () => {
    if (!selectedColleague?.email) {
      toast.error('Este contacto no posee un correo registrado.');
      return;
    }
    const subject = encodeURIComponent(
      `Asistente H&S — Consulta de ${currentUser?.displayName || 'Profesional HyS'}`
    );
    const body = encodeURIComponent(
      `Hola ${selectedColleague.name},\n\nTe contacto desde la Red Profesional Asistente H&S para coordinar tareas técnicas de prevención e higiene laboral.\n\nSaludos cordiales.`
    );
    window.open(`mailto:${selectedColleague.email}?subject=${subject}&body=${body}`, '_blank');
  };

  const handleAttachDocument = (doc: any) => {
    if (!selectedColleague) return;
    setShowDocModal(false);

    const publicUrl = `${window.location.origin}/v/${currentUser?.uid || 'guest'}/${doc.cat}/${doc.id}`;

    const newMsg: Message = {
      id: `msg-${Date.now()}`,
      senderUid: currentUser?.uid || 'user_me',
      senderName: currentUser?.displayName || 'Tú',
      senderRole: 'Profesional HyS',
      text: `Te comparto el documento oficial en PDF: "${doc.title}"`,
      timestamp: Date.now(),
      read: selectedColleague.isOnline,
      delivered: selectedColleague.isOnline,
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

    const colleague = selectedColleague;
    setMessages(prev => ({
      ...prev,
      [colleague.uid]: [...(prev[colleague.uid] || []), newMsg]
    }));

    setContacts(prev =>
      prev.map(c =>
        c.uid === colleague.uid
          ? {
              ...c,
              lastMsg: `📄 PDF: ${doc.title}`,
              lastTime: new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
            }
          : c
      )
    );

    toast.success('¡Documento PDF enviado al chat!');
    triggerSimulatedReply(colleague, true);
  };

  return (
    <div
      className="min-h-screen pb-8 px-2 sm:px-5 text-[#e9edef]"
      style={{
        paddingTop: '7.2rem',
        background: 'linear-gradient(180deg, #0b141a 0%, #111b21 100%)'
      }}
    >
      <div className="max-w-[1440px] mx-auto">
        {/* ── BANNER SUPERIOR ESTILO WHATSAPP BUSINESS PRO CON LOGO OFICIAL ── */}
        <div
          className="rounded-2xl p-3.5 sm:px-5 sm:py-3.5 mb-4 flex items-center justify-between gap-4 flex-wrap shadow-xl border"
          style={{
            background: 'linear-gradient(135deg, #008069 0%, #005c4b 55%, #111b21 100%)',
            borderColor: 'rgba(0, 168, 132, 0.45)'
          }}
        >
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {/* Botón Flecha Atrás Inteligente: si hay un chat abierto vuelve a Contactos; si no, vuelve al Inicio */}
            <button
              onClick={handleBackStep}
              className="px-3 py-2.5 rounded-xl bg-black/30 hover:bg-black/45 border border-white/20 text-white cursor-pointer transition-all shrink-0 flex items-center gap-1.5 font-bold text-xs"
              title={
                selectedColleague
                  ? 'Volver a la lista de contactos de Mensajería'
                  : 'Volver al Panel Principal'
              }
            >
              <ArrowLeft size={18} />
              <span className="hidden sm:inline">
                {selectedColleague ? 'Atrás a Contactos' : 'Inicio'}
              </span>
            </button>

            {/* Logo Oficial de Asistente H&S Destacado */}
            <div className="flex items-center gap-3 bg-[#111b21]/90 border border-[#00a884]/50 px-3 py-1.5 rounded-2xl shadow-lg shrink-0">
              <img
                src="/logo.png"
                alt="Logo Asistente H&S"
                className="w-9 h-9 sm:w-10 sm:h-10 object-contain drop-shadow-md"
              />
              <div className="hidden sm:flex flex-col leading-none">
                <span className="text-[11px] font-black tracking-wider text-[#00a884] uppercase">
                  ASISTENTE H&amp;S
                </span>
                <span className="text-[10px] font-bold text-[#8696a0]">
                  Red Oficial Certificada
                </span>
              </div>
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight m-0">
                  Mensajería PRO H&amp;S
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#25D366] text-[#0b141a] text-[10px] font-black uppercase tracking-wider shadow-sm">
                  {onlineCount} En Línea • {offlineCount} Desconectados
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5 m-0 truncate">
                Comunicación instantánea entre colegas matriculados e intercambio directo de informes PDF
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {selectedColleague && (
              <button
                onClick={() => navigate('/')}
                className="px-3 py-2 rounded-xl bg-black/25 hover:bg-black/40 border border-white/15 text-emerald-100 font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all"
                title="Salir al menú principal de Asistente H&S"
              >
                <Home size={14} />
                <span className="hidden sm:inline">Salir al Inicio</span>
              </button>
            )}
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#1ebe5d] text-[#0b141a] font-black text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all"
            >
              <UserPlus size={15} />
              <span>Nuevo Chat</span>
            </button>
          </div>
        </div>

        {/* ── CONTENEDOR PRINCIPAL ESTILO WHATSAPP WEB (2 PANELES) ── */}
        <div
          className="w-full flex flex-col lg:flex-row rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            backgroundColor: '#111b21',
            borderColor: '#222d34',
            height: 'calc(85vh - 95px)',
            minHeight: '590px'
          }}
        >
          {/* ================= PANEL IZQUIERDO: LISTA DE CHATS ================= */}
          <div
            className={`${
              mobileView === 'chat' && selectedColleague ? 'hidden lg:flex' : 'flex'
            } w-full lg:w-[360px] xl:w-[400px] flex-col shrink-0 h-full`}
            style={{
              backgroundColor: '#111b21',
              borderRight: '1px solid #222d34'
            }}
          >
            {/* Cabecera del Panel Izquierdo (#202c33) con Logo */}
            <div
              className="px-4 py-3 flex items-center justify-between gap-2 shrink-0"
              style={{
                backgroundColor: '#202c33',
                borderBottom: '1px solid #222d34'
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div className="w-10 h-10 rounded-full bg-[#111b21] border border-[#00a884]/60 p-1 flex items-center justify-center shadow-inner">
                    <img
                      src="/logo.png"
                      alt="HYS"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="w-3 h-3 rounded-full bg-[#25D366] border-2 border-[#202c33] absolute bottom-0 right-0" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-[#e9edef] truncate">
                    {currentUser?.displayName || 'Mi Perfil Profesional'}
                  </div>
                  <div className="text-[11px] text-[#00a884] font-semibold flex items-center gap-1">
                    <span>● En línea • {onlineCount} activos ahora</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowAddModal(true)}
                className="px-3 py-1.5 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-extrabold text-xs flex items-center gap-1.5 border-none cursor-pointer transition-all shadow-sm"
                title="Iniciar nuevo chat por correo electrónico"
              >
                <UserPlus size={15} />
                <span>+ Chat</span>
              </button>
            </div>

            {/* Buscador y Filtros Estilo WhatsApp (Todos | En línea | Desconectados | No leídos) */}
            <div
              className="p-2.5 space-y-2 shrink-0"
              style={{
                backgroundColor: '#111b21',
                borderBottom: '1px solid #222d34'
              }}
            >
              <div className="relative flex items-center">
                <Search size={15} className="absolute left-3.5 text-[#8696a0]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar un chat, matrícula o correo..."
                  style={{ backgroundColor: '#202c33', color: '#e9edef' }}
                  className="w-full pl-10 pr-8 py-2 rounded-lg border-none text-xs font-medium placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 text-[#8696a0] hover:text-white border-none bg-transparent cursor-pointer p-0.5"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Píldoras de Filtro: Todos, En línea, Desconectados y No leídos */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar px-0.5">
                {[
                  { id: 'all' as const, label: `Todos (${contacts.length})` },
                  { id: 'online' as const, label: `🟢 En línea (${onlineCount})` },
                  { id: 'offline' as const, label: `⚪ Desconectados (${offlineCount})` },
                  { id: 'unread' as const, label: `No leídos (${unreadTotalCount})` }
                ].map(tab => {
                  const active = contactFilter === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setContactFilter(tab.id)}
                      style={{
                        backgroundColor: active ? '#00a88433' : '#202c33',
                        color: active ? '#00a884' : '#8696a0',
                        borderColor: active ? '#00a88466' : 'transparent'
                      }}
                      className="px-2.5 py-1 rounded-full text-[11px] font-bold border cursor-pointer transition-colors whitespace-nowrap shrink-0"
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Lista de Conversaciones con Estado En Línea / Desconectado Diferenciado */}
            <div
              className="flex-1 overflow-y-auto divide-y custom-scrollbar"
              style={{
                backgroundColor: '#111b21',
                borderColor: '#222d34'
              }}
            >
              {filteredContacts.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8696a0] space-y-3">
                  <p className="m-0">No se encontraron contactos en este filtro.</p>
                  <button
                    onClick={() => setContactFilter('all')}
                    className="px-4 py-2 rounded-full bg-[#00a884] text-[#111b21] font-extrabold text-xs border-none cursor-pointer"
                  >
                    Ver todos los contactos
                  </button>
                </div>
              ) : (
                filteredContacts.map(c => {
                  const isSelected = selectedColleague?.uid === c.uid;
                  const isTyping = typingColleagueId === c.uid;
                  return (
                    <button
                      key={c.uid}
                      onClick={() => handleSelectContact(c)}
                      style={{
                        backgroundColor: isSelected ? '#2a3942' : 'transparent',
                        borderLeft: isSelected ? '4px solid #00a884' : '4px solid transparent'
                      }}
                      className="w-full px-3.5 py-3 text-left transition-colors hover:bg-[#202c33] flex items-center gap-3 cursor-pointer border-t-0 border-r-0 border-b border-[#222d34]"
                    >
                      {/* Avatar con indicador En Línea (verde) o Desconectado (gris) */}
                      <div className="relative shrink-0">
                        <div
                          className={`w-12 h-12 rounded-full bg-gradient-to-br ${
                            c.isOnline
                              ? c.avatarColor || 'from-[#00a884] to-[#008069]'
                              : 'from-slate-600 to-slate-800 opacity-80'
                          } flex items-center justify-center font-black text-white text-base shadow-md`}
                        >
                          {c.name
                            .replace(/^(Ing\.|Lic\.|Téc\.)\s*/i, '')
                            .charAt(0)}
                        </div>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border-2 border-[#111b21] absolute bottom-0 right-0 ${
                            c.isOnline ? 'bg-[#25D366]' : 'bg-[#667781]'
                          }`}
                          title={c.isOnline ? 'En línea' : `Desconectado (${c.lastSeen || 'inactivo'})`}
                        />
                      </div>

                      {/* Contenido del Contacto */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-[13.5px] text-[#e9edef] truncate">
                            {c.name}
                          </span>
                          <span
                            className={`text-[10.5px] shrink-0 font-semibold ${
                              c.unreadCount && c.unreadCount > 0
                                ? 'text-[#25D366] font-bold'
                                : 'text-[#8696a0]'
                            }`}
                          >
                            {c.lastTime || 'Hoy'}
                          </span>
                        </div>

                        {/* Etiqueta explícita de Estado En Línea vs Desconectado */}
                        <div className="flex items-center justify-between gap-1.5 mt-0.5">
                          {c.isOnline ? (
                            <span className="text-[10.5px] font-bold text-[#25D366] flex items-center gap-1 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] inline-block" />
                              <span>En línea • {c.profession}</span>
                            </span>
                          ) : (
                            <span className="text-[10.5px] font-medium text-[#8696a0] flex items-center gap-1 truncate">
                              <Clock size={10} className="shrink-0 text-[#8696a0]" />
                              <span>Desconectado ({c.lastSeen || 'últ. vez ayer'})</span>
                            </span>
                          )}

                          {c.license && (
                            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#202c33] text-[#8696a0] border border-[#2a3942] shrink-0">
                              {c.license}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between gap-2 mt-1">
                          {isTyping ? (
                            <span className="text-xs font-bold text-[#25D366] animate-pulse truncate">
                              escribiendo...
                            </span>
                          ) : (
                            <p className="text-xs text-[#8696a0] truncate m-0 flex items-center gap-1">
                              {c.isOnline ? (
                                <CheckCheck size={14} className="text-[#53bdeb] shrink-0" />
                              ) : (
                                <Check size={13} className="text-[#8696a0] shrink-0" />
                              )}
                              <span className="truncate">{c.lastMsg || c.email}</span>
                            </p>
                          )}

                          {c.unreadCount && c.unreadCount > 0 ? (
                            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#25D366] text-[#111b21] font-black text-[10px] flex items-center justify-center shrink-0">
                              {c.unreadCount}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ================= PANEL DERECHO: VENTANA DE CONVERSACIÓN WHATSAPP ================= */}
          <div
            className={`${
              mobileView === 'contacts' || !selectedColleague ? 'hidden lg:flex' : 'flex'
            } flex-1 flex-col h-full relative`}
            style={{ backgroundColor: '#0b141a' }}
          >
            {!selectedColleague ? (
              /* Pantalla de Bienvenida Estilo WhatsApp Web cuando no hay un chat abierto (o al volver atrás en PC) */
              <div
                className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none relative"
                style={{
                  backgroundColor: '#222e35',
                  borderBottom: '6px solid #00a884'
                }}
              >
                <div className="w-24 h-24 rounded-3xl bg-[#111b21] border-2 border-[#00a884]/50 p-3 flex items-center justify-center shadow-2xl mb-4">
                  <img
                    src="/logo.png"
                    alt="Logo Asistente H&S"
                    className="w-full h-full object-contain"
                  />
                </div>
                <h2 className="text-2xl font-black text-[#e9edef] m-0">
                  Mensajería PRO • Asistente H&amp;S
                </h2>
                <p className="text-sm text-[#8696a0] max-w-md mt-2 mb-6 leading-relaxed">
                  Seleccioná un colega de la lista izquierda para chatear en vivo o compartir informes técnicos en PDF (Programas de Seguridad, ATS, Carga de Fuego y Checklists).
                </p>

                <div className="flex flex-wrap items-center justify-center gap-3 mb-6">
                  <div className="px-3.5 py-2 rounded-xl bg-[#111b21] border border-[#25D366]/40 text-xs font-bold text-[#25D366] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#25D366] animate-pulse" />
                    <span>{onlineCount} Colegas En Línea Ahora</span>
                  </div>
                  <div className="px-3.5 py-2 rounded-xl bg-[#111b21] border border-[#8696a0]/30 text-xs font-bold text-[#8696a0] flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#667781]" />
                    <span>{offlineCount} Colegas Desconectados</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-[#8696a0]">
                  <Lock size={13} className="text-[#00a884]" />
                  <span>Tus mensajes técnicos y documentos están protegidos en la Red H&amp;S</span>
                </div>
              </div>
            ) : (
              <>
                {/* Cabecera del Chat Activo (#202c33) con Botón Flecha Atrás Visible en PC y Celular */}
                <div
                  className="px-3 sm:px-4 py-2.5 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-10"
                  style={{
                    backgroundColor: '#202c33',
                    borderBottom: '1px solid #222d34'
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Flecha para volver atrás a la bandeja de Mensajería (visible tanto en PC como en Celular) */}
                    <button
                      onClick={() => {
                        setSelectedColleague(null);
                        setMobileView('contacts');
                      }}
                      style={{ backgroundColor: '#2a3942', color: '#e9edef' }}
                      className="px-2.5 py-1.5 rounded-xl hover:bg-[#374248] border border-[#374248] cursor-pointer shrink-0 flex items-center gap-1 text-xs font-bold transition-colors"
                      title="Volver atrás a la lista de contactos (sin salir de Mensajería)"
                    >
                      <ChevronLeft size={18} />
                      <span className="hidden sm:inline">Atrás</span>
                    </button>

                    <div className="relative shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full bg-gradient-to-br ${
                          selectedColleague.isOnline
                            ? selectedColleague.avatarColor || 'from-[#00a884] to-[#008069]'
                            : 'from-slate-600 to-slate-800'
                        } flex items-center justify-center font-black text-white text-sm shadow-md`}
                      >
                        {selectedColleague.name
                          .replace(/^(Ing\.|Lic\.|Téc\.)\s*/i, '')
                          .charAt(0)}
                      </div>
                      <span
                        className={`w-2.5 h-2.5 rounded-full border-2 border-[#202c33] absolute bottom-0 right-0 ${
                          selectedColleague.isOnline ? 'bg-[#25D366]' : 'bg-[#667781]'
                        }`}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-[#e9edef] m-0 truncate">
                          {selectedColleague.name}
                        </h3>
                        <ShieldCheck size={15} className="text-[#00a884] shrink-0" />
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            selectedColleague.isOnline
                              ? 'bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/40'
                              : 'bg-slate-700/60 text-[#8696a0] border border-slate-600'
                          }`}
                        >
                          {selectedColleague.isOnline ? '🟢 En línea' : '⚪ Desconectado'}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#8696a0] truncate mt-0.5">
                        {typingColleagueId === selectedColleague.uid ? (
                          <span className="text-[#25D366] font-bold">escribiendo mensaje...</span>
                        ) : selectedColleague.isOnline ? (
                          <span className="text-[#00a884] font-medium">
                            Conectado ahora • {selectedColleague.profession} ({selectedColleague.email})
                          </span>
                        ) : (
                          <span className="text-[#8696a0]">
                            {selectedColleague.lastSeen || 'últ. vez recientemente'} • {selectedColleague.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Acciones del Chat Activo + Sello Logo HYS */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleSendEmailDirectly}
                      style={{ backgroundColor: '#2a3942', color: '#e9edef' }}
                      className="px-3 py-1.5 rounded-lg hover:opacity-90 font-semibold text-xs flex items-center gap-1.5 border border-[#374248] cursor-pointer transition-all"
                      title="Enviar correo electrónico directo"
                    >
                      <Mail size={14} className="text-[#53bdeb]" />
                      <span className="hidden sm:inline">Email</span>
                    </button>

                    <button
                      onClick={() => {
                        loadUserDocuments();
                        setShowDocModal(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-extrabold text-xs flex items-center gap-1.5 shadow-md border-none cursor-pointer transition-all"
                      title="Adjuntar informe técnico en PDF"
                    >
                      <Paperclip size={14} />
                      <span className="hidden sm:inline">Adjuntar PDF</span>
                    </button>

                    {/* Sello con el Logo de la página en la esquina superior derecha del chat */}
                    <div
                      className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-[#2a3942]"
                      title="Asistente H&S Oficial"
                    >
                      <img
                        src="/logo.png"
                        alt="Logo HYS"
                        className="w-7 h-7 object-contain opacity-90"
                      />
                    </div>
                  </div>
                </div>

                {/* Área de Mensajes con Fondo Texturizado Estilo WhatsApp Dark + Marca de Agua del Logo */}
                <div
                  className="flex-1 overflow-y-auto p-4 sm:px-8 sm:py-5 flex flex-col gap-2.5 custom-scrollbar relative"
                  style={{
                    backgroundColor: '#0b141a',
                    backgroundImage: `radial-gradient(rgba(0, 168, 132, 0.07) 1px, transparent 1px), radial-gradient(rgba(255, 255, 255, 0.03) 1px, #0b141a 1px)`,
                    backgroundSize: '28px 28px',
                    backgroundPosition: '0 0, 14px 14px'
                  }}
                >
                  {/* Marca de agua sutil con el Logo de la página en el centro del fondo del chat */}
                  <div className="pointer-events-none select-none sticky top-1/3 flex flex-col items-center justify-center opacity-[0.06] my-auto">
                    <img src="/logo.png" alt="" className="w-36 h-36 object-contain" />
                  </div>

                  {/* Aviso Superior de Seguridad + Estado de Conexión del Colega */}
                  <div className="self-center my-1 z-10 flex flex-col items-center gap-1.5">
                    <div
                      style={{
                        backgroundColor: '#182229',
                        color: '#ffd279',
                        borderColor: 'rgba(255, 210, 121, 0.2)'
                      }}
                      className="px-3.5 py-1.5 rounded-lg text-[11px] font-medium text-center max-w-md shadow-sm border flex items-center justify-center gap-1.5"
                    >
                      <Lock size={12} className="shrink-0 text-[#ffd279]" />
                      <span>
                        Los mensajes e informes técnicos PDF compartidos en este chat están verificados por{' '}
                        <strong>Asistente H&amp;S</strong>.
                      </span>
                    </div>

                    {!selectedColleague.isOnline && (
                      <div
                        style={{
                          backgroundColor: '#202c33',
                          color: '#8696a0',
                          borderColor: '#2a3942'
                        }}
                        className="px-3 py-1 rounded-full text-[10.5px] font-semibold border flex items-center gap-1.5"
                      >
                        <Clock size={11} />
                        <span>
                          {selectedColleague.name} no está en línea ({selectedColleague.lastSeen}). Tus mensajes quedarán enviados para cuando se conecte.
                        </span>
                      </div>
                    )}
                  </div>

                  {activeMessages.length === 0 ? (
                    <div
                      style={{ backgroundColor: '#182229', borderColor: '#2a3942' }}
                      className="m-auto z-10 text-center p-6 rounded-2xl border max-w-sm shadow-xl"
                    >
                      <img
                        src="/logo.png"
                        alt="Asistente H&S"
                        className="w-14 h-14 object-contain mx-auto mb-2"
                      />
                      <h4 className="font-bold text-sm text-[#e9edef] m-0">
                        Conversación con {selectedColleague.name}
                      </h4>
                      <p className="text-xs text-[#8696a0] mt-1 mb-0">
                        {selectedColleague.isOnline
                          ? 'El colega está en línea. Enviá un mensaje o compartí un informe PDF.'
                          : `El colega está desconectado (${selectedColleague.lastSeen}). Podés dejarle mensajes o informes PDF.`}
                      </p>
                    </div>
                  ) : (
                    activeMessages.map(m => {
                      const isMe = m.senderUid === (currentUser?.uid || 'user_me');
                      return (
                        <div
                          key={m.id}
                          className={`z-10 flex flex-col max-w-[88%] sm:max-w-[68%] ${
                            isMe ? 'self-end items-end' : 'self-start items-start'
                          }`}
                        >
                          {/* Burbuja Estilo WhatsApp (#005c4b para enviados, #202c33 para recibidos) */}
                          <div
                            style={{
                              backgroundColor: isMe ? '#005c4b' : '#202c33',
                              color: '#e9edef',
                              borderTopRightRadius: isMe ? '2px' : '12px',
                              borderTopLeftRadius: isMe ? '12px' : '2px',
                              borderBottomLeftRadius: '12px',
                              borderBottomRightRadius: '12px'
                            }}
                            className="px-3.5 py-2 shadow-md text-xs sm:text-[13.5px] leading-relaxed relative min-w-[140px]"
                          >
                            {!isMe && (
                              <div className="text-[11px] font-bold text-[#00a884] mb-0.5 flex items-center gap-1.5">
                                <span>{m.senderName}</span>
                                {m.senderRole && (
                                  <span className="text-[10px] font-normal text-[#8696a0]">
                                    • {m.senderRole}
                                  </span>
                                )}
                              </div>
                            )}

                            <p className="m-0 whitespace-pre-wrap pr-12">{m.text}</p>

                            {/* Tarjeta de Documento PDF Adjunto Estilo WhatsApp */}
                            {m.attachment && (
                              <div
                                style={{
                                  backgroundColor: isMe ? '#025144' : '#111b21',
                                  borderColor: isMe ? 'rgba(255,255,255,0.12)' : '#2a3942'
                                }}
                                className="mt-2 mb-3 p-3 rounded-xl border flex flex-col gap-2.5 shadow-inner"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-lg bg-[#f15c6d]/20 border border-[#f15c6d]/40 text-[#f15c6d] flex flex-col items-center justify-center shrink-0 font-black text-[9px]">
                                    <FileText size={16} />
                                    <span>PDF</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#00a884]/25 text-[#25D366] font-extrabold uppercase">
                                      {m.attachment.typeLabel}
                                    </span>
                                    <h4 className="font-bold text-xs mt-1 text-[#e9edef] truncate m-0">
                                      {m.attachment.title}
                                    </h4>
                                    <p className="text-[11px] text-[#8696a0] truncate m-0">
                                      {m.attachment.subtitle}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                  <a
                                    href={m.attachment.publicUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 py-1.5 px-3 rounded-lg bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] text-xs font-extrabold flex items-center justify-center gap-1.5 no-underline shadow-xs"
                                  >
                                    <Eye size={13} /> Abrir Documento
                                  </a>
                                  <a
                                    href={`${m.attachment.publicUrl}?print=true`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    style={{ backgroundColor: '#202c33', color: '#e9edef' }}
                                    className="py-1.5 px-3 rounded-lg hover:opacity-90 text-xs font-bold flex items-center justify-center gap-1 no-underline border border-white/10"
                                    title="Descargar / Imprimir PDF"
                                  >
                                    <Download size={13} /> PDF
                                  </a>
                                </div>
                              </div>
                            )}

                            {/* Hora + Doble tilde azul (si está en línea/leído) o 1 tilde gris (si está desconectado) */}
                            <div className="flex items-center justify-end gap-1 mt-0.5 text-[10px] text-[#8696a0] select-none">
                              <span>
                                {new Date(m.timestamp).toLocaleTimeString('es-AR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                              {isMe &&
                                (m.read !== false && selectedColleague.isOnline ? (
                                  <span title="Leído (En línea)" className="inline-flex">
                                    <CheckCheck size={14} className="text-[#53bdeb]" />
                                  </span>
                                ) : (
                                  <span title="Enviado (Destinatario desconectado)" className="inline-flex">
                                    <Check size={13} className="text-[#8696a0]" />
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Barra de Respuestas Rápidas H&S */}
                <div
                  className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0"
                  style={{
                    backgroundColor: '#182229',
                    borderTop: '1px solid #222d34'
                  }}
                >
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#00a884] shrink-0 px-1">
                    Respuesta rápida:
                  </span>
                  {QUICK_REPLIES.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => sendTextMessage(qr)}
                      style={{
                        backgroundColor: '#202c33',
                        color: '#d1d7db',
                        borderColor: '#2a3942'
                      }}
                      className="text-[11px] font-medium px-2.5 py-1 rounded-full border hover:border-[#00a884] hover:text-white whitespace-nowrap cursor-pointer transition-colors shrink-0"
                    >
                      {qr}
                    </button>
                  ))}
                </div>

                {/* Barra Inferior de Escritura Estilo WhatsApp (#202c33) */}
                <form
                  onSubmit={handleSendMessage}
                  className="px-3 py-2.5 flex items-center gap-2.5 shrink-0"
                  style={{
                    backgroundColor: '#202c33',
                    borderTop: '1px solid #222d34'
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      loadUserDocuments();
                      setShowDocModal(true);
                    }}
                    style={{ backgroundColor: '#2a3942', color: '#8696a0' }}
                    className="p-2.5 rounded-full hover:text-[#e9edef] border-none cursor-pointer transition-colors shrink-0 flex items-center justify-center"
                    title="Adjuntar informe PDF"
                  >
                    <Paperclip size={19} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={e => setInputText(e.target.value)}
                    placeholder={`Escribí un mensaje a ${selectedColleague.name}...`}
                    style={{ backgroundColor: '#2a3942', color: '#e9edef' }}
                    className="flex-1 px-4 py-2.5 rounded-xl border-none text-sm font-normal placeholder-[#8696a0] outline-none focus:ring-1 focus:ring-[#00a884]"
                  />

                  <button
                    type="submit"
                    disabled={!inputText.trim()}
                    className="w-10 h-10 rounded-full bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] border-none cursor-pointer shadow-md disabled:opacity-40 transition-all hover:scale-105 active:scale-95 shrink-0 flex items-center justify-center"
                    title="Enviar mensaje"
                  >
                    <Send size={18} />
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* MODAL: Agregar Nuevo Contacto por Correo Registrado */}
      {showAddModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            style={{ backgroundColor: '#202c33', borderColor: '#2a3942' }}
            className="border rounded-3xl p-6 max-w-[460px] w-full shadow-2xl space-y-4 text-[#e9edef]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[#00a884]/20 text-[#00a884]">
                  <UserPlus size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#e9edef] m-0">
                    Nuevo Chat Profesional
                  </h3>
                  <p className="text-xs text-[#8696a0] m-0">
                    Ingresá el correo registrado del colega
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1.5 text-[#8696a0] hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#111b21] border border-[#00a884]/30 flex items-start gap-2.5 text-xs text-[#d1d7db]">
              <AlertCircle size={18} className="shrink-0 mt-0.5 text-[#00a884]" />
              <span>
                Podés iniciar conversación con cualquier profesional registrado en{' '}
                <strong>Asistente H&amp;S</strong> o cargado en tu nómina de legajos.
              </span>
            </div>

            <form onSubmit={handleAddContactSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#d1d7db] uppercase mb-1.5">
                  Correo Electrónico del Profesional *
                </label>
                <div className="relative">
                  <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8696a0]" />
                  <input
                    required
                    type="email"
                    value={inputEmail}
                    onChange={e => setInputEmail(e.target.value)}
                    placeholder="ejemplo: carlos.mendoza@hys.com"
                    style={{ backgroundColor: '#111b21', color: '#e9edef' }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-[#2a3942] text-sm font-medium placeholder-[#8696a0] focus:ring-2 focus:ring-[#00a884] outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ backgroundColor: '#2a3942', color: '#d1d7db' }}
                  className="px-4 py-2 rounded-xl font-bold text-xs border-none cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#00a884] hover:bg-[#06cf9c] text-[#111b21] font-extrabold text-xs border-none cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <UserPlus size={15} /> Abrir Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Adjuntar Informe PDF */}
      {showDocModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div
            style={{ backgroundColor: '#202c33', borderColor: '#2a3942' }}
            className="border rounded-3xl p-6 max-w-[540px] w-full max-h-[85vh] flex flex-col shadow-2xl space-y-4 text-[#e9edef]"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#2a3942]">
              <div className="flex items-center gap-2.5">
                <FileText size={22} className="text-[#00a884]" />
                <div>
                  <h3 className="font-bold text-base text-[#e9edef] m-0">
                    Compartir Informe PDF en el Chat
                  </h3>
                  <p className="text-xs text-[#8696a0] m-0">
                    Seleccioná un documento generado en tu cuenta
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowDocModal(false)}
                className="p-1.5 text-[#8696a0] hover:text-white rounded-lg border-none bg-transparent cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1 custom-scrollbar">
              {userDocs.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#8696a0]">
                  No tenés informes guardados todavía. Creá un Programa de Seguridad, ATS, Carga de Fuego o Checklist para enviarlo por acá.
                </div>
              ) : (
                userDocs.map(doc => (
                  <button
                    key={doc.id}
                    onClick={() => handleAttachDocument(doc)}
                    style={{ backgroundColor: '#111b21', borderColor: '#2a3942' }}
                    className="p-3.5 rounded-2xl border hover:border-[#00a884] text-left transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2.5 rounded-xl bg-[#00a884]/20 text-[#00a884] shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00a884]/20 text-[#25D366] font-extrabold uppercase">
                          {doc.typeLabel}
                        </span>
                        <h4 className="font-bold text-xs text-[#e9edef] truncate mt-1 m-0">
                          {doc.title}
                        </h4>
                        <span className="text-[11px] text-[#8696a0] truncate block mt-0.5">
                          {doc.subtitle}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-[#111b21] bg-[#00a884] px-3 py-1.5 rounded-xl group-hover:scale-105 transition-transform shrink-0">
                      Enviar PDF →
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
