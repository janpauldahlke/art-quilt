"use client";

import React, { useEffect, useState } from "react";
import { UPLOAD_IMAGE_STORAGE_KEY } from "@/app/UploadPage/UploadComponent/UploadComponent";

type Status = "idle" | "loading" | "success" | "error";

export const PreviewBox = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);
    setImageBase64(stored);
  }, []);

  const handleGenerateSVG = async () => {
    if (!imageBase64) {
      setErrorMessage("No image available");
      setStatus("error");
      return;
    }

    setStatus("loading");
    setErrorMessage(null);
    setSvgContent(null);

    try {
      // Convert base64 data URL to File/Blob for the API
      const response = await fetch(imageBase64);
      const blob = await response.blob();
      const file = new File([blob], "image.png", { type: blob.type });

      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/generate-svg", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error ?? "Failed to generate SVG");
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

  const containerStyle: React.CSSProperties = {
    maxWidth: "30vw",
    flexShrink: 0,
  };

  if (!imageBase64) {
    return (
      <div style={containerStyle}>
        <h2>Preview</h2>
        <p style={{ color: "#737373", fontSize: 14 }}>
          No image yet. Upload or generate one on the Upload page.
        </p>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2>Preview</h2>
      <img
        src={imageBase64}
        alt="Preview"
        style={{
          maxWidth: "100%",
          height: "auto",
          borderRadius: 8,
          display: "block",
          marginBottom: 16,
        }}
      />
      <button
        type="button"
        onClick={handleGenerateSVG}
        disabled={status === "loading"}
        style={{
          padding: "10px 20px",
          fontSize: 14,
          fontWeight: 500,
          color: "#fff",
          backgroundColor: status === "loading" ? "#9ca3af" : "#10b981",
          border: "none",
          borderRadius: 8,
          cursor: status === "loading" ? "not-allowed" : "pointer",
          width: "100%",
          transition: "background-color 0.15s",
        }}
      >
        {status === "loading" ? "Generating SVG..." : "Generate Quilting Pattern (SVG)"}
      </button>

      {status === "error" && errorMessage && (
        <div
          style={{
            marginTop: 12,
            padding: "12px",
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            color: "#991b1b",
            fontSize: 14,
          }}
        >
          {errorMessage}
        </div>
      )}

      {status === "success" && svgContent && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
            Generated Quilting Pattern:
          </h3>
          <div
            style={{
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              padding: 16,
              backgroundColor: "#fafafa",
              overflow: "auto",
              maxHeight: "400px",
            }}
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
        </div>
      )}
    </div>
  );
};
