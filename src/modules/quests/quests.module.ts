import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { Quest, QuestSchema } from './quest.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Quest.name, schema: QuestSchema }]),
    ],
    controllers: [QuestsController],
    providers: [QuestsService],
    exports: [QuestsService],
})
export class QuestsModule { }
