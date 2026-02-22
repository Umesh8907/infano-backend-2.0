import { ApiProperty } from '@nestjs/swagger';

export class CreateJourneyDto {
    @ApiProperty({ example: 'The Magic Garden', description: 'Name of the journey' })
    name: string;

    @ApiProperty({ example: 'Explore the wonders of biology', description: 'Description' })
    description?: string;

    @ApiProperty({ example: 'https://example.com/banner.jpg', description: 'Banner image URL' })
    bannerImage?: string;
}
