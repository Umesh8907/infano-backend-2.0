import { Controller, Post, Get, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { InsightsService } from './insights.service';
import { SubmitReflectionDto } from './dto/submit-reflection.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Insights & Reflection')
@Controller('insights')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class InsightsController {
    constructor(private readonly insightsService: InsightsService) { }

    @Post('submit')
    @ApiOperation({ summary: 'Submit a reflection entry from a mini-challenge' })
    async submit(@Body() dto: SubmitReflectionDto, @Req() req: any) {
        return await this.insightsService.submitReflection(req.user.userId, dto);
    }

    @Get('my-reflections')
    @ApiOperation({ summary: 'Get all reflections for the current student' })
    async getMyReflections(@Req() req: any) {
        return await this.insightsService.getUserReflections(req.user.userId);
    }
}
