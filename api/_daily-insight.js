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

        const { country = 'argentina' } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini (Serverless)' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-flash"
        ];

        const prompt = `Actúa como un Asesor Senior en Higiene y Seguridad Laboral en ${country}. 
Genera un "Consejo del Día" breve y profesional para otros profesionales del área.
Puede ser un recordatorio normativo específico de ${country}, un tip técnico sobre EPP, ergonomía, o prevención de riesgos.
Formato de respuesta JSON estricto:
{
    "title": "Breve título del consejo (ej: Recordatorio SRT)",
    "content": "Contenido del consejo (máximo 140 caracteres)",
    "category": "Una de: Normativa, Técnico, Prevención, IA"
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON. Sea conciso y valioso.`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw new Error(lastError?.message || 'Modelos de Texto IA fallaron');
        const responseText = result.response.text();

        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error generating daily insight Serverless:", error);
        return res.status(500).json({ error: 'Error generando el consejo diario', details: error.message });
    }
}
