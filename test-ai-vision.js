import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function testVision() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Falta GEMINI_API_KEY en .env");
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const models = [
        "gemini-1.5-pro",
        "gemini-1.5-flash"
    ];

    // Tiny 1x1 black pixel image base64
    const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
    const imagePart = {
        inlineData: {
            data: base64Data,
            mimeType: "image/png"
        },
    };

    console.log("--- TEST DE VISION AI (ESM) ---");
    let success = false;

    for (const modelName of models) {
        try {
            process.stdout.write(`Probando ${modelName} con imagen... `);
            const model = genAI.getGenerativeModel({ model: modelName });

            const result = await model.generateContent("Describe brevemente qué ves en esta imagen. Responde solo 'TEST OK' si puedes procesar la imagen.");
            const responseText = result.response.text();

            console.log("ÉXITO ✅");
            console.log("Respuesta:", responseText);
            success = true;
            break;
        } catch (error) {
            console.log(`FALLÓ ❌`);
            import('fs').then(fs => fs.writeFileSync('error.json', JSON.stringify({
                message: error.message,
                status: error.status,
                statusText: error.statusText,
                response: error.response
            }, null, 2)));
        }
    }

    if (success) {
        console.log("\n✅ La visión de la IA está activa.");
    } else {
        console.error("\n❌ ERROR CRÍTICO: Ningún modelo pudo procesar la imagen.");
    }
}

testVision();
