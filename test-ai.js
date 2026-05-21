import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing Gemini API for Riesgo IA...");
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
    console.error("Missing GEMINI_API_KEY in env");
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

// A simple small 1x1 white transparent base64 GIF as test image
const testBase64 = "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"; 
const imagePart = {
    inlineData: {
        data: testBase64,
        mimeType: "image/gif"
    }
};

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

const models = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-flash-latest",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest"
];

async function runTest() {
    for (const modelName of models) {
        try {
            console.log(`\n--- Testing model: ${modelName} ---`);
            const model = genAI.getGenerativeModel({
                model: modelName,
                systemInstruction: "Detector maestro de riesgos. Encuentra condiciones subestándar. Entrega recuadros de detección normalizados de 0 a 1000 en formato [ymin, xmin, ymax, xmax] alrededor de los riesgos graves.",
                generationConfig: {
                    responseMimeType: "application/json",
                    responseSchema: responseSchema
                }
            });

            console.log("Sending generateContent request...");
            const result = await model.generateContent([
                "Analiza detalladamente esta imagen de un entorno laboral para detección general de evidentes riesgos laborales.",
                imagePart
            ]);

            console.log("SUCCESS! Result text:");
            console.log(result.response.text());
        } catch (error) {
            console.error(`FAILED for ${modelName}:`, error.message);
        }
    }
}

runTest();
