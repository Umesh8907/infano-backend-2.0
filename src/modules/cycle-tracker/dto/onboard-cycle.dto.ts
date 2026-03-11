import { IsDateString, IsNumber, IsOptional, Min, Max } from 'class-validator';

export class OnboardCycleDto {
  @IsDateString()
  lastPeriodStart: string;   // ISO date: when the last period started

  @IsNumber()
  @Min(1)
  @Max(10)
  periodLength: number;      // How many days did it last (1-10)

  @IsNumber()
  @IsOptional()
  @Min(18)
  @Max(45)
  usualCycleLength?: number; // User's known cycle length, defaults to 28
}
