import { Controller, Get, Patch, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @ApiOperation({ summary: 'Get current user profile' })
    async getMe(@Req() req: any) {
        return await this.usersService.getProfile(req.user.userId);
    }

    @Patch('me/onboarding')
    @ApiOperation({ summary: 'Complete onboarding and save interests' })
    async completeOnboarding(@Body() body: { interests: string[] }, @Req() req: any) {
        return await this.usersService.updateOnboarding(req.user.userId, body.interests);
    }
}
