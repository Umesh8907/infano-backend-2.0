import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reflection } from './reflection.schema';
import { SubmitReflectionDto } from './dto/submit-reflection.dto';

@Injectable()
export class InsightsService {
    constructor(@InjectModel(Reflection.name) private reflectionModel: Model<Reflection>) { }

    async submitReflection(userId: string, dto: SubmitReflectionDto) {
        return await this.reflectionModel.create({
            userId: new Types.ObjectId(userId),
            ...dto,
        });
    }

    async getUserReflections(userId: string) {
        return await this.reflectionModel.find({ userId: new Types.ObjectId(userId) })
            .sort({ createdAt: -1 })
            .exec();
    }
}
