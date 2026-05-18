import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
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

        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        // Validate image payload size (max ~3.5MB in base64 = ~2.6MB actual)
        const MAX_BASE64_SIZE = 3.5 * 1024 * 1024; // 3.5 MB
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido (3.5MB).' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-flash-latest",
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash",
            "gemini-1.5-pro"
        ];

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                personDetected: { type: SchemaType.BOOLEAN },
                generalAssessment: { type: SchemaType.STRING },
                foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                detections: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            label: { type: SchemaType.STRING },
                            box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                        },
                        required: ["label", "box_2d"]
                    }
                }
            },
            required: ["personDetected", "generalAssessment", "foundRisks", "recommendations", "detections"]
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
                    systemInstruction: "Detector maestro de riesgos. Encuentra condiciones subestándar (desorden, máquinas sin guardia, extintores bloqueados). Entrega recuadros de detección normalizados de 0 a 1000 en formato [ymin, xmin, ymax, xmax] alrededor de los riesgos graves.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                result = await model.generateContent([prompt, imagePart]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw new Error(lastError?.message || 'Modelos de Visión IA fallaron');

        const responseText = result.response.text();
        const parsedData = JSON.parse(responseText);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error analyzing general risks:", error);
        return res.status(500).json({ error: 'Error analizando riesgos', details: error.message });
    }
}
