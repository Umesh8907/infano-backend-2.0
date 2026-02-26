import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Journey } from './journey.schema';
import { CreateJourneyDto } from './dto/create-journey.dto';

import { slugify } from '../../common/utils/slugify';

@Injectable()
export class JourneysService {
    constructor(@InjectModel(Journey.name) private journeyModel: Model<Journey>) { }

    async create(dto: CreateJourneyDto) {
        const slug = slugify(dto.title);
        return await this.journeyModel.create({ ...dto, slug });
    }

    async findAll() {
        return await this.journeyModel.find({ isActive: true }).exec();
    }

    async findOne(idOrSlug: string) {
        const isObjectId = Types.ObjectId.isValid(idOrSlug);
        const query = isObjectId ? { _id: new Types.ObjectId(idOrSlug) } : { slug: idOrSlug };

        const journey = await this.journeyModel.findOne(query).exec();
        if (!journey) throw new NotFoundException('Journey not found');
        return journey;
    }
}
