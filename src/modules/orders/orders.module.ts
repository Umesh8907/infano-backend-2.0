import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Order, OrderSchema } from './order.schema';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PaymentProvider } from '../../providers/payments/payment.provider';
import { UsersModule } from '../users/users.module';
import { WebhooksController } from './webhooks.controller';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
        UsersModule,
    ],
    controllers: [OrdersController, WebhooksController],
    providers: [OrdersService, PaymentProvider],
})
export class OrdersModule { }
