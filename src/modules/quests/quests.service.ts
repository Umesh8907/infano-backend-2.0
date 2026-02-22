import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Quest } from './quest.schema';
import { CreateQuestDto } from './dto/create-quest.dto';

@Injectable()
export class QuestsService {
    constructor(@InjectModel(Quest.name) private questModel: Model<Quest>) { }

    async create(dto: CreateQuestDto) {
        return await this.questModel.create(dto);
    }

    async findByJourney(journeyId: string) {
        return await this.questModel.find({ journeyId, isActive: true })
            .sort({ order: 1 })
            .exec();
    }

    async findOne(id: string) {
        const quest = await this.questModel.findById(id).exec();
        if (!quest) throw new NotFoundException('Quest not found');
        return quest;
    }
}
