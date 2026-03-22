import mongoose, { Schema, Types } from 'mongoose';

export interface ProductDocument {
  _id: Types.ObjectId;
  name: string;
  price: number;
  category: string;
  colorCode: string;
  stockQuantity: number;
  soldCount: number;
  image?: string;
  description?: string;
  rating?: number;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<ProductDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    price: { type: Number, required: true, min: 0 },
    category: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    colorCode: { type: String, required: true, trim: true, maxlength: 20 },
    stockQuantity: { type: Number, required: true, min: 0 },
    soldCount: { type: Number, default: 0, min: 0 },
    image: { type: String, default: '', maxlength: 500 },
    description: { type: String, default: '', maxlength: 2000 },
    rating: { type: Number, default: 4.5, min: 0, max: 5 },
  },
  { timestamps: true, collection: 'products' }
);

ProductSchema.index({ category: 1 });
ProductSchema.index({ createdAt: -1 });

export const Product =
  mongoose.models.Product || mongoose.model<ProductDocument>('Product', ProductSchema);
