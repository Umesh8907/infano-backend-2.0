import { Controller, Post, Get, Body, UseGuards, Req, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CheckInService } from './check-in.service';

@ApiTags('Daily Check-In')
@Controller('check-in')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CheckInController {
    constructor(private readonly checkInService: CheckInService) { }

    @Post('mood')
    @ApiOperation({ summary: 'Log daily mood' })
    @ApiResponse({ status: 201, description: 'Mood logged successfully' })
    async logMood(@Body() body: { mood: string; note?: string }, @Req() req: any) {
        return await this.checkInService.logMood(req.user.userId, body.mood, body.note);
    }

    @Get('today')
    @ApiOperation({ summary: 'Get todays check-in for user' })
    async getToday(@Req() req: any) {
        return await this.checkInService.getTodayCheckIn(req.user.userId);
    }

    @Get('history')
    @ApiOperation({ summary: 'Get check-in history' })
    async getHistory(@Query('limit') limit: number, @Req() req: any) {
        return await this.checkInService.getHistory(req.user.userId, limit);
    }
}
