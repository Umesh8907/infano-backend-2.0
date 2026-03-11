import { IsNotEmpty, IsEnum, IsOptional, IsNumber, IsArray, IsString, IsDateString } from 'class-validator';

export class CreateDailyLogDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsEnum(['none', 'light', 'medium', 'heavy'])
  @IsOptional()
  flowLevel?: string;

  @IsEnum(['happy', 'calm', 'neutral', 'low', 'stressed'])
  @IsOptional()
  mood?: string;

  @IsNumber()
  @IsOptional()
  energy?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  symptoms?: string[];

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  lifestyleTriggers?: string[];
}
