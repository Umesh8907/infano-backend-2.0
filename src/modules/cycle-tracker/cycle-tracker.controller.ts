import { Controller, Post, Get, Patch, Delete, Body, UseGuards, Request, Param } from '@nestjs/common';
import { CycleTrackerService } from './cycle-tracker.service';
import { CreateDailyLogDto } from './dto/create-daily-log.dto';
import { OnboardCycleDto } from './dto/onboard-cycle.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Cycle Tracker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('cycle-tracker')
export class CycleTrackerController {
  constructor(private readonly trackerService: CycleTrackerService) {}

  @Post('onboard')
  @ApiOperation({ summary: 'Onboard a new user with their last period details' })
  async onboard(@Request() req, @Body() dto: OnboardCycleDto) {
    return this.trackerService.onboard(req.user.userId, {
      lastPeriodStart: dto.lastPeriodStart,
      periodLength: dto.periodLength,
      usualCycleLength: dto.usualCycleLength,
    });
  }

  @Delete('reset')
  @ApiOperation({ summary: 'Reset all tracker data for the user' })
  async resetData(@Request() req) {
    return this.trackerService.resetTrackerData(req.user.userId);
  }

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

  @Get('today-log')
  @ApiOperation({ summary: 'Get the daily log entry for today' })
  async getTodayLog(@Request() req) {
    return this.trackerService.getTodayLog(req.user.userId);
  }

  @Get('calendar')
  @ApiOperation({ summary: 'Get historical and predicted cycle dates' })
  async getCalendar(@Request() req) {
    return this.trackerService.getCalendar(req.user.userId);
  }

  @Get('education')
  @ApiOperation({ summary: 'Get phase-specific microlearning content' })
  async getEducation(@Request() req) {
    const status = await this.trackerService.getDashboard(req.user.userId);
    const phase = status.status === 'ACTIVE' ? status.phase : 'General';
    return this.trackerService.getEducationCards(phase || 'General');
  }

  @Get('education/all')
  @ApiOperation({ summary: 'Get all microlearning education cards' })
  async getAllEducation() {
    return this.trackerService.getAllEducation();
  }

  @Patch('cycle/:id')
  @ApiOperation({ summary: 'Update/Correct historical cycle dates' })
  async updateCycle(@Request() req, @Param('id') id: string, @Body() updateData: any) {
    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);
    return this.trackerService.updateCycle(req.user.userId, id, updateData);
  }

  @Post('seed-education')
  @ApiOperation({ summary: 'Seed initial microlearning content' })
  async seedEducation() {
    return this.trackerService.seedEducation();
  }
}
