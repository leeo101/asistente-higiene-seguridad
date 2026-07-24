import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

export default async function handler(req, res) {
    // 🔐 Enable secure CORS configuration
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end()
        return
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const user = await verifyToken(req, res);
    if (!user) return;

    try {
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const MAX_BASE64_SIZE = 3.5 * 1024 * 1024;
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido (3.5MB).' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        const base64Data = image.split(',')[1];
        const mimeType = image.split(';')[0].split(':')[1] || 'image/jpeg';

        const prompt = `Analiza esta imagen y verifica si contiene un extintor de incendios (matafuegos). Si NO hay un extintor en la imagen, debes establecer "extinguisherDetected" en false. Si HAY un extintor, establece "extinguisherDetected" en true, identifica su tipo (ABC, CO2, Agua, Espuma, o K), lee la etiqueta para encontrar la capacidad (ej. 5kg, 10kg), el estado ("vigente" o "vencido"), la fecha de último control (lastCheck) y la de próximo vencimiento (nextCheck). También incluye algunas recomendaciones de seguridad. Usa formato YYYY-MM-DD para las fechas si las encuentras, o null si no se pueden leer.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                extinguisherDetected: { type: SchemaType.BOOLEAN },
                type: { type: SchemaType.STRING },
                confidence: { type: SchemaType.NUMBER },
                capacity: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING },
                lastCheck: { type: SchemaType.STRING },
                nextCheck: { type: SchemaType.STRING },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["extinguisherDetected", "type", "confidence", "capacity", "status", "recommendations"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({ 
                    model: modelName,
                    systemInstruction: "Eres un inspector experto en extintores y seguridad contra incendios. Si en la imagen aparece el rostro de una persona o no hay un extintor claramente visible, recházala indicando que no hay extintor. Siempre responde en español.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });
                
                result = await model.generateContent([prompt, imagePart]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) throw new Error(lastError?.message || 'Modelos de IA fallaron');

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
        console.error("Error analyzing extinguisher:", error);
        return res.status(500).json({ error: 'Error analizando la imagen', details: error.message });
    }
}
