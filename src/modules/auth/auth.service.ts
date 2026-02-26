import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/user.schema';
import { SmsProvider } from '../../providers/sms/sms.provider';

@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private jwtService: JwtService,
        private smsProvider: SmsProvider,
    ) { }

    async requestOtp(phone: string) {
        console.log(`requestOtp called for phone: [${phone}]`);
        const normalizedPhone = phone.replace(/\D/g, '');
        console.log(`normalizedPhone: [${normalizedPhone}]`);

        if (normalizedPhone === '1234567890' || normalizedPhone === '1234567891' || normalizedPhone === '911234567890') {
            try {
                // Use the original phone format for DB to stay consistent
                let user = await this.userModel.findOne({ phone });
                if (!user) {
                    user = await this.userModel.create({
                        phone,
                        fullName: 'Test Student',
                        role: 'student',
                        isDashboardActive: true,
                    });
                }
                return { message: 'OTP sent successfully (Test Mode)' };
            } catch (error) {
                console.error('Test student creation error:', error);
                throw new InternalServerErrorException(`Failed to create test student: ${error.message}`);
            }
        }

        const user = await this.userModel.findOne({ phone });
        if (!user) {
            throw new NotFoundException('User not found. Please purchase a kit or register first.');
        }

        // Generate a 4-6 digit random OTP (user example used randomNumber)
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        const success = await this.smsProvider.sendOtp(phone, otp);
        if (!success) {
            throw new InternalServerErrorException('Failed to send OTP');
        }

        return { message: 'OTP sent successfully' };
    }

    async verifyOtp(phone: string, otp: string) {
        let isValid = false;
        const normalizedPhone = phone.replace(/\D/g, '');
        if (normalizedPhone === '1234567890' || normalizedPhone === '1234567891' || normalizedPhone === '911234567890') {
            isValid = true;
        } else {
            isValid = await this.smsProvider.verifyOtp(phone, otp);
        }

        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        let user = await this.userModel.findOne({ phone });
        if (!user && (normalizedPhone === '1234567890' || normalizedPhone === '1234567891' || normalizedPhone === '911234567890')) {
            // Try searching by normalized phone if it's the test user
            user = await this.userModel.findOne({ phone: { $regex: '1234567890$|1234567891$' } });
        }

        if (!user) {
            throw new NotFoundException('User not found');
        }

        const payload = { sub: user._id, phone: user.phone, role: user.role };
        return {
            accessToken: this.jwtService.sign(payload),
            user: {
                id: user._id,
                fullName: user.fullName,
                phone: user.phone,
                role: user.role,
                isDashboardActive: user.isDashboardActive,
                isOnboarded: user.isOnboarded,
            },
        };
    }
}
