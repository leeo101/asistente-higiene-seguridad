import fetch from 'node-fetch';

async function testEndpoint() {
    console.log('--- TEST DE INTEGRACIÓN: BACKEND LOCAL ---');
    console.log('Golpeando el endpoint local...');

    try {
        const response = await fetch('http://localhost:3001/api/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'leeo1010@live.com.ar' })
        });

        const data = await response.json();
        console.log('STATUS:', response.status);
        console.log('RESPONSE:', data);

        if (response.ok) {
            console.log('✅ TEST EXITOSO: El servidor envió el correo correctamente.');
        } else {
            console.error('❌ TEST FALLIDO:', data.error);
        }
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:', error.message);
    }
}

testEndpoint();
