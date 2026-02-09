"use client";

import { useCallback, useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";

export const UPLOAD_IMAGE_STORAGE_KEY = "art-quilt-upload-image";
const STORAGE_KEY = UPLOAD_IMAGE_STORAGE_KEY;
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

type UploadComponentProps = {
  onImageChange?: (hasImage: boolean) => void;
};

export const UploadComponent = ({ onImageChange }: UploadComponentProps) => {
  const [imageBase64, setImageBase64] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(STORAGE_KEY);
  });
  const [storageError, setStorageError] = useState<string | null>(null);

  useEffect(() => {
    onImageChange?.(!!imageBase64);
  }, [imageBase64, onImageChange]);

  const persist = useCallback(
    (base64: string | null) => {
      if (typeof window === "undefined") return;
      setStorageError(null);
      try {
        if (base64) localStorage.setItem(STORAGE_KEY, base64);
        else localStorage.removeItem(STORAGE_KEY);
        setImageBase64(base64);
        onImageChange?.(!!base64);
      } catch (e) {
        if (e instanceof DOMException && e.name === "QuotaExceededError") {
          setStorageError("Image too large to save locally. Try a smaller image.");
        } else {
          setStorageError("Could not save image.");
        }
      }
    },
    [onImageChange]
  );

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      setStorageError(null);
      try {
        const base64 = await compressToDataUrl(file);
        persist(base64);
      } catch (e) {
        setStorageError(e instanceof Error ? e.message : "Failed to process image.");
      }
    },
    [persist]
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

  return (
    <div className="flex flex-col gap-4">
      {storageError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm" role="alert">
            {storageError}
          </p>
        </div>
      )}

      {!imageBase64 ? (
        <>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-purple-400 bg-purple-50"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div>
                <p className="text-gray-700 font-medium">
                  {isDragActive ? "Drop your image here" : "Drag & drop your image"}
                </p>
                <p className="text-gray-500 text-sm mt-1">or click to browse</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 text-center">
            JPG, JPEG or PNG • Max {MAX_DIMENSION}px • Large images are resized
          </p>
        </>
      ) : (
        <div className="relative">
          {/* Image Preview */}
          <div className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-100">
            <img
              src={imageBase64}
              alt="Upload preview"
              className="w-full h-auto max-h-80 object-contain"
            />
            {/* Success badge */}
            <div className="absolute top-3 left-3 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Image Ready
            </div>
          </div>
          
          {/* Remove Button - Clear and prominent */}
          <button
            type="button"
            onClick={remove}
            className="mt-4 w-full py-3 px-4 bg-red-50 text-red-600 font-medium rounded-xl border border-red-200 hover:bg-red-100 hover:border-red-300 transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Remove Image & Start Over
          </button>
        </div>
      )}
    </div>
  );
};
