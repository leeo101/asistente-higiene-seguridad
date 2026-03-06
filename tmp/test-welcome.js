async function testWelcome() {
    try {
        const response = await fetch('http://localhost:3001/api/welcome-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'enzorodriguez31@gmail.com',
                name: 'Enzo Rodriguez'
            })
        });
        const data = await response.json();
        console.log('Response:', data);
    } catch (err) {
        console.error('Test failed:', err.message);
    }
}

testWelcome();
