import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class SmsProvider {
    private readonly apiKey: string;
    private readonly baseUrl = 'https://2factor.in/API/V1';

    constructor(private configService: ConfigService) {
        this.apiKey = this.configService.get<string>('sms.apiKey')!;
    }

    async sendOtp(phone: string, otp: string): Promise<boolean> {
        try {
            // Using the pattern: https://2factor.in/API/V1/{api_key}/SMS/{phone}/{otp}/InfanoOTPMessage
            const url = `${this.baseUrl}/${this.apiKey}/SMS/${phone}/${otp}/InfanoOTPMessage`;
            const response = await axios.get(url);
            return response.data.Status === 'Success';
        } catch (error) {
            throw new InternalServerErrorException(error.message);
        }
    }

    async verifyOtp(phone: string, otp: string): Promise<boolean> {
        try {
            // Using the pattern: https://2factor.in/API/V1/{api_key}/SMS/VERIFY3/{phone}/{otp}
            const url = `${this.baseUrl}/${this.apiKey}/SMS/VERIFY3/${phone}/${otp}`;
            const response = await axios.get(url);
            return response.data.Status === 'Success' && response.data.Details === 'OTP Matched';
        } catch (error) {
            return false;
        }
    }
}
