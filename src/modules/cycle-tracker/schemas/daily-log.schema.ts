import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type DailyLogDocument = DailyLog & Document;

@Schema({ timestamps: true })
export class DailyLog {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ enum: ['none', 'light', 'medium', 'heavy'], default: 'none' })
  flowLevel: string;

  @Prop({ enum: ['happy', 'calm', 'neutral', 'low', 'stressed'] })
  mood: string;

  @Prop({ min: 1, max: 10 })
  energy: number;

  @Prop([String])
  symptoms: string[];

  @Prop()
  notes: string;

  @Prop([String])
  lifestyleTriggers: string[];
}

export const DailyLogSchema = SchemaFactory.createForClass(DailyLog);
