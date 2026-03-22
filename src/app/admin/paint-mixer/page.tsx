'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Droplet, ImageIcon, Palette, Sparkles } from 'lucide-react';
import { estimateDrops, hexToRgb } from '@/frontend/lib/color';
import {
  applyColorOverlay,
  fetchMatchedColors,
  type ExtractedColorResult,
  type PaintMatch,
} from '@/frontend/lib/colorMatcherApi';

const DEFAULT_BASE = '#FFFFFF';
const DEFAULT_TARGET = '#FF3B3B';
const PER_DROP_DELTA = 8;
const ML_PER_DROP = 0.05;

type AuthUser = {
  role: 'admin' | 'customer';
};

function normalizeHex(value: string) {
  const raw = value.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return null;
}

function shade(hex: string, percent: number) {
  const n = hex.replace('#', '');
  const num = parseInt(n, 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + Math.round(255 * (percent / 100))));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + Math.round(255 * (percent / 100))));
  const b = Math.min(255, Math.max(0, (num & 0xff) + Math.round(255 * (percent / 100))));
  const toHex = (value: number) => value.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function AdminPaintMixerPage() {
  const router = useRouter();
  const [baseColor, setBaseColor] = useState(DEFAULT_BASE);
  const [targetColor, setTargetColor] = useState(DEFAULT_TARGET);
  const [result, setResult] = useState(() => estimateDrops(DEFAULT_BASE, DEFAULT_TARGET, PER_DROP_DELTA));
  const [customMixColors, setCustomMixColors] = useState<string[]>(['#FFFF00', '#FF69B4', '#EE82EE']);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [extractedColors, setExtractedColors] = useState<ExtractedColorResult[]>([]);
  const [selectedExtractedIndex, setSelectedExtractedIndex] = useState(0);
  const [selectedPaintId, setSelectedPaintId] = useState<string | null>(null);
  const [overlayPreviewUrl, setOverlayPreviewUrl] = useState('');
  const [matcherError, setMatcherError] = useState('');
  const [isMatching, setIsMatching] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const rawUser = localStorage.getItem('authUser');

    if (!token || !rawUser) {
      router.replace('/admin/login');
      return;
    }

    try {
      const user = JSON.parse(rawUser) as AuthUser;
      if (user.role !== 'admin') {
        router.replace('/admin/login');
      }
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (overlayPreviewUrl) {
        URL.revokeObjectURL(overlayPreviewUrl);
      }
    };
  }, [previewUrl, overlayPreviewUrl]);

  const simulated = result.simulatedHex;

  const colorDistance = useMemo(() => {
    const dr = result.targetRgb.r - result.appliedRgb.r;
    const dg = result.targetRgb.g - result.appliedRgb.g;
    const db = result.targetRgb.b - result.appliedRgb.b;
    return Math.abs(dr) + Math.abs(dg) + Math.abs(db);
  }, [result]);

  const calculateCustomMixResult = useCallback((mixColorHex: string) => {
    const base = hexToRgb(baseColor);
    const target = hexToRgb(targetColor);
    const mixColor = hexToRgb(mixColorHex);

    const dr = target.r - base.r;
    const dg = target.g - base.g;
    const db = target.b - base.b;

    const mixDr = mixColor.r - base.r;
    const mixDg = mixColor.g - base.g;
    const mixDb = mixColor.b - base.b;

    let estimatedDrops = 0;
    if (Math.abs(mixDr) > 0.1 || Math.abs(mixDg) > 0.1 || Math.abs(mixDb) > 0.1) {
      const ratios = [];
      if (Math.abs(mixDr) > 0.1) ratios.push(dr / mixDr);
      if (Math.abs(mixDg) > 0.1) ratios.push(dg / mixDg);
      if (Math.abs(mixDb) > 0.1) ratios.push(db / mixDb);

      if (ratios.length > 0) {
        const avgRatio = ratios.reduce((a, b) => a + b, 0) / ratios.length;
        estimatedDrops = Math.max(0, Math.ceil(avgRatio / PER_DROP_DELTA));
      }
    }

    const estimatedMl = estimatedDrops * ML_PER_DROP;
    return { drops: estimatedDrops, ml: estimatedMl, feasible: estimatedDrops > 0 && estimatedDrops < 1000 };
  }, [baseColor, targetColor]);

  const customMixResults = useMemo(() => {
    const results: Record<string, ReturnType<typeof calculateCustomMixResult>> = {};
    customMixColors.forEach((hex) => { results[hex] = calculateCustomMixResult(hex); });
    return results;
  }, [customMixColors, calculateCustomMixResult]);

  // keep linter happy — customMixResults used only if we add the custom section
  void customMixResults;

  const activeExtractedColor = extractedColors[selectedExtractedIndex] ?? null;
  const rankedPaints = activeExtractedColor?.matches ?? [];
  const selectedPaint = rankedPaints.find((paint) => paint.product_id === selectedPaintId) ?? null;

  const updateEstimate = () => {
    const normalizedBase = normalizeHex(baseColor) ?? DEFAULT_BASE;
    const normalizedTarget = normalizeHex(targetColor) ?? DEFAULT_TARGET;
    setBaseColor(normalizedBase);
    setTargetColor(normalizedTarget);
    setResult(estimateDrops(normalizedBase, normalizedTarget, PER_DROP_DELTA));
  };

  const resetAll = () => {
    setBaseColor(DEFAULT_BASE);
    setTargetColor(DEFAULT_TARGET);
    setResult(estimateDrops(DEFAULT_BASE, DEFAULT_TARGET, PER_DROP_DELTA));
    setCustomMixColors(['#FFFF00', '#FF69B4', '#EE82EE']);
  };

  const handleFileChange = (file: File | null) => {
    setMatcherError('');
    setExtractedColors([]);
    setSelectedExtractedIndex(0);
    setSelectedPaintId(null);

    if (overlayPreviewUrl) {
      URL.revokeObjectURL(overlayPreviewUrl);
      setOverlayPreviewUrl('');
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    setSelectedFile(file);

    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRunMatcher = async () => {
    if (!selectedFile) {
      setMatcherError('Please upload an image first.');
      return;
    }

    setIsMatching(true);
    setMatcherError('');
    setExtractedColors([]);
    setSelectedPaintId(null);

    try {
      const data = await fetchMatchedColors(selectedFile, 'ciede2000');
      const extracted = data.extracted_colors ?? [];

      setExtractedColors(extracted);
      setSelectedExtractedIndex(0);
      setSelectedPaintId(extracted[0]?.matches?.[0]?.product_id ?? null);
    } catch (error) {
      setMatcherError(
        error instanceof Error ? error.message : 'Failed to match colors. Please verify backend is running.'
      );
    } finally {
      setIsMatching(false);
    }
  };

  const handleApplyColor = async () => {
    if (!selectedFile || !selectedPaint) {
      setMatcherError('Pick a paint match before applying color.');
      return;
    }

    setIsApplying(true);
    setMatcherError('');

    if (overlayPreviewUrl) {
      URL.revokeObjectURL(overlayPreviewUrl);
      setOverlayPreviewUrl('');
    }

    try {
      const nextPreviewUrl = await applyColorOverlay(selectedFile, selectedPaint.hex_code);
      setOverlayPreviewUrl(nextPreviewUrl);
    } catch (error) {
      setMatcherError(error instanceof Error ? error.message : 'Failed to apply selected paint color.');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Admin Paint Mixer Lab</h1>
          <p className="text-gray-600 mt-2">
            Combined workflow: AI color matching add-on plus manual 5ml mix estimator.
          </p>
        </div>

        <div className="mb-8 rounded-2xl border border-blue-100 bg-white p-6 shadow-lg">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="text-blue-800" size={18} />
            <h2 className="text-xl font-bold text-gray-900">AI Image Color Matcher (Add-on Integrated)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-5">
            Upload a room photo, extract dominant colors, pick a matched paint, and preview overlay.
          </p>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <ImageIcon size={16} className="text-blue-800" />
                Upload image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
              />

              <button
                onClick={handleRunMatcher}
                disabled={!selectedFile || isMatching}
                className="w-full rounded-xl bg-blue-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isMatching ? 'Matching Colors...' : 'Extract + Match Colors'}
              </button>

              <button
                onClick={handleApplyColor}
                disabled={!selectedPaint || isApplying}
                className="w-full rounded-xl border border-blue-300 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isApplying ? 'Applying...' : 'Apply Selected Paint to Image'}
              </button>

              <p className="text-xs text-gray-500">
                Tip: start the add-on backend and set NEXT_PUBLIC_COLOR_MATCHER_API_URL in project1 if not using localhost 8000-8002.
              </p>

              {matcherError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {matcherError}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Extracted colors</p>
              {extractedColors.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  Upload an image and run matcher to see extracted palette.
                </div>
              ) : (
                <div className="space-y-2">
                  {extractedColors.map((entry, index) => (
                    <button
                      key={`${entry.hex_code}-${index}`}
                      onClick={() => {
                        setSelectedExtractedIndex(index);
                        setSelectedPaintId(entry.matches?.[0]?.product_id ?? null);
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedExtractedIndex === index
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span
                            className="h-6 w-6 rounded-full border border-black/10"
                            style={{ backgroundColor: entry.hex_code }}
                          />
                          <span className="text-sm font-semibold text-gray-900">{entry.hex_code}</span>
                        </div>
                        <span className="text-xs text-gray-600">{entry.rgb.join(', ')}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-gray-900">Matched paints</p>
              {rankedPaints.length === 0 ? (
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
                  Select an extracted color to view paint matches.
                </div>
              ) : (
                <div className="max-h-70 overflow-auto space-y-2 pr-1">
                  {rankedPaints.map((paint: PaintMatch) => (
                    <button
                      key={paint.product_id}
                      onClick={() => setSelectedPaintId(paint.product_id)}
                      className={`w-full rounded-lg border px-3 py-2 text-left transition ${
                        selectedPaintId === paint.product_id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-blue-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-5 w-5 rounded-full border border-black/10"
                            style={{ backgroundColor: paint.hex_code }}
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{paint.name}</p>
                            <p className="text-xs text-gray-600">{paint.brand} · {paint.hex_code}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-semibold text-blue-900">{paint.accuracy.toFixed(2)}%</p>
                          <p className="text-[11px] text-gray-600">{paint.match_quality}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Original preview</p>
              {previewUrl ? (
                <img src={previewUrl} alt="Uploaded preview" className="w-full rounded-lg border border-gray-200" />
              ) : (
                <div className="h-52 rounded-lg border border-dashed border-gray-300 grid place-items-center text-sm text-gray-500">
                  No image selected
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-gray-50 p-3">
              <p className="text-xs font-semibold text-gray-600 mb-2">Applied paint preview</p>
              {overlayPreviewUrl ? (
                <img src={overlayPreviewUrl} alt="Applied paint preview" className="w-full rounded-lg border border-gray-200" />
              ) : (
                <div className="h-52 rounded-lg border border-dashed border-gray-300 grid place-items-center text-sm text-gray-500">
                  Apply a selected match to generate overlay preview
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              className="group bg-linear-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Palette className="text-blue-900" size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">Base color (5ml)</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  aria-label="base color"
                  type="color"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="w-16 h-16 p-0 border-2 border-blue-200 rounded-lg cursor-pointer"
                />
                <input
                  aria-label="base hex"
                  value={baseColor}
                  onChange={(e) => setBaseColor(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg w-44 text-gray-900 bg-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">5ml base paint sample</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              whileHover={{ y: -8 }}
              className="group bg-linear-to-br from-white to-pink-50 p-6 rounded-2xl shadow-lg border border-pink-100 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-pink-100 rounded-lg">
                  <Droplet className="text-pink-900" size={18} />
                </div>
                <p className="text-sm font-semibold text-gray-900">Desired color</p>
              </div>
              <div className="flex items-center gap-4">
                <input
                  aria-label="target color"
                  type="color"
                  value={targetColor}
                  onChange={(e) => setTargetColor(e.target.value)}
                  className="w-16 h-16 p-0 border-2 border-pink-200 rounded-lg cursor-pointer"
                />
                <input
                  aria-label="target hex"
                  value={targetColor}
                  onChange={(e) => setTargetColor(e.target.value)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-lg w-44 text-gray-900 bg-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-3">Target color for the 5ml sample</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={updateEstimate}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 bg-linear-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:shadow-2xl"
              >
                Update Estimate
              </motion.button>
              <motion.button
                onClick={resetAll}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-semibold transition-all duration-200 hover:bg-gray-50 hover:shadow-md"
              >
                Reset
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.24 }}
              whileHover={{ y: -8 }}
              className="group bg-linear-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-2xl"
            >
              <h2 className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <circle cx="6" cy="6" r="6" fill={result.simulatedHex} />
                </svg>
                Mix Result
              </h2>
              <p className="text-sm text-gray-600 mb-4">Pigment volume to add to 5ml base (approx)</p>

              <div className="grid grid-cols-3 gap-3 text-sm mb-3">
                <div className="bg-red-50 p-3 rounded-lg border border-red-200">
                  <div className="text-gray-600 text-xs font-semibold">Add Red (R)</div>
                  <div className="font-bold text-red-900 text-lg">{(result.drops.r * ML_PER_DROP).toFixed(2)} ml</div>
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                  <div className="text-gray-600 text-xs font-semibold">Add Green (G)</div>
                  <div className="font-bold text-green-900 text-lg">{(result.drops.g * ML_PER_DROP).toFixed(2)} ml</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                  <div className="text-gray-600 text-xs font-semibold">Add Blue (B)</div>
                  <div className="font-bold text-blue-900 text-lg">{(result.drops.b * ML_PER_DROP).toFixed(2)} ml</div>
                </div>
              </div>

              <div className="bg-linear-to-r from-blue-100 to-pink-100 p-4 rounded-lg border border-blue-300">
                <div className="text-gray-600 text-sm font-semibold">Total Volume</div>
                <div className="font-bold text-3xl text-blue-900">{(result.totalDrops * ML_PER_DROP).toFixed(2)} ml</div>
              </div>

              <div className="mt-4 text-xs text-gray-600">
                Simulated output: <span className="font-semibold text-gray-900">{result.simulatedHex}</span>
                {' • '}
                Match error: <span className="font-semibold text-gray-900">{colorDistance}</span>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.18 }}
              whileHover={{ y: -8 }}
              className="group p-4 bg-linear-to-br from-gray-50 via-white to-blue-50 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="text-sm font-semibold text-gray-900 mb-3">Wall Visualization</div>
              <div className="w-full h-80 flex items-center justify-center perspective-distant">
                <div className="relative w-105 h-65 transition-transform duration-300 group-hover:scale-[1.02]">
                  <svg
                    viewBox="0 0 420 260"
                    className="w-105 h-65 rounded-[10px] shadow-[0_30px_50px_rgba(2,6,23,0.14)] transform-[rotateX(8deg)_rotateY(-12deg)]"
                    role="img"
                    aria-label="Wall preview"
                  >
                    <defs>
                      <linearGradient id="wallMixGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={simulated} />
                        <stop offset="100%" stopColor={shade(simulated, -8)} />
                      </linearGradient>
                    </defs>
                    <rect x="0" y="0" width="420" height="260" rx="10" fill="url(#wallMixGradient)" />
                    <ellipse cx="170" cy="70" rx="130" ry="55" fill="rgba(255,255,255,0.12)" />
                  </svg>
                  <div className="absolute left-3 bottom-2.5 text-gray-900 font-semibold text-xs">
                    <div>Simulated mix</div>
                    <div>{simulated}</div>
                  </div>
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-linear-to-t from-black/15 to-transparent rounded-[10px]" />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.28 }}
              className="mt-4 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 space-y-3"
            >
              <p className="text-sm font-bold text-gray-900">Custom Mix Colors</p>
              {customMixColors.map((hex, index) => (
                <div key={index} className="flex items-center gap-3">
                  <input
                    aria-label={`custom color ${index + 1}`}
                    type="color"
                    value={hex}
                    onChange={(e) => {
                      const updated = [...customMixColors];
                      updated[index] = e.target.value;
                      setCustomMixColors(updated);
                    }}
                    className="w-10 h-10 p-0 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <div className="flex-1 text-xs text-gray-700">
                    <div className="font-semibold">{hex}</div>
                    {customMixResults[hex]?.feasible ? (
                      <div className="text-gray-500">{customMixResults[hex].drops} drops · {customMixResults[hex].ml.toFixed(2)} ml</div>
                    ) : (
                      <div className="text-gray-400">Not feasible</div>
                    )}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

