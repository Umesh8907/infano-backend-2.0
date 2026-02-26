import { ApiProperty } from '@nestjs/swagger';

export class SubmitReflectionDto {
    @ApiProperty({ example: '65d6...', description: 'ID of the Quest' })
    questId: string;

    @ApiProperty({ example: 'item_123', description: 'ID of the quest item' })
    itemId: string;

    @ApiProperty({ example: 'Today I learned that...', description: 'Student response' })
    response: string;
}
