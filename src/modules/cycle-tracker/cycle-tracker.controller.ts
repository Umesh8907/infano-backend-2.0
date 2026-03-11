import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { CycleTrackerService } from './cycle-tracker.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cycle Tracker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cycle-tracker')
export class CycleTrackerController {
  constructor(private readonly trackerService: CycleTrackerService) {}

  @Post('log')
  @ApiOperation({ summary: 'Log daily cycle data (mood, symptoms, flow, etc.)' })
  async createLog(@Request() req, @Body() createLogDto: CreateDailyLogDto) {
    const logData = {
      ...createLogDto,
      date: createLogDto.date ? new Date(createLogDto.date) : new Date(),
    };
    return this.trackerService.createLog(req.user.userId, logData as any);
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get current cycle status and dashboard info' })
  async getDashboard(@Request() req) {
    return this.trackerService.getDashboard(req.user.userId);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get AI-generated cycle patterns and insights' })
  async getInsights(@Request() req) {
    return this.trackerService.getInsights(req.user.userId);
  }
}
