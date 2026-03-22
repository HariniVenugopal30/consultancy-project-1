export type SemanticColorInfo = {
  hex: string;
  name: string;
  mood: string;
  recommended_for: string[];
};

export type PaintMatch = {
  id: number;
  product_id: string;
  name: string;
  hex_code: string;
  brand: string;
  price: number;
  delta_e: number;
  match_quality: string;
  accuracy: number;
  semantic_color: SemanticColorInfo;
};

export type ExtractedColorResult = {
  rgb: number[];
  hex_code: string;
  best_match: PaintMatch | null;
  alternatives: PaintMatch[];
  matches: PaintMatch[];
};

export type MatchColorsResponse = {
  extracted_colors: ExtractedColorResult[];
};

async function getErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string };
    return payload.detail ?? payload.message ?? `Request failed with status ${response.status}`;
  } catch {
    return `Request failed with status ${response.status}`;
  }
}

export async function fetchMatchedColors(file: File, algorithm = 'ciede2000') {
  const body = new FormData();
  body.append('file', file);

  let response: Response;
  try {
    response = await fetch(`/api/color-matcher/match?algorithm=${encodeURIComponent(algorithm)}`, {
      method: 'POST',
      body,
    });
  } catch {
    throw new Error('Unable to reach local API route /api/color-matcher/match');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return (await response.json()) as MatchColorsResponse;
}

export async function applyColorOverlay(file: File, selectedHex: string) {
  const applyFormData = new FormData();
  applyFormData.append('image', file);
  applyFormData.append('selected_hex', selectedHex);

  let response: Response;
  try {
    response = await fetch('/api/color-matcher/apply', {
      method: 'POST',
      body: applyFormData,
    });
  } catch {
    throw new Error('Unable to reach local API route /api/color-matcher/apply');
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return URL.createObjectURL(await response.blob());
}
