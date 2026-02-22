import { ApiProperty } from '@nestjs/swagger';
import { QuestItemType } from '../quest.schema';

export class CreateQuestItemDto {
    @ApiProperty({ enum: QuestItemType, example: QuestItemType.STORY_HOOK })
    type: QuestItemType;

    @ApiProperty({ example: 'The Adventure Begins', description: 'Title of the item' })
    title: string;

    @ApiProperty({ description: 'The actual content object' })
    content: any;

    @ApiProperty({ example: 0, description: 'Order within the quest' })
    order: number;

    @ApiProperty({ example: 10, description: 'XP Reward' })
    xpReward: number;
}

export class CreateQuestDto {
    @ApiProperty({ example: '65d6...', description: 'ID of the Journey this quest belongs to' })
    journeyId: string;

    @ApiProperty({ example: 'The First Discovery', description: 'Title of the quest' })
    title: string;

    @ApiProperty({ example: 'A mysterious start to your journey', description: 'Description' })
    description?: string;

    @ApiProperty({ type: [CreateQuestItemDto], description: 'Sequential list of items' })
    items: CreateQuestItemDto[];

    @ApiProperty({ example: 1, description: 'Order in the journey' })
    order: number;
}
