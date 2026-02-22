import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Reflection extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Quest', required: true, index: true })
    questId: Types.ObjectId;

    @Prop({ required: true })
    challengeId: string; // The ID of the mini-challenge item within the quest

    @Prop({ required: true })
    response: string; // The student's journaling/reflection text

    @Prop({ type: Object })
    analysis: any; // Future placeholder for AI analysis or mentor notes
}

export const ReflectionSchema = SchemaFactory.createForClass(Reflection);
