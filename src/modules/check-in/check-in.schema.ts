import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class DailyCheckIn extends Document {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    userId: Types.ObjectId;

    @Prop({ required: true })
    mood: string; // e.g., 'Happy', 'Okay', 'Confused', 'Low', 'Calm', 'Worried'

    @Prop()
    note?: string;

    @Prop({ type: Date, default: Date.now, index: true })
    checkInDate: Date;
}

export const DailyCheckInSchema = SchemaFactory.createForClass(DailyCheckIn);

// Unique index to ensure only one check-in per user per day (simplified)
// For a more robust solution, we'd use a date-only field, but this is a good start.
DailyCheckInSchema.index({ userId: 1, checkInDate: 1 });
