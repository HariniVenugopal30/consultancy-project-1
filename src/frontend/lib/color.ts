export function hexToRgb(hex: string) {
  const normalized = hex.replace('#', '').trim();
  const h = normalized.length === 3
    ? normalized.split('').map(c => c + c).join('')
    : normalized;
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

export function rgbToHex({ r, g, b }: { r: number; g: number; b: number }) {
  const toHex = (v: number) => {
    const h = Math.max(0, Math.min(255, Math.round(v))).toString(16);
    return h.length === 1 ? '0' + h : h;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function clamp(v: number, a = 0, b = 255) {
  return Math.max(a, Math.min(b, v));
}

// Estimate pigment drops per RGB channel.
// perDropDelta: how many RGB units one drop changes (approx)
export function estimateDrops(baseHex: string, targetHex: string, perDropDelta = 8) {
  const base = hexToRgb(baseHex);
  const target = hexToRgb(targetHex);
  const dr = target.r - base.r;
  const dg = target.g - base.g;
  const db = target.b - base.b;

  const dropsR = Math.ceil(Math.abs(dr) / perDropDelta);
  const dropsG = Math.ceil(Math.abs(dg) / perDropDelta);
  const dropsB = Math.ceil(Math.abs(db) / perDropDelta);

  // Apply drops to simulate resulting color
  const appliedR = clamp(base.r + Math.sign(dr) * dropsR * perDropDelta);
  const appliedG = clamp(base.g + Math.sign(dg) * dropsG * perDropDelta);
  const appliedB = clamp(base.b + Math.sign(db) * dropsB * perDropDelta);

  return {
    drops: { r: dropsR, g: dropsG, b: dropsB },
    totalDrops: dropsR + dropsG + dropsB,
    simulatedHex: rgbToHex({ r: appliedR, g: appliedG, b: appliedB }),
    baseRgb: base,
    targetRgb: target,
    appliedRgb: { r: appliedR, g: appliedG, b: appliedB },
  };
}
