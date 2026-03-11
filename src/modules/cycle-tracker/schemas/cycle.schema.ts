import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CycleDocument = Cycle & Document;

@Schema({ timestamps: true })
export class Cycle {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop()
  predictedNextDate: Date;

  @Prop()
  cycleLength: Number;

  @Prop()
  periodLength: Number;

  @Prop({ default: false })
  isIrregular: boolean;

  @Prop({ default: 0.5 })
  confidenceScore: number;
}

export const CycleSchema = SchemaFactory.createForClass(Cycle);
