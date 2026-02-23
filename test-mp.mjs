import fetch from 'node-fetch';

async function testSubscription() {
    try {
        console.log("Testing POST to http://localhost:3001/api/create-subscription...");
        const response = await fetch('http://localhost:3001/api/create-subscription', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log("Status Code:", response.status);

        const data = await response.text();
        console.log("Response Body:", data);
    } catch (error) {
        console.error("Connection Error:", error);
    }
}

testSubscription();
