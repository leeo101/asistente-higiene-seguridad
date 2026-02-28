import fetch from 'node-fetch';
import fs from 'fs';

async function testRender() {
    console.log("--- TEST DE PRODUCCIÓN: RENDER ---");

    // Tiny 1x1 black pixel image base64
    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    try {
        const response = await fetch('https://asistente-higiene-seguridad.onrender.com/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image })
        });

        const data = await response.json();
        console.log("Status:", response.status);
        console.log("Response:", JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testRender();
