import { Injectable, NotFoundException, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Kit } from './kit.schema';
import { User } from '../users/user.schema';
import { ActivateKitDto } from './dto/activate-kit.dto';
import { KitStatus, UserRole } from '../../common/constants';

@Injectable()
export class KitsService {
    constructor(
        @InjectModel(Kit.name) private kitModel: Model<Kit>,
        @InjectModel(User.name) private userModel: Model<User>,
    ) { }

    async activateKit(dto: ActivateKitDto) {
        // 1. Validate Kit Code
        const kit = await this.kitModel.findOne({ code: dto.code });
        if (!kit) {
            throw new NotFoundException('Invalid kit code');
        }

        if (kit.status !== KitStatus.AVAILABLE) {
            throw new BadRequestException('This kit code has already been activated');
        }

        // 2. Find or Create User
        let user = await this.userModel.findOne({
            $or: [{ phone: dto.phone }, ...(dto.email ? [{ email: dto.email }] : [])]
        });

        if (user && user.isDashboardActive) {
            throw new ConflictException('An active account already exists for this phone or email. Please login to activate your kit.');
        }

        if (!user) {
            user = await this.userModel.create({
                fullName: dto.fullName,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                role: UserRole.STUDENT,
                isDashboardActive: true,
            });
        } else {
            // Activate existing user's dashboard if not already active (should be hit for inactive users)
            user.isDashboardActive = true;
            await user.save();
        }

        // 3. Mark Kit as Activated
        kit.status = KitStatus.ACTIVATED;
        kit.activatedBy = user._id as any;
        kit.activatedAt = new Date();
        await kit.save();

        return {
            success: true,
            message: 'Kit activated successfully. Your dashboard is now active.',
            code: kit.code,
            user: {
                id: user._id,
                fullName: user.fullName,
                isDashboardActive: user.isDashboardActive,
            },
        };
    }

    // Helper to seed codes (for testing)
    async seedKitCode(code: string) {
        return await this.kitModel.create({ code, status: KitStatus.AVAILABLE });
    }
}
