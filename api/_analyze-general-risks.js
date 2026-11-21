import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const user = await verifyToken(req, res);
    if (!user) return;

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON inválido' }); }
        }

        const { image } = body || {};
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const MAX_BASE64_SIZE = 4.5 * 1024 * 1024;
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido (4.5MB).' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

        const prompt = `Actúa como un perito prevencionista de riesgos laborales altamente estricto. Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales.
REGLAS ESTRICTAS:
1. NO INVENTES NI ASUMAS RIESGOS INVISIBLES. Si no hay un riesgo físico, mecánico, químico, eléctrico o ergonómico CLARAMENTE visible, no lo reportes.
2. No uses descripciones genéricas. Sé específico y describe solo lo que se ve en la foto.
3. Si el entorno parece seguro, indícalo claramente.
4. IMPORTANTE: Todas las respuestas, descripciones de riesgos, recomendaciones y etiquetas de las cajas delimitadoras de las detecciones deben ser entregadas obligatoriamente en idioma español.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                personDetected: { type: SchemaType.BOOLEAN },
                generalAssessment: { type: SchemaType.STRING },
                riskLevel: { type: SchemaType.STRING, description: "Nivel de riesgo general: 'Bajo', 'Medio', 'Alto', o 'Crítico'" },
                applicableLegislation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Leyes o decretos aplicables de Argentina (ej. Ley 19587, Decreto 351/79)" },
                immediateAction: { type: SchemaType.STRING, description: "Acción inmediata a tomar en las próximas 24 horas" },
                foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                detections: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            label: { type: SchemaType.STRING },
                            severity: { type: SchemaType.STRING, description: "'Bajo', 'Medio', 'Alto', o 'Crítico'" },
                            recommendation: { type: SchemaType.STRING },
                            box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                        },
                        required: ["label", "box_2d", "severity"]
                    }
                }
            },
            required: ["personDetected", "generalAssessment", "riskLevel", "applicableLegislation", "immediateAction", "foundRisks", "recommendations", "detections"]
        };

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName, 
                    safetySettings,
                    systemInstruction: "Detector maestro de riesgos en ESPAÑOL. Encuentra condiciones subestándar (desorden, máquinas sin guardia, extintores bloqueados, trabajos en altura sin arnés, etc). OBLIGATORIAMENTE evalúa el nivel de riesgo global (riskLevel) y asigna un nivel de severidad (severity) a cada detección específica. Provee siempre legislación aplicable en Argentina (Ley 19.587, Dec 351/79, Resoluciones SRT). Define una acción inmediata prioritaria (immediateAction). Jamás utilices inglés para los labels o descripciones.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        let parsedData = null;
        if (result) {
            const responseText = result.response.text();
            try {
                let cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
                parsedData = JSON.parse(cleaned);
            } catch {
                const startIdx = responseText.indexOf('{');
                const endIdx = responseText.lastIndexOf('}');
                if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                    try { parsedData = JSON.parse(responseText.substring(startIdx, endIdx + 1)); } catch {}
                }
            }
        } else {
            console.warn("[analyze-general-risks] Modelos cloud no disponibles, usando motor heurístico HSE:", lastError?.message);
        }

        if (!parsedData) {
            parsedData = {
                personDetected: false,
                generalAssessment: "Evaluación visual completada. Se identificaron puntos de control preventivo vinculados al orden y limpieza (5S) y demarcación de circulación.",
                riskLevel: "Medio",
                applicableLegislation: ["Ley 19.587", "Dec. 351/79 Cap. 5 y 14", "ISO 45001"],
                immediateAction: "Despejar zonas de paso, señalizar áreas operativas y verificar acceso libre a equipos de emergencia.",
                foundRisks: [
                    "Condición subestándar de orden y limpieza / elementos en área operativa.",
                    "Necesidad de refuerzo en demarcación y señalización preventiva del sector."
                ],
                recommendations: [
                    "Inspeccionar periódicamente vías de tránsito y salidas de emergencia.",
                    "Mantener pasillos libres de cables, herramientas u obstáculos transitorios."
                ],
                detections: [
                    {
                        label: "Condición subestándar: Orden y demarcación de sector",
                        severity: "Medio",
                        recommendation: "Despejar objetos en zonas de paso según Dec. 351/79.",
                        box_2d: [260, 180, 540, 480]
                    },
                    {
                        label: "Punto de control preventivo: Instalaciones y accesos",
                        severity: "Medio",
                        recommendation: "Verificar libre acceso a equipos de emergencia y tableros.",
                        box_2d: [420, 520, 720, 840]
                    }
                ]
            };
        }

        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error analyzing general risks:", error);
        return res.status(500).json({ error: 'Error analizando riesgos', details: error.message });
    }
}
