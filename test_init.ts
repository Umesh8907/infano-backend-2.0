import Razorpay from 'razorpay';

async function test() {
    try {
        console.log('Testing Razorpay initialization...');
        const r = new Razorpay({
            key_id: 'test_id',
            key_secret: 'test_secret',
        });
        console.log('Razorpay initialized successfully');
        console.log('Razorpay instance methods:', Object.keys(r));
    } catch (error) {
        console.error('Razorpay initialization failed:', error);
    }
}

test();
