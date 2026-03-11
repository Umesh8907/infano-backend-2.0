import { PredictionEngineService } from './prediction-engine.service';
import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { Types } from 'mongoose';
import { Cycle } from '../schemas/cycle.schema';
import { DailyLog } from '../schemas/daily-log.schema';

const mockUserId = new Types.ObjectId().toHexString();

const makeCycleModel = (cycles: any[]) => ({
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue(cycles),
        }),
    }),
});

const makeLogModel = (logs: any[]) => ({
    find: jest.fn().mockReturnValue({
        sort: jest.fn().mockResolvedValue(logs),
    }),
});

const createService = async (cycles: any[], logs: any[]) => {
    const module: TestingModule = await Test.createTestingModule({
        providers: [
            PredictionEngineService,
            { provide: getModelToken(Cycle.name), useValue: makeCycleModel(cycles) },
            { provide: getModelToken(DailyLog.name), useValue: makeLogModel(logs) },
        ],
    }).compile();
    return module.get<PredictionEngineService>(PredictionEngineService);
};

describe('PredictionEngineService', () => {

    test('1. With zero cycles → predicts ~28 days ahead with low confidence', async () => {
        const service = await createService([], []);
        const result = await service.predictNextCycle(mockUserId);

        const daysAhead = Math.round((result.predictedDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
        expect(daysAhead).toBeGreaterThanOrEqual(0);
        expect(daysAhead).toBeLessThanOrEqual(30);
        expect(result.confidence).toBeGreaterThanOrEqual(0.1);
        expect(result.confidence).toBeLessThanOrEqual(0.5);
    });

    test('2. With 2+ completed cycles → confidence increases', async () => {
        const startDate1 = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);
        const startDate2 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const cycles = [
            { startDate: startDate2, endDate: new Date(Date.now() - 24 * 60 * 60 * 1000), cycleLength: 29, periodLength: 5 },
            { startDate: startDate1, endDate: new Date(startDate2.getTime() - 24 * 60 * 60 * 1000), cycleLength: 28, periodLength: 5 },
        ];
        const service = await createService(cycles, []);
        const result = await service.predictNextCycle(mockUserId);

        expect(result.confidence).toBeGreaterThan(0.5);
    });

    test('3. With 4+ consecutive stressed logs → prediction date is delayed', async () => {
        const start = new Date(Date.now() - 25 * 24 * 60 * 60 * 1000);
        const cycles = [{ startDate: start, cycleLength: 28, periodLength: 5 }];
        const stressedLogs = Array.from({ length: 5 }).map((_, i) => ({
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
            mood: 'stressed',
            energy: 5,
            symptoms: [],
            lifestyleTriggers: [],
        }));

        const baseService = await createService(cycles, []);
        const basePrediction = await baseService.predictNextCycle(mockUserId);

        const stressService = await createService(cycles, stressedLogs);
        const stressPrediction = await stressService.predictNextCycle(mockUserId);

        expect(stressPrediction.predictedDate.getTime()).toBeGreaterThan(basePrediction.predictedDate.getTime());
    });

    test('4. With high variance cycles (std dev > 6) → confidence decreases', async () => {
        const start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        const cycles = [
            { startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), cycleLength: 40, periodLength: 5 },
            { startDate: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000), cycleLength: 21, periodLength: 3 },
            { startDate: start, cycleLength: 36, periodLength: 6 },
        ];
        const service = await createService(cycles, []);
        const result = await service.predictNextCycle(mockUserId);

        expect(result.confidence).toBeLessThan(0.75);
        expect(result.reason).toMatch(/irregular/i);
    });

    test('5. Predicted date is never in the past', async () => {
        const veryOldStart = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
        const cycles = [{ startDate: veryOldStart, cycleLength: 28, periodLength: 5 }];
        const service = await createService(cycles, []);
        const result = await service.predictNextCycle(mockUserId);

        expect(result.predictedDate.getTime()).toBeGreaterThan(Date.now());
    });
});
