"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

const STORAGE_KEY = "art-quilt-upload-image";

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") resolve(result);
      else reject(new Error("Expected string result"));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export const UploadComponent = () => {
  const [imageBase64, setImageBase64] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) setImageBase64(stored);
  }, []);

  const persist = useCallback((base64: string | null) => {
    if (typeof window === "undefined") return;
    if (base64) localStorage.setItem(STORAGE_KEY, base64);
    else localStorage.removeItem(STORAGE_KEY);
    setImageBase64(base64);
  }, []);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const base64 = await fileToBase64(file);
      persist(base64);
    },
    [persist]
  );

  const remove = useCallback(() => {
    persist(null);
  }, [persist]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/jpeg": [".jpg", ".jpeg"] },
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
      {!imageBase64 ? (
        <div {...getRootProps()} style={dropzoneStyle}>
          <input {...getInputProps()} />
          <span style={{ display: "block", fontSize: "2rem", color: "#a3a3a3", marginBottom: 8 }} aria-hidden>↓</span>
          <p style={{ color: "#525252", fontSize: 14 }}>
            {isDragActive ? "Drop JPG here" : "Drop one JPG here or click to choose"}
          </p>
        </div>
      ) : (
        <div>
          <div>
            <img src={imageBase64} alt="Upload preview" width={160} height={120} />
          </div>
          <button type="button" onClick={remove}>
            Remove
          </button>
        </div>
      )}
    </div>
  );
};
