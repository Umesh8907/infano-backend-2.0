import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Journey } from './journey.schema';
import { CreateJourneyDto } from './dto/create-journey.dto';

@Injectable()
export class JourneysService {
    constructor(@InjectModel(Journey.name) private journeyModel: Model<Journey>) { }

    async create(dto: CreateJourneyDto) {
        return await this.journeyModel.create(dto);
    }

    async findAll() {
        return await this.journeyModel.find({ isActive: true }).exec();
    }

    async findOne(id: string) {
        const journey = await this.journeyModel.findById(id).exec();
        if (!journey) throw new NotFoundException('Journey not found');
        return journey;
    }
}
