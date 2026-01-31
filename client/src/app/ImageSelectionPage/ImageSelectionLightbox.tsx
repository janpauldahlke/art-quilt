"use client";

import { useCallback, useEffect, useState } from "react";

const PROMPT_STORAGE_KEY = "art-quilt-user-prompt";

type GeneratedImage = {
  id: string;
  src: string;
  label: string;
  model?: string;
  loading?: boolean;
  error?: string;
};

export type ImageSelectionLightboxProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (base64: string) => void;
};

export function ImageSelectionLightbox({
  isOpen,
  onClose,
  onSelect,
}: ImageSelectionLightboxProps) {
  const [images, setImages] = useState<GeneratedImage[]>([
    { id: "openai", src: "", label: "OpenAI DALL-E 3", loading: true },
    { id: "imagen", src: "", label: "Google Imagen 4", loading: true },
  ]);
  const [generating, setGenerating] = useState(false);

  // Generate images when lightbox opens
  useEffect(() => {
    if (!isOpen) return;

    const prompt = sessionStorage.getItem(PROMPT_STORAGE_KEY);
    if (!prompt) return;

    setGenerating(true);
    setImages([
      { id: "openai", src: "", label: "OpenAI DALL-E 3", loading: true },
      { id: "imagen", src: "", label: "Google Imagen 4", loading: true },
    ]);

    // Generate from both providers in parallel
    const generateImage = async (
      provider: "openai" | "imagen",
      label: string
    ): Promise<GeneratedImage> => {
      try {
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt, provider }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          return {
            id: provider,
            src: "",
            label,
            error: data.error || "Failed to generate",
          };
        }

        return {
          id: provider,
          src: data.image,
          label,
          model: data.model,
        };
      } catch (err) {
        return {
          id: provider,
          src: "",
          label,
          error: err instanceof Error ? err.message : "Network error",
        };
      }
    };

    // Update images as they complete (don't wait for both)
    generateImage("openai", "OpenAI DALL-E 3").then((result) => {
      setImages((prev) =>
        prev.map((img) => (img.id === "openai" ? result : img))
      );
    });

    generateImage("imagen", "Google Imagen 4").then((result) => {
      setImages((prev) =>
        prev.map((img) => (img.id === "imagen" ? result : img))
      );
    });

    // Set generating to false after a reasonable time
    Promise.all([
      generateImage("openai", "OpenAI DALL-E 3"),
      generateImage("imagen", "Google Imagen 4"),
    ]).then(() => {
      setGenerating(false);
    });
  }, [isOpen]);

  const handleSelect = useCallback(
    (base64: string) => {
      onSelect(base64);
      onClose();
    },
    [onSelect, onClose]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") onClose();
    },
    [isOpen, onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  const hasAnyImage = images.some((img) => img.src);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2
                id="lightbox-title"
                className="text-xl font-bold text-gray-900"
              >
                {generating && !hasAnyImage ? "Generating Images..." : "Choose Your Image"}
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                {generating && !hasAnyImage
                  ? "Please wait while we create designs from both AI models"
                  : "Select one of the AI-generated images to use as your base"}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Image Grid */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            {images.map(({ id, src, label, model, loading, error }) => (
              <div key={id} className="flex flex-col">
                {/* Model Label */}
                <div
                  className={`py-2 px-4 rounded-t-xl text-center ${
                    id === "openai"
                      ? "bg-green-500"
                      : "bg-purple-500"
                  }`}
                >
                  <span className="text-sm font-semibold text-white uppercase tracking-wide">
                    {model || label}
                  </span>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center h-72 bg-gray-50 rounded-b-xl border-2 border-t-0 border-gray-200">
                    <div
                      className={`w-12 h-12 border-4 border-gray-200 rounded-full animate-spin ${
                        id === "openai" ? "border-t-green-500" : "border-t-purple-500"
                      }`}
                    />
                    <p className="mt-4 text-gray-500 text-sm">Generating...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center h-72 bg-red-50 rounded-b-xl border-2 border-t-0 border-red-200 p-6 text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                      <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-red-600 text-sm">{error}</p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSelect(src)}
                    className={`relative overflow-hidden rounded-b-xl border-2 border-t-0 transition-all hover:shadow-xl group ${
                      id === "openai"
                        ? "border-green-200 hover:border-green-400"
                        : "border-purple-200 hover:border-purple-400"
                    }`}
                  >
                    <img
                      src={src}
                      alt={`Generated by ${label}`}
                      className="w-full h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-white text-gray-900 px-4 py-2 rounded-lg font-semibold shadow-lg">
                        Select This Image
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
