"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { QuiltDesign } from "@/app/util/imageProcessing";
import {
  QUILT_DESIGN_STORAGE_KEY,
  QUILT_SVG_STORAGE_KEY,
} from "@/app/DesignCreationPage/DesignCreationPage";

export default function ResultPage() {
  const router = useRouter();
  const [design, setDesign] = useState<QuiltDesign | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedSvg = localStorage.getItem(QUILT_SVG_STORAGE_KEY);
    const savedDesign = localStorage.getItem(QUILT_DESIGN_STORAGE_KEY);

    if (savedSvg) setSvg(savedSvg);
    if (savedDesign) {
      try {
        setDesign(JSON.parse(savedDesign));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

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

    // Generate a cutting guide with all piece information
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
      <section>
        <h1>Result Page</h1>
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
            No design found. Please create a design first.
          </p>
          <button
            type="button"
            onClick={() => router.push("/designcreation")}
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
            Go to Design Creation
          </button>
        </div>
      </section>
    );
  }

  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  // Count pieces by color
  const colorCounts: Record<string, number> = {};
  for (const shape of design.shapes) {
    colorCounts[shape.color] = (colorCounts[shape.color] || 0) + 1;
  }

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
        <h1 style={{ margin: 0 }}>Quilt Pattern Result</h1>
        <button
          type="button"
          onClick={() => router.push("/designcreation")}
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
          ← Back to Design
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 400px",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* Main Preview */}
        <div>
          <div
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              border: "1px solid #e5e5e5",
              padding: 16,
              marginBottom: 24,
            }}
          >
            <img
              src={svgDataUrl}
              alt="Quilt pattern"
              style={{
                width: "100%",
                height: "auto",
                imageRendering: "pixelated",
              }}
            />
          </div>

          {/* Download Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button
              type="button"
              onClick={handleDownloadSvg}
              style={{
                flex: 1,
                padding: "14px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#6366f1",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Download SVG Pattern
            </button>
            <button
              type="button"
              onClick={handleDownloadCuttingGuide}
              style={{
                flex: 1,
                padding: "14px 20px",
                fontSize: 14,
                fontWeight: 600,
                color: "#fff",
                backgroundColor: "#10b981",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Download Cutting Guide
            </button>
            <button
              type="button"
              onClick={handleDownloadJson}
              style={{
                padding: "14px 20px",
                fontSize: 14,
                fontWeight: 500,
                color: "#525252",
                backgroundColor: "#fff",
                border: "1px solid #e5e5e5",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              JSON Data
            </button>
          </div>
        </div>

        {/* Sidebar with Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Summary Card */}
          <div
            style={{
              padding: 20,
              backgroundColor: "#fafafa",
              borderRadius: 12,
              border: "1px solid #e5e5e5",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
              Pattern Summary
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#737373" }}>Total Pieces</span>
                <span style={{ fontWeight: 600 }}>{design.shapes.length}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#737373" }}>Grid Size</span>
                <span style={{ fontWeight: 600 }}>
                  {design.gridWidth} × {design.gridHeight}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#737373" }}>Pattern Type</span>
                <span
                  style={{
                    fontWeight: 600,
                    textTransform: "capitalize",
                  }}
                >
                  {design.shapeType}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#737373" }}>Colors Used</span>
                <span style={{ fontWeight: 600 }}>
                  {design.colorPalette.length}
                </span>
              </div>
            </div>
          </div>

          {/* Fabric Requirements */}
          <div
            style={{
              padding: 20,
              backgroundColor: "#ecfdf5",
              borderRadius: 12,
              border: "1px solid #a7f3d0",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px",
                fontSize: 16,
                fontWeight: 600,
                color: "#065f46",
              }}
            >
              Fabric Requirements
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#047857" }}>Finished Size</span>
                <span style={{ fontWeight: 600, color: "#065f46" }}>
                  {Math.round(design.fabricData.totalWidthMm / 10)} ×{" "}
                  {Math.round(design.fabricData.totalHeightMm / 10)} cm
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#047857" }}>Piece Size</span>
                <span style={{ fontWeight: 600, color: "#065f46" }}>
                  {design.fabricData.cellSizeMm} mm (
                  {(design.fabricData.cellSizeMm / 25.4).toFixed(1)}")
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#047857" }}>Seam Allowance</span>
                <span style={{ fontWeight: 600, color: "#065f46" }}>
                  {design.fabricData.seamAllowanceMm} mm (
                  {(design.fabricData.seamAllowanceMm / 25.4).toFixed(2)}")
                </span>
              </div>
            </div>
          </div>

          {/* Color Breakdown */}
          <div
            style={{
              padding: 20,
              backgroundColor: "#fafafa",
              borderRadius: 12,
              border: "1px solid #e5e5e5",
            }}
          >
            <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 600 }}>
              Pieces by Color
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {Object.entries(colorCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([color, count]) => (
                  <div
                    key={color}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        backgroundColor: color,
                        borderRadius: 4,
                        border: "1px solid rgba(0,0,0,0.1)",
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 12,
                        fontFamily: "monospace",
                        color: "#737373",
                      }}
                    >
                      {color}
                    </span>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>
                      {count}
                    </span>
                  </div>
                ))}
            </div>
          </div>

          {/* Stitching Info */}
          <div
            style={{
              padding: 20,
              backgroundColor: "#fef3c7",
              borderRadius: 12,
              border: "1px solid #fcd34d",
            }}
          >
            <h3
              style={{
                margin: "0 0 12px",
                fontSize: 16,
                fontWeight: 600,
                color: "#92400e",
              }}
            >
              Stitching Notes
            </h3>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 13,
                color: "#78350f",
                lineHeight: 1.6,
              }}
            >
              <li>
                Each piece includes{" "}
                {design.fabricData.seamAllowanceMm}mm seam allowance
              </li>
              <li>
                {design.shapes[0]?.stitchData.edges} edges per piece (
                {design.shapeType})
              </li>
              <li>
                Recommended stitch length: 2.5mm for cotton
              </li>
              <li>
                Press seams open or to the dark side
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
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

  // Count by color
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
      const fabricYards = totalAreaSqIn / (36 * 44); // assuming 44" wide fabric

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
