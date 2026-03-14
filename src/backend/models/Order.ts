import mongoose, { Schema, Types } from 'mongoose';

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'completed'
  | 'shipped'
  | 'delivered'
  | 'cancelled';
export type PaymentMethod = 'cod' | 'upi' | 'card';
export type PurchaseType = 'online' | 'offline';

export interface OrderItem {
  productId?: Types.ObjectId;
  productName: string;
  category?: string;
  image?: string;
  quantity: number;
  price: number;
}

export interface ShippingAddress {
  address: string;
  city: string;
  pincode: string;
}

export interface OrderDocument {
  _id: Types.ObjectId;
  orderId: string;
  userId?: Types.ObjectId;
  customerName: string;
  phone: string;
  email: string;
  shippingAddress: ShippingAddress;
  products: OrderItem[];
  totalAmount: number;
  paymentMethod: PaymentMethod;
  purchaseType: PurchaseType;
  orderStatus: OrderStatus;
  deliveryDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<OrderDocument>(
  {
    orderId: { type: String, required: true, unique: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    customerName: { type: String, required: true, trim: true, maxlength: 120 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    shippingAddress: {
      address: { type: String, required: true, trim: true, maxlength: 300 },
      city: { type: String, required: true, trim: true, maxlength: 100 },
      pincode: { type: String, required: true, trim: true, maxlength: 10 },
    },
    products: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product' },
        productName: { type: String, required: true, trim: true },
        category: { type: String, default: '', trim: true, maxlength: 120 },
        image: { type: String, default: '', trim: true, maxlength: 500 },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true, min: 0 },
      },
    ],
    totalAmount: { type: Number, required: true, min: 0 },
    paymentMethod: {
      type: String,
      enum: ['cod', 'upi', 'card'],
      required: true,
    },
    purchaseType: {
      type: String,
      enum: ['online', 'offline'],
      default: 'online',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'paid', 'completed', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    deliveryDate: { type: Date },
  },
  { timestamps: true, collection: 'orders' }
);

export const Order = mongoose.models.Order || mongoose.model<OrderDocument>('Order', OrderSchema);
