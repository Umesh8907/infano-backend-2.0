import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum BadgeCriteriaType {
    JOURNEY_COMPLETION = 'journey_completion',
    XP_MILESTONE = 'xp_milestone',
    STREAK = 'streak',
}

@Schema({ timestamps: true })
export class Badge extends Document {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true })
    iconUrl: string;

    @Prop({ type: String, enum: BadgeCriteriaType, required: true })
    criteriaType: BadgeCriteriaType;

    @Prop({ type: Object, required: true })
    criteriaValue: number | string; // e.g., 500 for XP, or journeyId for completion

    @Prop({ type: Types.ObjectId, ref: 'Journey' })
    journeyId: Types.ObjectId;

    @Prop({ default: true })
    isActive: boolean;
}

export const BadgeSchema = SchemaFactory.createForClass(Badge);
