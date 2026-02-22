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
        const isValid = await this.smsProvider.verifyOtp(phone, otp);
        if (!isValid) {
            throw new UnauthorizedException('Invalid or expired OTP');
        }

        const user = await this.userModel.findOne({ phone });
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
            },
        };
    }
}
