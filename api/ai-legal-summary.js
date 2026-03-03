import { GoogleGenerativeAI } from '@google/generative-ai';

export default async function handler(req, res) {
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
        const { ley } = req.body;
        if (!ley) return res.status(400).json({ error: 'Faltan datos de la normativa' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest"];

        const prompt = `Como experto legislativo en Higiene y Seguridad en Argentina, realiza un resumen directo de esta norma: "${ley}".
Provee un resumen de puntos principales (en viñetas) que todo prevencionista debe saber de forma rápida para el trabajo de campo. No inventar contenido, basarse en el objeto material de la ley. Devuelve directamente el texto, y usa formato markdown.`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }

        if (!result) throw new Error('Todos los modelos de IA fallaron');

        return res.status(200).json({ summary: result.response.text().trim() });
    } catch (error) {
        console.error("Error in AI Legal Summary:", error);
        return res.status(500).json({ error: 'Error generando resumen', details: error.message });
    }
}
