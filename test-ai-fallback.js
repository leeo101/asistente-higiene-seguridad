import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testFallback() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Falta GEMINI_API_KEY en .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = [
        "gemini-2.0-flash",
        "gemini-1.5-flash-latest",
        "gemini-1.5-pro-latest",
        "gemini-1.5-flash",
        "models/gemini-1.5-flash",
        "gemini-flash-latest",
        "gemini-1.5-pro"
    ];

    console.log("--- TEST DE FALLBACK DE MODELOS AI (ESM) ---");
    let success = false;

    for (const modelName of models) {
        try {
            process.stdout.write(`Probando ${modelName}... `);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent("Hola, esto es un test de conectividad. Responde solo la palabra OK.");
            const responseText = result.response.text();

            console.log("ÉXITO ✅");
            console.log("Respuesta:", responseText);
            success = true;
            break;
        } catch (error) {
            console.log(`FALLÓ ❌ (${error.message})`);
        }
    }

    if (success) {
        console.log("\n✅ El sistema de fallback funciona correctamente.");
    } else {
        console.error("\n❌ ERROR CRÍTICO: Ningún modelo funcionó. Revisa la API Key.");
    }
}

testFallback();
