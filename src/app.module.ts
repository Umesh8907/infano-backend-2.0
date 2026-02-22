import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { GamificationModule } from './modules/gamification/gamification.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { KitsModule } from './modules/kits/kits.module';
import { OrdersModule } from './modules/orders/orders.module';
import { JourneysModule } from './modules/journeys/journeys.module';
import { QuestsModule } from './modules/quests/quests.module';
import { InsightsModule } from './modules/insights/insights.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('database.uri'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    KitsModule,
    OrdersModule,
    JourneysModule,
    QuestsModule,
    GamificationModule,
    InsightsModule,
  ],
})
export class AppModule { }
