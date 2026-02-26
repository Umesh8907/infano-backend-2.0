import { ApiProperty } from '@nestjs/swagger';

export class CreateJourneyDto {
    @ApiProperty({ example: 'The Magic Garden', description: 'Title of the journey' })
    title: string;

    @ApiProperty({ example: 'Explore the wonders of biology', description: 'Description' })
    description?: string;

    @ApiProperty({ example: 'https://example.com/banner.jpg', description: 'Banner image URL' })
    bannerImage?: string;
}
