import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ApiError } from './api-error';

export type AuthUser = {
  userId: string;
  role: 'admin' | 'customer';
};

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET environment variable');
  }

  return JWT_SECRET;
}

export function signToken(payload: AuthUser) {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getJwtSecret(), { expiresIn });
}

export function getAuthUser(request: NextRequest): AuthUser {
  const authHeader = request.headers.get('authorization');

  if (!authHeader) {
    throw new ApiError(401, 'Missing Authorization header');
  }

  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw new ApiError(401, 'Invalid Authorization header');
  }

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AuthUser;

    if (!decoded?.userId || !decoded?.role) {
      throw new ApiError(401, 'Invalid token payload');
    }

    return decoded;
  } catch {
    throw new ApiError(401, 'Invalid or expired token');
  }
}

export function requireAdmin(user: AuthUser) {
  if (user.role !== 'admin') {
    throw new ApiError(403, 'Admin access required');
  }
}
