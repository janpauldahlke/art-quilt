"use client";

import React, { useEffect, useState } from "react";
import { UPLOAD_IMAGE_STORAGE_KEY } from "@/app/UploadPage/UploadComponent/UploadComponent";

export const PreviewBox = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);
    setImageBase64(stored);
  }, []);

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
        }}
      />
    </div>
  );
};
