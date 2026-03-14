import mongoose, { Schema, Types } from 'mongoose';

export interface AboutDocument {
  _id: Types.ObjectId;
  title: string;
  description: string;
  createdAt: Date;
}

const AboutSchema = new Schema<AboutDocument>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'about' }
);

export const About = mongoose.models.About || mongoose.model<AboutDocument>('About', AboutSchema);
