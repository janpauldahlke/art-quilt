"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { QuiltDesign } from "@/app/util/imageProcessing";
import {
  QUILT_DESIGN_STORAGE_KEY,
  QUILT_SVG_STORAGE_KEY,
} from "@/app/DesignCreationPage/DesignCreationPage";

export default function ResultPage() {
  const router = useRouter();
  const [design] = useState<QuiltDesign | null>(() => {
    if (typeof window === "undefined") return null;
    const savedDesign = localStorage.getItem(QUILT_DESIGN_STORAGE_KEY);
    if (savedDesign) {
      try {
        return JSON.parse(savedDesign);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [svg] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(QUILT_SVG_STORAGE_KEY);
  });

  const handleDownloadSvg = useCallback(() => {
    if (!svg) return;
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quilt-pattern.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  const handleDownloadCuttingGuide = useCallback(() => {
    if (!design) return;
    const guide = generateCuttingGuide(design);
    const blob = new Blob([guide], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cutting-guide.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [design]);

  const handleDownloadJson = useCallback(() => {
    if (!design) return;
    const blob = new Blob([JSON.stringify(design, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quilt-design-complete.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [design]);

  if (!design || !svg) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
                ArtQuilt
              </Link>
            </div>
          </nav>
        </header>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-12 text-center max-w-lg mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No Design Found</h2>
            <p className="text-gray-500 mb-6">Please create a design first</p>
            <button
              type="button"
              onClick={() => router.push("/designcreation")}
              className="px-6 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors"
            >
              Go to Design Creation
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Count pieces by color
  const colorCounts: Record<string, number> = {};
  for (const shape of design.shapes) {
    colorCounts[shape.color] = (colorCounts[shape.color] || 0) + 1;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
              ArtQuilt
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-500">Step 3 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
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
            <h1 className="text-3xl font-bold text-gray-900">Your Quilt Pattern</h1>
            <p className="text-gray-600 mt-1">Download your files and start creating</p>
          </div>
          <button
            type="button"
            onClick={() => router.push("/designcreation")}
            className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Preview */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <div className="bg-gray-50 rounded-xl p-6 flex justify-center border border-gray-100 overflow-hidden">
                <div 
                  className="max-w-full [&>svg]:max-w-full [&>svg]:h-auto [&>svg_path]:transition-opacity [&>svg_path:hover]:opacity-80 [&>svg_path:hover]:cursor-pointer [&>svg_rect:hover]:opacity-80 [&>svg_rect:hover]:cursor-pointer"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </div>
            </div>

            {/* Download Actions */}
            <div className="grid sm:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={handleDownloadSvg}
                className="py-4 px-6 bg-purple-600 text-white font-semibold rounded-xl shadow-lg hover:bg-purple-700 hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                SVG Pattern
              </button>
              <button
                type="button"
                onClick={handleDownloadCuttingGuide}
                className="py-4 px-6 bg-green-600 text-white font-semibold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Cutting Guide
              </button>
              <button
                type="button"
                onClick={handleDownloadJson}
                className="py-4 px-6 bg-white text-gray-700 font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                JSON Data
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Summary Card */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pattern Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Pieces</span>
                  <span className="font-semibold text-gray-900">{design.shapes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Grid Size</span>
                  <span className="font-semibold text-gray-900">{design.gridWidth} × {design.gridHeight}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pattern Type</span>
                  <span className="font-semibold text-gray-900 capitalize">{design.shapeType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Colors Used</span>
                  <span className="font-semibold text-gray-900">{design.colorPalette.length}</span>
                </div>
              </div>
            </div>

            {/* Fabric Requirements */}
            <div className="bg-green-50 rounded-2xl border border-green-200 p-6">
              <h3 className="font-semibold text-green-800 mb-4">Fabric Requirements</h3>
              <div className="space-y-3 text-green-900">
                <div className="flex justify-between">
                  <span className="text-green-700">Finished Size</span>
                  <span className="font-semibold">
                    {Math.round(design.fabricData.totalWidthMm / 10)} × {Math.round(design.fabricData.totalHeightMm / 10)} cm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Piece Size</span>
                  <span className="font-semibold">
                    {design.fabricData.cellSizeMm}mm ({(design.fabricData.cellSizeMm / 25.4).toFixed(1)}&quot;)
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Seam Allowance</span>
                  <span className="font-semibold">
                    {design.fabricData.seamAllowanceMm}mm
                  </span>
                </div>
              </div>
            </div>

            {/* Color Breakdown */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Pieces by Color</h3>
              <div className="space-y-2">
                {Object.entries(colorCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([color, count]) => (
                    <div key={color} className="flex items-center gap-3">
                      <div
                        className="w-6 h-6 rounded-lg border border-gray-200 shadow-sm flex-shrink-0"
                        style={{ backgroundColor: color }}
                      />
                      <span className="flex-1 text-xs font-mono text-gray-500 truncate">{color}</span>
                      <span className="font-semibold text-gray-900">{count}</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Stitching Notes */}
            <div className="bg-amber-50 rounded-2xl border border-amber-200 p-6">
              <h3 className="font-semibold text-amber-800 mb-3">Stitching Notes</h3>
              <ul className="space-y-2 text-sm text-amber-900">
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Each piece includes {design.fabricData.seamAllowanceMm}mm seam allowance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  {design.shapes[0]?.stitchData?.edges ?? 4} edges per piece ({design.shapeType})
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Recommended stitch length: 2.5mm
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 mt-0.5">•</span>
                  Press seams open or to the dark side
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Start Over */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-gray-500 hover:text-gray-700 transition-colors text-sm"
          >
            ← Start a new design
          </button>
        </div>
      </main>
    </div>
  );
}

/**
 * Generate a human-readable cutting guide
 */
function generateCuttingGuide(design: QuiltDesign): string {
  const lines: string[] = [];

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("                    QUILT CUTTING GUIDE");
  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push("");
  lines.push("PATTERN SUMMARY");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push(`Pattern Type:      ${design.shapeType.toUpperCase()}`);
  lines.push(`Grid Size:         ${design.gridWidth} × ${design.gridHeight}`);
  lines.push(`Total Pieces:      ${design.shapes.length}`);
  lines.push(`Colors Used:       ${design.colorPalette.length}`);
  lines.push("");

  lines.push("FINISHED DIMENSIONS");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push(
    `Width:             ${Math.round(design.fabricData.totalWidthMm / 10)} cm (${Math.round(design.fabricData.totalWidthMm / 25.4)} inches)`
  );
  lines.push(
    `Height:            ${Math.round(design.fabricData.totalHeightMm / 10)} cm (${Math.round(design.fabricData.totalHeightMm / 25.4)} inches)`
  );
  lines.push("");

  lines.push("CUTTING SPECIFICATIONS");
  lines.push("───────────────────────────────────────────────────────────────");
  const cutSize = design.fabricData.cellSizeMm + design.fabricData.seamAllowanceMm * 2;
  lines.push(`Piece size (finished):  ${design.fabricData.cellSizeMm} mm`);
  lines.push(`Seam allowance:         ${design.fabricData.seamAllowanceMm} mm`);
  lines.push(`CUT SIZE (with seam):   ${cutSize} mm × ${cutSize} mm`);
  lines.push(`                        ${(cutSize / 25.4).toFixed(2)}" × ${(cutSize / 25.4).toFixed(2)}"`);
  lines.push("");

  const colorCounts: Record<string, number> = {};
  for (const shape of design.shapes) {
    colorCounts[shape.color] = (colorCounts[shape.color] || 0) + 1;
  }

  lines.push("FABRIC REQUIREMENTS BY COLOR");
  lines.push("───────────────────────────────────────────────────────────────");
  Object.entries(colorCounts)
    .sort((a, b) => b[1] - a[1])
    .forEach(([color, count], i) => {
      const areaPerPiece = cutSize * cutSize;
      const totalArea = areaPerPiece * count;
      const totalAreaSqIn = totalArea / (25.4 * 25.4);
      const fabricYards = totalAreaSqIn / (36 * 44);

      lines.push(
        `Color ${i + 1}: ${color.padEnd(8)} | ${String(count).padStart(4)} pieces | ~${fabricYards.toFixed(2)} yards`
      );
    });
  lines.push("");

  lines.push("STITCHING ORDER (Row by Row)");
  lines.push("───────────────────────────────────────────────────────────────");
  lines.push("1. Cut all pieces with seam allowance");
  lines.push("2. Organize by row");
  lines.push("3. Sew pieces in each row left to right");
  lines.push("4. Press seams in alternating directions per row");
  lines.push("5. Join rows from top to bottom");
  lines.push("6. Press final seams");
  lines.push("");

  lines.push("═══════════════════════════════════════════════════════════════");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("═══════════════════════════════════════════════════════════════");

  return lines.join("\n");
}
