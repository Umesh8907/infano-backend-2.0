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
      if (updateData.startDate && updateData.endDate) {
        cycle.cycleLength = Math.round((updateData.endDate.getTime() - updateData.startDate.getTime()) / (24 * 60 * 60 * 1000)) + 1;
      }
      return cycle.save();
    }
    return null;
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
