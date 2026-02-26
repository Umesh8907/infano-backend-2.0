import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserRole, Gender } from '../../common/constants';

@Schema({ timestamps: true })
export class User extends Document {
    @Prop({ required: true })
    fullName: string;

    @Prop({ required: true, unique: true })
    phone: string;

    @Prop({ unique: true, sparse: true })
    email?: string;

    @Prop()
    address: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.STUDENT })
    role: UserRole;

    @Prop({ type: String, enum: Gender })
    gender?: Gender;

    @Prop({ default: false })
    isDashboardActive: boolean;

    @Prop({ default: false })
    isOnboarded: boolean;

    @Prop({ type: [String], default: [] })
    selectedInterests: string[];

    @Prop()
    activationCode?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
