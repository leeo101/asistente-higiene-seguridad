import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

export default async function handler(req, res) {
    // CORS — restricted to known origins
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // 🔐 Firebase Auth verification
    const user = await verifyToken(req, res);
    if (!user) return;

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try {
                body = JSON.parse(body);
            } catch {
                return res.status(400).json({ error: 'Cuerpo de solicitud inválido' });
            }
        }

        const { taskDescription, contextData, country = 'argentina' } = body || {};

        if (!taskDescription || typeof taskDescription !== 'string' || !taskDescription.trim()) {
            return res.status(400).json({ error: 'Falta la descripción de la tarea' });
        }

        // 🛡️ Seguridad anti-gasto: limitar longitud de entrada para evitar consumo abusivo de tokens
        if (taskDescription.length > 4000) {
            return res.status(400).json({ error: 'La descripción de la tarea no puede superar los 4.000 caracteres.' });
        }
        if (contextData && typeof contextData === 'string' && contextData.length > 5000) {
            return res.status(400).json({ error: 'El contexto de datos no puede superar los 5.000 caracteres.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini (Serverless)' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        let prompt = `Eres un Consultor Senior Especialista en Higiene, Seguridad y Medio Ambiente (HSE) de ${country} y normativas internacionales (ej. en Argentina: Ley 19.587, Dec. 351/79, Dec. 911/96, Ley 24.449 de Tránsito, Res. SRT, Normas IRAM, NFPA).
Analiza la siguiente tarea, situación o consulta: "${taskDescription}".`;

        if (contextData) {
            prompt += `\n\nCONTEXTO HISTÓRICO DEL USUARIO:\n${contextData}\n`;
        }

        prompt += `\nINSTRUCCIONES CLAVE:
1. SÉ LIBRE, EXHAUSTIVO, PEDAGÓGICO Y MUY DETALLADO: El usuario puede consultarte cualquier tema o tarea (ej. "necesito hacer un plano de evacuación", "me piden hacer un ATS para tal tarea", "¿cómo armo un programa de seguridad?", etc.). Debes explicarle QUÉ hacer, CÓMO hacerlo paso a paso en campo/gabinete y QUÉ módulo(s) de la plataforma usar para cada cosa.
2. CATÁLOGO COMPLETO DE MÓDULOS DE LA PLATAFORMA (selecciona todos los pertinentes con sus rutas exactas):
   - "Generador de Planos de Evacuación y Mapas de Riesgo" (ruta: "/risk-maps"): Diseñar/subir el plano o croquis de evacuación, rutas de escape, extintores, "Usted está aquí" y exportar PDF.
   - "Simulador y Cálculo de Evacuación" (ruta: "/evacuation-form"): Cálculo de factor de ocupación, unidades de ancho de salida (UAS) y tiempos de escape (Dec. 351/79 Anexo VII).
   - "Plan de Emergencias y Brigadas" (ruta: "/emergency-plan"): Roles de brigada, protocolo de emergencia y comunicaciones.
   - "Actas de Simulacros de Emergencia" (ruta: "/drills"): Planificación y certificación de simulacros de evacuación.
   - "Análisis de Trabajo Seguro (ATS)" (ruta: "/ats"): Desglose cronológico de tareas paso a paso, peligros, controles, EPP y firmas digitales.
   - "Permiso de Trabajo con Tensión / Arc Flash" (ruta: "/arc-flash/new"): Trabajos eléctricos energizados bajo NFPA 70E y Res. SRT 3068/14 (cal/cm², frontera de arco, EPP y firmas).
   - "Bloqueo y Etiquetado (LOTO)" (ruta: "/loto/new"): Aislamiento de energías, candado, tarjeta y Energía Cero.
   - "Permiso de Trabajo en Altura" (ruta: "/working-at-height/new"): Trabajos > 2m, andamios, arnés, cabo de vida y punto de anclaje 22 kN.
   - "Permiso de Trabajo en Caliente" (ruta: "/hot-work/new"): Soldadura, amolado u oxicorte (radio 11m, biombos, arrestallamas, extintor y guardia de cenizas).
   - "Permiso de Espacios Confinados" (ruta: "/confined-space/new"): Ingreso a tanques/silos/cámaras, medición O2/LEL/CO/H2S, ventilación, trípode y vigía.
   - "Seguridad en Excavaciones y Zanjeo" (ruta: "/excavations/new"): Zanjas, entibamiento, cateos de servicios y escaleras cada 7,5m.
   - "Programa de Seguridad en Obra" (ruta: "/construction-safety-program/new"): Programas de seguridad Dec. 911/96 y Res. SRT 51/97, 35/98, 319/99.
   - "Carga de Fuego y Potencial Extintor" (ruta: "/fire-load"): Cálculo de carga de fuego (kg madera/m²), F30/F60/F90 y potencial extintor.
   - "Gestión e Inspección de Extintores" (ruta: "/extintores"): Padrón y control de matafuegos IRAM 3517.
   - "Matriz de Riesgos IPER" (ruta: "/risk-matrix"): Evaluación de Probabilidad x Severidad y controles por puesto.
   - "Protocolo de Puesta a Tierra SRT 900/15" (ruta: "/grounding/new"): Medición de PAT en Ohms, continuidad de masas y disyuntores.
   - "Protocolo de Iluminación SRT 84/12" (ruta: "/lighting"): Medición de lux y uniformidad.
   - "Protocolo de Ruido SRT 85/12" (ruta: "/noise-assessment/new"): Medición de NSCE (dBA) y dosis de ruido.
   - "Estudio de Ergonomía SRT 886/15" (ruta: "/ergonomics-form"): Planillas 1, 2, 3 y 4 de ergonomía.
   - "Evaluación de Estrés Térmico (TGBH)" (ruta: "/thermal-stress"): Cálculo de índice TGBH y descanso.
   - "Estudio de Ventilación" (ruta: "/ventilation"): Cálculo de renovaciones de aire por hora (Cap. 11 Dec. 351/79).
   - "Control y Entrega de EPP (Res. 299/11)" (ruta: "/ppe-tracker"): Planilla oficial de entrega de EPP certificado con firma.
   - "Aptitudes Médicas Laborales" (ruta: "/medical"): Certificados de aptitud médica y habilitaciones para tareas de riesgo.
   - "Gestión de Capacitaciones" (ruta: "/training-management") y "Charla de 5 Minutos" (ruta: "/toolbox-talk").
   - "Relevamiento General de Riesgos Laborales (RGRL)" (ruta: "/rgrl/new") y "Relevamiento de Agentes de Riesgo (RAR)" (ruta: "/rar/new").
   - "Autoelevadores Res. SRT 960/15" (ruta: "/forklifts"), "Inspección de Flota y Vehículos" (ruta: "/fleet-form") y "Operaciones de Izaje" (ruta: "/lifting-form").
   - "Seguridad Química y SGA" (ruta: "/chemical-safety/new"), "Atmósferas Explosivas ATEX" (ruta: "/atex/new") y "Residuos Peligrosos" (ruta: "/hazardous-waste/new").
   - "Investigación de Accidentes" (ruta: "/accident-investigation"), "Auditorías HSE" (ruta: "/audit/new"), "Acciones Correctivas CAPA" (ruta: "/capa/new").
   - "Procedimientos de Trabajo Seguro (PTS)" (ruta: "/pts"), "Inspección de Estanterías y Racks" (ruta: "/racks"), "Control de Contratistas" (ruta: "/contractors"), "Tarjetas STOP" (ruta: "/stop-cards/new"), "Primeros Auxilios y DEA" (ruta: "/first-aid-aed"), "Matriz Legal" (ruta: "/legal-matrix"), "Legajo Técnico" (ruta: "/legajos") y "Dossier ZIP" (ruta: "/dossier").

Proporciona un análisis exhaustivo en formato JSON con los siguientes campos EXACTOS:
{
    "task": "Nombre o título formal del programa, documento o tarea",
    "chatResponse": "Explicación completa, pedagógica y detallada en formato Markdown explicando QUÉ hacer, CÓMO hacerlo paso a paso y QUÉ módulos del sistema usar para cada parte",
    "planDeAccion": ["Paso 1: Detalle de qué hacer y cómo...", "Paso 2: Detalle..."],
    "riesgos": ["Detalle del riesgo 1", "Detalle del riesgo 2"],
    "epp": ["EPP o equipamiento de seguridad 1", "EPP 2"],
    "recomendaciones": ["Medida preventiva 1", "Medida preventiva 2"],
    "normativa": ["Ley o Decreto aplicable 1", "Norma 2"],
    "modulosRecomendados": [
        { "nombre": "Nombre del módulo", "ruta": "/ruta-modulo", "motivo": "Para qué sirve en este caso", "comoUsarlo": "Cómo usarlo y qué datos cargar paso a paso en la app" }
    ]
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON válido, sin texto adicional fuera del JSON.`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                console.log(`[AI ADVISOR] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                });

                const fetchPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);

                if (result) {
                    console.log(`[AI ADVISOR] Éxito con ${modelName}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`[AI Advisor] Model ${modelName} falló (${err.message}), probando siguiente...`);
                // Si el modelo falló por sobrecarga (503) o rate-limit (429), esperar brevemente
                if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
                    await new Promise(r => setTimeout(r, 600));
                }
                continue;
            }
        }

        if (!result) {
            return res.status(200).json({
                task: taskDescription,
                fallback: true
            });
        }

        const responseText = result.response.text();

        // Parseo y sanitización defensiva del JSON
        let parsedData = null;
        try {
            let cleaned = responseText.trim();
            if (cleaned.startsWith('```json')) {
                cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            } else if (cleaned.startsWith('```')) {
                cleaned = cleaned.replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
            }
            parsedData = JSON.parse(cleaned);
        } catch {
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                try {
                    parsedData = JSON.parse(responseText.substring(startIdx, endIdx + 1));
                } catch (e2) {
                    console.error("[AI ADVISOR] Fallo parseando JSON extraído:", e2.message);
                }
            }
        }

        if (!parsedData) {
            parsedData = {
                task: taskDescription.slice(0, 80),
                chatResponse: responseText,
                planDeAccion: ["Evaluar riesgos en el puesto de trabajo.", "Implementar medidas preventivas inmediatas."],
                riesgos: ["Riesgos específicos de la actividad laboral."],
                epp: ["EPP reglamentario según normativa aplicable."],
                recomendaciones: ["Verificar cumplimiento de protocolos de trabajo seguro."],
                normativa: ["Ley 19.587", "Dec. 351/79"],
                modulosRecomendados: []
            };
        }

        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error in AI Advisor Serverless:", error);
        return res.status(500).json({ error: 'Error procesando la consulta', details: error.message });
    }
}
