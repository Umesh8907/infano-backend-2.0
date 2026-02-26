import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProgress, QuestProgress } from './user-progress.schema';
import { Quest } from '../quests/quest.schema';
import { Journey } from '../journeys/journey.schema';
import { BadgeService } from './badge.service';

@Injectable()
export class UserProgressService {
    constructor(
        @InjectModel(UserProgress.name) private progressModel: Model<UserProgress>,
        @InjectModel(Quest.name) private questModel: Model<Quest>,
        @InjectModel(Journey.name) private journeyModel: Model<Journey>,
        private readonly badgeService: BadgeService,
    ) { }

    async getProgress(userId: string, journeyIdOrSlug: string) {
        let journeyId = journeyIdOrSlug;

        if (!Types.ObjectId.isValid(journeyIdOrSlug)) {
            const journey = await this.journeyModel.findOne({ slug: journeyIdOrSlug }).exec();
            if (!journey) throw new NotFoundException('Journey not found');
            journeyId = (journey._id as any).toString();
        }

        let progress = await this.progressModel.findOne({
            userId: new Types.ObjectId(userId),
            journeyId: new Types.ObjectId(journeyId),
        }).exec();

        if (!progress) {
            progress = await this.progressModel.create({
                userId: new Types.ObjectId(userId),
                journeyId: new Types.ObjectId(journeyId),
                questProgress: [],
                totalXp: 0,
            });
        }
        return progress;
    }

    async completeQuestItem(userId: string, journeyIdOrSlug: string, questIdOrSlug: string, itemId: string) {
        // 1. Resolve Quest ID
        let questId = questIdOrSlug;
        let quest: any;

        if (Types.ObjectId.isValid(questIdOrSlug)) {
            quest = await this.questModel.findById(questIdOrSlug).exec();
        } else {
            quest = await this.questModel.findOne({ slug: questIdOrSlug }).exec();
            if (quest) questId = (quest._id as any).toString();
        }
        if (!quest) throw new NotFoundException('Quest not found');

        // 2. Resolve or Create Progress (handles journeyId slug resolution internally)
        const progress = await this.getProgress(userId, journeyIdOrSlug);
        const resolvedJourneyId = (progress.journeyId as any).toString();

        const itemIndex = quest.items.findIndex(item => (item as any)._id.toString() === itemId);
        if (itemIndex === -1) throw new NotFoundException('Quest item not found');

        // 3. Find or create progress for this specific quest
        let qProgress = progress.questProgress.find(qp => qp.questId.toString() === questId);
        if (!qProgress) {
            qProgress = { questId: new Types.ObjectId(questId), completedItems: [], isCompleted: false };
            progress.questProgress.push(qProgress);
        }

        // 1. Check if already completed
        const itemObjectId = new Types.ObjectId(itemId);
        if (qProgress.completedItems.some(ci => ci.itemId.equals(itemObjectId))) {
            return progress; // Already done
        }

        // 2. Enforce Order: Check if previous items in this quest are completed
        if (itemIndex > 0) {
            for (let i = 0; i < itemIndex; i++) {
                const prevItemId = (quest.items[i] as any)._id;
                if (!qProgress.completedItems.some(ci => ci.itemId.equals(prevItemId))) {
                    throw new BadRequestException(`Must complete previous item: ${quest.items[i].title}`);
                }
            }
        }

        // 3. Mark as completed and Award XP
        qProgress.completedItems.push({
            itemId: itemObjectId,
            isCompleted: true,
            completedAt: new Date()
        });

        progress.totalXp += quest.items[itemIndex].xpReward;
        progress.lastAccessedAt = new Date();

        // 4. Check if quest is fully completed
        if (qProgress.completedItems.length === quest.items.length) {
            qProgress.isCompleted = true;
        }

        // 5. Check if journey is fully completed
        const totalQuestsInJourney = await this.questModel.countDocuments({ journeyId: progress.journeyId, isActive: true });
        const completedQuestsCount = progress.questProgress.filter(qp => qp.isCompleted).length;
        if (completedQuestsCount >= totalQuestsInJourney) {
            progress.isJourneyCompleted = true;
        }

        // 6. Check for new badges
        await this.badgeService.checkAndAwardBadges(userId, resolvedJourneyId, progress);

        // Since it's a nested array, we need to tell Mongoose it modified
        progress.markModified('questProgress');
        return await progress.save();
    }
}
