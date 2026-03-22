'use client';

import { useState, useEffect } from 'react';
import { ImageIcon, Sparkles } from 'lucide-react';
import {
  applyColorOverlay,
  fetchMatchedColors,
  type ExtractedColorResult,
  type PaintMatch,
} from '@/frontend/lib/colorMatcherApi';

export default function AIColorMatcher() {
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
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      if (overlayPreviewUrl) URL.revokeObjectURL(overlayPreviewUrl);
    };
  }, [previewUrl, overlayPreviewUrl]);

  const activeExtractedColor = extractedColors[selectedExtractedIndex] ?? null;
  const rankedPaints = activeExtractedColor?.matches ?? [];
  const selectedPaint = rankedPaints.find((paint) => paint.product_id === selectedPaintId) ?? null;

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
    <div className="mb-12 mt-12 rounded-2xl border border-blue-100 bg-white p-6 md:p-10 shadow-lg mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <Sparkles className="text-blue-800 mb-2" size={32} />
        <h2 className="text-3xl font-bold text-gray-900">AI Image Color Matcher</h2>
        <p className="text-base text-gray-600 mt-2 max-w-2xl mx-auto">
          Upload a photo of your room, let our AI extract the dominant colors, and instantly preview recommended paint matches directly on your walls.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="space-y-4">
          <label className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <ImageIcon size={16} className="text-blue-800" />
            Upload image
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)}
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <button
            onClick={handleRunMatcher}
            disabled={!selectedFile || isMatching}
            className="w-full rounded-xl bg-blue-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 shadow-md"
          >
            {isMatching ? 'Matching Colors...' : 'Extract + Match Colors'}
          </button>

          <button
            onClick={handleApplyColor}
            disabled={!selectedPaint || isApplying}
            className="w-full rounded-xl border-2 border-blue-300 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-900 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isApplying ? 'Applying...' : 'Apply Paint to Image'}
          </button>

          <p className="text-xs text-gray-500 text-center">
            Tip: For the best results, use standard resolution, well-lit photos.
          </p>

          {matcherError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-800 shadow-sm">
              {matcherError}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Extracted Dominant Colors</p>
          {extractedColors.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 h-[240px] flex items-center justify-center">
              Upload an image and run matcher to view colors.
            </div>
          ) : (
            <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2">
              {extractedColors.map((entry, index) => (
                <button
                  key={`${entry.hex_code}-${index}`}
                  onClick={() => {
                    setSelectedExtractedIndex(index);
                    setSelectedPaintId(entry.matches?.[0]?.product_id ?? null);
                  }}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-left transition ${
                    selectedExtractedIndex === index
                      ? 'border-blue-400 bg-blue-50'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: entry.hex_code }}
                      />
                      <span className="text-sm font-semibold text-gray-900">{entry.hex_code}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-900">Recommended Products</p>
          {rankedPaints.length === 0 ? (
            <div className="rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-500 h-[240px] flex items-center justify-center">
              Select an extracted color to view recommendations.
            </div>
          ) : (
            <div className="max-h-[240px] overflow-auto space-y-2 pr-2">
              {rankedPaints.map((paint: PaintMatch) => (
                <button
                  key={paint.product_id}
                  onClick={() => setSelectedPaintId(paint.product_id)}
                  className={`w-full rounded-lg border-2 px-4 py-3 text-left transition ${
                    selectedPaintId === paint.product_id
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className="h-6 w-6 rounded-full border border-black/10 shadow-sm"
                        style={{ backgroundColor: paint.hex_code }}
                      />
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{paint.name}</p>
                        <p className="text-xs text-gray-600">{paint.brand} · {paint.hex_code}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-blue-900">{paint.accuracy.toFixed(1)}%</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Original Photo</p>
          {previewUrl ? (
            <img src={previewUrl} alt="Uploaded preview" className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200 shadow-sm bg-white" />
          ) : (
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500">
              No image selected
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 shadow-sm">
          <p className="text-sm font-semibold text-gray-700 mb-3 text-center">Simulated Paint Result</p>
          {overlayPreviewUrl ? (
            <img src={overlayPreviewUrl} alt="Applied paint preview" className="w-full h-auto max-h-96 object-contain rounded-lg border border-gray-200 shadow-sm bg-white" />
          ) : (
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-sm text-gray-500 text-center px-4">
              Apply a selected product match to generate preview
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
