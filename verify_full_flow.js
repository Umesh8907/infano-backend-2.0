const axios = require('axios');

async function verifyFullFlow() {
    const BASE_URL = 'http://localhost:3000/api';
    const TEST_PHONE = '1234567890';

    try {
        console.log(`1. Requesting OTP for ${TEST_PHONE}...`);
        const requestRes = await axios.post(`${BASE_URL}/auth/request-otp`, {
            phone: TEST_PHONE
        });
        console.log(`- Request Status: ${requestRes.status} (${requestRes.data.message})`);

        console.log(`\n2. Verifying OTP for ${TEST_PHONE}...`);
        const verifyRes = await axios.post(`${BASE_URL}/verify-otp`, { // Wait, the controller path is auth/verify-otp
            phone: TEST_PHONE,
            otp: '1234'
        }).catch(err => {
            // Try /auth/verify-otp if /verify-otp fails (just in case of prefix issues)
            return axios.post(`${BASE_URL}/auth/verify-otp`, {
                phone: TEST_PHONE,
                otp: '1234'
            });
        });

        const token = verifyRes.data.accessToken;
        console.log(`- Token Received: ${token ? 'Yes' : 'No'}`);

        if (token) {
            console.log(`\n3. Accessing /journeys with token...`);
            const journeyRes = await axios.get(`${BASE_URL}/journeys`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            console.log(`- Journeys Status: ${journeyRes.status}`);
            console.log(`- Data received: ${Array.isArray(journeyRes.data) ? journeyRes.data.length : 'Object'} items`);

            if (journeyRes.status === 200) {
                console.log('\nSUCCESS: Full flow verified for test student.');
            } else {
                console.log('\nFAILED: Could not access journeys.');
            }
        }

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

verifyFullFlow();
