import mongoose, { Schema, Types } from 'mongoose';

export type UserRole = 'admin' | 'customer';

export interface UserDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 255 },
    password: { type: String, required: true, minlength: 8 },
    role: { type: String, enum: ['admin', 'customer'], default: 'customer' },
  },
  { timestamps: true, collection: 'users' }
);

export const User = mongoose.models.User || mongoose.model<UserDocument>('User', UserSchema);
