import { Injectable, BadRequestException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Order } from './order.schema';
import { User } from '../users/user.schema';
import { PaymentProvider } from '../../providers/payments/payment.provider';
import { OrderStatus, UserRole } from '../../common/constants';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<Order>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectConnection() private readonly connection: Connection,
        private paymentProvider: PaymentProvider,
        private configService: ConfigService,
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
        const kitPrice = this.configService.get<number>('payments.kitPrice') || 1999;
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

        return await this.fulfillOrder(orderId, paymentId);
    }

    async fulfillOrder(razorpayOrderId: string, razorpayPaymentId?: string) {
        const useTransaction = this.configService.get<boolean>('payments.useTransactions') === true;
        let session: any = null;

        if (useTransaction) {
            try {
                session = await this.connection.startSession();
                session.startTransaction();
            } catch (e) {
                console.error('Failed to start MongoDB Transaction:', e.message);
                throw new InternalServerErrorException(`Transaction Initialization Failed: ${e.message}`);
            }
        }

        try {
            // 1. Find the order (Idempotency check)
            const query = this.orderModel.findOne({ razorpayOrderId });
            if (session) query.session(session);

            const order = await query;

            if (!order) {
                throw new BadRequestException('Order not found');
            }

            if (order.status === OrderStatus.PAID) {
                return { success: true, message: 'Order already fulfilled', order };
            }

            // 2. Update Order status
            order.status = OrderStatus.PAID;
            if (razorpayPaymentId) {
                order.razorpayPaymentId = razorpayPaymentId;
            }
            await (session ? order.save({ session }) : order.save());

            // 3. Activate User Dashboard
            const userQuery = this.userModel.findById(order.userId);
            if (session) userQuery.session(session);

            const user = await userQuery;
            if (user) {
                user.isDashboardActive = true;
                await (session ? user.save({ session }) : user.save());
            }

            if (session) {
                await session.commitTransaction();
            }

            return { success: true, message: 'Order fulfilled and dashboard activated', order };

        } catch (error) {
            if (session) {
                try {
                    await session.abortTransaction();
                } catch (abortError) {
                    console.error('Failed to abort transaction:', abortError.message);
                }
            }
            console.error('Fulfillment Logic Error:', error.message);
            throw (error instanceof BadRequestException) ? error : new InternalServerErrorException(`Order Fulfillment Failed: ${error.message}`);
        } finally {
            if (session) {
                session.endSession();
            }
        }
    }
}
