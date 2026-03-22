const DEFAULT_MATCHER_BASE_URLS = [
  'http://127.0.0.1:8001',
  'http://127.0.0.1:8002',
  'http://127.0.0.1:8000',
];

function normalizeBaseUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed.replace(/\/+$/, '');
  }

  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/i.test(trimmed)) {
    return `http://${trimmed}`.replace(/\/+$/, '');
  }

  return trimmed.replace(/\/+$/, '');
}

export function getMatcherBaseUrls() {
  const configured = normalizeBaseUrl(
    process.env.COLOR_MATCHER_API_URL ?? process.env.NEXT_PUBLIC_COLOR_MATCHER_API_URL ?? ''
  );

  return [configured, ...DEFAULT_MATCHER_BASE_URLS].filter(
    (value, index, list): value is string => Boolean(value) && list.indexOf(value) === index
  );
}

export async function fetchMatcherWithFallback(
  path: string,
  requestBuilder: (fullUrl: string, init?: RequestInit) => Promise<Response>
) {
  const baseUrls = getMatcherBaseUrls();
  let lastError: Error | null = null;

  for (const baseUrl of baseUrls) {
    const fullUrl = `${baseUrl}${path}`;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await requestBuilder(fullUrl, { signal: controller.signal });
      clearTimeout(timeoutId);
      if (response.status === 404) {
        lastError = new Error(`Color matcher endpoint not found at ${fullUrl}`);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unable to reach color matcher backend');
    }
  }

  throw lastError ?? new Error('Unable to reach color matcher backend');
}

export async function getMatcherErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail ?? payload.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}
