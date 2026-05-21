import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

console.log("Testing new Gemini models...");
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const models = [
    "gemini-2.5-flash",
    "gemini-2.0-flash-exp",
    "gemini-2.0-flash-lite",
    "gemini-2.0-pro-exp",
    "gemini-flash-latest"
];

async function run() {
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Hola");
            console.log(`  SUCCESS: ${result.response.text().trim().substring(0, 100)}`);
        } catch (err) {
            console.log(`  FAILED: ${err.message}`);
        }
    }
}

run();
