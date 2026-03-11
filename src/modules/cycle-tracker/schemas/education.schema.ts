import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type EducationDocument = Education & Document;

@Schema({ timestamps: true })
export class Education {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  category: string; // e.g., 'Health', 'Biology', 'Self-care'

  @Prop({ required: true })
  content: string;

  @Prop()
  icon: string;

  @Prop({ enum: ['Menstrual', 'Follicular', 'Ovulatory', 'Luteal', 'General'], default: 'General' })
  targetPhase: string;

  @Prop({ default: 1 })
  version: number;
}

export const EducationSchema = SchemaFactory.createForClass(Education);
