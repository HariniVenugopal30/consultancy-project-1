import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { getAuthUser, requireAdmin } from '@/lib/auth';
import { handleApiError } from '@/lib/api-error';
import { User } from '@/models/User';

export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    requireAdmin(user);

    await connectToDatabase();

    const users = await User.find({ role: { $ne: 'admin' } })
      .select('_id name email')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      users: users.map((item) => ({
        id: String(item._id),
        name: item.name,
        email: item.email,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
