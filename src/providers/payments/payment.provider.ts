import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Razorpay from 'razorpay';
import * as crypto from 'crypto';

@Injectable()
export class PaymentProvider {
    private razorpay: any;

    constructor(private configService: ConfigService) {
        const keyId = this.configService.get<string>('payments.razorpayKeyId');
        const keySecret = this.configService.get<string>('payments.razorpayKeySecret');

        if (!keyId || !keySecret || keyId === '' || keySecret === '') {
            console.warn('Razorpay keys are missing. Payment features will not work.');
            return;
        }

        try {
            this.razorpay = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
        } catch (error) {
            console.error('Failed to initialize Razorpay:', error.message);
        }
    }

    async createOrder(amount: number, currency: string = 'INR', receipt: string): Promise<any> {
        const options = {
            amount: amount * 100, // Razorpay works in paise
            currency,
            receipt,
        };
        return await this.razorpay.orders.create(options);
    }

    verifySignature(razorpayOrderId: string, razorpayPaymentId: string, signature: string): boolean {
        const text = `${razorpayOrderId}|${razorpayPaymentId}`;
        const generatedSignature = crypto
            .createHmac('sha256', this.configService.get<string>('payments.razorpayKeySecret')!)
            .update(text)
            .digest('hex');
        return generatedSignature === signature;
    }
}
