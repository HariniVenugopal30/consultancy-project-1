import mongoose, { Schema, Types } from 'mongoose';

export interface ContactDocument {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: Date;
  updatedAt: Date;
}

const ContactSchema = new Schema<ContactDocument>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, lowercase: true, trim: true, maxlength: 255 },
    phone: { type: String, trim: true, maxlength: 30 },
    subject: { type: String, required: true, trim: true, minlength: 2, maxlength: 120 },
    message: { type: String, required: true, trim: true, minlength: 10, maxlength: 2000 },
  },
  { timestamps: true }
);

export const Contact = mongoose.models.Contact || mongoose.model<ContactDocument>('Contact', ContactSchema);
