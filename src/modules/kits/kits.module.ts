import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KitsService } from './kits.service';
import { KitsController } from './kits.controller';
import { Kit, KitSchema } from './kit.schema';
import { User, UserSchema } from '../users/user.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Kit.name, schema: KitSchema },
            { name: User.name, schema: UserSchema },
        ]),
    ],
    controllers: [KitsController],
    providers: [KitsService],
    exports: [KitsService],
})
export class KitsModule { }
