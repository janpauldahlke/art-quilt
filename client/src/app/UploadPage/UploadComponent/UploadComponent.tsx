"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const STORAGE_KEY = "art-quilt-upload-image";
const MAX_DIMENSION = 1200;
const JPEG_QUALITY = 0.75;

/** Resize/compress image so it fits in localStorage (~5MB limit). */
function compressToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      let w = width;
      let h = height;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          w = MAX_DIMENSION;
          h = Math.round((height * MAX_DIMENSION) / width);
        } else {
          h = MAX_DIMENSION;
          w = Math.round((width * MAX_DIMENSION) / height);
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);
      try {
        const dataUrl = canvas.toDataURL("image/jpeg", JPEG_QUALITY);
        resolve(dataUrl);
      } catch (e) {
        reject(e);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };
    img.src = url;
  });
}

export const UploadComponent = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setImageBase64(stored);
  }, []);

  const persist = useCallback((base64: string | null) => {
    if (typeof window === "undefined") return;
    setStorageError(null);
    try {
      if (base64) localStorage.setItem(STORAGE_KEY, base64);
      else localStorage.removeItem(STORAGE_KEY);
      setImageBase64(base64);
    } catch (e) {
      if (e instanceof DOMException && e.name === "QuotaExceededError") {
        setStorageError(
          "Image too large to save locally. Try a smaller image.",
        );
      } else {
        setStorageError("Could not save image.");
      }
    }
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setStorageError(null);
      try {
        const base64 = await compressToDataUrl(file);
        persist(base64);
      } catch (e) {
        setStorageError(
          e instanceof Error ? e.message : "Failed to process image.",
        );
      }
    },
    [persist],
  );

  const remove = useCallback(() => {
    persist(null);
  }, [persist]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"], "image/png": [".png"] },
    maxFiles: 1,
    multiple: false,
    disabled: !!imageBase64,
  });

  const dropzoneStyle: React.CSSProperties = {
    border: "2px dashed #d4d4d4",
    borderRadius: 8,
    padding: 32,
    textAlign: "center",
    cursor: "pointer",
    outline: "none",
    ...(isDragActive && { borderColor: "#a3a3a3", backgroundColor: "#f5f5f5" }),
  };

  return (
    <div>
      {storageError && (
        <p
          style={{ color: "#b91c1c", fontSize: 14, marginBottom: 8 }}
          role="alert"
        >
          {storageError}
        </p>
      )}
      {!imageBase64 ? (
        <>
          <div {...getRootProps()} style={dropzoneStyle}>
            <input {...getInputProps()} />
            <span
              style={{
                display: "block",
                fontSize: "2rem",
                color: "#a3a3a3",
                marginBottom: 8,
              }}
              aria-hidden
            >
              ↓
            </span>
            <p style={{ color: "#525252", fontSize: 14 }}>
              {isDragActive
                ? "Drop image here"
                : "Drop one JPG or PNG here or click to choose"}
            </p>
          </div>
          <p
            style={{
              marginTop: 8,
              padding: "8px 12px",
              fontSize: 12,
              color: "#737373",
              backgroundColor: "#fafafa",
              border: "1px solid #e5e5e5",
              borderRadius: 4,
            }}
          >
            JPG, JPEG or PNG · Max {MAX_DIMENSION}px per side · Large images are
            resized and compressed for local storage
          </p>
        </>
      ) : (
        <div>
          <div>
            <img
              src={imageBase64}
              alt="Upload preview"
              width={160}
              height={120}
            />
          </div>
          <button type="button" onClick={remove}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
