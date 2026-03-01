import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Falta GEMINI_API_KEY");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // The SDK doesn't have a direct listModels yet in all versions, 
        // but we can try to fetch from the API directly or use a dummy request
        console.log("Checking API Key with a basic prompt...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hola");
        console.log("Respuesta:", result.response.text());
        console.log("API Key parece válida para gemini-pro");
    } catch (error) {
        console.error("Error:", error.message);
        if (error.response) {
            console.error("Detalles:", await error.response.json());
        }
    }
}

listModels();
