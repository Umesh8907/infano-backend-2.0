import { Controller, Post, Headers, BadRequestException, RawBodyRequest, Req, Logger } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { PaymentProvider } from '../../providers/payments/payment.provider';
import * as express from 'express';

@Controller('webhooks/razorpay')
export class WebhooksController {
    private readonly logger = new Logger(WebhooksController.name);

    constructor(
        private readonly ordersService: OrdersService,
        private readonly paymentProvider: PaymentProvider,
    ) { }

    @Post()
    async handleWebhook(@Headers('x-razorpay-signature') signature: string, @Req() req: any) {
        if (!signature) {
            throw new BadRequestException('Missing Razorpay signature');
        }

        if (!req.rawBody) {
            this.logger.error('Raw body missing. Ensure NestFactory.create(AppModule, { rawBody: true }) is set.');
            throw new BadRequestException('Missing raw body for verification');
        }

        // Razorpay webhooks require the raw body for signature verification
        const rawBody = req.rawBody.toString();
        const isValid = this.paymentProvider.verifyWebhookSignature(rawBody, signature);

        if (!isValid) {
            throw new BadRequestException('Invalid webhook signature');
        }

        const event = JSON.parse(rawBody);

        // Handle payment captured event
        if (event.event === 'payment.captured') {
            const razorpayOrderId = event.payload.payment.entity.order_id;
            const razorpayPaymentId = event.payload.payment.entity.id;

            console.log(`Received payment.captured webhook for order: ${razorpayOrderId}`);
            await this.ordersService.fulfillOrder(razorpayOrderId, razorpayPaymentId);
        }

        return { status: 'ok' };
    }
}
