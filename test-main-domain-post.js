import fetch from 'node-fetch';

async function testMainDomain() {
    console.log("--- TEST DE PRODUCCIÓN: ASISTENTEHS.COM (POST) ---");

    const image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

    try {
        const response = await fetch('https://www.asistentehs.com/api/analyze-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image })
        });

        const contentType = response.headers.get("content-type");
        console.log("Status:", response.status);
        console.log("Content-Type:", contentType);

        const text = await response.text();
        try {
            const data = JSON.parse(text);
            console.log("Response JSON:", JSON.stringify(data, null, 2));
        } catch (e) {
            console.log("Response Text (Not JSON):", text.substring(0, 500));
        }
    } catch (err) {
        console.error("Fetch failed:", err.message);
    }
}

testMainDomain();
