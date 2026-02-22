import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class UserProgress extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Quest', required: true })
    questId: string;

    @Prop({ default: false })
    isCompleted: boolean;

    @Prop({ type: Object })
    moduleProgress: {
        storyViewed: boolean;
        quizScore: number;
        videoWatched: boolean;
        challengeResponse?: string;
    };

    @Prop()
    completedAt?: Date;
}

export const UserProgressSchema = SchemaFactory.createForClass(UserProgress);
