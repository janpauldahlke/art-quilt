"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, startTransition } from "react";
import Link from "next/link";
import { ImageSelectionLightbox } from "@/app/ImageSelectionPage/ImageSelectionLightbox";
import { UploadComponent } from "./UploadComponent/UploadComponent";
import { UPLOAD_IMAGE_STORAGE_KEY } from "./UploadComponent/UploadComponent";
import { UserPromptComponent } from "./UserPromptComponent/UserPromptComponent";

export default function UploadPage() {
  const router = useRouter();
  const [hasImage, setHasImage] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  // Clear stale data on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    // Check if we should reset (coming fresh from landing)
    const shouldReset = sessionStorage.getItem("art-quilt-fresh-start");
    if (shouldReset) {
      localStorage.removeItem(UPLOAD_IMAGE_STORAGE_KEY);
      localStorage.removeItem("art-quilt-svg");
      localStorage.removeItem("art-quilt-design");
      sessionStorage.removeItem("art-quilt-fresh-start");
      startTransition(() => {
        setUploadKey((k) => k + 1);
      });
    }
  }, []);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const handleLightboxSelect = useCallback(
    (base64: string) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(UPLOAD_IMAGE_STORAGE_KEY, base64);
        setUploadKey((k) => k + 1);
        setHasImage(true);
        setLightboxOpen(false);
      } catch {
        // quota etc.
      }
    },
    []
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="text-2xl font-bold text-gray-900 hover:text-purple-600 transition-colors">
              ArtQuilt
            </Link>
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline text-sm text-gray-500">Step 1 of 3</span>
              <div className="flex gap-1">
                <div className="w-8 h-1.5 rounded-full bg-purple-600" />
                <div className="w-8 h-1.5 rounded-full bg-gray-200" />
                <div className="w-8 h-1.5 rounded-full bg-gray-200" />
              </div>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        {/* Page Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Create Your Design
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Start with a prompt to generate AI images, or upload your own photo
          </p>
        </div>

        {/* Split Screen Layout */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Side - Prompt */}
          <div className="order-1">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Describe Your Vision</h2>
                  <p className="text-sm text-gray-500">Generate with AI</p>
                </div>
              </div>
              
              <UserPromptComponent disabled={hasImage} onPromptChange={setHasPrompt} />
              
              {!hasImage && (
                <button
                  type="button"
                  onClick={openLightbox}
                  disabled={!hasPrompt}
                  className={`mt-6 w-full py-4 px-6 rounded-xl font-semibold text-base transition-all ${
                    hasPrompt
                      ? "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                      : "bg-gray-100 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate with AI
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Side - Upload */}
          <div className="order-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 lg:p-8 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Upload Your Image</h2>
                  <p className="text-sm text-gray-500">Or use your own photo</p>
                </div>
              </div>
              
              <UploadComponent
                key={uploadKey}
                onImageChange={setHasImage}
              />
            </div>
          </div>
        </div>

        {/* Next Step Button */}
        {hasImage && (
          <div className="mt-10 flex justify-center">
            <button
              type="button"
              onClick={() => router.push("/designcreation")}
              className="px-10 py-4 bg-green-600 text-white text-lg font-semibold rounded-xl shadow-lg hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5 flex items-center gap-3"
            >
              Continue to Design
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </button>
          </div>
        )}

        {/* Divider with "or" */}
        {!hasImage && (
          <div className="flex items-center justify-center my-8 lg:hidden">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="px-4 text-sm text-gray-400 font-medium">or</span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>
        )}
      </main>

      {/* Lightbox */}
      <ImageSelectionLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onSelect={handleLightboxSelect}
      />
    </div>
  );
}
