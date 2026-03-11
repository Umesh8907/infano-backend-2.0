import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InsightDocument = Insight & Document;

@Schema({ timestamps: true })
export class Insight {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: ['mood_pattern', 'symptom_trend', 'cycle_regularity'] })
  type: string;

  @Prop({ type: Object, required: true })
  value: any;

  @Prop({ required: true })
  summary: string;

  @Prop({ default: Date.now })
  generatedDate: Date;
}

export const InsightSchema = SchemaFactory.createForClass(Insight);
