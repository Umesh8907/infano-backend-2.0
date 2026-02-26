import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { QuestsService } from './quests.service';
import { QuestsController } from './quests.controller';
import { Quest, QuestSchema } from './quest.schema';
import { Journey, JourneySchema } from '../journeys/journey.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Quest.name, schema: QuestSchema },
            { name: Journey.name, schema: JourneySchema }
        ]),
    ],
    controllers: [QuestsController],
    providers: [QuestsService],
    exports: [QuestsService],
})
export class QuestsModule { }
