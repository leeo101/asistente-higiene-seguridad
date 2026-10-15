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

        const { historyData } = body || {};
        if (!historyData || !Array.isArray(historyData) || historyData.length === 0) {
            return res.status(400).json({ error: 'historyData array requerido' });
        }

        const safeHistory = historyData.slice(0, 30);
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

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
                prediccionPrincipal: { type: SchemaType.STRING },
                zonasRiesgo: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                tareasCriticas: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
                recomendaciones: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["prediccionPrincipal", "zonasRiesgo", "tareasCriticas", "recomendaciones"]
        };

        const prompt = `Actúa como un perito analista en Higiene, Seguridad y Ergonomía Laboral.
Analiza el siguiente historial de accidentes laborales de una empresa y genera una predicción predictiva fundada para el próximo mes con zonas de riesgo, tareas críticas y recomendaciones prioritarias.
Historial registrado:
${JSON.stringify(safeHistory, null, 2)}`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un analista de datos y prevencionista senior en Argentina. Proporciona predicciones fundamentadas y de alto valor preventivo.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                const fetchPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout de 25s')), 25000)
                );

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
        console.error("Error in Predict Accidents:", error.message);
        return res.status(500).json({ error: 'Error generando predicción de accidentes', details: error.message });
    }
}
