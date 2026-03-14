'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Droplet, Palette } from 'lucide-react';
import { estimateDrops, hexToRgb } from '@/frontend/lib/color';

const DEFAULT_BASE = '#FFFFFF';
const DEFAULT_TARGET = '#FF3B3B';
const PER_DROP_DELTA = 8;
const ML_PER_DROP = 0.05;

function normalizeHex(value: string) {
  const raw = value.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return null;
}

export default function WallPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [baseColor, setBaseColor] = useState(DEFAULT_BASE);
  const [targetColor, setTargetColor] = useState(DEFAULT_TARGET);
  const [result, setResult] = useState(() => estimateDrops(DEFAULT_BASE, DEFAULT_TARGET, PER_DROP_DELTA));
  const [customMixColors, setCustomMixColors] = useState<string[]>(['#FFFF00', '#FF69B4', '#EE82EE']);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const rawUser = localStorage.getItem('authUser');

    if (!token || !rawUser) {
      router.replace('/admin/login');
      setIsCheckingAccess(false);
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as { role?: string };
      if (parsed.role !== 'admin') {
        router.replace('/admin/login');
        setIsCheckingAccess(false);
        return;
      }

      setIsAdmin(true);
    } catch {
      router.replace('/admin/login');
    } finally {
      setIsCheckingAccess(false);
    }
  }, [router]);

  const simulated = result.simulatedHex;

  const colorDistance = useMemo(() => {
    const dr = result.targetRgb.r - result.appliedRgb.r;
    const dg = result.targetRgb.g - result.appliedRgb.g;
    const db = result.targetRgb.b - result.appliedRgb.b;
    return Math.abs(dr) + Math.abs(dg) + Math.abs(db);
  }, [result]);

  const customColors = customMixColors.map((hex, index) => ({
    name: `Color ${index + 1}`,
    hex,
    setHex: (newHex: string) => {
      const updated = [...customMixColors];
      updated[index] = newHex;
      setCustomMixColors(updated);
    },
  }));

  const calculateCustomMixResult = useCallback((mixColorHex: string) => {
    const base = hexToRgb(baseColor);
    const target = hexToRgb(targetColor);
    const mixColor = hexToRgb(mixColorHex);

    // Calculate the difference we need to cover
    const dr = target.r - base.r;
    const dg = target.g - base.g;
    const db = target.b - base.b;

    // Calculate how much the mix color contributes per drop
    const mixDr = mixColor.r - base.r;
    const mixDg = mixColor.g - base.g;
    const mixDb = mixColor.b - base.b;

    // Estimate drops needed (simplified approach)
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

    return {
      drops: estimatedDrops,
      ml: estimatedMl,
      feasible: estimatedDrops > 0 && estimatedDrops < 1000,
    };
  }, [baseColor, targetColor]);

  const customMixResults = useMemo(() => {
    const results: Record<string, ReturnType<typeof calculateCustomMixResult>> = {};
    customMixColors.forEach((hex) => {
      results[hex] = calculateCustomMixResult(hex);
    });
    return results;
  }, [customMixColors, calculateCustomMixResult]);

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

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-pink-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900">Sample Paint Mixer</h1>
          <p className="text-gray-600 mt-2">
            Mix a 5ml sample: Select base color and desired color to estimate pigment drops needed.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -8 }}
              className="group bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-2xl"
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
                  onChange={(event) => setBaseColor(event.target.value)}
                  className="w-16 h-16 p-0 border-2 border-blue-200 rounded-lg cursor-pointer"
                />
                <input
                  aria-label="base hex"
                  value={baseColor}
                  onChange={(event) => setBaseColor(event.target.value)}
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
              className="group bg-gradient-to-br from-white to-pink-50 p-6 rounded-2xl shadow-lg border border-pink-100 transition-all duration-300 hover:shadow-2xl"
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
                  onChange={(event) => setTargetColor(event.target.value)}
                  className="w-16 h-16 p-0 border-2 border-pink-200 rounded-lg cursor-pointer"
                />
                <input
                  aria-label="target hex"
                  value={targetColor}
                  onChange={(event) => setTargetColor(event.target.value)}
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
                className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:shadow-2xl"
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
              className="group bg-gradient-to-br from-white to-blue-50 p-6 rounded-2xl shadow-lg border border-blue-100 transition-all duration-300 hover:shadow-2xl"
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

              <div className="bg-gradient-to-r from-blue-100 to-pink-100 p-4 rounded-lg border border-blue-300">
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
              className="group p-4 bg-gradient-to-br from-gray-50 via-white to-blue-50 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="text-sm font-semibold text-gray-900 mb-3">Wall Visualization</div>
              <div className="w-full h-80 flex items-center justify-center [perspective:1200px]">
                <div className="relative w-[420px] h-[260px] transition-transform duration-300 group-hover:scale-[1.02]">
                  <svg
                    viewBox="0 0 420 260"
                    className="w-[420px] h-[260px] rounded-[10px] shadow-[0_30px_50px_rgba(2,6,23,0.14)] [transform:rotateX(8deg)_rotateY(-12deg)]"
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
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/15 to-transparent rounded-[10px]" />
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
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

