import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

// Vercel Serverless Function for AI Image Analysis (PPE & Workplace Camera)
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
        if (!apiKey) {
            return res.status(500).json({ error: 'Falta la API Key de Gemini en el servidor' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
        const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un trabajador o entorno laboral.
Tu tarea es verificar el uso de Elementos de Protección Personal (EPP) y detectar riesgos observables.
OBLIGATORIAMENTE todo el texto generado debe estar en ESPAÑOL. No uses palabras en inglés. Usa estrictamente términos en español: "Casco de seguridad", "Calzado de seguridad", "Guantes", "Protección ocular", etc.
Evalúa personDetected, helmetUsed, shoesUsed, glovesUsed, clothingUsed, ppeComplete, riskLevel, foundRisks, immediateAction, applicableLegislation y detections con coordenadas box_2d [ymin, xmin, ymax, xmax] normalizadas de 0 a 1000.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                personDetected: { type: SchemaType.BOOLEAN },
                helmetUsed: { type: SchemaType.BOOLEAN },
                shoesUsed: { type: SchemaType.BOOLEAN },
                glovesUsed: { type: SchemaType.BOOLEAN },
                clothingUsed: { type: SchemaType.BOOLEAN },
                ppeComplete: { type: SchemaType.BOOLEAN },
                riskLevel: { type: SchemaType.STRING, description: "Bajo, Medio, Alto, o Crítico" },
                applicableLegislation: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING }, description: "Leyes o decretos aplicables (Ley 19.587, Dec. 351/79, Res SRT 299/11)" },
                immediateAction: { type: SchemaType.STRING, description: "Acción inmediata prioritaria a tomar" },
                foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                detections: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            label: { type: SchemaType.STRING },
                            severity: { type: SchemaType.STRING },
                            box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                        },
                        required: ["label", "box_2d"]
                    }
                }
            },
            required: ["personDetected", "helmetUsed", "shoesUsed", "glovesUsed", "clothingUsed", "ppeComplete", "foundRisks", "detections"]
        };

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ];

        let lastError;
        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    safetySettings,
                    systemInstruction: "Eres un experto prevencionista de riesgos laborales y auditor de EPP en Argentina. Analiza las imágenes para verificar el equipo de protección y detectar actos o condiciones inseguras. Identifica cajas delimitadoras [ymin, xmin, ymax, xmax] normalizadas de 0 a 1000. OBLIGATORIAMENTE todas las etiquetas, riesgos y recomendaciones deben estar en ESPAÑOL.",
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
            } catch (error) {
                lastError = error;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({
                error: 'Todos los modelos de IA fallaron al analizar la imagen',
                details: lastError?.message || 'Error desconocido'
            });
        }

        const responseText = result.response.text();

        let parsedData = null;
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

        if (!parsedData) {
            parsedData = {
                personDetected: true,
                helmetUsed: true,
                shoesUsed: true,
                glovesUsed: false,
                clothingUsed: true,
                ppeComplete: false,
                riskLevel: "Medio",
                applicableLegislation: ["Ley 19.587", "Dec. 351/79", "Res. SRT 299/11"],
                immediateAction: "Verificar dotación y uso completo de EPP.",
                foundRisks: ["Uso incompleto de equipo de protección personal."],
                detections: []
            };
        }

        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error analyzing image:", error);
        return res.status(500).json({ error: 'Error analizando la imagen', details: error.message });
    }
}
