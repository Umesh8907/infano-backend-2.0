import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JourneysService } from './journeys.service';
import { JourneysController } from './journeys.controller';
import { Journey, JourneySchema } from './journey.schema';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Journey.name, schema: JourneySchema }]),
    ],
    controllers: [JourneysController],
    providers: [JourneysService],
    exports: [JourneysService],
})
export class JourneysModule { }
