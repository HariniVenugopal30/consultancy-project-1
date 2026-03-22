import { NextRequest, NextResponse } from 'next/server';
import {
  fetchMatcherWithFallback,
  getMatcherErrorMessage,
} from '@/backend/lib/color-matcher-proxy';

export async function POST(request: NextRequest) {
  try {
    const sourceFormData = await request.formData();
    const image = sourceFormData.get('image');
    const selectedHex = sourceFormData.get('selected_hex');

    if (!image || typeof image === 'string') {
      return NextResponse.json({ message: 'Image file is required' }, { status: 400 });
    }

    if (typeof selectedHex !== 'string' || !selectedHex.trim()) {
      return NextResponse.json({ message: 'selected_hex is required' }, { status: 400 });
    }

    let response: Response;

    try {
      response = await fetchMatcherWithFallback('/apply-color', async (url, init) => {
        const outboundFormData = new FormData();
        const filename = (image as any).name || 'image.jpg';
        outboundFormData.append('image', image, filename);
        outboundFormData.append('selected_hex', selectedHex);
        return fetch(url, { method: 'POST', body: outboundFormData, cache: 'no-store', ...init });
      });
    } catch {
      response = await fetchMatcherWithFallback(
        `/overlay-color?paint_hex=${encodeURIComponent(selectedHex)}`,
        async (url, init) => {
          const outboundFormData = new FormData();
          const filename = (image as any).name || 'image.jpg';
          outboundFormData.append('file', image, filename);
          return fetch(url, { method: 'POST', body: outboundFormData, cache: 'no-store', ...init });
        }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        { message: await getMatcherErrorMessage(response) },
        { status: response.status }
      );
    }

    const data = await response.arrayBuffer();
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': response.headers.get('Content-Type') ?? 'image/png',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reach color matcher backend';
    return NextResponse.json({ message }, { status: 502 });
  }
}
