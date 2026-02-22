import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserProgress, QuestProgress } from './user-progress.schema';
import { Quest } from '../quests/quest.schema';
import { BadgeService } from './badge.service';

@Injectable()
export class UserProgressService {
    constructor(
        @InjectModel(UserProgress.name) private progressModel: Model<UserProgress>,
        @InjectModel(Quest.name) private questModel: Model<Quest>,
        private readonly badgeService: BadgeService,
    ) { }

    async getProgress(userId: string, journeyId: string) {
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

    async completeQuestItem(userId: string, journeyId: string, questId: string, itemId: string) {
        const quest = await this.questModel.findById(questId).exec();
        if (!quest) throw new NotFoundException('Quest not found');

        const itemIndex = quest.items.findIndex(item => (item as any)._id.toString() === itemId);
        if (itemIndex === -1) throw new NotFoundException('Quest item not found');

        const progress = await this.getProgress(userId, journeyId);

        // Find or create progress for this specific quest
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
        const totalQuestsInJourney = await this.questModel.countDocuments({ journeyId, isActive: true });
        const completedQuestsCount = progress.questProgress.filter(qp => qp.isCompleted).length;
        if (completedQuestsCount >= totalQuestsInJourney) {
            progress.isJourneyCompleted = true;
        }

        // 6. Check for new badges
        await this.badgeService.checkAndAwardBadges(userId, journeyId, progress);

        // Since it's a nested array, we need to tell Mongoose it modified
        progress.markModified('questProgress');
        return await progress.save();
    }
}
