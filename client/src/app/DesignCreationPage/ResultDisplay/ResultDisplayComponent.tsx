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

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Quilt Pattern</h2>
            <p className="text-xs text-gray-500">Generated design</p>
          </div>
        </div>
        {onClear && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* SVG Preview - Rendered directly for future interactivity */}
      <div 
        className="bg-gray-50 rounded-xl p-4 flex justify-center border border-gray-100 overflow-hidden"
      >
        <div 
          className="max-w-full max-h-[400px] [&>svg]:max-w-full [&>svg]:max-h-[400px] [&>svg]:w-auto [&>svg]:h-auto [&>svg_path]:transition-opacity [&>svg_path:hover]:opacity-80 [&>svg_rect:hover]:opacity-80"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-purple-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-purple-600">{design.shapes.length}</div>
          <div className="text-xs text-purple-700">Pieces</div>
        </div>
        <div className="bg-blue-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-blue-600">{design.colorPalette.length}</div>
          <div className="text-xs text-blue-700">Colors</div>
        </div>
        <div className="bg-green-50 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-green-600">{design.gridWidth}×{design.gridHeight}</div>
          <div className="text-xs text-green-700">Grid</div>
        </div>
      </div>

      {/* Color Palette */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Color Palette</p>
        <div className="flex gap-2 flex-wrap">
          {design.colorPalette.map((color, i) => (
            <div
              key={i}
              title={color}
              className="w-8 h-8 rounded-lg border border-gray-200 shadow-sm cursor-pointer hover:scale-110 transition-transform"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </div>

      {/* Fabric Size */}
      <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
        <p className="text-sm font-medium text-amber-800 mb-1">Finished Size</p>
        <p className="text-amber-900">
          <span className="font-bold">
            {Math.round(design.fabricData.totalWidthMm / 10)} × {Math.round(design.fabricData.totalHeightMm / 10)} cm
          </span>
          <span className="text-amber-700 text-sm ml-2">
            ({Math.round(design.fabricData.totalWidthMm / 25.4)} × {Math.round(design.fabricData.totalHeightMm / 25.4)} in)
          </span>
        </p>
      </div>

      {/* Metadata Toggle */}
      <button
        type="button"
        onClick={() => setShowMetadata(!showMetadata)}
        className="text-left text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center gap-2"
      >
        <svg className={`w-4 h-4 transition-transform ${showMetadata ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        Stitching Data (JSON)
      </button>

      {showMetadata && (
        <pre className="p-4 bg-gray-900 text-gray-100 rounded-xl text-xs overflow-auto max-h-48">
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
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={handleDownloadSvg}
          className="py-3 px-4 bg-purple-600 text-white font-medium rounded-xl hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          SVG
        </button>
        <button
          type="button"
          onClick={handleDownloadJson}
          className="py-3 px-4 bg-white text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Data
        </button>
      </div>
    </div>
  );
};
