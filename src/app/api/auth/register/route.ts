import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { User } from '@/backend/models/User';
import { ApiError, handleApiError } from '@/backend/lib/api-error';
import { signToken } from '@/backend/lib/auth';
import { consumeRateLimit, getClientIp } from '@/backend/lib/rate-limit';

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`auth:register:${ip}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 6,
    });

    if (!rateLimit.success) {
      throw new ApiError(429, 'Too many signup attempts. Please try again later.');
    }

    const payload = await request.json();
    const name = String(payload?.name ?? '').trim();
    const email = String(payload?.email ?? '').trim().toLowerCase();
    const password = String(payload?.password ?? '');

    if (!name || !email || !password) {
      throw new ApiError(400, 'Name, email, and password are required');
    }

    if (name.length < 2) {
      throw new ApiError(400, 'Name must be at least 2 characters long');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'customer',
    });

    const token = signToken({ userId: user._id.toString(), role: user.role });

    return NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

