"use client";

import { useState } from "react";
import FlowerSvg from "./FlowerSvg";

type Status = "idle" | "loading" | "success" | "error";

export default function ImageToSvgResult() {
  const [status, setStatus] = useState<Status>("idle");
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus("loading");
    setErrorMessage(null);
    setSvgContent(null);
    try {
      const res = await fetch("/api/image-to-svg", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error ?? "Request failed");
        setStatus("error");
        return;
      }
      if (data.svg) {
        setSvgContent(data.svg);
        setStatus("success");
      } else {
        setErrorMessage("No SVG in response");
        setStatus("error");
      }
    } catch (e) {
      setErrorMessage((e as Error).message);
      setStatus("error");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-lg font-semibold text-gray-800">
        Image → Quilting SVG
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Uses <code className="rounded bg-gray-100 px-1">input.JPG</code> and the
        imageToSVG instructions to generate a pixel-grid SVG.
      </p>
      <button
        type="button"
        onClick={handleGenerate}
        disabled={status === "loading"}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
      >
        {status === "loading" ? "Generating…" : "Generate SVG"}
      </button>

      {status === "loading" && (
        <div className="mt-4 text-sm text-gray-500">Calling OpenAI…</div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {status === "success" && svgContent && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Result:</p>
          <div className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4">
            <FlowerSvg svgContent={svgContent} />
          </div>
        </div>
      )}
    </div>
  );
}
