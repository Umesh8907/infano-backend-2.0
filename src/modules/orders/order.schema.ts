import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';
import { OrderStatus } from '../../common/constants';

@Schema({ timestamps: true })
export class Order extends Document {
    @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true })
    userId: string;

    @Prop({ required: true })
    amount: number;

    @Prop({ required: true })
    razorpayOrderId: string;

    @Prop()
    razorpayPaymentId?: string;

    @Prop({ type: String, enum: OrderStatus, default: OrderStatus.PENDING })
    status: OrderStatus;

    @Prop({ type: Object })
    shippingAddress: {
        fullName: string;
        phone: string;
        address: string;
        email?: string;
    };
}

export const OrderSchema = SchemaFactory.createForClass(Order);
