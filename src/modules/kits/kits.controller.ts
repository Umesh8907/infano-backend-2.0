import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { KitsService } from './kits.service';
import { ActivateKitDto } from './dto/activate-kit.dto';

@ApiTags('Kits & Activation')
@Controller('kits')
export class KitsController {
    constructor(private readonly kitsService: KitsService) { }

    @Post('activate')
    @ApiOperation({ summary: 'Activate a physical kit using a unique code' })
    @ApiResponse({ status: 200, description: 'Kit activated and user access granted' })
    @ApiResponse({ status: 404, description: 'Invalid kit code' })
    @ApiResponse({ status: 400, description: 'Kit already activated' })
    async activate(@Body() activateKitDto: ActivateKitDto) {
        return await this.kitsService.activateKit(activateKitDto);
    }
}
