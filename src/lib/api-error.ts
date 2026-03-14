import { NextResponse } from 'next/server';

export class ApiError extends Error {
  statusCode: number;
  details?: Record<string, unknown>;

  constructor(statusCode: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details ?? null,
      },
      { status: error.statusCode }
    );
  }

  if (error instanceof Error && process.env.NODE_ENV !== 'production') {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { message: 'Internal server error' },
    { status: 500 }
  );
}
