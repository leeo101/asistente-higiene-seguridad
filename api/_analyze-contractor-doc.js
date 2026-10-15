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

        const { image } = body || {};
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini en el backend' });

        const genAI = new GoogleGenerativeAI(apiKey);

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        if (!base64Data || base64Data.length < 10) {
            return res.status(400).json({ error: 'La imagen enviada no es válida o está vacía.' });
        }
        const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

        const prompt = `Analiza este documento laboral o de identidad (puede ser DNI, Certificado de cobertura ART, Seguro de Vida, Constancia AFIP/ARCA, etc.). Extrae la siguiente información y devuélvela estrictamente estructurada.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                documentType: { type: SchemaType.STRING, description: "DNI, ART, SEGURO, AFIP, OTRO" },
                name: { type: SchemaType.STRING, description: "Nombre completo de la persona o de la empresa contratista" },
                idNumber: { type: SchemaType.STRING, description: "Número de DNI, CUIT o CUIL extraído" },
                expiryDate: { type: SchemaType.STRING, description: "Fecha de vencimiento en formato YYYY-MM-DD. Si no tiene vencimiento, omitir o dejar vacío." }
            },
            required: ["documentType", "name", "idNumber"]
        };

        const imagePart = {
            inlineData: {
                data: base64Data,
                mimeType
            },
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
                    systemInstruction: "Eres un experto en lectura OCR de documentos laborales, pólizas y documentos de identidad. Extraes información precisa ignorando ruido visual. Siempre respondes con fechas en YYYY-MM-DD y números de ID limpios.",
                    generationConfig: {
                        responseMimeType: "application/json",
                        responseSchema: responseSchema
                    }
                });

                const fetchPromise = model.generateContent([prompt, imagePart]);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout local de 25s')), 25000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (error) {
                lastError = error;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({ error: 'Todos los modelos de IA fallaron', details: lastError?.message });
        }

        const parsedData = JSON.parse(result.response.text());
        return res.status(200).json(parsedData);

    } catch (error) {
        console.error("Error analyzing contractor doc:", error.message);
        return res.status(500).json({ error: 'Error analizando el documento', details: error.message });
    }
}
