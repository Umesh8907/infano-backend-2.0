import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Quest } from './quest.schema';
import { CreateQuestDto } from './dto/create-quest.dto';

import { slugify } from '../../common/utils/slugify';

import { Journey } from '../journeys/journey.schema';

@Injectable()
export class QuestsService {
    constructor(
        @InjectModel(Quest.name) private questModel: Model<Quest>,
        @InjectModel(Journey.name) private journeyModel: Model<Journey>,
    ) { }

    async create(dto: CreateQuestDto) {
        const slug = slugify(dto.title);
        return await this.questModel.create({ ...dto, slug });
    }

    async findByJourney(journeyIdOrSlug: string) {
        let journeyId = journeyIdOrSlug;

        if (!Types.ObjectId.isValid(journeyIdOrSlug)) {
            const journey = await this.journeyModel.findOne({ slug: journeyIdOrSlug }).exec();
            if (!journey) return [];
            journeyId = (journey._id as any).toString();
        }

        return await this.questModel.find({
            journeyId: new Types.ObjectId(journeyId),
            isActive: true
        })
            .sort({ order: 1 })
            .exec();
    }

    async findOne(idOrSlug: string) {
        const query = Types.ObjectId.isValid(idOrSlug)
            ? { _id: idOrSlug }
            : { slug: idOrSlug };

        const quest = await this.questModel.findOne(query).exec();
        if (!quest) throw new NotFoundException('Quest not found');
        return quest;
    }
}
