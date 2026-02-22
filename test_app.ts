import { NestFactory } from '@nestjs/core';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import configuration from './src/config/configuration';
import { AuthModule } from './src/modules/auth/auth.module';
import { UsersModule } from './src/modules/users/users.module';
import { OrdersModule } from './src/modules/orders/orders.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            load: [configuration],
            isGlobal: true,
        }),
        MongooseModule.forRootAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                uri: 'mongodb://localhost:27017/infano_test',
            }),
            inject: [ConfigService],
        }),
        AuthModule,
        UsersModule,
        OrdersModule,
    ],
})
class TestModule { }

async function bootstrap() {
    try {
        console.log('Starting bootstrap with OrdersModule...');
        const app = await NestFactory.create(TestModule);
        await app.listen(3001);
        console.log('App is running on port 3001');
        setTimeout(() => process.exit(0), 5000);
    } catch (error) {
        console.error('Bootstrap failed:', error);
        process.exit(1);
    }
}
bootstrap();
