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

    async getLatestOverview(userId: string) {
        const progress = await this.progressModel
            .findOne({ userId: new Types.ObjectId(userId) })
            .sort({ lastAccessedAt: -1, updatedAt: -1, createdAt: -1 })
            .exec();

        if (!progress) {
            return null;
        }

        const journey = await this.journeyModel.findById(progress.journeyId).exec();
        if (!journey) {
            throw new NotFoundException('Journey not found for progress record');
        }

        const totalQuestsInJourney = await this.questModel.countDocuments({
            journeyId: progress.journeyId,
            isActive: true,
        });
        const completedQuestsCount = progress.questProgress.filter(qp => qp.isCompleted).length;

        return {
            journeyId: (journey._id as any).toString(),
            journeySlug: (journey as any).slug,
            journeyTitle: journey.title,
            journeyDescription: journey.description,
            thumbnailUrl: journey.thumbnailUrl,
            totalQuests: totalQuestsInJourney,
            completedQuests: completedQuestsCount,
            totalXp: progress.totalXp,
            isJourneyCompleted: progress.isJourneyCompleted,
        };
    }

    async completeQuestItem(userId: string, journeyIdOrSlug: string, questIdOrSlug: string, itemId: string, submissionData?: any, isCompleted: boolean = true) {
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
            qProgress = {
                questId: new Types.ObjectId(questId),
                completedItems: [],
                isCompleted: false,
                lastViewedItemId: new Types.ObjectId(itemId),
                lastViewedAt: new Date(),
            };
            progress.questProgress.push(qProgress);
        }

        // Track last viewed item for resume (even on completion)
        (qProgress as any).lastViewedItemId = new Types.ObjectId(itemId);
        (qProgress as any).lastViewedAt = new Date();

        // 1. Check if already completed
        const itemObjectId = new Types.ObjectId(itemId);
        const existingCompletion = qProgress!.completedItems.find(ci => ci.itemId.equals(itemObjectId));

        if (existingCompletion) {
            // Update submission data
            existingCompletion.submissionData = submissionData;
            existingCompletion.completedAt = new Date();
            // If transitioning from partial to full completion, handle XP
            if (isCompleted && !(existingCompletion as any).isCompleted) {
                (existingCompletion as any).isCompleted = true;
                progress.totalXp += quest.items[itemIndex].xpReward;
                progress.lastAccessedAt = new Date();
                const completedItemIds = new Set(
                    (qProgress!.completedItems as any[])
                        .filter(ci => ci.isCompleted === true)
                        .map(ci => ci.itemId.toString())
                );
                if (completedItemIds.size === quest.items.length) {
                    qProgress!.isCompleted = true;
                }
                const totalQuestsInJourney = await this.questModel.countDocuments({ journeyId: progress.journeyId, isActive: true });
                const completedQuestsCount = progress.questProgress.filter(qp => qp.isCompleted).length;
                if (completedQuestsCount >= totalQuestsInJourney) {
                    progress.isJourneyCompleted = true;
                }
                await this.badgeService.checkAndAwardBadges(userId, resolvedJourneyId, progress);
            }
            progress.markModified('questProgress');
            return await (progress as any).save();
        }

        // 2. Enforce Order: only for full completion
        if (isCompleted && itemIndex > 0) {
            for (let i = 0; i < itemIndex; i++) {
                const prevItemId = (quest.items[i] as any)._id;
                if (!qProgress!.completedItems.some(ci => ci.itemId.equals(prevItemId))) {
                    throw new BadRequestException(`Must complete previous item: ${quest.items[i].title}`);
                }
            }
        }

        // 3. Mark as completed (or partial) and conditionally Award XP
        if (!existingCompletion) {
            qProgress!.completedItems.push({
                itemId: itemObjectId,
                isCompleted: isCompleted,
                completedAt: new Date(),
                submissionData,
            });
        }

        // Only award XP and check for quest completion if marking fully completed
        if (isCompleted) {
            // If it was previously partial, mark it full now
            if (existingCompletion) {
                (existingCompletion as any).isCompleted = true;
            }

            progress.totalXp += quest.items[itemIndex].xpReward;
            progress.lastAccessedAt = new Date();

            // 4. Check if quest is fully completed
            // Count only unique quest items that have been fully completed (isCompleted: true)
            const completedItemIds = new Set(
                (qProgress!.completedItems as any[])
                    .filter(ci => ci.isCompleted === true)
                    .map(ci => ci.itemId.toString())
            );
            if (completedItemIds.size === quest.items.length) {
                qProgress!.isCompleted = true;
            }

            // 5. Check if journey is fully completed
            const totalQuestsInJourney = await this.questModel.countDocuments({ journeyId: progress.journeyId, isActive: true });
            const completedQuestsCount = progress.questProgress.filter(qp => qp.isCompleted).length;
            if (completedQuestsCount >= totalQuestsInJourney) {
                progress.isJourneyCompleted = true;
            }

            // 6. Check for new badges
            await this.badgeService.checkAndAwardBadges(userId, resolvedJourneyId, progress);
        } else {
            // If partial update, just update timestamp
            progress.lastAccessedAt = new Date();
        }

        // Since it's a nested array, we need to tell Mongoose it modified
        progress.markModified('questProgress');
        return await progress.save();
    }

    async setLastViewedItem(userId: string, journeyIdOrSlug: string, questIdOrSlug: string, itemId: string) {
        // Resolve quest
        let questId = questIdOrSlug;
        let quest: any;

        if (Types.ObjectId.isValid(questIdOrSlug)) {
            quest = await this.questModel.findById(questIdOrSlug).exec();
        } else {
            quest = await this.questModel.findOne({ slug: questIdOrSlug }).exec();
            if (quest) questId = (quest._id as any).toString();
        }
        if (!quest) throw new NotFoundException('Quest not found');

        const progress = await this.getProgress(userId, journeyIdOrSlug);

        // Ensure the item exists in the quest (prevents garbage IDs)
        const exists = quest.items.some(item => (item as any)._id.toString() === itemId);
        if (!exists) throw new NotFoundException('Quest item not found');

        let qProgress = progress.questProgress.find(qp => qp.questId.toString() === questId);
        if (!qProgress) {
            qProgress = {
                questId: new Types.ObjectId(questId),
                completedItems: [],
                isCompleted: false,
                lastViewedItemId: new Types.ObjectId(itemId),
                lastViewedAt: new Date(),
            };
            progress.questProgress.push(qProgress);
        }

        (qProgress as any).lastViewedItemId = new Types.ObjectId(itemId);
        (qProgress as any).lastViewedAt = new Date();
        progress.lastAccessedAt = new Date();

        progress.markModified('questProgress');
        return await progress.save();
    }
}
