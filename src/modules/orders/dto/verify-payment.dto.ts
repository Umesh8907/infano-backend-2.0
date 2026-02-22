import { ApiProperty } from '@nestjs/swagger';

export class VerifyPaymentDto {
    @ApiProperty({ example: 'order_SJItg3iiLWSseZ', description: 'Razorpay Order ID' })
    razorpay_order_id: string;

    @ApiProperty({ example: 'pay_SJItg3iiLWSseZ', description: 'Razorpay Payment ID' })
    razorpay_payment_id: string;

    @ApiProperty({ example: 'abc123signature...', description: 'Razorpay HMAC Signature' })
    razorpay_signature: string;
}
