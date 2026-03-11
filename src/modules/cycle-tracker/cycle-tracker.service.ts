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
    @InjectModel('Education') private educationModel: Model<any>,
    private predictionEngine: PredictionEngineService,
  ) {}

  async onboard(userId: string, data: { lastPeriodStart: string; periodLength: number; usualCycleLength?: number }) {
    const userObjectId = new Types.ObjectId(userId);

    // Prevent duplicate onboarding — if cycles already exist, skip
    const existingCycles = await this.cycleModel.countDocuments({ userId: userObjectId as any });
    if (existingCycles > 0) {
      return { skipped: true, message: 'Cycle data already exists' };
    }

    const startDate = new Date(data.lastPeriodStart);
    const periodLength = data.periodLength;
    const cycleLength = data.usualCycleLength || 28;
    const endDate = new Date(startDate.getTime() + (periodLength - 1) * 24 * 60 * 60 * 1000);

    // Seed a completed historical cycle so prediction engine has real data
    const historicalCycle = new this.cycleModel({
      userId: userObjectId,
      startDate,
      endDate,
      cycleLength,
      periodLength,
      confidenceScore: 0.5,
    });
    await historicalCycle.save();

    // Now run prediction based on this seeded cycle
    const prediction = await this.predictionEngine.predictNextCycle(userId);

    // Update the seeded cycle with a prediction
    historicalCycle.predictedNextDate = prediction.predictedDate;
    historicalCycle.confidenceScore = prediction.confidence;
    await historicalCycle.save();

    // Seed daily flow logs for the period days so the calendar shows them
    const logPromises: any[] = [];
    for (let i = 0; i < periodLength; i++) {
      const logDate = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      // Heavier flow at the start, tapering off
      const flowLevel = i === 0 ? 'heavy' : i < 2 ? 'medium' : 'light';
      logPromises.push(
        new this.logModel({
          userId: userObjectId,
          date: logDate,
          flowLevel,
          mood: 'neutral',
          energy: 5,
          symptoms: i === 0 ? ['Cramps'] : [],
        }).save()
      );
    }
    await Promise.all(logPromises);

    return {
      success: true,
      predictedNextPeriod: prediction.predictedDate,
      confidence: prediction.confidence,
      cycleLength,
      periodLength,
    };
  }

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
      // Compute actual period length from daily flow logs
      const periodLogs = await this.logModel.find({
        userId: userObjectId as any,
        date: { $gte: lastCycle.startDate, $lte: lastCycle.endDate },
        flowLevel: { $ne: 'none' },
      });
      lastCycle.periodLength = periodLogs.length || 5;
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
    const cycleLength = Number(lastCycle.cycleLength || 28);
    const periodLength = Number(lastCycle.periodLength || 5);
    const phase = this.determinePhase(cycleDay, cycleLength, periodLength);
    const ovulation = this.getOvulationWindow(lastCycle.startDate, cycleLength);

    return {
      status: 'ACTIVE',
      cycleDay,
      cycleLength,
      periodLength,
      nextPeriodDate: lastCycle.predictedNextDate,
      predictionConfidence: lastCycle.confidenceScore,
      phase,
      tips: this.getPhaseTips(phase),
      ovulationWindowStart: ovulation.start,
      ovulationWindowEnd: ovulation.end,
    };
  }

  private getOvulationWindow(cycleStart: Date, cycleLength: number): { start: Date; end: Date } {
    // Ovulation typically occurs around 14 days BEFORE the next period
    const ovulationDay = cycleLength - 14;
    const start = new Date(cycleStart.getTime() + (ovulationDay - 2) * 24 * 60 * 60 * 1000);
    const end = new Date(cycleStart.getTime() + (ovulationDay + 2) * 24 * 60 * 60 * 1000);
    return { start, end };
  }

  private determinePhase(day: number, cycleLength: number, periodLength: number): string {
    if (day <= periodLength) return 'Menstrual';
    const follicularEnd = Math.round(cycleLength * 0.45);
    const ovulatoryEnd = Math.round(cycleLength * 0.55);
    if (day <= follicularEnd) return 'Follicular';
    if (day <= ovulatoryEnd) return 'Ovulatory';
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
    
    if (logs.length < 3) return;

    const insights: any[] = [];

    // Symptom Analysis
    const recentSymptoms = logs.flatMap(l => l.symptoms || []);
    const symptomFreq = recentSymptoms.reduce((acc, s) => {
        acc[s] = (acc[s] || 0) + 1;
        return acc;
    }, {});

    const topSymptom = Object.keys(symptomFreq).sort((a,b) => symptomFreq[b] - symptomFreq[a])[0];
    if (topSymptom) {
        insights.push({
            type: 'symptom_alert',
            title: `Managing ${topSymptom}`,
            summary: `We've noticed ${topSymptom} appearing in ${symptomFreq[topSymptom]} of your recent logs.`,
            advice: this.getSymptomAdvice(topSymptom),
        });
    }

    // Energy & Mood Correlation
    const avgEnergy = logs.reduce((acc, l) => acc + (l.energy || 5), 0) / logs.length;
    if (avgEnergy < 4) {
        insights.push({
            type: 'lifestyle_tip',
            title: 'Energy Restoration',
            summary: 'Your energy levels have been lower than usual this week.',
            advice: 'Consider increasing your iron intake and prioritizing 8+ hours of sleep during this phase.',
        });
    }

    // Period incoming alert
    const dashboard = await this.getDashboard(userId);
    if (dashboard.status === 'ACTIVE' && dashboard.nextPeriodDate) {
      const daysUntilPeriod = Math.round((new Date(dashboard.nextPeriodDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
      if (daysUntilPeriod >= 0 && daysUntilPeriod <= 3) {
        insights.push({
          type: 'period_incoming',
          title: 'Period in ~' + daysUntilPeriod + ' day(s)',
          summary: 'Based on your tracked history, your period is expected very soon.',
          advice: 'Stock up on your essentials: pads, pain relief, and some self-care treats.',
        });
      }
    }

    // Save/Update newest insights
    for (const insight of insights) {
        await this.insightModel.findOneAndUpdate(
            { userId: userObjectId as any, type: insight.type },
            {
                ...insight,
                generatedDate: new Date()
            },
            { upsert: true }
        );
    }
  }

  private getSymptomAdvice(symptom: string): string {
    const adviceMap = {
        'Cramps': 'Try magnesium-rich foods like dark chocolate or a warm heating pad.',
        'Headache': 'Stay extra hydrated and consider lowering screen time today.',
        'Bloating': 'Peppermint tea and light walking can help ease discomfort.',
        'Acne': 'Focus on gentle cleansing and stay hydrated.',
        'Tiredness': 'Listen to your body; it is okay to take it slow today.',
    };
    return adviceMap[symptom] || 'Keep tracking to see more personalized patterns.';
  }

  async getInsights(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    return this.insightModel.find({ userId: userObjectId as any }).sort({ generatedDate: -1 });
  }

  async getTodayLog(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000 - 1);
    return this.logModel.findOne({
      userId: userObjectId as any,
      date: { $gte: startOfDay, $lte: endOfDay },
    });
  }

  async resetTrackerData(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    await Promise.all([
      this.cycleModel.deleteMany({ userId: userObjectId as any }),
      this.logModel.deleteMany({ userId: userObjectId as any }),
      this.insightModel.deleteMany({ userId: userObjectId as any }),
    ]);
    return { success: true };
  }

  async getCalendar(userId: string) {
    const userObjectId = new Types.ObjectId(userId);
    
    // Get last 6 months of historical cycles
    const cycles = await this.cycleModel.find({ userId: userObjectId as any })
      .sort({ startDate: -1 })
      .limit(6);
      
    // Get daily logs for the last 30 days
    const logs = await this.logModel.find({
      userId: userObjectId as any,
      date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    }).sort({ date: 1 });

    return {
      cycles,
      logs
    };
  }

  async getEducationCards(phase: string) {
    return this.educationModel.find({ 
      $or: [{ targetPhase: phase }, { targetPhase: 'General' }] 
    }).limit(3);
  }

  async updateCycle(userId: string, cycleId: string, updateData: Partial<Cycle>) {
    const userObjectId = new Types.ObjectId(userId);
    const cycle = await this.cycleModel.findOne({ _id: cycleId, userId: userObjectId as any });
    
    if (cycle) {
      Object.assign(cycle, updateData);
      if (cycle.startDate && cycle.endDate) {
        cycle.cycleLength = Math.round((cycle.endDate.getTime() - cycle.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      }
      return cycle.save();
    }
    return null;
  }

  async getAllEducation() {
    return this.educationModel.find();
  }

  async seedEducation() {
    const count = await this.educationModel.countDocuments();
    if (count > 0) return;

    const cards = [
      { title: 'Why periods happen', category: 'Biology', content: 'Your body is preparing for a potential journey. Every month, the uterus builds a cozy lining...', targetPhase: 'Menstrual', icon: 'Flower' },
      { title: 'Energy is rising!', category: 'Self-care', content: 'During the Follicular phase, your estrogen levels go up, making you feel more energetic and social.', targetPhase: 'Follicular', icon: 'Zap' },
      { title: 'Understanding Mood Swings', category: 'Health', content: 'It is normal to feel more sensitive during the Luteal phase. Be extra kind to yourself today.', targetPhase: 'Luteal', icon: 'Heart' },
    ];

    await this.educationModel.insertMany(cards);
  }
}
