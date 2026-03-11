import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cycle, CycleDocument } from '../schemas/cycle.schema';
import { DailyLog, DailyLogDocument } from '../schemas/daily-log.schema';

@Injectable()
export class PredictionEngineService {
  private readonly logger = new Logger(PredictionEngineService.name);

  // Population Priors for adolescents (based on research 21-35 days)
  private readonly POPULATION_MEAN = 28;
  private readonly POPULATION_STD_DEV = 4;

  constructor(
    @InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>,
    @InjectModel(DailyLog.name) private logModel: Model<DailyLogDocument>,
  ) {}

  async predictNextCycle(userId: string): Promise<{ predictedDate: Date; confidence: number; reason?: string; earlyWarning?: boolean; predictedPeriodLength?: number }> {
    const userObjectId = new Types.ObjectId(userId);
    const history = await this.cycleModel.find({ userId: userObjectId as any }).sort({ startDate: -1 }).limit(12);

    let baseCycleLength = this.POPULATION_MEAN;
    let confidence = 0.3;
    let reason = 'Initial estimate based on scientific averages';

    if (history.length > 0) {
      const completedCycles = history.filter(c => c.cycleLength);
      
      if (completedCycles.length >= 2) {
        const userMean = this.calculateAverageLength(history);
        const userStdDev = this.calculateVariance(history, userMean);
        
        // Bayesian Weighting: Higher weight to user history as more data arrives
        const weight = Math.min(completedCycles.length / 10, 0.8);
        baseCycleLength = (this.POPULATION_MEAN * (1 - weight)) + (userMean * weight);
        
        // Confidence increases with consistency (lower std dev) and history length
        const consistencyFactor = Math.max(0, 1 - (userStdDev / 10));
        confidence = Math.min(0.4 + (completedCycles.length * 0.05) + (consistencyFactor * 0.3), 0.95);
        reason = completedCycles.length > 5 ? 'High-accuracy personalized pattern' : 'Personalized rhythm analysis';

        if (userStdDev > 6) {
            reason += ' (Highly irregular patterns detected)';
            confidence -= 0.15;
        }
      } else {
        confidence = 0.45;
        reason = 'Learning your unique rhythm';
      }
    }

    // --- Dynamic Behavioral Adjustments ---
    const recentLogs = await this.logModel.find({
        userId: userObjectId as any,
        date: { $gte: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000) }
    }).sort({ date: -1 });

    // Stress & Lifestyle Correlation
    const stressLogs = recentLogs.filter(l => l.mood === 'stressed' || l.mood === 'low');
    if (stressLogs.length >= 4) {
        const delay = Math.min(stressLogs.length - 2, 4);
        baseCycleLength += delay;
        confidence -= 0.05;
        reason += ` (+${delay}d adjustment for recent stress patterns)`;
    }

    // Energy & Activity Correlation
    const extremeEnergyLogs = recentLogs.filter(l => (l.energy || 5) > 8 || (l.energy || 5) < 3);
    if (extremeEnergyLogs.length >= 5) {
        confidence -= 0.05;
        reason += ' (Fluctuating energy levels detected)';
    }

    // Lifestyle Trigger Adjustment (travel, illness add uncertainty)
    const triggerLogs = recentLogs.filter(l => 
        (l.lifestyleTriggers || []).some((t: string) => ['travel', 'illness', 'sleep_changes'].includes(t?.toLowerCase()))
    );
    if (triggerLogs.length >= 2) {
        baseCycleLength += 1;
        confidence -= 0.05;
        reason += ' (+1d for lifestyle disruptions)';
    }

    // Symptom-to-period correlation: cramps near last period end → likely starts 1 day earlier
    const lastCycleForCorrelation = history[0];
    let earlyWarning = false;
    if (lastCycleForCorrelation?.endDate) {
        const threeDaysBeforeEnd = new Date(lastCycleForCorrelation.endDate.getTime() - 3 * 24 * 60 * 60 * 1000);
        const crampLogs = await this.logModel.find({
            userId: userObjectId as any,
            date: { $gte: threeDaysBeforeEnd, $lte: lastCycleForCorrelation.endDate },
            symptoms: { $in: ['Cramps'] },
        });
        if (crampLogs.length >= 1) {
            baseCycleLength -= 1;
            earlyWarning = true;
            reason += ' (-1d: cramp pattern detected near previous period end)';
        }
    }

    // Predict period length from historical data
    const avgPeriodLength = history
        .filter(c => c.periodLength)
        .reduce((acc, c, _, arr) => acc + Number(c.periodLength) / arr.length, 0) || 5;

    const lastCycle = history[0];
    const latestStart = lastCycle ? lastCycle.startDate : new Date();
    
    // Ensure we don't predict a date in the past
    let predictedDate = new Date(latestStart.getTime() + baseCycleLength * 24 * 60 * 60 * 1000);
    if (predictedDate < new Date()) {
        predictedDate = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000); // Minimum 1 day ahead
    }

    return { 
        predictedDate, 
        confidence: Math.max(confidence, 0.1),
        reason,
        earlyWarning,
        predictedPeriodLength: Math.round(avgPeriodLength),
    };
  }

  private calculateAverageLength(cycles: CycleDocument[]): number {
    if (cycles.length === 0) return this.POPULATION_MEAN;
    
    const validCycles = cycles.filter(c => c.cycleLength);
    if (validCycles.length === 0) return this.POPULATION_MEAN;

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
