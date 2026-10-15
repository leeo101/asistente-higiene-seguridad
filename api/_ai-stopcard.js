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

        const { transcript, country = 'argentina' } = body || {};
        if (!transcript || typeof transcript !== 'string') {
            return res.status(400).json({ error: 'Falta transcripción' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                type: { type: SchemaType.STRING },
                location: { type: SchemaType.STRING },
                description: { type: SchemaType.STRING },
                actionTaken: { type: SchemaType.STRING }
            },
            required: ["type", "location", "description", "actionTaken"]
        };

        const prompt = `Analiza este reporte de voz de un inspector de seguridad: "${transcript}".
Extrae e infiere los datos para una Tarjeta STOP. Clasifícalo en uno de estos: "Condición Insegura", "Acto Inseguro", "Casi Accidente", "Acto Seguro".
Extrae la ubicación si se menciona. Da una descripción profesional del hallazgo. Si menciona qué hizo al respecto, ponlo en actionTaken.
Responde estrictamente en formato JSON válido.`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: `Eres un asistente experto en seguridad laboral en ${country}. Transformas notas de voz informales en reportes STOP estructurados.`,
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                const fetchPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout de 25s')), 25000));
                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({ error: 'Todos los modelos de IA fallaron', details: lastError?.message });
        }

        const parsedData = JSON.parse(result.response.text());
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error in AI StopCard:", error.message);
        return res.status(500).json({ error: 'Error procesando reporte STOP', details: error.message });
    }
}
