import { ApiProperty } from '@nestjs/swagger';

export class RequestOtpDto {
    @ApiProperty({
        example: '919876543210',
        description: 'User phone number with country code',
    })
    phone: string;
}
