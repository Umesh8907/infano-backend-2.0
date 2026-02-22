import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Reflection, ReflectionSchema } from './reflection.schema';
import { InsightsService } from './insights.service';
import { InsightsController } from './insights.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Reflection.name, schema: ReflectionSchema }]),
    ],
    controllers: [InsightsController],
    providers: [InsightsService],
    exports: [InsightsService],
})
export class InsightsModule { }
