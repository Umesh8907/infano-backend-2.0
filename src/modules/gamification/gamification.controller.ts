import { Controller, Post, Get, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UserProgressService } from './user-progress.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Gamification & Progress')
@Controller('progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class GamificationController {
    constructor(private readonly progressService: UserProgressService) { }

    @Get(':journeyId')
    @ApiOperation({ summary: 'Get current user progress for a journey' })
    async getProgress(@Param('journeyId') journeyId: string, @Req() req: any) {
        return await this.progressService.getProgress(req.user.userId, journeyId);
    }

    @Post(':journeyId/quests/:questId/items/:itemId/complete')
    @ApiOperation({ summary: 'Mark a specific quest item as completed' })
    @ApiResponse({ status: 200, description: 'Progress updated and XP awarded' })
    @ApiResponse({ status: 400, description: 'Sequential locking error (Previous item not done)' })
    async completeQuestItem(
        @Param('journeyId') journeyId: string,
        @Param('questId') questId: string,
        @Param('itemId') itemId: string,
        @Req() req: any,
    ) {
        return await this.progressService.completeQuestItem(req.user.userId, journeyId, questId, itemId);
    }
}
