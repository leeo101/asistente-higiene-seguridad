// This file exports the standard ISO/IRAM safety icons used in the Risk Map Generator
export const SAFETY_ICONS = {
    // Fire Equipment (Red)
    EXTINGUISHER: {
        id: 'EXTINGUISHER', type: 'fire', label: 'Extintor ABC', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#dc2626"/><path d="M12 4.5v1.5m-2.5-1.5h5m-3.5 1.5h2v1h-2z" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/><rect x="8.5" y="7.5" width="7" height="11.5" rx="3.5" fill="#ffffff"/><path d="M8.5 10.5c-1.5 0-2.2.8-2.2 2.2v3.3l1.2-.8" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10.5" r="1.1" fill="#dc2626"/><path d="M18.8 9.5c-.4.7-.9 1.1-.9 1.8 0 1 .8 1.8 1.8 1.8.3 0 .5 0 .6-.1-.2 1.1-1.1 1.9-2.2 1.9-1.3 0-2.3-1-2.3-2.3 0-1.6 1.5-2.5 2-3.1h1z" fill="#ffffff"/></svg>`
    },
    HYDRANT: {
        id: 'HYDRANT', type: 'fire', label: 'Hidrante / BIE', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#dc2626"/><circle cx="12" cy="12" r="7.5" stroke="#ffffff" stroke-width="1.6"/><circle cx="12" cy="12" r="4.5" stroke="#ffffff" stroke-width="1.2"/><circle cx="12" cy="12" r="2" fill="#ffffff"/><path d="M12 4.5h6v4l-2 1.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M16 10l2-1.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round"/></svg>`
    },
    ALARM: {
        id: 'ALARM', type: 'fire', label: 'Pulsador Alarma', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#dc2626"/><rect x="4.5" y="4.5" width="15" height="15" rx="1.5" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="12" r="3.5" fill="#ffffff"/><circle cx="12" cy="12" r="1.5" fill="#dc2626"/><path d="M12 18v-3m-2 0h4" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/></svg>`
    },
    NO_ENTRY: {
        id: 'NO_ENTRY', type: 'fire', label: 'Prohibido el Acceso', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#dc2626"/><rect x="4.5" y="10" width="15" height="4" rx="1" fill="#ffffff"/></svg>`
    },

    // Warning / Risks (Yellow)
    ELECTRICAL: {
        id: 'ELECTRICAL', type: 'warning', label: 'Riesgo Eléctrico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 21h22L12 2z" fill="#eab308" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M13 6l-5 8h4.5l-1.5 6 6-9h-4.5l1.5-5h-1z" fill="#0f172a"/></svg>`
    },
    CHEMICAL: {
        id: 'CHEMICAL', type: 'warning', label: 'Riesgo Químico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 21h22L12 2z" fill="#eab308" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M10 9v3.5l-3 5.5h10l-3-5.5V9h-4z" stroke="#0f172a" stroke-width="1.3" fill="#ffffff"/><circle cx="12" cy="15" r="1" fill="#0f172a"/></svg>`
    },
    BIOLOGICAL: {
        id: 'BIOLOGICAL', type: 'warning', label: 'Riesgo Biológico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 21h22L12 2z" fill="#eab308" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="12" cy="11.5" r="2.2" stroke="#0f172a" stroke-width="1.3"/><circle cx="9.5" cy="15" r="2.2" stroke="#0f172a" stroke-width="1.3"/><circle cx="14.5" cy="15" r="2.2" stroke="#0f172a" stroke-width="1.3"/><circle cx="12" cy="13.5" r="1" fill="#0f172a"/></svg>`
    },
    SLIP: {
        id: 'SLIP', type: 'warning', label: 'Piso Resbaladizo', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 21h22L12 2z" fill="#eab308" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><circle cx="14.5" cy="8.5" r="1.3" fill="#0f172a"/><path d="M13 10.5l-2.5 3 2 1.5 2-1m-4.5-1l-3 1.5m6.5 2.5l2 3.5m-5-2.5l-3 2" stroke="#0f172a" stroke-width="1.3" stroke-linecap="round"/><path d="M5 19c3-1 7 1 11-1 1 0 2-.5 3-.5" stroke="#0f172a" stroke-width="1.3" stroke-linecap="round"/></svg>`
    },
    PPE_REQUIRED: {
        id: 'PPE_REQUIRED', type: 'warning', label: 'EPP Obligatorio', color: '#2563eb',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10" fill="#2563eb"/><path d="M6 13c0-3.3 2.7-6 6-6s6 2.7 6 6v1H6v-1z" fill="#ffffff"/><rect x="5" y="14" width="14" height="2" rx="1" fill="#ffffff"/><circle cx="9.5" cy="18" r="1.5" stroke="#ffffff" stroke-width="1.2"/><circle cx="14.5" cy="18" r="1.5" stroke="#ffffff" stroke-width="1.2"/><path d="M11 18h2" stroke="#ffffff" stroke-width="1.2"/></svg>`
    },
    FORKLIFT: {
        id: 'FORKLIFT', type: 'warning', label: 'Tránsito Autoelevadores', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L1 21h22L12 2z" fill="#eab308" stroke="#0f172a" stroke-width="1.5" stroke-linejoin="round"/><path d="M5 16h8v2H5zm3-5h3v4H8zm6-3v7h4v-1h-2v-4h2V8h-4z" fill="#0f172a"/><circle cx="7" cy="18.5" r="1.2" fill="#0f172a"/><circle cx="12" cy="18.5" r="1.2" fill="#0f172a"/></svg>`
    },

    // Escape Routes / Safe Conditions (Green)
    EXIT: {
        id: 'EXIT', type: 'escape', label: 'Salida / Escape', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#16a34a"/><path d="M18.5 4.5v15h-4v-1h3v-13h-3v-1h4z" fill="#ffffff"/><circle cx="9" cy="6.5" r="1.6" fill="#ffffff"/><path d="M8 9l2 2.5v3.8l-1.5 3.2m-1-4.8l-2-2.5 1.5-2.2 2.5.5 2 1.5" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11.5l2.5 2.5 1.5-1" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 12h4.5m-2-2l2 2-2 2" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    },
    MEETING_POINT: {
        id: 'MEETING_POINT', type: 'escape', label: 'Punto Encuentro', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#16a34a"/><path d="M3.5 3.5l4 4m0-3v3h-3" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 3.5l-4 4m0-3v3h3" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M3.5 20.5l4-4m0 3v-3h-3" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M20.5 20.5l-4-4m0 3v-3h3" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="10" r="1.5" fill="#ffffff"/><path d="M9.5 15c0-1.5 1-2.5 2.5-2.5s2.5 1 2.5 2.5v1h-5v-1z" fill="#ffffff"/></svg>`
    },
    FIRST_AID: {
        id: 'FIRST_AID', type: 'escape', label: 'Primeros Auxilios', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#16a34a"/><path d="M9 5h6v4h4v6h-4v4H9v-4H5V9h4V5z" fill="#ffffff"/></svg>`
    },
    EMERGENCY_SHOWER: {
        id: 'EMERGENCY_SHOWER', type: 'escape', label: 'Ducha de Emergencia', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#16a34a"/><path d="M6 3h8v3h-8zM10 6v3" stroke="#ffffff" stroke-width="1.5"/><path d="M6 9h8l2 3H4l2-3z" fill="#ffffff"/><line x1="7" y1="13" x2="6" y2="17" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/><line x1="10" y1="13" x2="10" y2="18" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/><line x1="13" y1="13" x2="14" y2="17" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round"/><circle cx="10" cy="15" r="1.5" fill="#ffffff"/><path d="M8 20v-3h4v3" stroke="#ffffff" stroke-width="1.3"/></svg>`
    },
    EYE_WASH: {
        id: 'EYE_WASH', type: 'escape', label: 'Lavaojos', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="1.5" y="1.5" width="21" height="21" rx="3.5" fill="#16a34a"/><path d="M4 17h16c0 2-3 4-8 4s-8-2-8-4z" fill="#ffffff"/><path d="M8 17v-4c0-2 2-3 2-3s2 1 2 3v4" stroke="#ffffff" stroke-width="1.3" fill="none"/><path d="M12 17v-4c0-2 2-3 2-3s2 1 2 3v4" stroke="#ffffff" stroke-width="1.3" fill="none"/><ellipse cx="9" cy="8" rx="2.5" ry="1.5" fill="#ffffff"/><circle cx="9" cy="8" r="0.8" fill="#16a34a"/><ellipse cx="15" cy="8" rx="2.5" ry="1.5" fill="#ffffff"/><circle cx="15" cy="8" r="0.8" fill="#16a34a"/></svg>`
    },

    // Custom Shapes (Text / Blueprints)
    TEXT_LABEL: {
        id: 'TEXT_LABEL', type: 'text', label: 'Etiqueta Texto', color: '#0f172a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V4h16v3"/><path d="M9 20h6"/><path d="M12 4v16"/></svg>`
    },

    // Evacuation Routing
    YOU_ARE_HERE: {
        id: 'YOU_ARE_HERE', type: 'indicator', label: 'Usted Está Aquí', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>`
    },
    ARROW_LINE: {
        id: 'ARROW_LINE', type: 'arrow', label: 'Ruta de Escape', color: '#2563eb',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`
    },

    // Structural Drawing Tools
    LINE: {
        id: 'LINE', type: 'line', label: 'Pared / Muro', color: '#374151',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="20" y2="4"/></svg>`
    },
    RECTANGLE: {
        id: 'RECTANGLE', type: 'rect', label: 'Salón / Zona', color: '#374151',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`
    },

    // ── Architectural Elements (AutoCAD / Planos) ───────────────────────────
    DOOR_SINGLE: {
        id: 'DOOR_SINGLE', type: 'door', label: 'Puerta Simple (Batiente)', color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="21" x2="21" y2="21"/><line x1="4" y1="21" x2="4" y2="6"/><path d="M4 6 A 15 15 0 0 1 19 21" stroke-dasharray="2 2" stroke-width="1.3"/></svg>`
    },
    DOOR_DOUBLE: {
        id: 'DOOR_DOUBLE', type: 'door', label: 'Puerta Doble Hoja', color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="21" x2="22" y2="21"/><line x1="3" y1="21" x2="3" y2="12"/><line x1="21" y1="21" x2="21" y2="12"/><path d="M3 12 A 9 9 0 0 1 12 21" stroke-dasharray="2 2" stroke-width="1.2"/><path d="M21 12 A 9 9 0 0 0 12 21" stroke-dasharray="2 2" stroke-width="1.2"/></svg>`
    },
    DOOR_SLIDING: {
        id: 'DOOR_SLIDING', type: 'door', label: 'Puerta Corrediza', color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><line x1="2" y1="14" x2="22" y2="14" stroke-width="2.5"/><line x1="5" y1="10" x2="15" y2="10" stroke-width="3"/><polyline points="13 7 17 10 13 13"/></svg>`
    },
    DOOR_EMERGENCY: {
        id: 'DOOR_EMERGENCY', type: 'door', label: 'Puerta Antipánico / Escape', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1.5"/><line x1="4" y1="12" x2="20" y2="12" stroke="#16a34a" stroke-width="3"/><circle cx="17" cy="12" r="1.5" fill="#16a34a"/><path d="M9 15l3-3-3-3"/></svg>`
    },
    STAIRS_STRAIGHT: {
        id: 'STAIRS_STRAIGHT', type: 'stairs', label: 'Escalera Recta (Sube/Baja)', color: '#475569',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="11" x2="20" y2="11"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="12" y1="18" x2="12" y2="5" stroke="#2563eb" stroke-width="1.8"/><polyline points="9 8 12 5 15 8" stroke="#2563eb" stroke-width="1.8"/></svg>`
    },
    STAIRS_SPIRAL: {
        id: 'STAIRS_SPIRAL', type: 'stairs', label: 'Escalera Caracol', color: '#475569',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill="currentColor"/><line x1="12" y1="3" x2="12" y2="9.5"/><line x1="18.3" y1="5.7" x2="13.8" y2="10.2"/><line x1="21" y1="12" x2="14.5" y2="12"/><line x1="18.3" y1="18.3" x2="13.8" y2="13.8"/><line x1="12" y1="21" x2="12" y2="14.5"/><line x1="5.7" y1="18.3" x2="10.2" y2="13.8"/><line x1="3" y1="12" x2="9.5" y2="12"/></svg>`
    },
    RAMP: {
        id: 'RAMP', type: 'stairs', label: 'Rampa de Desnivel / Escape', color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="3,19 21,19 21,7 3,19"/><polyline points="8,15 15,10 12,9"/><line x1="15" y1="10" x2="15" y2="13"/></svg>`
    },
    WINDOW: {
        id: 'WINDOW', type: 'window', label: 'Ventana / Vano', color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="18" height="12" rx="1"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="12" y1="6" x2="12" y2="18"/></svg>`
    },
    COLUMN_SQUARE: {
        id: 'COLUMN_SQUARE', type: 'column', label: 'Columna / Pilar', color: '#1e293b',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="5" width="14" height="14" fill="#cbd5e1" stroke="#1e293b" stroke-width="2"/><line x1="5" y1="5" x2="19" y2="19" stroke="#1e293b"/><line x1="19" y1="5" x2="5" y2="19" stroke="#1e293b"/></svg>`
    },
    DIMENSION: {
        id: 'DIMENSION', type: 'dimension', label: 'Cota de Medida (m)', color: '#6366f1',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="5" x2="3" y2="19"/><line x1="21" y1="5" x2="21" y2="19"/><line x1="3" y1="12" x2="21" y2="12"/><polyline points="7 9 4 12 7 15"/><polyline points="17 9 20 12 17 15"/></svg>`
    }
};
