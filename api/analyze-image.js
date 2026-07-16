import { GoogleGenerativeAI } from '@google/generative-ai';
import { verifyToken, setCorsHeaders } from './_verifyToken.js';

// Vercel Serverless Function for AI Image Analysis
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

    // 🔐 Firebase Auth verification
    const user = await verifyToken(req, res);
    if (!user) return;

    try {

        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        // Validate image payload size (max ~3.5MB in base64 = ~2.6MB actual)
        const MAX_BASE64_SIZE = 3.5 * 1024 * 1024; // 3.5 MB
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido (3.5MB).' });
        }

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

        const prompt = `Analiza detalladamente esta imagen de un trabajador o entorno laboral. 
Tu tarea es verificar el uso de Elementos de Protección Personal (EPP) y detectar riesgos.
OBLIGATORIAMENTE todo el texto generado debe estar en ESPAÑOL. No uses palabras en inglés. Usa estrictamente términos en español: "Casco de seguridad", "Guantes", etc.
Devuelve ÚNICAMENTE un objeto JSON estricto, sin texto adicional, con el siguiente formato exacto:
{
    "personDetected": true/false,
    "helmetUsed": true/false,
    "shoesUsed": true/false,
    "glovesUsed": true/false,
    "clothingUsed": true/false,
    "ppeComplete": true/false,
    "riskLevel": "Bajo, Medio, Alto, o Crítico",
    "applicableLegislation": ["Ley 19587", "Dec 351/79", ...],
    "immediateAction": "Acción inmediata prioritaria a tomar en las próximas 24 horas",
    "foundRisks": ["Descripción del riesgo 1", "Riesgo 2"],
    "detections": [
        {"label": "Casco de seguridad", "severity": "Bajo/Medio/Alto/Crítico", "box_2d": [ymin, xmin, ymax, xmax]},
        {"label": "Riesgo: [Nombre en español]", "severity": "Bajo/Medio/Alto/Crítico", "box_2d": [ymin, xmin, ymax, xmax]}
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
            "gemini-2.5-flash",
            "gemini-flash-latest"
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
                    safetySettings,
                    systemInstruction: "Eres un experto prevencionista de riesgos laborales. Analiza las imágenes para detectar uso de EPP y riesgos. Identifica cajas delimitadoras [ymin, xmin, ymax, xmax] de 0 a 1000. OBLIGATORIAMENTE todas las etiquetas, riesgos y textos deben estar en ESPAÑOL. Jamás uses inglés. OBLIGATORIAMENTE evalúa el nivel de riesgo global (riskLevel) y provee SIEMPRE legislación aplicable en Argentina (Ley 19.587, Dec 351/79, Resoluciones SRT) en el array 'applicableLegislation'. Define una acción inmediata (immediateAction)."
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
