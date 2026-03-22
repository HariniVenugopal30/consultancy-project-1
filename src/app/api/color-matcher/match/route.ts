import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMatcherWithFallback,
  getMatcherErrorMessage,
} from '@/backend/lib/color-matcher-proxy';

export async function POST(request: NextRequest) {
  try {
    const sourceFormData = await request.formData();
    const file = sourceFormData.get('file');
    const algorithm = request.nextUrl.searchParams.get('algorithm') ?? 'ciede2000';

    if (!file || typeof file === 'string') {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    const response = await fetchMatcherWithFallback(
      `/match-colors?algorithm=${encodeURIComponent(algorithm)}`,
      async (url, init) => {
        const outboundFormData = new FormData();
        const filename = (file as any).name || 'image.jpg';
        outboundFormData.append('file', file, filename);
        return fetch(url, { method: 'POST', body: outboundFormData, cache: 'no-store', ...init });
      }
    );

    if (!response.ok) {
      return NextResponse.json(
        { message: await getMatcherErrorMessage(response) },
        { status: response.status }
      );
    }

    const payload = await response.json();
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach color matcher backend';
    return NextResponse.json({ message }, { status: 502 });
  }
}
