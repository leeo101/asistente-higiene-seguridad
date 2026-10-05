// Iconografía Técnica Reglamentaria conforme a Norma IRAM 10005 (Partes I y II) e ISO 7010
// Símbolos gráficos vectoriales normalizados para Planos de Evacuación y Mapas de Riesgos Industriales.

export const SAFETY_ICONS: Record<string, {
    id: string;
    type: string;
    label: string;
    color: string;
    svg: string;
}> = {
    // ── 1. PROTECCIÓN CONTRA INCENDIOS (ISO 7010 Serie F / IRAM 10005 Rojo Seguridad) ──
    EXTINGUISHER: {
        id: 'EXTINGUISHER',
        type: 'fire',
        label: 'Matafuego Manual (Extintor)',
        color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#dc2626"/>
  <rect x="2" y="2" width="20" height="20" rx="2.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
  <!-- Cilindro normalizado IRAM -->
  <rect x="8.5" y="8" width="7" height="12" rx="3.2" fill="#ffffff"/>
  <rect x="9.5" y="19" width="5" height="1.8" rx="0.5" fill="#ffffff"/>
  <!-- Manija de accionamiento y perno de seguridad -->
  <path d="M12 4.5v3.5" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M9.5 5.5h5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M9.5 4.5l4.5 2" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
  <!-- Manómetro y Manguera con Tobera -->
  <circle cx="15.5" cy="7.2" r="1.1" fill="#ffffff"/>
  <path d="M11.5 7.5c-3 0-4.5 1.8-4.5 4.5v5.5" fill="none" stroke="#ffffff" stroke-width="1.4" stroke-linecap="round"/>
  <polygon points="6,17.5 8,17.5 8.5,20.5 5.5,20.5" fill="#ffffff"/>
  <!-- Llama de fuego esquemática técnica -->
  <path d="M18.5 12c0-1.2-.6-2.2-1.4-2.8.2 1.2-.4 2.2-1.2 2.6.2-2.4-1.6-3.8-1.6-3.8s.2 1.4-.4 2.4c-.5.8-1 1.4-.9 2.6.1 1.6 1.4 2.8 2.8 2.8s2.7-1.3 2.7-2.8z" fill="#ffffff"/>
</svg>`
    },
    HYDRANT: {
        id: 'HYDRANT',
        type: 'fire',
        label: 'Boca de Incendio Equipada (BIE)',
        color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#dc2626"/>
  <rect x="2" y="2" width="20" height="20" rx="2.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
  <!-- Carrete devanadera manguera -->
  <circle cx="12" cy="12" r="7.5" fill="none" stroke="#ffffff" stroke-width="1.6"/>
  <circle cx="12" cy="12" r="4.5" fill="none" stroke="#ffffff" stroke-width="1.3"/>
  <circle cx="12" cy="12" r="2" fill="#ffffff"/>
  <!-- Manguera y Lanza orientable -->
  <path d="M12 4.5h5.5v3.5l-2 1.8" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <polygon points="17.5,7 19.5,8 17.5,9.5" fill="#ffffff"/>
  <line x1="12" y1="4.5" x2="12" y2="7.5" stroke="#ffffff" stroke-width="1.4"/>
</svg>`
    },
    ALARM: {
        id: 'ALARM',
        type: 'fire',
        label: 'Pulsador Manual de Alarma',
        color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#dc2626"/>
  <rect x="4.5" y="4.5" width="15" height="15" rx="2" fill="none" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="12" cy="12" r="4.2" fill="#ffffff"/>
  <circle cx="12" cy="12" r="2" fill="#dc2626"/>
  <!-- Símbolo de rotura de cristal / push -->
  <path d="M12 4.5v2.5M12 17v2.5M4.5 12h2.5M17 12h2.5" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
</svg>`
    },
    NO_ENTRY: {
        id: 'NO_ENTRY',
        type: 'fire',
        label: 'Prohibido el Paso / Ingreso',
        color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10.5" fill="#ffffff" stroke="#dc2626" stroke-width="2.5"/>
  <circle cx="12" cy="12" r="9.5" fill="#dc2626"/>
  <rect x="4.5" y="10.2" width="15" height="3.6" rx="1" fill="#ffffff"/>
</svg>`
    },

    // ── 2. ADVERTENCIA DE RIESGOS (ISO 7010 Serie W / IRAM 10005 Amarillo Seguridad) ──
    ELECTRICAL: {
        id: 'ELECTRICAL',
        type: 'warning',
        label: 'Riesgo Eléctrico (Peligro de Electrocución)',
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Triángulo equilátero amarillo normalizado -->
  <polygon points="12,2.2 1.5,21.5 22.5,21.5" fill="#eab308" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- Rayo quebrado normalizado DIN/IRAM -->
  <path d="M12.8 6.5l-4.5 6.8h3.8l-1.8 6.2 5.8-8.2h-3.8l1.7-4.8h-1.2z" fill="#0f172a"/>
</svg>`
    },
    CHEMICAL: {
        id: 'CHEMICAL',
        type: 'warning',
        label: 'Riesgo Químico / Sustancias Corrosivas',
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,2.2 1.5,21.5 22.5,21.5" fill="#eab308" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- Probetas vertiendo líquido corrosivo GHS/IRAM -->
  <path d="M8 8l2.5 4M16 8l-2.5 4" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M6.5 16.5h11" stroke="#0f172a" stroke-width="1.6" stroke-linecap="round"/>
  <!-- Gotas corrosivas cayendo -->
  <circle cx="10.5" cy="14" r="0.9" fill="#0f172a"/>
  <circle cx="13.5" cy="14" r="0.9" fill="#0f172a"/>
  <rect x="9" y="16" width="6" height="2" rx="0.5" fill="#0f172a"/>
</svg>`
    },
    BIOLOGICAL: {
        id: 'BIOLOGICAL',
        type: 'warning',
        label: 'Riesgo Biológico (Biohazard)',
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,2.2 1.5,21.5 22.5,21.5" fill="#eab308" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- Símbolo internacional de riesgo biológico -->
  <circle cx="12" cy="12" r="1.3" fill="#0f172a"/>
  <path d="M12 9.5a3.2 3.2 0 0 0-2.8 1.6 3.2 3.2 0 0 1 5.6 0A3.2 3.2 0 0 0 12 9.5z" fill="#0f172a"/>
  <path d="M9.2 15a3.2 3.2 0 0 0 .2-3.2 3.2 3.2 0 0 1 2.8 4.8 3.2 3.2 0 0 0-3-1.6z" fill="#0f172a"/>
  <path d="M14.8 15a3.2 3.2 0 0 0 3-1.6 3.2 3.2 0 0 1-2.8 4.8 3.2 3.2 0 0 0-.2-3.2z" fill="#0f172a"/>
  <circle cx="12" cy="13.2" r="3.2" fill="none" stroke="#0f172a" stroke-width="1"/>
</svg>`
    },
    SLIP: {
        id: 'SLIP',
        type: 'warning',
        label: 'Riesgo de Caída / Piso Resbaladizo',
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,2.2 1.5,21.5 22.5,21.5" fill="#eab308" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- Silueta de persona resbalando ISO 7010 W011 -->
  <circle cx="14.8" cy="8.2" r="1.4" fill="#0f172a"/>
  <path d="M13.2 10.2l-2.6 3.2 2.2 1.2 2-1.2" fill="none" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M10.6 13.4l-3.2 1.4M12.8 14.6l2 3.8M9.6 16.4l-3.2 2.4" fill="none" stroke="#0f172a" stroke-width="1.4" stroke-linecap="round"/>
  <path d="M5.5 19.5c3-1 7 1 11-1 1 0 2-.4 3-.4" fill="none" stroke="#0f172a" stroke-width="1.5" stroke-linecap="round"/>
</svg>`
    },
    PPE_REQUIRED: {
        id: 'PPE_REQUIRED',
        type: 'warning',
        label: 'Uso Obligatorio de EPP (Casco/Gafas)',
        color: '#2563eb',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <circle cx="12" cy="12" r="10.5" fill="#2563eb"/>
  <circle cx="12" cy="12" r="9.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
  <!-- Casco de Seguridad Industrial Normalizado -->
  <path d="M6.5 12.5c0-3.3 2.5-5.8 5.5-5.8s5.5 2.5 5.5 5.8v1.2H6.5v-1.2z" fill="#ffffff"/>
  <rect x="5.5" y="13.5" width="13" height="2" rx="0.8" fill="#ffffff"/>
  <!-- Orejeras / Gafas de protección integradas -->
  <circle cx="9" cy="17.2" r="1.6" fill="none" stroke="#ffffff" stroke-width="1.3"/>
  <circle cx="15" cy="17.2" r="1.6" fill="none" stroke="#ffffff" stroke-width="1.3"/>
  <path d="M10.6 17.2h2.8" stroke="#ffffff" stroke-width="1.3"/>
</svg>`
    },
    FORKLIFT: {
        id: 'FORKLIFT',
        type: 'warning',
        label: 'Tránsito de Autoelevadores / Maquinaria',
        color: '#eab308',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <polygon points="12,2.2 1.5,21.5 22.5,21.5" fill="#eab308" stroke="#0f172a" stroke-width="1.8" stroke-linejoin="round"/>
  <!-- Silueta vehicular ISO 7010 W014 -->
  <path d="M6 16.5h7.5v1.8H6zm2.5-5h3.2v4.5H8.5zm5.5-3.5v8.5h3.8v-1.2h-2V11h2V8h-3.8z" fill="#0f172a"/>
  <!-- Operador y ruedas -->
  <circle cx="7.5" cy="19" r="1.3" fill="#0f172a"/>
  <circle cx="12.5" cy="19" r="1.3" fill="#0f172a"/>
  <circle cx="10" cy="9.5" r="1.1" fill="#0f172a"/>
</svg>`
    },

    // ── 3. EVACUACIÓN Y SALVAMENTO (ISO 7010 Serie E / IRAM 10005 Verde Seguridad) ──
    EXIT: {
        id: 'EXIT',
        type: 'escape',
        label: 'Salida de Emergencia / Vía de Escape',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#16a34a"/>
  <rect x="2" y="2" width="20" height="20" rx="2.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
  <!-- Marco de puerta reglamentario -->
  <path d="M19 4.5v15h-4.5v-1.2h3.3V5.7h-3.3V4.5H19z" fill="#ffffff"/>
  <!-- Silueta técnica ISO hombre corriendo hacia la puerta -->
  <circle cx="9.2" cy="6.8" r="1.5" fill="#ffffff"/>
  <path d="M8.2 9.2l2.2 2.6v4l-1.8 3.5m-1-5.2l-2.2-2.5 1.6-2.2 2.8.6 2.2 1.6" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Flecha direccional de escape -->
  <path d="M3.5 12h4.5m-2-2.2l2.2 2.2-2.2 2.2" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
    },
    MEETING_POINT: {
        id: 'MEETING_POINT',
        type: 'escape',
        label: 'Punto de Encuentro de Emergencia',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#16a34a"/>
  <!-- 4 Flechas convergentes ISO 7010 E007 -->
  <path d="M4 4l4 4m0-3.5v3.5h-3.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 4l-4 4m0-3.5v3.5h3.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M4 20l4-4m0 3.5v-3.5h-3.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M20 20l-4-4m0 3.5v-3.5h3.5" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
  <!-- Personas en el centro del punto de reunión -->
  <circle cx="12" cy="9.8" r="1.6" fill="#ffffff"/>
  <path d="M9.5 15.5c0-1.6 1.2-2.8 2.5-2.8s2.5 1.2 2.5 2.8v1.2H9.5v-1.2z" fill="#ffffff"/>
</svg>`
    },
    FIRST_AID: {
        id: 'FIRST_AID',
        type: 'escape',
        label: 'Primeros Auxilios / Botiquín',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#16a34a"/>
  <rect x="2" y="2" width="20" height="20" rx="2.5" fill="none" stroke="#ffffff" stroke-width="0.8" opacity="0.6"/>
  <!-- Cruz blanca reglamentaria proporciones 1:1:1 -->
  <path d="M9 5h6v4h4v6h-4v4H9v-4H5V9h4V5z" fill="#ffffff"/>
</svg>`
    },
    EMERGENCY_SHOWER: {
        id: 'EMERGENCY_SHOWER',
        type: 'escape',
        label: 'Ducha de Seguridad de Emergencia',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#16a34a"/>
  <!-- Ducha cenital industrial -->
  <path d="M5.5 3.5h8v3h-8zM9.5 6.5v3" fill="none" stroke="#ffffff" stroke-width="1.5"/>
  <path d="M5.5 9.5h8l2.2 3.2H3.3l2.2-3.2z" fill="#ffffff"/>
  <!-- Rociado de agua y persona recibiendo el chorro -->
  <line x1="7" y1="13.5" x2="6" y2="18" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
  <line x1="9.5" y1="13.5" x2="9.5" y2="19" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
  <line x1="12" y1="13.5" x2="13" y2="18" stroke="#ffffff" stroke-width="1.3" stroke-linecap="round"/>
  <circle cx="9.5" cy="15.5" r="1.6" fill="#ffffff"/>
  <path d="M7.5 21v-3.5h4V21" fill="none" stroke="#ffffff" stroke-width="1.4"/>
</svg>`
    },
    EYE_WASH: {
        id: 'EYE_WASH',
        type: 'escape',
        label: 'Lavaojos de Emergencia',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <rect width="24" height="24" rx="3.5" fill="#16a34a"/>
  <!-- Cuenco recolector y boquillas de aspersión doble -->
  <path d="M3.5 17h17c0 2.2-3.5 4.5-8.5 4.5s-8.5-2.3-8.5-4.5z" fill="#ffffff"/>
  <path d="M7.5 17v-4.5c0-1.8 1.8-3 1.8-3s1.8 1.2 1.8 3V17" fill="none" stroke="#ffffff" stroke-width="1.4"/>
  <path d="M13 17v-4.5c0-1.8 1.8-3 1.8-3s1.8 1.2 1.8 3V17" fill="none" stroke="#ffffff" stroke-width="1.4"/>
  <!-- Ojos estilizados recibiendo aspersión -->
  <ellipse cx="8.5" cy="7.5" rx="2.5" ry="1.6" fill="#ffffff"/>
  <circle cx="8.5" cy="7.5" r="0.9" fill="#16a34a"/>
  <ellipse cx="15.5" cy="7.5" rx="2.5" ry="1.6" fill="#ffffff"/>
  <circle cx="15.5" cy="7.5" r="0.9" fill="#16a34a"/>
</svg>`
    },

    // ── 4. RUTA DE EVACUACIÓN Y POSICIÓN (Indicadores Técnicos) ──
    YOU_ARE_HERE: {
        id: 'YOU_ARE_HERE',
        type: 'indicator',
        label: 'Usted Está Aquí (Punto de Observador)',
        color: '#dc2626',
        svg: `<svg viewBox="0 0 24 24" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <!-- Círculo blanco perimetral con pin técnico pericial -->
  <circle cx="12" cy="12" r="11" fill="#ffffff" stroke="#dc2626" stroke-width="2"/>
  <circle cx="12" cy="12" r="8.5" fill="#dc2626"/>
  <!-- Diana concéntrica -->
  <circle cx="12" cy="12" r="4.5" fill="#ffffff"/>
  <circle cx="12" cy="12" r="2.2" fill="#dc2626"/>
</svg>`
    },
    ARROW_LINE: {
        id: 'ARROW_LINE',
        type: 'arrow',
        label: 'Flecha Dirección de Evacuación',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 12h16M14 6l6 6-6 6"/>
</svg>`
    },
    TEXT_LABEL: {
        id: 'TEXT_LABEL',
        type: 'text',
        label: 'Anotación Técnica / Nombre de Sector',
        color: '#0f172a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 7V4h16v3M9 20h6M12 4v16"/>
</svg>`
    },

    // ── 5. ELEMENTOS ESTRUCTURALES Y ARQUITECTÓNICOS (Líneas CAD) ──
    LINE: {
        id: 'LINE',
        type: 'line',
        label: 'Muro Portante / Pared',
        color: '#334155',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
  <line x1="4" y1="20" x2="20" y2="4"/>
</svg>`
    },
    RECTANGLE: {
        id: 'RECTANGLE',
        type: 'rect',
        label: 'Recinto / Área Delimitada',
        color: '#334155',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="3" width="18" height="18" rx="2"/>
</svg>`
    },
    DOOR_SINGLE: {
        id: 'DOOR_SINGLE',
        type: 'door',
        label: 'Puerta Batiente Simple (CAD)',
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="21" x2="21" y2="21"/>
  <line x1="4" y1="21" x2="4" y2="6"/>
  <path d="M4 6 A 15 15 0 0 1 19 21" stroke-dasharray="2.5 2.5" stroke-width="1.4"/>
</svg>`
    },
    DOOR_DOUBLE: {
        id: 'DOOR_DOUBLE',
        type: 'door',
        label: 'Puerta Doble Hoja (CAD)',
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <line x1="2" y1="21" x2="22" y2="21"/>
  <line x1="3" y1="21" x2="3" y2="12"/>
  <line x1="21" y1="21" x2="21" y2="12"/>
  <path d="M3 12 A 9 9 0 0 1 12 21" stroke-dasharray="2 2" stroke-width="1.3"/>
  <path d="M21 12 A 9 9 0 0 0 12 21" stroke-dasharray="2 2" stroke-width="1.3"/>
</svg>`
    },
    DOOR_SLIDING: {
        id: 'DOOR_SLIDING',
        type: 'door',
        label: 'Puerta Corrediza Industrial',
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <line x1="2" y1="14" x2="22" y2="14" stroke-width="2.5"/>
  <line x1="5" y1="10" x2="15" y2="10" stroke-width="3"/>
  <polyline points="13 7 17 10 13 13"/>
</svg>`
    },
    DOOR_EMERGENCY: {
        id: 'DOOR_EMERGENCY',
        type: 'door',
        label: 'Puerta de Emergencia Barra Antipánico',
        color: '#16a34a',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="3" width="16" height="18" rx="1.5"/>
  <line x1="4" y1="12" x2="20" y2="12" stroke="#16a34a" stroke-width="3"/>
  <circle cx="17" cy="12" r="1.5" fill="#16a34a"/>
  <path d="M9 15l3-3-3-3" stroke="#16a34a"/>
</svg>`
    },
    STAIRS_STRAIGHT: {
        id: 'STAIRS_STRAIGHT',
        type: 'stairs',
        label: 'Escalera de Emergencia Recta',
        color: '#475569',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <rect x="4" y="3" width="16" height="18" rx="1"/>
  <line x1="4" y1="7" x2="20" y2="7"/>
  <line x1="4" y1="11" x2="20" y2="11"/>
  <line x1="4" y1="15" x2="20" y2="15"/>
  <line x1="12" y1="18" x2="12" y2="5" stroke="#2563eb" stroke-width="1.8"/>
  <polyline points="9 8 12 5 15 8" stroke="#2563eb" stroke-width="1.8"/>
</svg>`
    },
    STAIRS_SPIRAL: {
        id: 'STAIRS_SPIRAL',
        type: 'stairs',
        label: 'Escalera Helicoidal / Caracol',
        color: '#475569',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="9"/>
  <circle cx="12" cy="12" r="2.5" fill="currentColor"/>
  <line x1="12" y1="3" x2="12" y2="9.5"/>
  <line x1="18.3" y1="5.7" x2="13.8" y2="10.2"/>
  <line x1="21" y1="12" x2="14.5" y2="12"/>
  <line x1="18.3" y1="18.3" x2="13.8" y2="13.8"/>
  <line x1="12" y1="21" x2="12" y2="14.5"/>
  <line x1="5.7" y1="18.3" x2="10.2" y2="13.8"/>
  <line x1="3" y1="12" x2="9.5" y2="12"/>
</svg>`
    },
    RAMP: {
        id: 'RAMP',
        type: 'stairs',
        label: 'Rampa de Desnivel / Evacuación',
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <polygon points="3,19 21,19 21,7 3,19"/>
  <polyline points="8,15 15,10 12,9"/>
  <line x1="15" y1="10" x2="15" y2="13"/>
</svg>`
    },
    WINDOW: {
        id: 'WINDOW',
        type: 'window',
        label: 'Ventana / Vano Exterior',
        color: '#0284c7',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="3" y="6" width="18" height="12" rx="1"/>
  <line x1="3" y1="12" x2="21" y2="12"/>
  <line x1="12" y1="6" x2="12" y2="18"/>
</svg>`
    },
    COLUMN_SQUARE: {
        id: 'COLUMN_SQUARE',
        type: 'column',
        label: 'Columna Estructural / Pilar',
        color: '#1e293b',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
  <rect x="5" y="5" width="14" height="14" fill="#cbd5e1" stroke="#1e293b" stroke-width="2"/>
  <line x1="5" y1="5" x2="19" y2="19" stroke="#1e293b"/>
  <line x1="19" y1="5" x2="5" y2="19" stroke="#1e293b"/>
</svg>`
    },
    DIMENSION: {
        id: 'DIMENSION',
        type: 'dimension',
        label: 'Cota de Medida (m) CAD',
        color: '#6366f1',
        svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
  <line x1="3" y1="5" x2="3" y2="19"/>
  <line x1="21" y1="5" x2="21" y2="19"/>
  <line x1="3" y1="12" x2="21" y2="12"/>
  <polyline points="7 9 4 12 7 15"/>
  <polyline points="17 9 20 12 17 15"/>
</svg>`
    }
};
