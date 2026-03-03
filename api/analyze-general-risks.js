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
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

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

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral y detecta riesgos generales de Higiene y Seguridad.
Busca desorden, falta de protección, riesgos eléctricos, mecánicos, de caída, etc.
Devuelve ÚNICAMENTE un objeto JSON estricto con este formato:
{
    "detections": [
        {
            "label": "Riesgo: [Descripción corta]",
            "box_2d": [ymin, xmin, ymax, xmax],
            "recommendation": "Acción correctiva"
        }
    ],
    "generalAssessment": "Evaluación general del entorno"
}
Las coordenadas [ymin, xmin, ymax, xmax] deben estar normalizadas de 0 a 1000.`;

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
                const model = genAI.getGenerativeModel({ model: modelName, safetySettings });
                result = await model.generateContent([prompt, imagePart]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw new Error(lastError?.message || 'Modelos de Visión IA fallaron');

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
        console.error("Error analyzing general risks:", error);
        return res.status(500).json({ error: 'Error analizando riesgos', details: error.message });
    }
}
