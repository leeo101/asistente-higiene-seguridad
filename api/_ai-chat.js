import { GoogleGenerativeAI } from '@google/generative-ai';
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

    // 🔐 Verificación de token obligatoria para proteger cuota de IA
    const user = await verifyToken(req, res);
    if (!user) return;

    try {
        let body = req.body;
        if (typeof body === 'string') {
            try { body = JSON.parse(body); } catch { return res.status(400).json({ error: 'JSON inválido' }); }
        }

        const { message, messages, systemInstruction } = body || {};

        let prompt = '';
        if (message && typeof message === 'string') {
            prompt = message;
        } else if (Array.isArray(messages) && messages.length > 0) {
            prompt = messages.map(m => `${m.role === 'system' ? 'INSTRUCCIÓN' : m.role === 'user' ? 'USUARIO' : 'ASISTENTE'}: ${m.content}`).join('\n\n');
        } else {
            return res.status(400).json({ error: 'Falta el mensaje o lista de mensajes' });
        }

        if (prompt.length > 8000) {
            return res.status(400).json({ error: 'El mensaje excede el límite máximo de 8.000 caracteres.' });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta la API Key de Gemini' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.5-flash",
            "gemini-2.0-flash",
            "gemini-flash-latest"
        ];

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: systemInstruction || "Eres un Asistente Senior especializado en Higiene, Seguridad Laboral y Prevención de Riesgos en Argentina. Proporciona respuestas claras, técnicas y fundamentadas.",
                });

                const fetchPromise = model.generateContent(prompt);
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
            const fallbackReply = `📌 **Asesoría Técnica H&S (Ley 19.587 / Dec. 351/79):**\n\nPara abordar tu consulta de forma segura en campo:\n1. **Evaluación Previa:** Realizá el Análisis de Trabajo Seguro (ATS) identificando peligros mecánicos, eléctricos, locativos y ergonómicos antes de iniciar.\n2. **Medidas de Control:** Aplicá bloqueo de energías (LOTO) cuando corresponda, delimitá el sector y verificá extintor vigente en el área.\n3. **Protección Personal:** Asegurá el uso de EPP certificado (casco, calzado de seguridad, protección ocular y guantes específicos según Res. SRT 299/11).\n4. **Registro Documental:** Dejá constancia firmada de la inspección o permiso de trabajo en el módulo correspondiente de la plataforma.`;
            return res.status(200).json({
                response: fallbackReply,
                content: fallbackReply,
                text: fallbackReply
            });
        }

        const responseText = result.response.text();

        // Si la respuesta es JSON, enviarlo parseado; de lo contrario en campo response y text
        let jsonPayload = null;
        try {
            let cleaned = responseText.trim().replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
            jsonPayload = JSON.parse(cleaned);
        } catch {
            const startIdx = responseText.indexOf('{');
            const endIdx = responseText.lastIndexOf('}');
            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                try { jsonPayload = JSON.parse(responseText.substring(startIdx, endIdx + 1)); } catch {}
            }
        }

        if (jsonPayload && typeof jsonPayload === 'object') {
            return res.status(200).json({
                response: responseText,
                content: responseText,
                text: responseText,
                ...jsonPayload
            });
        }

        return res.status(200).json({
            response: responseText,
            content: responseText,
            text: responseText
        });

    } catch (error) {
        console.error("Error in AI Chat:", error.message);
        return res.status(500).json({ error: 'Error procesando la consulta de IA', details: error.message });
    }
}
