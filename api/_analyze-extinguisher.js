import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

export default async function handler(req, res) {
    // 🔐 Enable secure CORS configuration
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
            try { body = JSON.parse(body); } catch (_) {}
        }

        const image = body?.image;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const MAX_BASE64_SIZE = 12 * 1024 * 1024;
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const mimeType = image.includes(';') ? (image.split(';')[0].split(':')[1] || 'image/jpeg') : 'image/jpeg';

        const prompt = `Actúa como un inspector estricto y certificado de extintores y protección contra incendios. Analiza detalladamente la imagen de este extintor (matafuegos) e inspecciona sus componentes críticos.
REGLAS:
1. Si NO hay un extintor visible en la imagen, establece "extinguisherDetected" en false y completa los campos con valores por defecto/null.
2. Si HAY un extintor:
   - "extinguisherDetected": true
   - "type": Tipo de extintor ("ABC", "CO2", "Agua", "Espuma", "K").
   - "capacity": Capacidad indicada en la etiqueta o cilindro (ej. "5 kg", "10 kg", "2.5 kg"). Si no se lee, null.
   - "confidenceScore": Nivel de certeza de 0 a 100.
   - "status": "vigente" o "vencido" según la etiqueta y fechas.
   - "lastCheck": Fecha del último control/recarga en YYYY-MM-DD o null si ilegible.
   - "nextCheck": Fecha de próximo vencimiento/recarga en YYYY-MM-DD o null si ilegible.
   - "phDate": Fecha de prueba hidráulica (PH) en YYYY-MM-DD o null si ilegible.
   - "expirationDate": Fecha de vencimiento general en YYYY-MM-DD o null si ilegible.
   - "manometerStatus": Inspecciona la aguja del manómetro de presión:
       * "zona_verde" si la aguja está en el cuadrante verde central (operativo/presión correcta).
       * "descargado" si la aguja está a la izquierda / sector de despresurización o recarga.
       * "sobrepresionado" si la aguja está a la derecha / sobrepresión.
       * "no_aplica" si el extintor no posee manómetro (ej. CO2) o no es visible.
   - "manometerMessage": Breve explicación técnica del estado del manómetro y la presión observada.
   - "sealStatus": Estado del precinto plástico/metálico de seguridad: "intacto", "dañado", o "ausente".
   - "pinStatus": Pasador o chaveta de seguridad: "presente" o "ausente".
   - "hoseStatus": Estado de la manguera y tobera: "bueno", "grietas", u "obstruido".
   - "recommendations": Array con 2 a 4 recomendaciones prioritarias de seguridad preventiva para este extintor.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                extinguisherDetected: { type: SchemaType.BOOLEAN },
                type: { type: SchemaType.STRING },
                confidenceScore: { type: SchemaType.NUMBER },
                capacity: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING },
                lastCheck: { type: SchemaType.STRING },
                nextCheck: { type: SchemaType.STRING },
                phDate: { type: SchemaType.STRING },
                expirationDate: { type: SchemaType.STRING },
                manometerStatus: { type: SchemaType.STRING },
                manometerMessage: { type: SchemaType.STRING },
                sealStatus: { type: SchemaType.STRING },
                pinStatus: { type: SchemaType.STRING },
                hoseStatus: { type: SchemaType.STRING },
                recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["extinguisherDetected", "type", "confidenceScore", "capacity", "status", "manometerStatus", "manometerMessage", "sealStatus", "recommendations"]
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

        if (!result) throw new Error(lastError?.message || 'Modelos de IA fallaron');

        const responseText = result.response.text();
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/```json/, '').replace(/```$/, '').trim();
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/```/, '').replace(/```$/, '').trim();
        }

        let parsedData;
        try {
            parsedData = JSON.parse(cleanedJson);
        } catch (_) {
            const firstBrace = cleanedJson.indexOf('{');
            const lastBrace = cleanedJson.lastIndexOf('}');
            if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
                parsedData = JSON.parse(cleanedJson.substring(firstBrace, lastBrace + 1));
            } else {
                throw new Error('Respuesta JSON inválida de la IA');
            }
        }

        // Retrocompatibilidad con componentes que lean confidence en lugar de confidenceScore
        if (parsedData.confidenceScore && !parsedData.confidence) {
            parsedData.confidence = parsedData.confidenceScore;
        }

        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error analyzing extinguisher:", error);
        return res.status(500).json({ error: 'Error analizando la imagen', details: error.message });
    }
}
