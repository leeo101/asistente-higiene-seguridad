import { adaptNormativeText } from '../data/legislationData';

export type Language = 'es' | 'en' | 'pt';

export interface Translations {
  [key: string]: {
    es: string;
    en: string;
    pt: string;
  };
}

export const dictionary: Translations = {
  // Navigation & Core
  'app.name': {
    es: 'Asistente de Higiene y Seguridad',
    en: 'EHS Assistant & Safety Suite',
    pt: 'Assistente de Higiene e Segurança'
  },
  'app.short_name': {
    es: 'Asistente HYS',
    en: 'EHS Assistant',
    pt: 'Assistente H&S'
  },
  'app.tagline': {
    es: 'Plataforma Inteligente de Gestión de Seguridad Laboral y Medio Ambiente',
    en: 'Intelligent Occupational Safety & Environmental Platform',
    pt: 'Plataforma Inteligente de Gestão de Segurança e Meio Ambiente'
  },
  'header.all_companies': {
    es: 'Todas las Empresas',
    en: 'All Companies',
    pt: 'Todas as Empresas'
  },
  'header.change_company': {
    es: 'Cambiar empresa activa (Multi-empresa)',
    en: 'Switch active company (Multi-company)',
    pt: 'Trocar empresa ativa (Multi-empresa)'
  },
  'header.search': {
    es: 'Buscar…',
    en: 'Search…',
    pt: 'Buscar…'
  },
  'header.open_menu': {
    es: 'Abrir menú',
    en: 'Open menu',
    pt: 'Abrir menu'
  },
  'selector.lang_title': {
    es: 'Idioma / Language',
    en: 'Language / Idioma',
    pt: 'Idioma / Language'
  },
  'selector.framework_title': {
    es: 'Marco EHS Preferido (País / Ley)',
    en: 'Preferred EHS Framework (Country / Law)',
    pt: 'Marco EHS Preferido (País / Lei)'
  },
  'selector.lang_changed': {
    es: 'Idioma cambiado a Español',
    en: 'Language switched to English',
    pt: 'Idioma alterado para Português'
  },
  'selector.framework_changed': {
    es: 'Marco normativo actualizado:',
    en: 'Legal framework updated:',
    pt: 'Marco normativo atualizado:'
  },

  // Sidebar & BottomNav
  'nav.home': { es: 'Inicio', en: 'Home', pt: 'Início' },
  'nav.dashboard': { es: 'Dashboard', en: 'Dashboard', pt: 'Painel KPI' },
  'nav.kpis': { es: 'KPIs', en: 'KPIs', pt: 'KPIs' },
  'nav.messages': { es: 'Mensajes', en: 'Messages', pt: 'Mensagens' },
  'nav.ai_advisor': { es: 'Asesor IA', en: 'AI Advisor', pt: 'Consultor IA' },
  'nav.field': { es: 'Campo', en: 'Field', pt: 'Campo' },
  'nav.more': { es: 'Más', en: 'More', pt: 'Mais' },
  'nav.field_actions': { es: 'Acciones de Campo', en: 'Field Actions', pt: 'Ações de Campo' },
  'nav.quick_access': { es: 'Acceso Rápido In Situ', en: 'Quick On-Site Access', pt: 'Acesso Rápido em Campo' },
  'nav.ats': { es: 'ATS / JSA', en: 'JSA / ATS', pt: 'APR / ATS' },
  'nav.extinguishers': { es: 'Extintores & Fuego', en: 'Fire & Extinguishers', pt: 'Extintores e Fogo' },
  'nav.permits': { es: 'Permisos de Trabajo', en: 'Work Permits', pt: 'Permissões de Trabalho' },
  'nav.audits': { es: 'Auditorías EHS', en: 'EHS Audits', pt: 'Auditorias EHS' },
  'nav.trust': { es: 'Seguridad & Trust Enterprise', en: 'Enterprise Trust & Security', pt: 'Segurança & Trust Enterprise' },
  'nav.asset_scanner': { es: 'Escáner QR Activos', en: 'Asset QR Scanner', pt: 'Scanner QR de Ativos' },
  'nav.calendar': { es: 'Calendario', en: 'Calendar', pt: 'Calendário' },
  'nav.settings': { es: 'Configuración', en: 'Settings', pt: 'Configurações' },
  'nav.company_logo': { es: 'Logo de Empresa', en: 'Company Logo', pt: 'Logo da Empresa' },
  'nav.profile': { es: 'Mi Perfil', en: 'My Profile', pt: 'Meu Perfil' },
  'nav.privacy': { es: 'Privacidad', en: 'Privacy', pt: 'Privacidade' },
  'nav.monthly_report': { es: 'Reporte Mensual', en: 'Monthly Report', pt: 'Relatório Mensal' },
  'nav.support': { es: 'Soporte y Sugerencias', en: 'Support & Feedback', pt: 'Suporte e Sugestões' },
  'nav.activate_pro': { es: 'Activar Versión Pro', en: 'Activate Pro Version', pt: 'Ativar Versão Pro' },
  'nav.unlock_all': { es: 'Desbloquea todas las funciones', en: 'Unlock all features', pt: 'Desbloqueie todas as funções' },
  'nav.install_pwa': { es: 'Instalar App (PWA)', en: 'Install App (PWA)', pt: 'Instalar App (PWA)' },
  'nav.logout': { es: 'Cerrar Sesión', en: 'Sign Out', pt: 'Sair da Conta' },
  'nav.back': { es: 'VOLVER', en: 'BACK', pt: 'VOLTAR' },

  // Home & Dashboard
  'home.private_dashboard': { es: 'Dashboard Privado', en: 'Private Dashboard', pt: 'Painel Privado' },
  'home.hello': { es: 'Hola', en: 'Hello', pt: 'Olá' },
  'home.subtitle': {
    es: 'Tu centro de control de Higiene y Seguridad con IA.',
    en: 'Your AI-powered Occupational Health & Safety control center.',
    pt: 'Seu centro de controle de Higiene e Segurança com IA.'
  },
  'home.ai_today': { es: 'IA · Hoy', en: 'AI · Today', pt: 'IA · Hoje' },
  'home.daily_summary': { es: 'Resumen Diario', en: 'Daily Summary', pt: 'Resumo Diário' },
  'home.daily_subtitle': {
    es: 'Consejos y análisis de tu asistente',
    en: 'Tips and insights from your AI assistant',
    pt: 'Dicas e análises do seu assistente'
  },
  'home.loading_insight': {
    es: 'Cargando análisis diario...',
    en: 'Loading daily analysis...',
    pt: 'Carregando análise diária...'
  },
  'home.documents': { es: 'Documentos', en: 'Documents', pt: 'Documentos' },
  'home.this_week': { es: 'Esta semana', en: 'This week', pt: 'Esta semana' },
  'home.score_title': { es: 'Score H&S', en: 'EHS Score', pt: 'Score H&S' },
  'home.this_month': { es: 'Este mes', en: 'This month', pt: 'Este mês' },
  'home.score_excellent': { es: 'Excelente', en: 'Excellent', pt: 'Excelente' },
  'home.score_progress': { es: 'En Progreso', en: 'In Progress', pt: 'Em Progresso' },
  'home.score_no_data': { es: 'Sin datos', en: 'No data', pt: 'Sem dados' },
  'home.score_attention': { es: 'Atención', en: 'Attention', pt: 'Atenção' },
  'home.docs_registered': { es: 'registrados', en: 'recorded', pt: 'registrados' },
  'home.quick_kpis': { es: 'KPIs Rápidos', en: 'Quick KPIs', pt: 'KPIs Rápidos' },
  'home.recent_activity': { es: 'Actividad Reciente', en: 'Recent Activity', pt: 'Atividade Recente' },
  'home.entries': { es: 'entradas', en: 'entries', pt: 'registros' },
  'home.no_recent_activity': { es: 'Sin actividad reciente', en: 'No recent activity', pt: 'Sem atividade recente' },
  'home.my_favorites': { es: 'Mis Favoritos', en: 'My Favorites', pt: 'Meus Favoritos' },
  'home.pinned': { es: 'fijados', en: 'pinned', pt: 'fixados' },
  'home.pro_vault': { es: 'Bóveda Pro', en: 'Pro Vault', pt: 'Cofre Pro' },
  'home.pro_vault_sub': {
    es: 'Herramientas y módulos avanzados para tu gestión de seguridad.',
    en: 'Advanced tools and modules for your safety management.',
    pt: 'Ferramentas e módulos avançados para sua gestão de segurança.'
  },
  'home.cat_all': { es: '✨ Todos', en: '✨ All', pt: '✨ Todos' },
  'home.cat_fav': { es: 'Favoritos', en: 'Favorites', pt: 'Favoritos' },
  'home.cat_new': { es: '🚀 Nuevos 2026', en: '🚀 New 2026', pt: '🚀 Novos 2026' },
  'home.cat_docs': { es: '📋 Docs', en: '📋 Docs', pt: '📋 Docs' },
  'home.cat_critical': { es: '🛡️ Crítico', en: '🛡️ Critical', pt: '🛡️ Crítico' },
  'home.cat_specific': { es: '⚙️ Específicos', en: '⚙️ Specific', pt: '⚙️ Específicos' },
  'home.cat_management': { es: '📊 Gestión', en: '📊 Management', pt: '📊 Gestão' },
  'home.cat_ia': { es: '🤖 IA', en: '🤖 AI', pt: '🤖 IA' },
  'home.field_mode': { es: 'Modo Campo', en: 'Field Mode', pt: 'Modo Campo' },
  'home.no_tools_found': { es: 'No se encontraron herramientas', en: 'No tools found', pt: 'Nenhuma ferramenta encontrada' },
  'home.try_another_search': { es: 'Probá con otro término de búsqueda.', en: 'Try another search term.', pt: 'Tente outro termo de busca.' },
  'home.recent_works': { es: 'Trabajos Recientes', en: 'Recent Work', pt: 'Trabalhos Recentes' },

  // Command Center Dashboard
  'cmd.title': {
    es: 'Centro de Mando & Semáforo Legal de Vencimientos',
    en: 'Command Center & Legal Expiration Traffic Light',
    pt: 'Centro de Comando e Semáforo Legal de Vencimentos'
  },
  'cmd.subtitle': {
    es: 'Vigilancia legal en tiempo real: Extintores, Protocolos (Luz, Ruido, PAT), Salud y Planes CAPA.',
    en: 'Real-time legal compliance monitoring: Extinguishers, Protocols (Light, Noise, Grounding), Health & CAPA.',
    pt: 'Vigilância legal em tempo real: Extintores, Protocolos (Luz, Ruído, Aterramento), Saúde e Planos CAPA.'
  },
  'cmd.expired': { es: 'Vencidos', en: 'Expired', pt: 'Vencidos' },
  'cmd.upcoming': { es: 'Próximos', en: 'Upcoming', pt: 'Próximos' },
  'cmd.all': { es: 'Todos', en: 'All', pt: 'Todos' },
  'cmd.all_good_title': {
    es: '¡Todo al día y en regla legal!',
    en: 'All up to date and legally compliant!',
    pt: 'Tudo em dia e em conformidade legal!'
  },
  'cmd.all_good_sub': {
    es: 'No se detectaron protocolos legales ni extintores con plazos vencidos en la empresa seleccionada.',
    en: 'No expired legal protocols or fire extinguishers detected for the selected company.',
    pt: 'Nenhum protocolo legal ou extintor com prazo vencido foi detectado na empresa selecionada.'
  },

  // Actions & General Buttons
  'btn.save': { es: 'Guardar', en: 'Save', pt: 'Salvar' },
  'btn.save_changes': { es: 'Guardar Cambios', en: 'Save Changes', pt: 'Salvar Alterações' },
  'btn.saved': { es: '¡Guardado!', en: 'Saved!', pt: 'Salvo!' },
  'btn.cancel': { es: 'Cancelar', en: 'Cancel', pt: 'Cancelar' },
  'btn.export_pdf': { es: 'Exportar PDF', en: 'Export PDF', pt: 'Exportar PDF' },
  'btn.export_excel': { es: 'Exportar Excel', en: 'Export Excel', pt: 'Exportar Excel' },
  'btn.scan_qr': { es: 'Escanear QR', en: 'Scan QR', pt: 'Escanear QR' },
  'btn.voice_input': { es: 'Dictar por Voz', en: 'Voice Dictation', pt: 'Ditar por Voz' },
  'btn.search': { es: 'Buscar', en: 'Search', pt: 'Buscar' },
  'btn.filter': { es: 'Filtrar', en: 'Filter', pt: 'Filtrar' },

  // Statuses
  'status.online': { es: 'En Línea', en: 'Online', pt: 'Online' },
  'status.offline': { es: 'Modo Offline', en: 'Offline Mode', pt: 'Modo Offline' },
  'status.syncing': { es: 'Sincronizando...', en: 'Syncing...', pt: 'Sincronizando...' },
  'status.cloud_up_to_date': { es: 'Nube al día', en: 'Cloud up to date', pt: 'Nuvem atualizada' },
  'status.pending_sync': { es: 'Pendientes de envío', en: 'Pending sync', pt: 'Pendentes de envio' },

  // Footer
  'footer.description': {
    es: 'Software integral para profesionales de Higiene, Seguridad y Medio Ambiente en Argentina y Latinoamérica.',
    en: 'Comprehensive suite for Occupational Health, Safety & Environment professionals across Latin America & Global.',
    pt: 'Software completo para profissionais de Higiene, Segurança e Meio Ambiente na América Latina e Global.'
  },
  'footer.official_validity': {
    es: 'Validez oficial',
    en: 'Official compliance',
    pt: 'Validade oficial'
  },
  'footer.protocols': {
    es: 'Protocolos Oficiales',
    en: 'Official Protocols',
    pt: 'Protocolos Oficiais'
  },
  'footer.ehs_tools': {
    es: 'Herramientas EHS',
    en: 'EHS Tools',
    pt: 'Ferramentas EHS'
  },
  'footer.institutional': {
    es: 'Institucional',
    en: 'Institutional',
    pt: 'Institucional'
  },
  'footer.rights': {
    es: 'Plataforma de Higiene, Seguridad y Medio Ambiente. Todos los derechos reservados.',
    en: 'Occupational Health, Safety & Environment Platform. All rights reserved.',
    pt: 'Plataforma de Higiene, Segurança e Meio Ambiente. Todos os direitos reservados.'
  },
  'footer.compliance': {
    es: 'Cumplimiento Normativo:',
    en: 'Regulatory Compliance:',
    pt: 'Conformidade Normativa:'
  }
};

/**
 * Diccionario de frases y términos de interfaz para traducción automática de páginas internas.
 */
export const uiPhraseMap: Record<string, { en: string; pt: string }> = {
  // Títulos y cabeceras comunes
  'Legislación': { en: 'Legislation', pt: 'Legislação' },
  'Biblioteca Legal y Normativa': { en: 'Legal & Regulatory Library', pt: 'Biblioteca Legal e Normativa' },
  'País:': { en: 'Country:', pt: 'País:' },
  'Todo': { en: 'All', pt: 'Tudo' },
  'Nacional': { en: 'National', pt: 'Nacional' },
  'Provincial': { en: 'Regional / State', pt: 'Estadual / Regional' },
  'Municipal': { en: 'Municipal', pt: 'Municipal' },
  'Provincias': { en: 'Provinces', pt: 'Províncias' },
  'Regiones': { en: 'Regions', pt: 'Regiões' },
  'Departamentos': { en: 'Departments', pt: 'Departamentos' },
  'Estados': { en: 'States', pt: 'Estados' },
  'Comunidades Autónomas': { en: 'Autonomous Communities', pt: 'Comunidades Autônomas' },
  'Estándares Internacionales': { en: 'International Standards', pt: 'Padrões Internacionais' },
  'Buscar ley, decreto o palabra clave...': { en: 'Search law, decree, or keyword...', pt: 'Buscar lei, decreto ou palavra-chave...' },
  'Buscar módulo, registro o acción…': { en: 'Search module, record, or action…', pt: 'Buscar módulo, registro ou ação…' },
  'Ver Texto Oficial': { en: 'View Official Text', pt: 'Ver Texto Oficial' },
  'Simplificar con IA': { en: 'Simplify with AI', pt: 'Simplificar com IA' },
  'Analizando...': { en: 'Analyzing...', pt: 'Analisando...' },
  'Notas Personales': { en: 'Personal Notes', pt: 'Notas Pessoais' },

  // Perfil, Datos Personales y Configuración
  'Perfil Profesional': { en: 'Professional Profile', pt: 'Perfil Profissional' },
  'Datos Personales': { en: 'Personal Data', pt: 'Dados Pessoais' },
  'Tu información profesional': { en: 'Your professional information', pt: 'Suas informações profissionais' },
  'Tocá la cámara para cambiar tu foto': { en: 'Tap the camera to change your photo', pt: 'Toque na câmera para alterar sua foto' },
  'Nombre y Apellido': { en: 'Full Name', pt: 'Nome e Sobrenome' },
  'Título / Profesión': { en: 'Title / Profession', pt: 'Título / Profissão' },
  'País / Región': { en: 'Country / Region', pt: 'País / Região' },
  'DNI / Cédula': { en: 'ID / National Document', pt: 'RG / CPF / Documento' },
  'Matrícula': { en: 'License Number', pt: 'Registro Profissional' },
  'Teléfono': { en: 'Phone', pt: 'Telefone' },
  'Dirección Profesional': { en: 'Professional Address', pt: 'Endereço Profissional' },
  'Guardar Cambios': { en: 'Save Changes', pt: 'Salvar Alterações' },
  '¡Guardado!': { en: 'Saved!', pt: 'Salvo!' },
  'Firma y Sello': { en: 'Signature & Stamp', pt: 'Assinatura e Carimbo' },
  'Suscripción': { en: 'Subscription', pt: 'Assinatura' },
  'Configuración': { en: 'Settings', pt: 'Configurações' },
  'Seguridad': { en: 'Security', pt: 'Segurança' },
  'Personalización y sincronización': { en: 'Customization and cloud sync', pt: 'Personalização e sincronização' },
  'Tus datos están en la nube ☁️': { en: 'Your data is backed up in the cloud ☁️', pt: 'Seus dados estão na nuvem ☁️' },
  'Sincronización en la nube': { en: 'Cloud Synchronization', pt: 'Sincronização na nuvem' },
  'Sincronización automática activa': { en: 'Automatic sync active', pt: 'Sincronização automática ativa' },
  'Sincronizar ahora': { en: 'Sync now', pt: 'Sincronizar agora' },
  'Preferencias': { en: 'Preferences', pt: 'Preferências' },
  'Notificaciones': { en: 'Notifications', pt: 'Notificações' },
  'Alertas de inspecciones pendientes': { en: 'Alerts for pending inspections', pt: 'Alertas de inspeções pendentes' },
  'Modo Offline': { en: 'Offline Mode', pt: 'Modo Offline' },
  'Sincronizar datos al recuperar señal': { en: 'Sync data when connection returns', pt: 'Sincronizar dados ao recuperar sinal' },
  'Tema de Interfaz': { en: 'Interface Theme', pt: 'Tema da Interface' },
  'Modo Oscuro': { en: 'Dark Mode', pt: 'Modo Escuro' },
  'Modo Claro': { en: 'Light Mode', pt: 'Modo Claro' },
  'Alto Contraste (Industrial)': { en: 'High Contrast (Industrial)', pt: 'Alto Contraste (Industrial)' },
  '☀️ Claro': { en: '☀️ Light', pt: '☀️ Claro' },
  '🌙 Oscuro': { en: '🌙 Dark', pt: '🌙 Escuro' },
  '⚡ Alto Contraste': { en: '⚡ High Contrast', pt: '⚡ Alto Contraste' },
  'Privacidad y Seguridad': { en: 'Privacy & Security', pt: 'Privacidade e Segurança' },
  'Cerrar Sesión': { en: 'Sign Out', pt: 'Sair da Conta' },

  // Módulos y Acciones Generales
  'VOLVER': { en: 'BACK', pt: 'VOLTAR' },
  'INICIO': { en: 'HOME', pt: 'INÍCIO' },
  'Volver': { en: 'Back', pt: 'Voltar' },
  'Inicio': { en: 'Home', pt: 'Início' },
  'Guardar': { en: 'Save', pt: 'Salvar' },
  'Cancelar': { en: 'Cancel', pt: 'Cancelar' },
  'Eliminar': { en: 'Delete', pt: 'Excluir' },
  'Editar': { en: 'Edit', pt: 'Editar' },
  'Imprimir': { en: 'Print', pt: 'Imprimir' },
  'Compartir': { en: 'Share', pt: 'Compartilhar' },
  'Vista Previa': { en: 'Preview', pt: 'Visualizar' },
  'Descargar PDF': { en: 'Download PDF', pt: 'Baixar PDF' },
  'Exportar PDF': { en: 'Export PDF', pt: 'Exportar PDF' },
  'Exportar CSV': { en: 'Export CSV', pt: 'Exportar CSV' },
  'Nuevo Estudio': { en: 'New Assessment', pt: 'Novo Estudo' },
  'Nuevo Registro': { en: 'New Record', pt: 'Novo Registro' },
  'Nueva Inspección': { en: 'New Inspection', pt: 'Nova Inspeção' },
  'Nuevo Permiso': { en: 'New Permit', pt: 'Nova Permissão' },
  'Nuevo ATS': { en: 'New JSA / ATS', pt: 'Nova APR / ATS' },
  'Historial': { en: 'History', pt: 'Histórico' },
  'Empresa': { en: 'Company', pt: 'Empresa' },
  'Sector': { en: 'Area / Sector', pt: 'Setor' },
  'Fecha': { en: 'Date', pt: 'Data' },
  'Estado': { en: 'Status', pt: 'Status' },
  'Acciones': { en: 'Actions', pt: 'Ações' },
  'Observaciones': { en: 'Observations', pt: 'Observações' },
  'Conclusión': { en: 'Conclusion', pt: 'Conclusão' },
  'Conforme': { en: 'Compliant', pt: 'Conforme' },
  'No Conforme': { en: 'Non-Compliant', pt: 'Não Conforme' },
  'En Proceso': { en: 'In Progress', pt: 'Em Andamento' },
  'No Aplica': { en: 'Not Applicable', pt: 'Não se Aplica' },
  'Cumplimiento Legal': { en: 'Legal Compliance', pt: 'Conformidade Legal' },
  'Matriz de Cumplimiento Legal': { en: 'Legal Compliance Matrix', pt: 'Matriz de Conformidade Legal' },
  'Novedades Normativas': { en: 'Regulatory Updates', pt: 'Novidades Normativas' },
  'Trabajos Recientes': { en: 'Recent Work', pt: 'Trabalhos Recentes' },
  'Actividad Reciente': { en: 'Recent Activity', pt: 'Atividade Recente' },
  'Mis Favoritos': { en: 'My Favorites', pt: 'Meus Favoritos' },
  'Bóveda Pro': { en: 'Pro Vault', pt: 'Cofre Pro' },
  'Resumen Diario': { en: 'Daily Summary', pt: 'Resumo Diário' },
  'KPIs Rápidos': { en: 'Quick KPIs', pt: 'KPIs Rápidos' },
  'Asesor IA': { en: 'AI Advisor', pt: 'Consultor IA' },
  'Auditorías': { en: 'Audits', pt: 'Auditorias' },
  'Cámara IA': { en: 'AI Camera', pt: 'Câmera IA' },
  'Capacitar': { en: 'Training', pt: 'Treinamentos' },
  'Carga Fuego': { en: 'Fire Load', pt: 'Carga de Incêndio' },
  'Carga de Fuego': { en: 'Fire Load', pt: 'Carga de Incêndio' },
  'Charlas 5 Min': { en: '5-Min Toolbox Talks', pt: 'DDS 5 Min' },
  'Control EPP': { en: 'PPE Tracker', pt: 'Controle de EPI' },
  'Ergonomía': { en: 'Ergonomics', pt: 'Ergonomia' },
  'Espacios Confinados': { en: 'Confined Spaces', pt: 'Espaços Confinados' },
  'Estrés Térmico': { en: 'Thermal Stress', pt: 'Estresse Térmico' },
  'Extintores IA': { en: 'AI Extinguishers', pt: 'Extintores IA' },
  'Iluminación': { en: 'Lighting', pt: 'Iluminação' },
  'Informes': { en: 'Reports', pt: 'Relatórios' },
  'Investigación': { en: 'Investigation', pt: 'Investigação' },
  'KPIs Seguridad': { en: 'Safety KPIs', pt: 'KPIs de Segurança' },
  'Mapas': { en: 'Risk Maps', pt: 'Mapas de Risco' },
  'Matafuegos': { en: 'Fire Extinguishers', pt: 'Extintores' },
  'Mensajería Pro': { en: 'Pro Messaging', pt: 'Mensagens Pro' },
  'Medio Ambiente': { en: 'Environment', pt: 'Meio Ambiente' },
  'Permisos': { en: 'Work Permits', pt: 'Permissões' },
  'Riesgos IA': { en: 'AI Hazards', pt: 'Riscos IA' },
  'Ruido': { en: 'Noise Assessment', pt: 'Ruído Ocupacional' },
  'Escáner QR': { en: 'QR Scanner', pt: 'Scanner QR' },
  'Seguridad Química': { en: 'Chemical Safety', pt: 'Segurança Química' },
  'Simulacros': { en: 'Emergency Drills', pt: 'Simulados' },
  'Tarjetas STOP': { en: 'STOP Cards', pt: 'Cartões STOP' },
  'Trabajo en Altura': { en: 'Working at Height', pt: 'Trabalho em Altura' },
  'Izaje y Grúas': { en: 'Lifting & Cranes', pt: 'Içamento e Guindastes' },
  'Flota y Vehículos': { en: 'Fleet & Vehicles', pt: 'Frota e Veículos' },
  'Simulador de Evacuación': { en: 'Evacuation Simulator', pt: 'Simulador de Evacuação' },
  'Legajos Técnicos': { en: 'Technical Dossiers', pt: 'Prontuários Técnicos' },
  'Aptitudes Médicas': { en: 'Medical Fitness', pt: 'Aptidões Médicas' },
  'Mapa Calor': { en: 'Incident Heatmap', pt: 'Mapa de Calor' },
  'Plan de Emergencias': { en: 'Emergency Plan', pt: 'Plano de Emergência' },
  'Matriz Contratistas': { en: 'Contractor Matrix', pt: 'Matriz de Contratadas' },
  'Puesta a Tierra': { en: 'Grounding (Earthing)', pt: 'Aterramento Elétrico' },
  'RGRL Anual': { en: 'Annual Risk Survey', pt: 'Levantamento Geral de Riscos' },
  'Nómina RAR': { en: 'Risk Agents Roster', pt: 'Exposição a Agentes de Risco' },
  'Trabajo en Caliente': { en: 'Hot Work Permit', pt: 'Trabalho a Quente' },
  'Programa de Seguridad Obra': { en: 'Construction Safety Program', pt: 'Programa de Segurança em Obras' },
  'Residuos Peligrosos': { en: 'Hazardous Waste', pt: 'Resíduos Perigosos' },
  'Excavaciones y Zanjas': { en: 'Excavations & Trenches', pt: 'Escavações e Valas' },
  'Atmósferas Explosivas (ATEX)': { en: 'Explosive Atmospheres (ATEX)', pt: 'Atmosferas Explosivas (ATEX)' },
  'Primeros Auxilios y DEA': { en: 'First Aid & AED', pt: 'Primeiros Socorros e DEA' },
  'Arco Eléctrico (Arc Flash)': { en: 'Arc Flash Safety', pt: 'Arco Elétrico (Arc Flash)' },
  'Efluentes y Emisiones': { en: 'Effluents & Emissions', pt: 'Efluentes e Emissões' },
  'Matriz Legal (ISO 45001)': { en: 'Legal Matrix (ISO 45001)', pt: 'Matriz Legal (ISO 45001)' },
  'Procedimientos (PTS)': { en: 'Safe Work Procedures (SOP)', pt: 'Procedimentos Seguros (POP)' },
  'Dossier ZIP': { en: 'Audit ZIP Dossier', pt: 'Dossiê ZIP de Auditoria' },
  'Resumir con IA': { en: 'Summarize with AI', pt: 'Resumir com IA' },
  'Leyes': { en: 'Laws', pt: 'Leis' },
  'Decretos': { en: 'Decrees', pt: 'Decretos' },
  'Resoluciones': { en: 'Resolutions', pt: 'Resoluções' },
  'Normas Técnicas': { en: 'Technical Standards', pt: 'Normas Técnicas' },
  'Ordenanzas': { en: 'Ordinances', pt: 'Portarias Municipais' },
  'Estándar': { en: 'Standard', pt: 'Padrão' },
  'Índice Global de Cumplimiento Legal': { en: 'Global Legal Compliance Index', pt: 'Índice Global de Conformidade Legal' },
  'Conformidad Satisfactoria': { en: 'Satisfactory Compliance', pt: 'Conformidade Satisfatória' },
  'Riesgo Medio': { en: 'Moderate Risk', pt: 'Risco Médio' },
  'Riesgo Legal Crítico': { en: 'Critical Legal Risk', pt: 'Risco Legal Crítico' },
  'Descargar Dictamen de Auditoría': { en: 'Download Audit Opinion', pt: 'Baixar Parecer de Auditoria' },
  'Informe Oficial PDF': { en: 'Official PDF Report', pt: 'Relatório Oficial PDF' },
  'Nuevo Requisito': { en: 'New Requirement', pt: 'Novo Requisito' },
  'Todas las Categorías': { en: 'All Categories', pt: 'Todas as Categorias' },
  'Todos los Estados': { en: 'All Statuses', pt: 'Todos os Status' },
  'Prueba Exigida:': { en: 'Required Evidence:', pt: 'Evidência Exigida:' },
  'Evidencia Cargada:': { en: 'Uploaded Evidence:', pt: 'Evidência Registrada:' },
  'Evidencia / Plan': { en: 'Evidence / Plan', pt: 'Evidência / Plano' },
  'Cumple': { en: 'Compliant', pt: 'Cumpre' },
  'En Plan': { en: 'In Plan', pt: 'Em Plano' },
  'No Cumple': { en: 'Non-Compliant', pt: 'Não Cumpre' },
  'Leer más': { en: 'Read more', pt: 'Ler mais' }
};

export function getTranslation(key: string, lang: Language = 'es'): string {
  if (dictionary[key] && dictionary[key][lang]) {
    return dictionary[key][lang];
  }
  return dictionary[key]?.es || key;
}

/**
 * Traduce un texto de interfaz y adapta sus referencias legales al país activo.
 */
export function translateAndAdaptText(text: string, lang: Language, country: string): string {
  if (!text) return text;
  const trimmed = text.trim();
  if (!trimmed) return text;

  let adapted = adaptNormativeText(text, country);

  if (lang === 'es') {
    return adapted;
  }

  const adaptedTrimmed = adapted.trim();
  if (uiPhraseMap[adaptedTrimmed]) {
    return adapted.replace(adaptedTrimmed, uiPhraseMap[adaptedTrimmed][lang]);
  }
  if (uiPhraseMap[trimmed]) {
    const translatedBase = text.replace(trimmed, uiPhraseMap[trimmed][lang]);
    return adaptNormativeText(translatedBase, country);
  }

  return adapted;
}
