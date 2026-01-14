import fetch from 'node-fetch';

const API_URL = 'http://localhost:3002/api/auth/login';

async function testLoginFailed() {
    console.log('🧪 Testing Login Fail Scenario...');
    console.log(`Endpoint: ${API_URL}`);

    // DTO with wrong password
    const credentials = {
        personalId: 'BD6111', // A valid ID from our previous interactions
        password: 'wrong_password_123'
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        console.log(`\nStatus Code: ${response.status}`);

        const data = await response.json();
        console.log('Response Body:', data);

        if (response.status === 401 && data.error === 'Invalid credentials') {
            console.log('\n✅ TEST PASSED: Backend correctly rejected invalid credentials.');
        } else {
            console.log('\n❌ TEST FAILED: Unexpected response.');
        }

    } catch (error) {
        console.error('Error running test:', error);
    }
}

testLoginFailed();
