"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PreviewBox } from "./Preview/previewBox";
import { FormGroup, DEFAULT_SETTINGS, type QuiltSettings } from "./FormGroup/FormGroup";
import { ResultDisplayComponent } from "./ResultDisplay/ResultDisplayComponent";
import { processImageToQuiltSvg, type QuiltDesign } from "@/app/util/imageProcessing";
import { UPLOAD_IMAGE_STORAGE_KEY } from "@/app/UploadPage/UploadComponent/UploadComponent";

export const QUILT_DESIGN_STORAGE_KEY = "art-quilt-design";
export const QUILT_SVG_STORAGE_KEY = "art-quilt-svg";

export default function DesignCreationPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<QuiltSettings>(DEFAULT_SETTINGS);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState<{ svg: string; design: QuiltDesign } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasImage, setHasImage] = useState(false);

  // Check if we have an image on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);
    setHasImage(!!stored);

    // Also check for previously generated design
    const savedSvg = localStorage.getItem(QUILT_SVG_STORAGE_KEY);
    const savedDesign = localStorage.getItem(QUILT_DESIGN_STORAGE_KEY);
    if (savedSvg && savedDesign) {
      try {
        setResult({ svg: savedSvg, design: JSON.parse(savedDesign) });
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  const handleProcess = useCallback(async () => {
    if (typeof window === "undefined") return;

    const imageDataUrl = localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);
    if (!imageDataUrl) {
      setError("No image found. Please upload or generate an image first.");
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const result = await processImageToQuiltSvg(imageDataUrl, {
        gridWidth: settings.granularity,
        numColors: settings.colorCount,
        shapeType: settings.style,
        cellSizeMm: 25,
        seamAllowanceMm: 6.35,
        voronoiSettings: settings.voronoi,
      });

      setResult(result);

      // Save to localStorage for the result page
      localStorage.setItem(QUILT_SVG_STORAGE_KEY, result.svg);
      localStorage.setItem(QUILT_DESIGN_STORAGE_KEY, JSON.stringify(result.design));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed");
    } finally {
      setProcessing(false);
    }
  }, [settings]);

  const handleClearResult = useCallback(() => {
    setResult(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(QUILT_SVG_STORAGE_KEY);
      localStorage.removeItem(QUILT_DESIGN_STORAGE_KEY);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
              ArtQuilt
            </a>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-500">Step 2 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
                <div className="w-8 h-1.5 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Design Your Quilt</h1>
            <p className="text-gray-600 mt-1">Adjust settings and generate your pattern</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        {!hasImage ? (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Image Found</h2>
            <p className="text-gray-500 mb-6">Please upload or generate an image first</p>
            <button
              type="button"
              onClick={() => router.push("/upload")}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Go to Upload
            </button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Left Column - Base Image (Small) */}
            <div className="lg:col-span-1">
              <PreviewBox />
            </div>

            {/* Middle Column - Quilt Pattern (Large) */}
            <div className="lg:col-span-2">
              {result ? (
                <ResultDisplayComponent
                  svg={result.svg}
                  design={result.design}
                  onClear={handleClearResult}
                />
              ) : (
                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 h-full flex flex-col items-center justify-center min-h-[400px]">
                  <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mb-6">
                    <svg className="w-10 h-10 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Generate</h3>
                  <p className="text-gray-500 text-center max-w-sm">
                    Adjust the settings on the right and click "Generate Quilt Pattern" to create your design
                  </p>
                </div>
              )}

              {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {result && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    onClick={() => router.push("/result")}
                    className="px-8 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all flex items-center gap-3"
                  >
                    Continue to Final Result
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            {/* Right Column - Settings */}
            <div className="lg:col-span-1">
              <FormGroup
                settings={settings}
                onChange={setSettings}
                onProcess={handleProcess}
                processing={processing}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
