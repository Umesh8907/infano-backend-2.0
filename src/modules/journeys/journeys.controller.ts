import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JourneysService } from './journeys.service';
import { CreateJourneyDto } from './dto/create-journey.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Learning Journeys')
@Controller('journeys')
export class JourneysController {
    constructor(private readonly journeysService: JourneysService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new learning journey (Admin)' })
    @ApiResponse({ status: 201, description: 'Journey created successfully' })
    async create(@Body() createJourneyDto: CreateJourneyDto) {
        return await this.journeysService.create(createJourneyDto);
    }

    @Get()
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get all active learning journeys' })
    @ApiResponse({ status: 200, description: 'List of journeys' })
    async findAll() {
        return await this.journeysService.findAll();
    }

    @Get(':id')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get a specific journey by ID' })
    async findOne(@Param('id') id: string) {
        return await this.journeysService.findOne(id);
    }
}
