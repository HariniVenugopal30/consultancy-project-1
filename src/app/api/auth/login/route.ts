import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { User } from '@/models/User';
import { ApiError, handleApiError } from '@/lib/api-error';
import { signToken } from '@/lib/auth';
import { consumeRateLimit, getClientIp } from '@/lib/rate-limit';

function isDatabaseUnavailableError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes('querysrv') ||
    message.includes('enotfound') ||
    message.includes('econnrefused') ||
    message.includes('server selection timed out') ||
    message.includes('failed to connect')
  );
}

function createOfflineAdminLogin(options: {
  normalizedEmail: string;
  normalizedUsername: string;
  usernameAsEmail: string;
  password: string;
}) {
  const adminUsername = (process.env.ADMIN_USERNAME ?? '').trim().toLowerCase();
  const adminEmail = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD ?? '';

  if (!adminPassword) {
    return null;
  }

  const emailMatches =
    Boolean(options.normalizedEmail || options.usernameAsEmail) &&
    Boolean(adminEmail) &&
    (options.normalizedEmail === adminEmail || options.usernameAsEmail === adminEmail);
  const usernameMatches =
    Boolean(options.normalizedUsername) &&
    Boolean(adminUsername) &&
    options.normalizedUsername.toLowerCase() === adminUsername;

  if (!emailMatches && !usernameMatches) {
    return null;
  }

  if (options.password !== adminPassword) {
    return null;
  }

  const displayName = process.env.ADMIN_DISPLAY_NAME ?? 'Admin';
  const loginEmail = adminEmail || `${adminUsername || 'admin'}@local.dev`;
  const userId = process.env.ADMIN_USER_ID ?? 'offline-admin';
  const token = signToken({ userId, role: 'admin' });

  return {
    token,
    user: {
      id: userId,
      name: displayName,
      email: loginEmail,
      role: 'admin' as const,
    },
  };
}

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rateLimit = consumeRateLimit(`auth:login:${ip}`, {
      windowMs: 15 * 60 * 1000,
      maxRequests: 8,
    });

    if (!rateLimit.success) {
      throw new ApiError(429, 'Too many login attempts. Please try again later.');
    }

    const payload = await request.json();
    const email = String(payload?.email ?? '');
    const username = String(payload?.username ?? '');
    const password = String(payload?.password ?? '');
    const normalizedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const normalizedUsername = typeof username === 'string' ? username.trim() : '';
    const usernameAsEmail = normalizedUsername.includes('@')
      ? normalizedUsername.toLowerCase()
      : '';

    if ((!normalizedEmail && !normalizedUsername) || !password) {
      throw new ApiError(400, 'Username or email and password are required');
    }

    if (password.length < 8) {
      throw new ApiError(400, 'Password must be at least 8 characters long');
    }

    try {
      await connectToDatabase();

      const user = await User.findOne(
        normalizedEmail || usernameAsEmail
          ? { email: normalizedEmail || usernameAsEmail }
          : {
              name: {
                $regex: `^${normalizedUsername.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`,
                $options: 'i',
              },
            }
      );
      if (!user) {
        throw new ApiError(401, 'Invalid username/email or password');
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new ApiError(401, 'Invalid username/email or password');
      }

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
      if (isDatabaseUnavailableError(error)) {
        const offlineAdmin = createOfflineAdminLogin({
          normalizedEmail,
          normalizedUsername,
          usernameAsEmail,
          password,
        });

        if (offlineAdmin) {
          return NextResponse.json(offlineAdmin);
        }

        throw new ApiError(
          503,
          'Database is unavailable. Use configured offline admin credentials or restore database connection.'
        );
      }

      throw error;
    }
  } catch (error) {
    return handleApiError(error);
  }
}
