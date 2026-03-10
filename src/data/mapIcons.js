// This file exports the standard ISO/IRAM safety icons used in the Risk Map Generator
export const SAFETY_ICONS = {
    // Fire Equipment (Red)
    EXTINGUISHER: {
        id: 'EXTINGUISHER', type: 'fire', label: 'Extintor ABC', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21h10"/><path d="M12 21v-3"/><path d="M10 4h4"/><path d="M11 4v3"/><path d="M13 4v3"/><path d="M8 7h8a2 2 0 0 1 2 2v9H6V9a2 2 0 0 1 2-2z"/><path d="M8 12h8"/><path d="M6 14s2-2 6-2 6 2 6 2"/><path d="M9 18v-4"/><path d="M15 18v-4"/><path d="M6 7V5a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v2"/><path d="M5 14h2"/></svg>`
    },
    HYDRANT: {
        id: 'HYDRANT', type: 'fire', label: 'Hidrante / BIE', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="2" width="18" height="20" rx="2" ry="2"/><circle cx="12" cy="12" r="5"/><path d="M12 12v.01"/><path d="M12 7v5"/></svg>`
    },
    ALARM: {
        id: 'ALARM', type: 'fire', label: 'Pulsador Alarma', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><circle cx="12" cy="12" r="3"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="M2 12h2"/><path d="M20 12h2"/></svg>`
    },
    NO_ENTRY: {
        id: 'NO_ENTRY', type: 'fire', label: 'Prohibido el Acceso', color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M7 12h10"/></svg>`
    },

    // Warning / Risks (Yellow)
    ELECTRICAL: {
        id: 'ELECTRICAL', type: 'warning', label: 'Riesgo Eléctrico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`
    },
    CHEMICAL: {
        id: 'CHEMICAL', type: 'warning', label: 'Riesgo Químico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 2v7.527a2 2 0 0 1-.211.896L4.72 20.55a2 2 0 0 0 1.8 2.95h10.96a2 2 0 0 0 1.8-2.95L14.21 10.42a2 2 0 0 1-.21-.896V2"/><path d="M8 2h8"/><path d="M8 15h8"/></svg>`
    },
    BIOLOGICAL: {
        id: 'BIOLOGICAL', type: 'warning', label: 'Riesgo Biológico', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/><circle cx="12" cy="12" r="3"/><path d="M12 15a4 4 0 0 1-4-4"/><path d="M16 12a4 4 0 0 1-4 4"/></svg>`
    },
    SLIP: {
        id: 'SLIP', type: 'warning', label: 'Piso Resbaladizo', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 22 2-2m-2-4 2 2m4 0 2-2m-2-4 2 2m4 0 2-2m-2-4 2 2m4 0 2-2m-2-4 2 2"/><path d="M5 22h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2z"/></svg>`
    },
    PPE_REQUIRED: {
        id: 'PPE_REQUIRED', type: 'warning', label: 'EPP Obligatorio', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>`
    },
    FORKLIFT: {
        id: 'FORKLIFT', type: 'warning', label: 'Tránsito Autoelevadores', color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 17h14v2H2z"/><path d="M6 17V7l4-3 4 3v10"/><path d="M16 11h3l3 6H16V11z"/><circle cx="6" cy="20" r="1.5"/><circle cx="19" cy="20" r="1.5"/><path d="M9 12H7"/><path d="M9 9H7"/></svg>`
    },

    // Escape Routes / Safe Conditions (Green)
    EXIT: {
        id: 'EXIT', type: 'escape', label: 'Salida / Escape', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`
    },
    MEETING_POINT: {
        id: 'MEETING_POINT', type: 'escape', label: 'Punto Encuentro', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 18a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2"/><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><circle cx="12" cy="10" r="2"/><path d="M8 14v4"/><path d="M16 14v4"/></svg>`
    },
    FIRST_AID: {
        id: 'FIRST_AID', type: 'escape', label: 'Primeros Auxilios', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><path d="M12 8v8"/><path d="M8 12h8"/></svg>`
    },
    EMERGENCY_SHOWER: {
        id: 'EMERGENCY_SHOWER', type: 'escape', label: 'Ducha de Emergencia', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v7"/><path d="M8 5h8"/><path d="M8 9h8"/><path d="M10 12v6"/><path d="M14 12v6"/><path d="M8 18h8"/><circle cx="10" cy="21" r="0.5" fill="currentColor"/><circle cx="14" cy="21" r="0.5" fill="currentColor"/><circle cx="12" cy="21" r="0.5" fill="currentColor"/></svg>`
    },
    EYE_WASH: {
        id: 'EYE_WASH', type: 'escape', label: 'Lavaojos', color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/><path d="M9 20c0 1.1.9 2 2 2h2a2 2 0 0 0 2-2v-1H9v1z"/><path d="M12 17v3"/></svg>`
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
        id: 'LINE', type: 'line', label: 'Pared / Línea', color: '#374151',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="20" x2="20" y2="4"/></svg>`
    },
    RECTANGLE: {
        id: 'RECTANGLE', type: 'rect', label: 'Salón / Zona', color: '#374151',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/></svg>`
    }
};
