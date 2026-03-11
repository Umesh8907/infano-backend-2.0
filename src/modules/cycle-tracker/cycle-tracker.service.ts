import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cycle, CycleDocument } from './schemas/cycle.schema';
import { DailyLog, DailyLogDocument } from './schemas/daily-log.schema';
import { Insight, InsightDocument } from './schemas/insight.schema';
import { PredictionEngineService } from './services/prediction-engine.service';

@Injectable()
export class CycleTrackerService {
  private readonly logger = new Logger(CycleTrackerService.name);

  constructor(
    @InjectModel(Cycle.name) private cycleModel: Model<CycleDocument>,
    @InjectModel(DailyLog.name) private logModel: Model<DailyLogDocument>,
    @InjectModel(Insight.name) private insightModel: Model<InsightDocument>,
    private predictionEngine: PredictionEngineService,
  ) {}

  async createLog(userId: string, logData: Partial<DailyLog>): Promise<DailyLog> {
    const userObjectId = new Types.ObjectId(userId);
    const newLog = new this.logModel({
      ...logData,
      userId: userObjectId,
      date: logData.date || new Date(),
    });

    const savedLog = await newLog.save();

    // If logging period start, handle cycle creation
    if (logData.flowLevel && logData.flowLevel !== 'none') {
      await this.handlePeriodStart(userId, savedLog.date);
    }

    // Trigger insight generation periodically (e.g., after a log)
    await this.generateInsights(userId);

    return savedLog;
  }

  private async handlePeriodStart(userId: string, startDate: Date) {
    const userObjectId = new Types.ObjectId(userId);
    
    const recentCycle = await this.cycleModel.findOne({
      userId: userObjectId as any,
      startDate: { $gte: new Date(startDate.getTime() - 15 * 24 * 60 * 60 * 1000) }
    });

    if (recentCycle) return;

    const lastCycle = await this.cycleModel.findOne({ userId: userObjectId as any }).sort({ startDate: -1 });
    if (lastCycle && !lastCycle.endDate) {
      lastCycle.endDate = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
      lastCycle.cycleLength = Math.round((lastCycle.endDate.getTime() - lastCycle.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      await lastCycle.save();
    }

    const prediction = await this.predictionEngine.predictNextCycle(userId);

    const newCycle = new this.cycleModel({
      userId: userObjectId,
      startDate,
      predictedNextDate: prediction.predictedDate,
      confidenceScore: prediction.confidence,
    });

    await newCycle.save();
  }

  async getDashboard(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const lastCycle = await this.cycleModel.findOne({ userId: userObjectId as any }).sort({ startDate: -1 });
    
    if (!lastCycle) {
      return { status: 'NO_DATA', message: 'Ready to track your first cycle' };
    }

    const today = new Date();
    const cycleDay = Math.round((today.getTime() - lastCycle.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
    const phase = this.determinePhase(cycleDay, Number(lastCycle.cycleLength || 28));

    return {
      status: 'ACTIVE',
      cycleDay,
      predictedNextPeriod: lastCycle.predictedNextDate,
      confidence: lastCycle.confidenceScore,
      phase,
      tips: this.getPhaseTips(phase),
    };
  }

  private determinePhase(day: number, totalLength: number): string {
    if (day <= 5) return 'Menstrual';
    if (day <= 13) return 'Follicular';
    if (day <= 16) return 'Ovulatory';
    return 'Luteal';
  }

  private getPhaseTips(phase: string): string[] {
    const tips = {
      'Menstrual': ['Stay hydrated', 'Try gentle stretching', 'Warm compress for cramps'],
      'Follicular': ['Great time for new projects', 'Energy is rising', 'Focus on protein-rich foods'],
      'Ovulatory': ['Social energy is peak', 'Good for intense workouts', 'Stay active'],
      'Luteal': ['Prioritize rest', 'Mood might fluctuate', 'Gentle yoga is best'],
    };
    return tips[phase] || [];
  }

  async generateInsights(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const logs = await this.logModel.find({ userId: userObjectId as any }).sort({ date: -1 }).limit(30);
    
    if (logs.length < 5) return; // Need at least some logs

    // Example Insight: Mood Trend
    const moods = logs.map(l => l.mood).filter(Boolean);
    const moodCounts = moods.reduce((acc, m) => {
      acc[m] = (acc[m] || 0) + 1;
      return acc;
    }, {});

    const dominantMood = Object.keys(moodCounts).reduce((a, b) => moodCounts[a] > moodCounts[b] ? a : b);

    await this.insightModel.findOneAndUpdate(
      { userId: userObjectId as any, type: 'mood_pattern' },
      {
        value: { moodCounts, dominantMood },
        summary: `You've been feeling mostly ${dominantMood} lately.`,
        generatedDate: new Date()
      },
      { upsert: true }
    );
  }

  async getInsights(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    return this.insightModel.find({ userId: userObjectId as any }).sort({ generatedDate: -1 });
  }
}
