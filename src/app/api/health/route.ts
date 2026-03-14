import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectToDatabase } from '@/backend/lib/db';

export async function GET() {
  try {
    await connectToDatabase();

    const state = mongoose.connection.readyState;

    return NextResponse.json({
      status: state === 1 ? 'ok' : 'degraded',
      database: {
        connected: state === 1,
        readyState: state,
        name: mongoose.connection.name,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        database: {
          connected: false,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
