import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { KitStatus } from '../../common/constants';

@Schema({ timestamps: true })
export class Kit extends Document {
    @Prop({ required: true, unique: true })
    code: string;

    @Prop({
        type: String,
        enum: KitStatus,
        default: KitStatus.AVAILABLE,
    })
    status: KitStatus;

    @Prop({ type: Types.ObjectId, ref: 'User' })
    activatedBy: Types.ObjectId;

    @Prop()
    activatedAt: Date;
}

export const KitSchema = SchemaFactory.createForClass(Kit);
