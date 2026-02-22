import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Journey extends Document {
    @Prop({ required: true })
    name: string;

    @Prop()
    description: string;

    @Prop()
    bannerImage: string;

    @Prop({ default: true })
    isActive: boolean;
}

export const JourneySchema = SchemaFactory.createForClass(Journey);
