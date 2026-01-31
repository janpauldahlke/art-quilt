"use client";

import { useCallback, useState } from "react";

type ClickInfo = {
  element: string;
  tagName: string;
  pixelX: number | null;
  pixelY: number | null;
  fill: string | null;
} | null;

export default function FlowerSvg({ svgContent }: { svgContent: string }) {
  const [clickInfo, setClickInfo] = useState<ClickInfo>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as SVGElement;
    if (!target || !(target instanceof SVGElement)) return;

    const svg = target.closest("svg");
    if (!svg) return;

    // Pixel in viewBox coordinates (your SVG is 20x13)
    const rect = svg.getBoundingClientRect();
    const scaleX = 20 / rect.width;
    const scaleY = 13 / rect.height;
    const pixelX = Math.floor((e.clientX - rect.left) * scaleX);
    const pixelY = Math.floor((e.clientY - rect.top) * scaleY);

    // For <rect> elements we have exact x,y attributes
    const rectX = target.getAttribute("x");
    const rectY = target.getAttribute("y");
    const fill = target.getAttribute("fill");

    const info = {
      element: target.tagName.toLowerCase(),
      tagName: target.tagName,
      pixelX: rectX !== null ? parseInt(rectX, 10) : pixelX,
      pixelY: rectY !== null ? parseInt(rectY, 10) : pixelY,
      fill,
    };
    console.log("Flower pixel clicked:", info);
    setClickInfo(info);
  }, []);

  return (
    <div className="inline-block" onClick={handleClick}>
      <div
        className="cursor-crosshair [&_svg]:max-h-[400px] [&_svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
      {clickInfo && (
        <div className="mt-2 rounded bg-gray-100 px-3 py-2 text-sm font-mono">
          <p>
            <strong>Element:</strong> {clickInfo.tagName}
          </p>
          <p>
            <strong>Pixel (x, y):</strong> ({clickInfo.pixelX},{" "}
            {clickInfo.pixelY})
          </p>
          {clickInfo.fill && (
            <p>
              <strong>Fill:</strong> {clickInfo.fill}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
