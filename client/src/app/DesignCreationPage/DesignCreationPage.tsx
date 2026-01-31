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
        cellSizeMm: 25, // 1 inch squares
        seamAllowanceMm: 6.35, // 1/4 inch seam
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
    <section>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0 }}>Design Creation</h1>
        <button
          type="button"
          onClick={() => router.push("/upload")}
          style={{
            padding: "8px 16px",
            fontSize: 13,
            color: "#525252",
            backgroundColor: "#f5f5f5",
            border: "1px solid #e5e5e5",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          ← Back to Upload
        </button>
      </div>

      {!hasImage ? (
        <div
          style={{
            padding: 40,
            textAlign: "center",
            backgroundColor: "#fafafa",
            borderRadius: 12,
            border: "1px dashed #d4d4d4",
          }}
        >
          <p style={{ color: "#525252", fontSize: 16, marginBottom: 16 }}>
            No image found. Please upload or generate an image first.
          </p>
          <button
            type="button"
            onClick={() => router.push("/upload")}
            style={{
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 500,
              color: "#fff",
              backgroundColor: "#6366f1",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Go to Upload Page
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 280px",
            gap: 24,
            alignItems: "start",
          }}
        >
          {/* Main content area */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            {/* Source and Result side by side */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: result ? "1fr 1fr" : "1fr",
                gap: 24,
              }}
            >
              <PreviewBox />
              {result && (
                <ResultDisplayComponent
                  svg={result.svg}
                  design={result.design}
                  onClear={handleClearResult}
                />
              )}
            </div>

            {error && (
              <div
                style={{
                  padding: 16,
                  backgroundColor: "#fef2f2",
                  borderRadius: 8,
                  border: "1px solid #fecaca",
                }}
              >
                <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>
                  {error}
                </p>
              </div>
            )}

            {result && (
              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={() => router.push("/result")}
                  style={{
                    padding: "12px 24px",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#fff",
                    backgroundColor: "#10b981",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                  }}
                >
                  Continue to Result →
                </button>
              </div>
            )}
          </div>

          {/* Settings sidebar */}
          <FormGroup
            settings={settings}
            onChange={setSettings}
            onProcess={handleProcess}
            processing={processing}
          />
        </div>
      )}
    </section>
  );
}
