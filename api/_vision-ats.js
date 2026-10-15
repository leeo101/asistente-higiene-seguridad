import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

export default async function handler(req, res) {
    const corsOk = setCorsHeaders(req, res);
    if (!corsOk) return;

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const user = await verifyToken(req, res);
    if (!user) return;

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON inválido' }); }
        }

        const { imageBase64 } = body || {};
        if (!imageBase64) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;
        const mimeType = imageBase64.includes(';') ? imageBase64.split(';')[0].split(':')[1] : 'image/jpeg';

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            }
        };

        const prompt = `Analiza esta imagen tomada en un lugar de trabajo (obra, taller, fábrica o faena).
Desglosa las operaciones que se observan o se requieren en pasos lógicos de trabajo para un Análisis de Trabajo Seguro (ATS).
Para cada paso, identifica los riesgos o peligros visibles y la medida de control o EPP preventivo correspondiente.
Devuelve ÚNICAMENTE un array JSON válido con la siguiente estructura:
[
  {
    "paso": "Descripción del paso o tarea",
    "riesgo": "Riesgo o peligro inherente observado",
    "control": "Medida preventiva o control a aplicar"
  }
]`;

        const responseSchema = {
            type: SchemaType.ARRAY,
            items: {
                type: SchemaType.OBJECT,
                properties: {
                    paso: { type: SchemaType.STRING },
                    riesgo: { type: SchemaType.STRING },
                    control: { type: SchemaType.STRING }
                },
                required: ["paso", "riesgo", "control"]
            }
        };

        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un especialista senior en Análisis de Trabajo Seguro (ATS) en Argentina. Identificas condiciones de riesgo y medidas de control según Ley 19.587, Dec. 351/79 y Dec. 911/96.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({ error: 'Todos los modelos de visión fallaron', details: lastError?.message });
        }

        const parsedData = JSON.parse(result.response.text());
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error in Vision ATS:", error.message);
        return res.status(500).json({ error: 'Error procesando la imagen de ATS', details: error.message });
    }
}
