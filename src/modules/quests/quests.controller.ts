import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { QuestsService } from './quests.service';
import { CreateQuestDto } from './dto/create-quest.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Quests & Content')
@Controller('quests')
export class QuestsController {
    constructor(private readonly questsService: QuestsService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new quest (Admin)' })
    @ApiResponse({ status: 201, description: 'Quest created successfully' })
    async create(@Body() createQuestDto: CreateQuestDto) {
        return await this.questsService.create(createQuestDto);
    }

    @Get('journey/:journeyId')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all quests for a specific journey' })
    async findByJourney(@Param('journeyId') journeyId: string) {
        return await this.questsService.findByJourney(journeyId);
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a specific quest detail' })
    async findOne(@Param('id') id: string) {
        return await this.questsService.findOne(id);
    }
}
