/* eslint-disable */
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRightLeft, Droplet, Palette, Play, Pause } from 'lucide-react';
import { estimateDrops, hexToRgb, rgbToHex } from '@/lib/color';

const DEFAULT_BASE = '#FFFFFF';
const DEFAULT_TARGET = '#FF3B3B';
const PER_DROP_DELTA = 8;
const ML_PER_DROP = 0.05;
const ML_PER_LITER = 1000;
const QUICK_COLORS = ['#FFFFFF', '#F2EFE6', '#FFE2C5', '#FFB347', '#6FC2FF', '#8CE99A', '#DDA0DD', '#FF3B3B'];

function normalizeHex(value: string) {
  const raw = value.trim().replace('#', '');
  if (/^[0-9a-fA-F]{3}$/.test(raw) || /^[0-9a-fA-F]{6}$/.test(raw)) {
    return `#${raw.toUpperCase()}`;
  }
  return null;
}

export default function PaintCalculatorPage() {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [baseColor, setBaseColor] = useState(DEFAULT_BASE);
  const [targetColor, setTargetColor] = useState(DEFAULT_TARGET);
  const [baseLiters, setBaseLiters] = useState(10);
  const [previewStep, setPreviewStep] = useState(100);
  const [compareSplit, setCompareSplit] = useState(50);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [result, setResult] = useState(() => estimateDrops(DEFAULT_BASE, DEFAULT_TARGET, PER_DROP_DELTA));

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

  const blendAccuracy = useMemo(() => {
    const accuracy = 100 - (colorDistance / 765) * 100;
    return Math.max(0, Math.min(100, accuracy));
  }, [colorDistance]);

  const livePreviewHex = useMemo(() => {
    const base = hexToRgb(baseColor);
    const simulatedRgb = hexToRgb(simulated);
    const ratio = previewStep / 100;

    return rgbToHex({
      r: base.r + (simulatedRgb.r - base.r) * ratio,
      g: base.g + (simulatedRgb.g - base.g) * ratio,
      b: base.b + (simulatedRgb.b - base.b) * ratio,
    });
  }, [baseColor, simulated, previewStep]);

  // Scale the result based on base liters
  const scaledResult = useMemo(() => {
    const scale = baseLiters / 0.005; // 5ml = 0.005 liters
    return {
      redLiters: (result.drops.r * ML_PER_DROP / ML_PER_LITER) * scale,
      greenLiters: (result.drops.g * ML_PER_DROP / ML_PER_LITER) * scale,
      blueLiters: (result.drops.b * ML_PER_DROP / ML_PER_LITER) * scale,
      totalLiters: (result.totalDrops * ML_PER_DROP / ML_PER_LITER) * scale + baseLiters,
    };
  }, [result, baseLiters]);

  const totalPigmentLiters = useMemo(
    () => scaledResult.redLiters + scaledResult.greenLiters + scaledResult.blueLiters,
    [scaledResult]
  );

  const distribution = useMemo(() => ({
    red: totalPigmentLiters ? (scaledResult.redLiters / totalPigmentLiters) * 100 : 0,
    green: totalPigmentLiters ? (scaledResult.greenLiters / totalPigmentLiters) * 100 : 0,
    blue: totalPigmentLiters ? (scaledResult.blueLiters / totalPigmentLiters) * 100 : 0,
  }), [scaledResult, totalPigmentLiters]);

  useEffect(() => {
    const normalizedBase = normalizeHex(baseColor);
    const normalizedTarget = normalizeHex(targetColor);
    if (!normalizedBase || !normalizedTarget) return;
    setResult(estimateDrops(normalizedBase, normalizedTarget, PER_DROP_DELTA));
  }, [baseColor, targetColor]);

  useEffect(() => {
    if (!isPlayingPreview) return;

    const id = setInterval(() => {
      setPreviewStep((previous) => {
        if (previous >= 100) return 0;
        return previous + 4;
      });
    }, 70);

    return () => clearInterval(id);
  }, [isPlayingPreview]);

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
    setBaseLiters(10);
    setPreviewStep(100);
    setIsPlayingPreview(false);
    setResult(estimateDrops(DEFAULT_BASE, DEFAULT_TARGET, PER_DROP_DELTA));
  };

  const swapColors = () => {
    const currentBase = baseColor;
    const currentTarget = targetColor;
    setBaseColor(currentTarget);
    setTargetColor(currentBase);

    const normalizedBase = normalizeHex(currentTarget) ?? DEFAULT_BASE;
    const normalizedTarget = normalizeHex(currentBase) ?? DEFAULT_TARGET;
    setResult(estimateDrops(normalizedBase, normalizedTarget, PER_DROP_DELTA));
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-gray-700">Checking admin access...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold text-gray-900">Paint Mixer Studio</h1>
            <p className="text-gray-600 mt-2">
              Calculate pigment amounts for large batches with live color blending feedback.
            </p>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-white/70 px-4 py-3 backdrop-blur-sm">
            <div className="text-xs font-semibold text-gray-600">Blend Accuracy</div>
            <div className="mt-1 flex items-center gap-3">
              <div className="h-2 w-32 overflow-hidden rounded-full bg-gray-200">
                <motion.div
                  className="h-full bg-emerald-500"
                  animate={{ width: `${blendAccuracy}%` }}
                  transition={{ duration: 0.35 }}
                />
              </div>
              <span className="text-lg font-bold text-gray-900">{blendAccuracy.toFixed(1)}%</span>
            </div>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-gray-600 mt-2">
            Select your base amount in liters, tune pigment strength, and refine until the simulated color is close to the target.
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
                <p className="text-sm font-semibold text-gray-900">Base color</p>
              </div>
              <div className="flex items-center gap-4 mb-4">
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
              <div className="flex flex-wrap gap-2 mb-4">
                {QUICK_COLORS.map((color) => (
                  <motion.button
                    key={`base-${color}`}
                    onClick={() => setBaseColor(color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-8 w-8 rounded-md border-2 border-white shadow-sm ring-1 ring-gray-200 transition-transform duration-200 hover:scale-110 hover:ring-gray-400"
                    style={{ backgroundColor: color }}
                    title={`Use ${color} as base`}
                    aria-label={`Use ${color} as base`}
                    suppressHydrationWarning
                  />
                ))}
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 mb-2 block">Amount (Liters)</label>
                <input
                  aria-label="base amount in liters"
                  type="number"
                  value={baseLiters}
                  onChange={(event) => setBaseLiters(Math.max(0.1, parseFloat(event.target.value) || 0))}
                  min="0.1"
                  step="0.5"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-gray-900 bg-white"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">Enter base paint volume in liters</p>
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
              <div className="flex flex-wrap gap-2 mt-4">
                {QUICK_COLORS.map((color) => (
                  <motion.button
                    key={`target-${color}`}
                    onClick={() => setTargetColor(color)}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="h-8 w-8 rounded-md border-2 border-white shadow-sm ring-1 ring-gray-200 transition-transform duration-200 hover:scale-110 hover:ring-gray-400"
                    style={{ backgroundColor: color }}
                    title={`Use ${color} as target`}
                    aria-label={`Use ${color} as target`}
                    suppressHydrationWarning
                  />
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-3">Target color for the paint batch</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              className="flex gap-3"
            >
              <motion.button
                onClick={updateEstimate}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex-1 bg-gradient-to-r from-blue-900 to-blue-700 text-white px-6 py-3 rounded-xl shadow-lg font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl"
              >
                Calculate Mix
              </motion.button>
              <motion.button
                onClick={swapColors}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-3 text-gray-900 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
              >
                <ArrowRightLeft size={16} />
                Swap
              </motion.button>
              <motion.button
                onClick={resetAll}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-6 py-3 rounded-xl border-2 border-gray-300 bg-white text-gray-900 font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md"
              >
                Reset
              </motion.button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.16 }}
              whileHover={{ y: -8 }}
              className="group bg-gradient-to-br from-white to-emerald-50 p-6 rounded-2xl shadow-lg border border-emerald-100 transition-all duration-300 hover:shadow-2xl"
            >
              <h2 className="font-bold text-lg text-gray-900 mb-1 flex items-center gap-2">
                <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                  <circle cx="6" cy="6" r="6" fill={result.simulatedHex} />
                </svg>
                Pigment Amounts
              </h2>
              <p className="text-sm text-gray-600 mb-4">Pigment volume needed for {baseLiters}L batch</p>

              <div className="grid grid-cols-3 gap-3 text-sm mb-4">
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <div className="text-gray-600 text-xs font-semibold">Red (R)</div>
                  <div className="font-bold text-red-900 text-xl">{scaledResult.redLiters.toFixed(3)} L</div>
                  <div className="text-xs text-gray-500 mt-1">{(scaledResult.redLiters * 1000).toFixed(1)} ml</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-gray-600 text-xs font-semibold">Green (G)</div>
                  <div className="font-bold text-green-900 text-xl">{scaledResult.greenLiters.toFixed(3)} L</div>
                  <div className="text-xs text-gray-500 mt-1">{(scaledResult.greenLiters * 1000).toFixed(1)} ml</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-gray-600 text-xs font-semibold">Blue (B)</div>
                  <div className="font-bold text-blue-900 text-xl">{scaledResult.blueLiters.toFixed(3)} L</div>
                  <div className="text-xs text-gray-500 mt-1">{(scaledResult.blueLiters * 1000).toFixed(1)} ml</div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-amber-100 to-orange-100 p-4 rounded-lg border border-amber-300">
                <div className="text-gray-700 text-sm font-semibold">Total Final Volume</div>
                <div className="font-bold text-3xl text-amber-900">{scaledResult.totalLiters.toFixed(2)} L</div>
              </div>

              <div className="mt-4 text-xs text-gray-600">
                Simulated result: <span className="font-semibold text-gray-900">{result.simulatedHex}</span>
                {' • '}
                Match error: <span className="font-semibold text-gray-900">{colorDistance}</span>
                {' • '}
                Total drops: <span className="font-semibold text-gray-900">{result.totalDrops}</span>
              </div>
            </motion.div>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -8 }}
              className="group p-6 bg-gradient-to-br from-gray-50 via-white to-emerald-50 rounded-2xl shadow-lg border border-gray-100 transition-all duration-300 hover:shadow-2xl"
            >
              <div className="text-sm font-semibold text-gray-900 mb-4">Batch Preview</div>
              <div className="space-y-3">
                <div className="relative h-32 rounded-lg overflow-hidden shadow-lg border-4 transition-transform duration-300 hover:scale-[1.02]" style={{ borderColor: baseColor }} suppressHydrationWarning>
                  <div
                    className="w-full h-full"
                    style={{ backgroundColor: livePreviewHex }}
                    suppressHydrationWarning
                  />
                  <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-black/10" />
                  <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 bg-gradient-to-t from-black/20 to-transparent" />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-700">Live blend preview</div>
                    <button
                      onClick={() => setIsPlayingPreview((previous) => !previous)}
                      className="inline-flex items-center gap-1 rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-sm"
                    >
                      {isPlayingPreview ? <Pause size={12} /> : <Play size={12} />}
                      {isPlayingPreview ? 'Pause' : 'Play'}
                    </button>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={previewStep}
                    onChange={(event) => {
                      setPreviewStep(Number(event.target.value));
                      setIsPlayingPreview(false);
                    }}
                    className="w-full"
                    aria-label="blend preview transition"
                  />
                  <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Base</span>
                    <span>{previewStep}% mixed</span>
                    <span>Simulated</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    {[0, 25, 50, 75, 100].map((step) => (
                      <button
                        key={step}
                        onClick={() => {
                          setPreviewStep(step);
                          setIsPlayingPreview(false);
                        }}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-200 hover:-translate-y-0.5 ${previewStep === step ? 'bg-blue-100 text-blue-900 shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      >
                        {step}%
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3 transition-all duration-300 hover:shadow-md">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-semibold text-gray-700">Target vs simulated</div>
                    <div className="text-[11px] text-gray-500">Drag to compare</div>
                  </div>
                  <div className="rounded-md border border-gray-200 p-2">
                    <div className="relative h-14 overflow-hidden rounded" suppressHydrationWarning>
                      <div className="absolute inset-0" style={{ backgroundColor: targetColor }} suppressHydrationWarning />
                      <div
                        className="absolute inset-y-0 left-0"
                        style={{ width: `${compareSplit}%`, backgroundColor: simulated }}
                        suppressHydrationWarning
                      />
                      <div
                        className="absolute inset-y-0 w-0.5 bg-white shadow"
                        style={{ left: `${compareSplit}%`, transform: 'translateX(-1px)' }}
                        suppressHydrationWarning
                      />
                      <div className="absolute left-2 top-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">Simulated</div>
                      <div className="absolute right-2 top-2 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold text-gray-700">Target</div>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={compareSplit}
                      onChange={(event) => setCompareSplit(Number(event.target.value))}
                      className="mt-2 w-full"
                      aria-label="target simulated comparison"
                    />
                    <div className="mt-1 flex items-center justify-between text-[11px] text-gray-500">
                      <span>{simulated}</span>
                      <span>{targetColor}</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-3 rounded-lg text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm" style={{ backgroundColor: `${baseColor}20`, borderLeft: `4px solid ${baseColor}` }} suppressHydrationWarning>
                    <div className="text-xs font-semibold text-gray-700">Base</div>
                    <div className="text-sm font-bold text-gray-900">{baseLiters}L</div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-blue-50 border-l-4 border-blue-500 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="text-xs font-semibold text-gray-700">Pigment</div>
                    <div className="text-sm font-bold text-blue-900">
                      {totalPigmentLiters.toFixed(2)}L
                    </div>
                  </div>
                  <div className="p-3 rounded-lg text-center bg-amber-50 border-l-4 border-amber-500 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm">
                    <div className="text-xs font-semibold text-gray-700">Total</div>
                    <div className="text-sm font-bold text-amber-900">{scaledResult.totalLiters.toFixed(2)}L</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs font-semibold text-gray-700 mb-2">Pigment Distribution</div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF0000' }} suppressHydrationWarning />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-red-500 h-full"
                          animate={{ width: `${distribution.red}%` }}
                          transition={{ duration: 0.35 }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{distribution.red.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00AA00' }} suppressHydrationWarning />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-green-500 h-full"
                          animate={{ width: `${distribution.green}%` }}
                          transition={{ duration: 0.35 }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{distribution.green.toFixed(0)}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0000FF' }} suppressHydrationWarning />
                      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                        <motion.div
                          className="bg-blue-500 h-full"
                          animate={{ width: `${distribution.blue}%` }}
                          transition={{ duration: 0.35 }}
                        />
                      </div>
                      <span className="text-xs text-gray-600 w-12 text-right">{distribution.blue.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
