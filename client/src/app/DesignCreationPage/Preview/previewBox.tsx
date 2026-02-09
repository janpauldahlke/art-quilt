"use client";

import { useState } from "react";
import { UPLOAD_IMAGE_STORAGE_KEY } from "@/app/UploadPage/UploadComponent/UploadComponent";

export const PreviewBox = () => {
  const [imageBase64] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);
  });

  if (!imageBase64) {
    return (
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Base Image</h2>
        <div className="bg-gray-50 rounded-xl p-8 text-center">
          <p className="text-gray-400 text-sm">No image uploaded</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h2 className="text-sm font-semibold text-gray-900">Base Image</h2>
      </div>
      <div className="rounded-xl overflow-hidden border border-gray-100">
        <img
          src={imageBase64}
          alt="Uploaded artwork for quilt design"
          className="w-full h-auto object-cover"
        />
      </div>
      <p className="text-xs text-gray-400 mt-2 text-center">
        Source for your quilt pattern
      </p>
    </div>
  );
};
