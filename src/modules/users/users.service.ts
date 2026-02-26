import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './user.schema';

@Injectable()
export class UsersService {
    constructor(@InjectModel(User.name) private userModel: Model<User>) { }

    async findById(id: string): Promise<User> {
        const user = await this.userModel.findById(id).exec();
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async updateOnboarding(userId: string, interests: string[]) {
        const user = await this.findById(userId);
        user.isOnboarded = true;
        user.selectedInterests = interests;
        return await user.save();
    }

    async getProfile(userId: string) {
        return await this.findById(userId);
    }
}
