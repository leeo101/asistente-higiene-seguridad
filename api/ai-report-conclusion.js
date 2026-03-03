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
        const { reportType, reportData } = req.body;
        if (!reportType || !reportData) return res.status(400).json({ error: 'Faltan datos del reporte' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = ["gemini-2.0-flash", "gemini-1.5-flash-latest", "gemini-1.5-pro-latest", "gemini-1.5-flash"];

        const prompt = `Actúa como un experto consultor en Higiene y Seguridad Laboral en Argentina.
Analiza los siguientes datos extraídos de un reporte de "${reportType}":
${JSON.stringify(reportData)}

Redacta una concisa y profesional conclusión técnica (entre 2 y 4 párrafos cortos).
La conclusión debe analizar los resultados técnicos, indicar si hay desvíos según normativa y proponer recomendaciones concretas. 
Importante: tu respuesta debe contener ÚNICAMENTE el texto de la conclusión final, listo para insertar en un documento como respuesta cruda (sin comillas adicionales, sin bloque json, ni texto de saludo previo).`;

        let result;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent(prompt);
                if (result) break;
            } catch (err) { continue; }
        }

        if (!result) throw new Error('Todos los modelos de IA fallaron');

        return res.status(200).json({ conclusion: result.response.text().trim() });
    } catch (error) {
        console.error("Error in AI Conclusion:", error);
        return res.status(500).json({ error: 'Error generando la conclusión', details: error.message });
    }
}
