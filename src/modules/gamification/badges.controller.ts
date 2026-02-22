import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BadgeService } from './badge.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Badge Rewards')
@Controller('badges')
export class BadgesController {
    constructor(private readonly badgeService: BadgeService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new badge (Admin)' })
    async create(@Body() dto: any) {
        return await this.badgeService.createBadge(dto);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all available badges' })
    async findAll() {
        return await this.badgeService.findAll();
    }
}
