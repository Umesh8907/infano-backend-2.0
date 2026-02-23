const axios = require('axios');
const crypto = require('crypto');

async function testFulfillment() {
    const BASE_URL = 'http://localhost:3000/api';
    const WEBHOOK_SECRET = 'test-secret'; // Matches my fallback in configuration.ts

    try {
        console.log('1. Creating Purchase Order...');
        const purchaseRes = await axios.post(`${BASE_URL}/orders/purchase`, {
            fullName: 'Automation Test',
            phone: '8888811111',
            email: 'automation@test.com',
            address: '123 Automation Lane'
        });

        const razorpayOrderId = purchaseRes.data.order.id;
        console.log(`- Order Created: ${razorpayOrderId}`);

        console.log('\n2. Simulating Razorpay Webhook (payment.captured)...');
        const payload = JSON.stringify({
            event: 'payment.captured',
            payload: {
                payment: {
                    entity: {
                        id: 'pay_test_' + Date.now(),
                        order_id: razorpayOrderId
                    }
                }
            }
        });

        const signature = crypto
            .createHmac('sha256', WEBHOOK_SECRET)
            .update(payload)
            .digest('hex');

        const webhookRes = await axios.post(`${BASE_URL}/webhooks/razorpay`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'x-razorpay-signature': signature
            }
        });

        console.log(`- Webhook Status: ${webhookRes.status} (${webhookRes.data.status})`);
        console.log('\nSUCCESS: Fulfillment logic executed without 500 errors.');

    } catch (err) {
        console.error('Test Failed:', err.response?.data || err.message);
    }
}

testFulfillment();
