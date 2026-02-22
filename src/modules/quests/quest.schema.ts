import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum QuestItemType {
    STORY_HOOK = 'story_hook',
    KNOWLEDGE_CHECK = 'knowledge_check',
    VIDEO_ACTIVITY = 'video_activity',
    LEARNING_CARDS = 'learning_cards',
    MINI_CHALLENGE = 'mini_challenge',
    INSIGHT = 'insight',
}

@Schema({ _id: false })
class StoryHookContent {
    @Prop({ required: true })
    text: string;
    @Prop()
    imageUrl: string;
}

@Schema({ _id: false })
class KnowledgeCheckQuestion {
    @Prop({ required: true })
    question: string;
    @Prop({ type: [String], required: true })
    options: string[];
    @Prop({ required: true })
    correctOptionIndex: number;
}

@Schema({ _id: false })
class KnowledgeCheckContent {
    @Prop({ type: [KnowledgeCheckQuestion], required: true })
    questions: KnowledgeCheckQuestion[];
}

@Schema({ _id: false })
class VideoActivityContent {
    @Prop({ required: true })
    videoUrl: string;
    @Prop()
    thumbnailUrl: string;
    @Prop()
    description: string;
}

@Schema({ _id: false })
class LearningCard {
    @Prop({ required: true })
    title: string;
    @Prop({ required: true })
    content: string;
    @Prop()
    imageUrl: string;
}

@Schema({ _id: false })
class LearningCardsContent {
    @Prop({ type: [LearningCard], required: true })
    cards: LearningCard[];
}

@Schema({ _id: false })
class MiniChallengeContent {
    @Prop({ required: true })
    question: string;
}

@Schema({ _id: false })
class InsightContent {
    @Prop({ required: true })
    fullInsight: string;
    @Prop()
    imageUrl: string;
}

@Schema()
export class QuestItem {
    @Prop({ type: String, enum: QuestItemType, required: true })
    type: QuestItemType;

    @Prop({ required: true })
    title: string;

    @Prop({ type: Object, required: true })
    content:
        | StoryHookContent
        | KnowledgeCheckContent
        | VideoActivityContent
        | LearningCardsContent
        | MiniChallengeContent
        | InsightContent;

    @Prop({ default: 0 })
    order: number;

    @Prop({ default: 10 })
    xpReward: number;
}

const QuestItemSchema = SchemaFactory.createForClass(QuestItem);

@Schema({ timestamps: true })
export class Quest extends Document {
    @Prop({ type: Types.ObjectId, ref: 'Journey', required: true })
    journeyId: Types.ObjectId;

    @Prop({ required: true })
    title: string;

    @Prop()
    description: string;

    @Prop({ type: [QuestItemSchema], default: [] })
    items: QuestItem[];

    @Prop({ default: 0 })
    order: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const QuestSchema = SchemaFactory.createForClass(Quest);
