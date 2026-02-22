import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ _id: false })
export class QuestItemProgress {
    @Prop({ type: Types.ObjectId, required: true })
    itemId: Types.ObjectId;

    @Prop({ default: true })
    isCompleted: boolean;

    @Prop({ default: Date.now })
    completedAt: Date;
}

@Schema({ _id: false })
export class QuestProgress {
    @Prop({ type: Types.ObjectId, ref: 'Quest', required: true })
    questId: Types.ObjectId;

    @Prop({ type: [QuestItemProgress], default: [] })
    completedItems: QuestItemProgress[];

    @Prop({ default: false })
    isCompleted: boolean;
}

@Schema({ timestamps: true })
export class UserProgress extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Journey', required: true, index: true })
    journeyId: Types.ObjectId;

    @Prop({ type: [QuestProgress], default: [] })
    questProgress: QuestProgress[];

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Badge' }], default: [] })
    earnedBadges: Types.ObjectId[];

    @Prop({ default: 0 })
    totalXp: number;

    @Prop({ default: false })
    isJourneyCompleted: boolean;

    @Prop({ type: Date })
    lastAccessedAt: Date;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);

// Compound index for unique user-journey progress
UserProgressSchema.index({ userId: 1, journeyId: 1 }, { unique: true });
