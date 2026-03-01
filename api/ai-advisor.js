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
        const { taskDescription } = req.body;
        if (!taskDescription) return res.status(400).json({ error: 'Falta la descripción de la tarea' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini (Serverless)' });

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
Analiza la siguiente tarea o situación laboral: "${taskDescription}".
Proporciona un análisis detallado en formato JSON con los siguientes campos EXACTOS:
{
    "task": "Nombre de la tarea",
    "riesgos": ["Detalle del riesgo 1", "Riesgo 2"],
    "epp": ["EPP recomendado 1", "EPP 2"],
    "recomendaciones": ["Medida preventiva 1", "2"],
    "normativa": ["Ley o Decreto aplicable"]
}
IMPORTANTE: Devuelve ÚNICAMENTE el objeto JSON, sin texto adicional. Asegúrate de incluir normativas argentinas (ej: Ley 19587, Dec 351/79, Dec 911/96).`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                console.log(`[AI ADVISOR] Intentando con ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });

                const fetchPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);

                if (result) {
                    console.log(`[AI ADVISOR] Éxito con ${modelName}`);
                    break;
                }
            } catch (err) {
                lastError = err;
                console.warn(`[AI Advisor] Model ${modelName} failed (${err.message}), trying next...`);
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({
                error: 'Todos los modelos de IA fallaron',
                details: lastError?.message || 'Error desconocido'
            });
        }

        const responseText = result.response.text();

        // Sanitize JSON
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('\`\`\`json')) {
            cleanedJson = cleanedJson.replace(/\`\`\`json/, '').replace(/\`\`\`$/, '').trim();
        } else if (cleanedJson.startsWith('\`\`\`')) {
            cleanedJson = cleanedJson.replace(/\`\`\`/, '').replace(/\`\`\`$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error in AI Advisor Serverless:", error);
        return res.status(500).json({ error: 'Error procesando la consulta', details: error.message });
    }
}
