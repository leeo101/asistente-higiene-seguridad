import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true)
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS,POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { country = 'argentina' } = req.body;
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini (Serverless)' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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

        const result = await model.generateContent(prompt);
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
