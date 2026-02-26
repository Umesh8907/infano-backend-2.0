const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    fullName: String,
    phone: { type: String, unique: true },
    email: String,
    role: { type: String, default: 'student' },
    isDashboardActive: { type: Boolean, default: true },
    isOnboarded: { type: Boolean, default: false },
    selectedInterests: [String],
}, { timestamps: true });

async function seedUser() {
    try {
        await mongoose.connect('mongodb://localhost:27017/infano');
        console.log('Connected to MongoDB');

        const UserModel = mongoose.model('User', UserSchema);

        // Check if user exists
        const existing = await UserModel.findOne({ phone: '1234567891' });
        if (existing) {
            console.log('User with phone 1234567891 already exists. Resetting status...');
            existing.isOnboarded = false;
            existing.selectedInterests = [];
            await existing.save();
        } else {
            await UserModel.create({
                fullName: 'Test User',
                phone: '1234567891',
                email: 'test.1234567891@example.com',
                role: 'student',
                isDashboardActive: true,
                isOnboarded: false
            });
            console.log('Created new test user: 1234567891');
        }

        process.exit(0);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    }
}

seedUser();
