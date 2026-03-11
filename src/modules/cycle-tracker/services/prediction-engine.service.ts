import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cycle, CycleDocument } from '../schemas/cycle.schema';
import { DailyLog, DailyLogDocument } from '../schemas/daily-log.schema';

@Injectable()
export class PredictionEngineService {
  private readonly POPULATION_AVG_CYCLE = 28;
  private readonly MIN_CYCLE_LENGTH = 21;
  private readonly MAX_CYCLE_LENGTH = 35;

  constructor(
    @InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>,
    @InjectModel(DailyLog.name) private logModel: Model<DailyLogDocument>,
  ) {}

  /**
   * Calculates the next predicted period date based on historical data.
   * Uses population priors for new users and shifts to Bayesian updating for returning users.
   */
  async predictNextCycle(userId: string): Promise<{ predictedDate: Date | null; confidence: number }> {
    const historicalCycles = await this.cycleModel
      .find({ userId: userId } as any)
      .sort({ startDate: -1 })
      .limit(6)
      .exec();

    if (historicalCycles.length === 0) {
      // First timer - use population priors with low confidence
      return {
        predictedDate: null, // Needs at least one start date to predict
        confidence: 0.1,
      };
    }

    if (historicalCycles.length < 3) {
      // Learning phase
      const lastCycle = historicalCycles[0];
      const avgLength = this.calculateAverageLength(historicalCycles);
      const predictedDate = new Date(lastCycle.startDate);
      predictedDate.setDate(predictedDate.getDate() + avgLength);

      return {
        predictedDate,
        confidence: 0.3 * historicalCycles.length,
      };
    }

    // Hybrid Analysis (Phase 2/3)
    const avgLength = this.calculateAverageLength(historicalCycles);
    const lastCycle = historicalCycles[0];
    
    // Simple Bayesian Update emulation: adjust prediction based on recent variability
    const variance = this.calculateVariance(historicalCycles, avgLength);
    const confidence = Math.max(0.1, Math.min(0.9, 0.9 - (variance / 10)));

    const predictedDate = new Date(lastCycle.startDate);
    predictedDate.setDate(predictedDate.getDate() + Math.round(avgLength));

    return { predictedDate, confidence };
  }

  private calculateAverageLength(cycles: CycleDocument[]): number {
    if (cycles.length === 0) return this.POPULATION_AVG_CYCLE;
    
    const validCycles = cycles.filter(c => c.cycleLength);
    if (validCycles.length === 0) return this.POPULATION_AVG_CYCLE;

    const sum = validCycles.reduce((acc, curr) => acc + Number(curr.cycleLength), 0);
    return sum / validCycles.length;
  }

  private calculateVariance(cycles: CycleDocument[], avg: number): number {
    const validCycles = cycles.filter(c => c.cycleLength);
    if (validCycles.length <= 1) return 5; // Default minor variability

    const squareDiffs = validCycles.map(c => {
      const diff = Number(c.cycleLength) - avg;
      return diff * diff;
    });

    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }
}
