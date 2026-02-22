import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PurchaseKitDto } from './dto/purchase.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';

@ApiTags('Orders & Registration')
@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    @Post('purchase')
    @ApiOperation({ summary: 'Purchase a kit and register as a student' })
    @ApiResponse({ status: 201, description: 'Order created and user registered' })
    async purchaseKit(@Body() purchaseKitDto: PurchaseKitDto) {
        return await this.ordersService.createPurchaseOrder(purchaseKitDto);
    }

    @Post('verify')
    @ApiOperation({ summary: 'Verify Razorpay payment signature' })
    @ApiResponse({ status: 200, description: 'Payment verified and access granted' })
    async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
        return await this.ordersService.verifyPayment(
            verifyPaymentDto.razorpay_order_id,
            verifyPaymentDto.razorpay_payment_id,
            verifyPaymentDto.razorpay_signature,
        );
    }
}
