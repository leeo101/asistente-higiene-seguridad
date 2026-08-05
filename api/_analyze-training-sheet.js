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
        const { image } = req.body;
        if (!image) return res.status(400).json({ error: 'No se envió imagen' });

        const MAX_BASE64_SIZE = 15 * 1024 * 1024;
        if (image.length > MAX_BASE64_SIZE) {
            return res.status(413).json({ error: 'La imagen excede el tamaño máximo permitido (15MB).' });
        }


        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) return res.status(500).json({ error: 'Falta API Key de Gemini en el servidor' });

        const genAI = new GoogleGenerativeAI(apiKey);
        const models = [
            "gemini-2.0-flash",
            "gemini-1.5-flash",
            "gemini-1.5-pro",
            "gemini-2.5-flash",
            "gemini-flash-latest"
        ];

        const base64Data = image.includes(',') ? image.split(',')[1] : image;
        const mimeType = image.includes(';') ? image.split(';')[0].split(':')[1] : 'image/jpeg';

        const prompt = `Analiza detalladamente esta imagen de una planilla o acta de capacitación / asistencia de seguridad e higiene laboral.
REGLAS ESTRICTAS:
1. NO INVENTES NINGÚN DATO NI NOMBRE. Extrae estrictamente lo que se lee en la imagen. Si un dato no se lee con claridad, devuelve null o cadena vacía.
2. Si NO se detecta una planilla, acta o lista de asistencia a capacitación, establece "sheetDetected" en false.
3. Si HAY una planilla de capacitación visible: establece "sheetDetected" en true.
4. Extrae los datos generales del encabezado:
   - "tema": Título o tema principal de la capacitación (ej. "Uso de EPP", "Trabajo en Altura", "Prevención de Incendios").
   - "tipoCapacitacion": Categoría (ej. "Seguridad e Higiene", "Emergencias", "Ergonomía", "Medio Ambiente", "Salud Ocupacional", "Otros").
   - "fecha": Fecha en formato YYYY-MM-DD si es legible, o null.
   - "duracion": Duración en horas (ej. "1.5", "2.0", "1"), o null.
   - "expositor": Nombre del capacitador, expositor o instructor.
   - "empresa": Razón social o empresa.
   - "lugar": Sector, planta o ubicación.
   - "objetivo": Objetivo redactado en la planilla si existe.
5. Extrae la nómina completa de asistentes inscritos en la tabla/lista:
   - Para cada trabajador detectado:
     - "nombre": Nombre y apellido completo.
     - "dni": DNI o CUIT/CUIL sin puntos si es posible, o exactamente como figura.
     - "puesto": Puesto de trabajo, cargo o área.
     - "nota": Calificación/examen (ej. "10", "Aprobado", "9"), o null si no hay.
     - "firmado": boolean (true si se aprecia firma manuscrita, gancho o sello en la casilla correspondiente, false si está en blanco).
6. Responde SIEMPRE en formato JSON válido.`;

        const responseSchema = {
            type: SchemaType.OBJECT,
            properties: {
                sheetDetected: { type: SchemaType.BOOLEAN },
                confidence: { type: SchemaType.NUMBER },
                tema: { type: SchemaType.STRING },
                tipoCapacitacion: { type: SchemaType.STRING },
                fecha: { type: SchemaType.STRING },
                duracion: { type: SchemaType.STRING },
                expositor: { type: SchemaType.STRING },
                empresa: { type: SchemaType.STRING },
                lugar: { type: SchemaType.STRING },
                objetivo: { type: SchemaType.STRING },
                asistentes: {
                    type: SchemaType.ARRAY,
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            nombre: { type: SchemaType.STRING },
                            dni: { type: SchemaType.STRING },
                            puesto: { type: SchemaType.STRING },
                            nota: { type: SchemaType.STRING },
                            firmado: { type: SchemaType.BOOLEAN }
                        },
                        required: ["nombre", "dni"]
                    }
                },
                observaciones: { type: SchemaType.STRING }
            },
            required: ["sheetDetected", "asistentes"]
        };

        const imagePart = { inlineData: { data: base64Data, mimeType } };

        let result;
        let lastError;
        for (const modelName of models) {
            try {
                const model = genAI.getGenerativeModel({
                    model: modelName,
                    systemInstruction: "Eres un asistente experto en digitalización de planillas de seguridad e higiene laboral. Analizas imágenes de hojas físicas de capacitación y extraes sus datos a formato JSON estricto con máxima precisión.",
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

        if (!result) throw new Error(lastError?.message || 'Los modelos de IA no pudieron procesar la imagen.');

        const responseText = result.response.text();
        let cleanedJson = responseText.trim();
        if (cleanedJson.startsWith('```json')) {
            cleanedJson = cleanedJson.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (cleanedJson.startsWith('```')) {
            cleanedJson = cleanedJson.replace(/^```/, '').replace(/```$/, '').trim();
        }

        const parsedData = JSON.parse(cleanedJson);
        return res.status(200).json(parsedData);
    } catch (error) {
        console.error("Error analizando planilla de capacitación:", error);
        return res.status(500).json({ error: 'Error analizando la planilla', details: error.message });
    }
}
