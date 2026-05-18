import dotenv from 'dotenv';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

dotenv.config();

async function run() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("GEMINI_API_KEY is missing in env");
        process.exit(1);
    }
    
    console.log("Found API Key ending in:", apiKey.slice(-4));
    const genAI = new GoogleGenerativeAI(apiKey);
    
    const responseSchema = {
        type: SchemaType.OBJECT,
        properties: {
            personDetected: { type: SchemaType.BOOLEAN },
            generalAssessment: { type: SchemaType.STRING },
            foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            recommendations: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } },
            detections: {
                type: SchemaType.ARRAY,
                items: {
                    type: SchemaType.OBJECT,
                    properties: {
                        label: { type: SchemaType.STRING },
                        box_2d: { type: SchemaType.ARRAY, items: { type: SchemaType.NUMBER } }
                    },
                    required: ["label", "box_2d"]
                }
            }
        },
        required: ["personDetected", "generalAssessment", "foundRisks", "recommendations", "detections"]
    };

    // Use a small 1x1 white pixel base64 jpeg
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const mimeType = "image/png";
    const imagePart = { inlineData: { data: base64Data, mimeType } };
    
    const prompt = `Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales.`;
    
    const models = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-1.5-pro"
    ];

    for (const modelName of models) {
        try {
            console.log(`\n--- Testing model: ${modelName} ---`);
            const model = genAI.getGenerativeModel({ 
                model: modelName,
                systemInstruction: "Detector maestro de riesgos. Encuentra condiciones subestándar. Entrega recuadros de detección normalizados de 0 a 1000 en format [ymin, xmin, ymax, xmax].",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });
            
            const result = await model.generateContent([prompt, imagePart]);
            console.log("SUCCESS! Result text:", result.response.text());
            break;
        } catch (error) {
            console.error(`FAILED for ${modelName}:`, error.message);
        }
    }
}

run();
