import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = globalThis as unknown as { mongoose: MongooseCache | undefined };

const cached = globalForMongoose.mongoose ?? { conn: null, promise: null };

globalForMongoose.mongoose = cached;

export async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error('Missing MONGODB_URI environment variable');
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const connectWithRetry = async () => {
      try {
        const mongooseInstance = await mongoose.connect(MONGODB_URI!, {
          dbName: 'paintcalculator',
          bufferCommands: false,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
          retryWrites: true,
          retryReads: true,
        });
        return mongooseInstance;
      } catch (error) {
        console.error('MongoDB connection error:', error);
        // Reset the promise cache so next attempt can try again
        cached.promise = null;
        throw error;
      }
    };

    cached.promise = connectWithRetry();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    console.error('Failed to establish MongoDB connection:', error);
    cached.promise = null;
    throw error;
  }
}
