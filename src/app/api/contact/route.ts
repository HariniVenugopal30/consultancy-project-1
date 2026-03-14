import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/backend/lib/db';
import { Contact } from '@/backend/models/Contact';
import { ApiError, handleApiError } from '@/backend/lib/api-error';

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const name = String(payload?.name ?? '').trim();
    const email = String(payload?.email ?? '').trim().toLowerCase();
    const phoneRaw = String(payload?.phone ?? '').trim();
    const subject = String(payload?.subject ?? '').trim();
    const message = String(payload?.message ?? '').trim();
    const phone = phoneRaw.length > 0 ? phoneRaw : undefined;

    if (!name || !email || !subject || !message) {
      throw new ApiError(400, 'Name, email, subject, and message are required');
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new ApiError(400, 'Please provide a valid email address');
    }

    if (message.length < 10) {
      throw new ApiError(400, 'Message must be at least 10 characters long');
    }

    await connectToDatabase();

    const contact = await Contact.create({
      name,
      email,
      phone,
      subject,
      message,
    });

    return NextResponse.json({
      message: 'Contact request received',
      id: contact._id.toString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

