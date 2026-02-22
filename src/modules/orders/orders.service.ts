import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order } from './order.schema';
import { User } from '../users/user.schema';
import { PaymentProvider } from '../../providers/payments/payment.provider';
import { OrderStatus, UserRole } from '../../common/constants';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        private paymentProvider: PaymentProvider,
    ) { }

    async createPurchaseOrder(dto: any) {
        // 1. Find or create User
        let user = await this.userModel.findOne({
            $or: [{ phone: dto.phone }, { email: dto.email }]
        });

        if (user && user.isDashboardActive) {
            throw new ConflictException('An active account already exists for this phone or email. Please login to your dashboard.');
        }

        if (!user) {
            user = await this.userModel.create({
                fullName: dto.fullName,
                phone: dto.phone,
                email: dto.email,
                address: dto.address,
                role: UserRole.STUDENT,
                isDashboardActive: false,
            });
        }

        // 2. Create Razorpay Order
        // Assuming a fixed price for the kit for now
        const kitPrice = 1999;
        const razorpayOrder = await this.paymentProvider.createOrder(
            kitPrice,
            'INR',
            `receipt_${Date.now()}`,
        );

        // 3. Save Pending Order
        await this.orderModel.create({
            userId: user._id as any,
            amount: kitPrice,
            razorpayOrderId: razorpayOrder.id,
            status: OrderStatus.PENDING,
            shippingAddress: {
                fullName: dto.fullName,
                phone: dto.phone,
                address: dto.address,
                email: dto.email,
            },
        });

        return {
            order: razorpayOrder,
            razorpayKeyId: this.paymentProvider.getRazorpayKeyId()
        };
    }

    async verifyPayment(orderId: string, paymentId: string, signature: string) {
        const isValid = this.paymentProvider.verifySignature(orderId, paymentId, signature);
        if (!isValid) {
            throw new BadRequestException('Invalid payment signature');
        }

        // Update Order
        const order = await this.orderModel.findOneAndUpdate(
            { razorpayOrderId: orderId },
            { status: OrderStatus.PAID, razorpayPaymentId: paymentId },
            { new: true },
        );

        if (order) {
            // Activate Dashboard for Student
            await this.userModel.findByIdAndUpdate(order.userId, {
                isDashboardActive: true,
            });
        }

        return { success: true, message: 'Payment verified and dashboard activated' };
    }
}
