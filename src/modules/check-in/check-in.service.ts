import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DailyCheckIn } from './check-in.schema';

@Injectable()
export class CheckInService {
    constructor(
        @InjectModel(DailyCheckIn.name) private checkInModel: Model<DailyCheckIn>
    ) { }

    async logMood(userId: string, mood: string, note?: string) {
        // Check if already checked in today
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const alreadyCheckedIn = await this.checkInModel.findOne({
            userId: new Types.ObjectId(userId),
            checkInDate: { $gte: startOfDay }
        });

        if (alreadyCheckedIn) {
            alreadyCheckedIn.mood = mood;
            if (note) alreadyCheckedIn.note = note;
            return await alreadyCheckedIn.save();
        }

        return await this.checkInModel.create({
            userId: new Types.ObjectId(userId),
            mood,
            note,
            checkInDate: new Date()
        });
    }

    async getTodayCheckIn(userId: string) {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        return await this.checkInModel.findOne({
            userId: new Types.ObjectId(userId),
            checkInDate: { $gte: startOfDay }
        });
    }

    async getHistory(userId: string, limit = 7) {
        return await this.checkInModel.find({
            userId: new Types.ObjectId(userId)
        })
            .sort({ checkInDate: -1 })
            .limit(limit)
            .exec();
    }
}
