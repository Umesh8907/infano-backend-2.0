import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Cycle, CycleSchema } from './schemas/cycle.schema';
import { DailyLog, DailyLogSchema } from './schemas/daily-log.schema';
import { Insight, InsightSchema } from './schemas/insight.schema';
import { PredictionEngineService } from './services/prediction-engine.service';
import { CycleTrackerService } from './cycle-tracker.service';
import { CycleTrackerController } from './cycle-tracker.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Cycle.name, schema: CycleSchema },
      { name: DailyLog.name, schema: DailyLogSchema },
      { name: Insight.name, schema: InsightSchema },
    ]),
  ],
  controllers: [CycleTrackerController],
  providers: [PredictionEngineService, CycleTrackerService],
  exports: [CycleTrackerService],
})
export class CycleTrackerModule {}
