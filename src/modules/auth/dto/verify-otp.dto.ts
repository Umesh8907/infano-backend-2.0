import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
    @ApiProperty({
        example: '919876543210',
        description: 'User phone number',
    })
    phone: string;

    @ApiProperty({
        example: '123456',
        description: '6-digit OTP received on phone',
    })
    otp: string;
}
