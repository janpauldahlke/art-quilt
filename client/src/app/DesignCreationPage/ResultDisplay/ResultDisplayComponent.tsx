"use client";

import { useCallback, useState } from "react";
import type { QuiltDesign } from "@/app/util/imageProcessing";

type ResultDisplayProps = {
  svg: string;
  design: QuiltDesign;
  onClear?: () => void;
};

export const ResultDisplayComponent = ({
  svg,
  design,
  onClear,
}: ResultDisplayProps) => {
  const [showMetadata, setShowMetadata] = useState(false);

  const handleDownloadSvg = useCallback(() => {
    const blob = new Blob([svg], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quilt-design.svg";
    a.click();
    URL.revokeObjectURL(url);
  }, [svg]);

  const handleDownloadJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(design, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "quilt-design-data.json";
    a.click();
    URL.revokeObjectURL(url);
  }, [design]);

  // Create a data URL from SVG for display
  const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>
          Quilt Pattern
        </h2>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            style={{
              padding: "4px 10px",
              fontSize: 12,
              color: "#737373",
              backgroundColor: "transparent",
              border: "1px solid #e5e5e5",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Clear
          </button>
        )}
      </div>

      {/* SVG Preview */}
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 8,
          border: "1px solid #e5e5e5",
          padding: 8,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <img
          src={svgDataUrl}
          alt="Quilt pattern preview"
          style={{
            maxWidth: "100%",
            height: "auto",
            maxHeight: 400,
            imageRendering: "pixelated",
          }}
        />
      </div>

      {/* Quick Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 8,
        }}
      >
        <div
          style={{
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
            {design.shapes.length}
          </div>
          <div style={{ fontSize: 11, color: "#737373" }}>Pieces</div>
        </div>
        <div
          style={{
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
            {design.colorPalette.length}
          </div>
          <div style={{ fontSize: 11, color: "#737373" }}>Colors</div>
        </div>
        <div
          style={{
            padding: 12,
            backgroundColor: "#f5f5f5",
            borderRadius: 6,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 20, fontWeight: 700, color: "#6366f1" }}>
            {design.gridWidth}×{design.gridHeight}
          </div>
          <div style={{ fontSize: 11, color: "#737373" }}>Grid</div>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#525252",
            marginBottom: 8,
          }}
        >
          Color Palette
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {design.colorPalette.map((color, i) => (
            <div
              key={i}
              title={color}
              style={{
                width: 32,
                height: 32,
                backgroundColor: color,
                borderRadius: 4,
                border: "1px solid rgba(0,0,0,0.1)",
                cursor: "pointer",
              }}
            />
          ))}
        </div>
      </div>

      {/* Fabric Dimensions */}
      <div
        style={{
          padding: 12,
          backgroundColor: "#fef3c7",
          borderRadius: 8,
          border: "1px solid #fcd34d",
        }}
      >
        <div
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#92400e",
            marginBottom: 4,
          }}
        >
          Real-World Size
        </div>
        <div style={{ fontSize: 14, color: "#78350f" }}>
          {Math.round(design.fabricData.totalWidthMm / 10)} ×{" "}
          {Math.round(design.fabricData.totalHeightMm / 10)} cm
          <span style={{ fontSize: 12, color: "#92400e", marginLeft: 8 }}>
            ({Math.round(design.fabricData.totalWidthMm / 25.4)} ×{" "}
            {Math.round(design.fabricData.totalHeightMm / 25.4)} inches)
          </span>
        </div>
        <div style={{ fontSize: 12, color: "#92400e", marginTop: 4 }}>
          Cell size: {design.fabricData.cellSizeMm}mm | Seam:{" "}
          {design.fabricData.seamAllowanceMm}mm
        </div>
      </div>

      {/* Metadata Toggle */}
      <button
        type="button"
        onClick={() => setShowMetadata(!showMetadata)}
        style={{
          padding: "8px 12px",
          fontSize: 12,
          color: "#525252",
          backgroundColor: "#f5f5f5",
          border: "1px solid #e5e5e5",
          borderRadius: 6,
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        {showMetadata ? "▼" : "▶"} Stitching Data (JSON)
      </button>

      {showMetadata && (
        <pre
          style={{
            padding: 12,
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            borderRadius: 8,
            fontSize: 11,
            overflow: "auto",
            maxHeight: 200,
            margin: 0,
          }}
        >
          {JSON.stringify(
            {
              fabricData: design.fabricData,
              gridSize: { width: design.gridWidth, height: design.gridHeight },
              shapeType: design.shapeType,
              sampleShape: design.shapes[0],
            },
            null,
            2
          )}
        </pre>
      )}

      {/* Download Buttons */}
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          onClick={handleDownloadSvg}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 500,
            color: "#fff",
            backgroundColor: "#6366f1",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Download SVG
        </button>
        <button
          type="button"
          onClick={handleDownloadJson}
          style={{
            flex: 1,
            padding: "10px 16px",
            fontSize: 13,
            fontWeight: 500,
            color: "#525252",
            backgroundColor: "#fff",
            border: "1px solid #e5e5e5",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Download Data
        </button>
      </div>
    </div>
  );
};
