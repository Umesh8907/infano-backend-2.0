import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Badge, BadgeCriteriaType } from './badge.schema';
import { UserProgress } from './user-progress.schema';

@Injectable()
export class BadgeService {
    constructor(
        @InjectModel(Badge.name) private badgeModel: Model<Badge>,
        @InjectModel(UserProgress.name) private progressModel: Model<UserProgress>,
    ) { }

    async createBadge(dto: any) {
        return await this.badgeModel.create(dto);
    }

    async findAll() {
        return await this.badgeModel.find({ isActive: true }).exec();
    }

    async checkAndAwardBadges(userId: string, journeyId: string, progress: UserProgress) {
        const activeBadges = await this.badgeModel.find({ isActive: true }).exec();
        let updated = false;

        for (const badge of activeBadges) {
            // Skip if already earned
            if (progress.earnedBadges.some(id => id.toString() === badge._id.toString())) {
                continue;
            }

            let matches = false;

            if (badge.criteriaType === BadgeCriteriaType.JOURNEY_COMPLETION) {
                if (badge.criteriaValue === journeyId && progress.isJourneyCompleted) {
                    matches = true;
                }
            } else if (badge.criteriaType === BadgeCriteriaType.XP_MILESTONE) {
                if (progress.totalXp >= (badge.criteriaValue as number)) {
                    matches = true;
                }
            }

            if (matches) {
                progress.earnedBadges.push(badge._id as any);
                updated = true;
            }
        }

        if (updated) {
            await progress.save();
        }
        return updated;
    }
}
