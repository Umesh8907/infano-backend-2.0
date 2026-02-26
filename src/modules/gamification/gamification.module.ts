import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserProgress, UserProgressSchema } from './user-progress.schema';
import { UserProgressService } from './user-progress.service';
import { GamificationController } from './gamification.controller';
import { Quest, QuestSchema } from '../quests/quest.schema';
import { Badge, BadgeSchema } from './badge.schema';
import { BadgeService } from './badge.service';
import { BadgesController } from './badges.controller';
import { Journey, JourneySchema } from '../journeys/journey.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: UserProgress.name, schema: UserProgressSchema },
            { name: Quest.name, schema: QuestSchema },
            { name: Badge.name, schema: BadgeSchema },
            { name: Journey.name, schema: JourneySchema },
        ]),
    ],
    controllers: [GamificationController, BadgesController],
    providers: [UserProgressService, BadgeService],
    exports: [UserProgressService, BadgeService],
})
export class GamificationModule { }
