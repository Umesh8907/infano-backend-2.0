export default () => ({
    port: parseInt(process.env.PORT || '3000', 10),
    database: {
        uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/infano',
    },
    auth: {
        jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
        jwtExpiration: process.env.JWT_EXPIRATION || '7d',
    },
    sms: {
        apiKey: process.env.TWO_FACTOR_API_KEY || '',
    },
    payments: {
        razorpayKeyId: process.env.RAZORPAY_KEY_ID || '',
        razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || '',
    },
});
