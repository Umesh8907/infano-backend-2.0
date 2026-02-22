import { ApiProperty } from '@nestjs/swagger';

export class ActivateKitDto {
    @ApiProperty({ example: 'INF-123-ABC', description: 'Activation code from the physical kit' })
    code: string;

    @ApiProperty({ example: 'John Doe', description: 'Full name' })
    fullName: string;

    @ApiProperty({ example: '919876543210', description: 'Phone number' })
    phone: string;

    @ApiProperty({ example: 'john@example.com', description: 'Email address', required: false })
    email?: string;

    @ApiProperty({ example: '123 Street, City, Country', description: 'Shipping address' })
    address: string;
}
