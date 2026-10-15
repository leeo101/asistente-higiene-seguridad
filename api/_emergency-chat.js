import { GoogleGenerativeAI } from '@google/generative-ai';
import { setCorsHeaders } from './_verifyToken.js';

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

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON inválido' }); }
        }

        const { message, context = 'general', companyContext = '' } = body || {};
        if (!message) return res.status(400).json({ error: 'Mensaje requerido' });

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-flash-latest",
            "gemini-3.5-flash",
            "gemini-3.8-flash",
            "gemini-pro-latest"
        ];

        const prompt = `Emergencia reportada por el usuario: "${message}".
Tipo/Contexto: "${context}".
Empresa/Ubicación: "${companyContext}".
Instrucciones estrictas:
- Actúa inmediatamente indicando si se debe llamar a Bomberos (100), SAME/Ambulancia (107) o Policía (911).
- Proporciona pasos de primeros auxilios y evacuación breves, ordenados con viñetas numéricas ("1.", "2.", "3.").
- Sé extremadamente claro, sereno y directo. No agregues introducciones largas.`;

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un Asistente de Emergencias Críticas EHS para establecimientos laborales y fábricas en Argentina. Tu prioridad absoluta es salvar vidas, ordenar la evacuación segura y coordinar la respuesta médica inicial.",
                });

                const fetchPromise = model.generateContent(prompt);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Timeout de 20s')), 20000)
                );

                result = await Promise.race([fetchPromise, timeoutPromise]);
                if (result) break;
            } catch (err) {
                lastError = err;
                continue;
            }
        }

        if (!result) {
            return res.status(500).json({ error: 'Todos los modelos de emergencia fallaron', details: lastError?.message });
        }

        const text = result.response.text();
        return res.status(200).json({ response: text });

    } catch (error) {
        console.error("Error in Emergency Chat:", error.message);
        return res.status(500).json({ error: 'Error procesando respuesta de emergencia', details: error.message });
    }
}
