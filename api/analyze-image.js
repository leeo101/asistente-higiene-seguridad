import { GoogleGenerativeAI } from '@google/generative-ai';

// Vercel Serverless Function for AI Image Analysis
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
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("[ERROR] Missing GEMINI_API_KEY environment variable.");
            return res.status(500).json({ error: 'Falta la API Key de Gemini (Environment Variables en Vercel)' });
        }

        console.log(`[AI] Attempting analysis with key ending in: ...${apiKey.slice(-4)}`);

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de un entorno laboral. 
Tu tarea es verificar el uso de Elementos de Protección Personal (EPP) y detectar riesgos.
Devuelve ÚNICAMENTE un objeto JSON estricto, sin texto adicional, con el siguiente formato exacto:
{
    "personDetected": true/false,
    "helmetUsed": true/false, // Casco
    "shoesUsed": true/false,  // Calzado de seguridad o botines
    "glovesUsed": true/false, // Guantes de trabajo
    "clothingUsed": true/false, // Ropa de trabajo, uniforme o chaleco reflectivo
    "ppeComplete": true/false, // Si tiene todos los EPP básicos listados antes
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"],
    "detections": [
        {"label": "Casco", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Calzado", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Guantes", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Riesgo: [Nombre]", "box_2d": [ymin, xmin, ymax, xmax]}
    ]
}
Importante: Las coordenadas [ymin, xmin, ymax, xmax] deben estar normalizadas de 0 a 1000.`;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-1.5-flash-latest",
            "gemini-1.5-pro-latest"
        ];

        const safetySettings = [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" },
        ];

        let lastError;
        let result;
        for (const modelName of models) {
            try {
                process.stdout.write(`[AI RECOVERY] Intentando con ${modelName}... `);
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    safetySettings
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);

                if (result) {
                    console.log("ÉXITO ✅");
                    break;
                }
            } catch (error) {
                lastError = error;
                console.log(`FALLÓ ❌ (${error.message})`);
                continue;
            }
        }

        if (!result) {
            const keyInfo = apiKey ? `${apiKey.substring(0, 6)}...${apiKey.slice(-4)}` : 'MISSING';
            console.error("[RECOVERY] Todos los modelos han fallado. Último error:", lastError?.message);
            return res.status(500).json({
                error: 'Todos los modelos de IA fallaron',
                details: lastError?.message || 'Error desconocido durante la recuperación'
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
        console.error("Error analyzing image:", error);
        return res.status(500).json({ error: 'Error analizando la imagen', details: error.message });
    }
}
