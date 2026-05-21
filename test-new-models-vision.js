import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing gemini-2.5-flash with vision and structured output...");
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

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
        foundRisks: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
    },
    required: ["personDetected", "generalAssessment", "foundRisks"]
};

async function run() {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: responseSchema
            }
        });
        const result = await model.generateContent([
            "Analiza si hay riesgos en la imagen.",
            imagePart
        ]);
        console.log("SUCCESS!");
        console.log(result.response.text());
    } catch (err) {
        console.log("FAILED:", err.message);
    }
}

run();
