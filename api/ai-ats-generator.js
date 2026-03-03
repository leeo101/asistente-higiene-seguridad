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
        const { taskTitle } = req.body;
        if (!taskTitle) return res.status(400).json({ error: 'Falta el título de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest",
            "gemini-1.5-flash",
            "models/gemini-1.5-flash",
            "gemini-flash-latest",
            "gemini-1.5-pro"
        ];

        const prompt = `Actúa como un experto en Higiene y Seguridad Laboral en Argentina.
        Tu tarea es generar un Análisis de Trabajo Seguro (ATS) detallado para la siguiente actividad: "${taskTitle}".
        Deberás devolver una lista de pasos lógicos de trabajo, sus riesgos asociados y los controles preventivos necesarios.
        
        Devuelve ÚNICAMENTE un objeto JSON (sin texto adicional ni markdown) con el siguiente formato:
        [
            {
                "paso": "Descripción del paso 1",
                "riesgo": "Riesgo asociado al paso 1",
                "control": "Control preventivo para el paso 1"
            },
            ...
        ]
        Genera entre 5 y 10 pasos detallados. No incluyas explicaciones fuera del JSON.`;

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

        if (!result) throw new Error(lastError?.message || 'Todos los modelos de IA fallaron');

        const responseText = result.response.text();
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/```json/, '').replace(/```$/, '').trim();
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/```/, '').replace(/```$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error in AI ATS Generator:", error);
        return res.status(500).json({ error: 'Error generando el ATS', details: error.message });
    }
}
