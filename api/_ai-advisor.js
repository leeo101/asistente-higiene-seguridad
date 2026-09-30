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
        const { taskDescription, contextData } = req.body;

        if (!taskDescription || typeof taskDescription !== 'string' || !taskDescription.trim()) {
            return res.status(400).json({ error: 'Falta la descripción de la tarea' });
        }

        // 🛡️ Seguridad anti-gasto: limitar longitud de entrada para evitar consumo abusivo de tokens
        if (taskDescription.length > 3000) {
            return res.status(400).json({ error: 'La descripción de la tarea no puede superar los 3.000 caracteres.' });
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
            "gemini-2.0-flash-exp",
            "gemini-1.5-flash-latest"
        ];

        let prompt = `Eres un Consultor Senior Especialista en Higiene, Seguridad y Medio Ambiente (HSE) en Argentina y normativas internacionales (Ley 19.587, Dec. 351/79, Dec. 911/96, Ley 24.449 de Tránsito, Res. SRT, Normas IRAM, NFPA).
Analiza la siguiente tarea, situación o consulta: "${taskDescription}".`;

        if (contextData) {
            prompt += `\n\nCONTEXTO HISTÓRICO DEL USUARIO:\n${contextData}\n`;
        }

        prompt += `\nINSTRUCCIONES CLAVE:
1. SÉ LIBRE, EXHAUSTIVO, PEDAGÓGICO Y MUY DETALLADO: Desarrolla el programa de trabajo paso a paso sin respuestas cortas o telegráficas.
2. EN CASO DE VEHÍCULOS / CASAS RODANTES / MOTORHOMES / CASILLAS:
   - Riesgo de Monóxido de Carbono (CO) y Gas Licuado de Petróleo (GLP/garrafas). Detectores de CO y gas.
   - Seguridad eléctrica dual (12V continua / 220V alterna, disyuntor, puesta a tierra).
   - Prevención de incendios y extintores (matafuego vehicular y habitáculo triclase ABC, soporte reglamentario, manta ignífuga).
   - Plan de evacuación (salida principal libre de trabas, salida de emergencia por ventana expulsable/escotilla, punto de encuentro exterior seguro a >15m).
   - Estado cinemático y mecánico (enganche con cadenas cruzadas, luces y frenos según Ley 24.449).
3. RECOMIENDA LOS MÓDULOS DE LA PLATAFORMA QUE PUEDE UTILIZAR:
   Selecciona los módulos correspondientes entre:
   - "Simulador y Plan de Evacuación" (ruta: "/evacuation-form"): Cálculo de anchos de salida, tiempos y protocolo de escape.
   - "Inspección de Flota y Vehículos" (ruta: "/fleet-form"): Checklists de inspección vehicular, enganches, luces, neumáticos y matafuego.
   - "Gestión de Extintores" (ruta: "/extintores"): Control e inspección periódica de extintores según IRAM 3517.
   - "Carga de Fuego" (ruta: "/fire-load"): Cálculo de carga de fuego y potencial extintor según Dec. 351/79 Anexo VII.
   - "Análisis de Trabajo Seguro (ATS)" (ruta: "/ats"): Desglose de tareas críticas, riesgos paso a paso y medidas de control.
   - "Matriz de Riesgos IPER" (ruta: "/risk-matrix"): Evaluación matricial de probabilidad y severidad de riesgos.
   - "Control y Entrega de EPP" (ruta: "/ppe-tracker"): Registro y firma de entrega de EPP según Res. SRT 299/11.
   - "Legajo Técnico" (ruta: "/legajos"): Consolidación del expediente técnico, certificados y documentación legal.
   - "Permiso de Trabajo Especial" (ruta: "/work-permit"): Para trabajos en caliente, soldadura o fuego.
   - "Plan de Emergencias" (ruta: "/emergency-plan"): Roles de brigada, contingencias y comunicaciones.
   - "Primeros Auxilios y DEA" (ruta: "/first-aid-aed"): Dotación de botiquines de primeros auxilios.

Proporciona un análisis exhaustivo en formato JSON con los siguientes campos EXACTOS:
{
    "task": "Nombre o título formal del programa o tarea",
    "chatResponse": "Explicación completa, pedagógica y detallada en formato Markdown con viñetas, títulos y recomendación explícita de los módulos del sistema a utilizar",
    "planDeAccion": ["Paso 1: Detalle del paso...", "Paso 2: Detalle del paso..."],
    "riesgos": ["Detalle del riesgo 1", "Detalle del riesgo 2"],
    "epp": ["EPP o equipamiento de seguridad 1", "EPP 2"],
    "recomendaciones": ["Medida preventiva 1", "Medida preventiva 2"],
    "normativa": ["Ley o Decreto aplicable 1", "Norma 2"],
    "modulosRecomendados": [
        { "nombre": "Nombre del módulo", "ruta": "/ruta-modulo", "motivo": "Para qué sirve en este caso" }
    ]
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON válido, sin texto fuera del bloque JSON.`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                console.log(`[AI ADVISOR] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

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
                console.warn(`[AI Advisor] Model ${modelName} failed (${err.message}), trying next...`);
                // Si el modelo falló por sobrecarga (503) o rate-limit (429), esperar brevemente
                if (err.status === 503 || err.status === 429 || (err.message && err.message.includes('503'))) {
                    await new Promise(r => setTimeout(r, 600));
                }
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({
                error: 'Todos los modelos de IA fallaron',
                details: lastError?.message || 'Error desconocido'
            });
        }

        const responseText = result.response.text();

        // Sanitize JSON
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error in AI Advisor Serverless:", error);
        return res.status(500).json({ error: 'Error procesando la consulta', details: error.message });
    }
}
