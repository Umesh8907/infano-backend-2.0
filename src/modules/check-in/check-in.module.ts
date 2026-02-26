import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DailyCheckIn, DailyCheckInSchema } from './check-in.schema';
import { CheckInService } from './check-in.service';
import { CheckInController } from './check-in.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: DailyCheckIn.name, schema: DailyCheckInSchema }])
    ],
    controllers: [CheckInController],
    providers: [CheckInService],
    exports: [CheckInService]
})
export class CheckInModule { }
