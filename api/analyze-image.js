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
            return res.status(500).json({ error: 'Falta la API Key de Gemini (Environment Variables en Vercel)' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.split(',')[1];
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
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"] // Array vacío si no hay riesgos evidentes adicionales a los EPP faltantes
}`;

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
        };

        const modelsToTry = ["gemini-1.5-flash", "gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-pro-vision"];
        let result = null;
        let lastError = null;

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                result = await model.generateContent([prompt, imagePart]);
                break; // Break loop if successful
            } catch (error) {
                lastError = error;
                console.log(`Model ${modelName} encountered an error: ${error.message}`);
                continue; // Try the next model
            }
        }

        if (!result) {
            console.error("All models failed. Last error: ", lastError);
            throw lastError; // Throw the error to be caught by the outer catch block
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
