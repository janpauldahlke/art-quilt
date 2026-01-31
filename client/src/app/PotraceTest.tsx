"use client";

import { useState, useRef } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function PotraceTest() {
  const [status, setStatus] = useState<Status>("idle");
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    setFileName(file?.name ?? null);
    setSvgContent(null);
    setErrorMessage(null);
    setStatus("idle");
  };

  const handleUseSampleImage = async () => {
    setStatus("loading");
    setErrorMessage(null);
    setSvgContent(null);
    setFileName("input.JPG (sample)");

    try {
      const res = await fetch("/api/generate-svg-sample", {
        method: "POST",
      });

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

  const handleGenerate = async () => {
    if (!selectedFile) {
      setErrorMessage("Please select an image first");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setSvgContent(null);

    try {
      const formData = new FormData();
      formData.append("image", selectedFile);

      const res = await fetch("/api/generate-svg", {
        method: "POST",
        body: formData,
      });

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
        Potrace Test (Vector Tracing)
      </h2>
      <p className="mb-4 text-sm text-gray-600">
        Upload an image to convert it to SVG using the{" "}
        <code className="rounded bg-gray-100 px-1">potrace</code> library.
      </p>

      <div className="mb-4 flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
        />
      </div>

      {fileName && (
        <p className="mb-4 text-sm text-gray-600">
          Selected: <strong>{fileName}</strong>
          {selectedFile && ` (${(selectedFile.size / 1024).toFixed(1)} KB)`}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleUseSampleImage}
          disabled={status === "loading"}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {status === "loading" ? "Generating…" : "Use input.JPG"}
        </button>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={status === "loading" || !selectedFile}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {status === "loading" ? "Generating…" : "Generate SVG (Potrace)"}
        </button>
      </div>

      {status === "loading" && (
        <div className="mt-4 text-sm text-gray-500">Processing with potrace…</div>
      )}

      {status === "error" && errorMessage && (
        <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      {status === "success" && svgContent && (
        <div className="mt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Result:</p>
          <div
            className="overflow-auto rounded-lg border border-gray-200 bg-gray-50 p-4"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
}
