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

  const allDone = images.every((img) => !img.loading);
  const hasAnyImage = images.some((img) => img.src);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="lightbox-title"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(0,0,0,0.6)",
        padding: 24,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: 12,
          padding: 24,
          maxWidth: 800,
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2
          id="lightbox-title"
          style={{
            margin: "0 0 16px",
            fontSize: 18,
            fontWeight: 600,
            color: "#171717",
          }}
        >
          {generating && !hasAnyImage
            ? "Generating images..."
            : "Choose an image"}
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "#525252",
          }}
        >
          {generating && !hasAnyImage
            ? "Please wait while we generate quilt-suitable designs from both AI models."
            : "Select one of the generated images to use as your design base. Each is from a different AI model."}
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {images.map(({ id, src, label, model, loading, error }) => (
            <div key={id} style={{ display: "flex", flexDirection: "column" }}>
              {/* Model Label */}
              <div
                style={{
                  marginBottom: 8,
                  padding: "6px 12px",
                  backgroundColor:
                    id === "openai" ? "#10b981" : "#6366f1",
                  borderRadius: "6px 6px 0 0",
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#fff",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {model || label}
                </span>
              </div>

              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 280,
                    backgroundColor: "#f5f5f5",
                    borderRadius: "0 0 8px 8px",
                    border: "2px solid #e5e5e5",
                    borderTop: "none",
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      border: "3px solid #e5e5e5",
                      borderTopColor:
                        id === "openai" ? "#10b981" : "#6366f1",
                      borderRadius: "50%",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  <p
                    style={{
                      marginTop: 12,
                      fontSize: 13,
                      color: "#737373",
                    }}
                  >
                    Generating...
                  </p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              ) : error ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 280,
                    backgroundColor: "#fef2f2",
                    borderRadius: "0 0 8px 8px",
                    border: "2px solid #fecaca",
                    borderTop: "none",
                    padding: 16,
                    textAlign: "center",
                  }}
                >
                  <p style={{ color: "#b91c1c", fontSize: 14, margin: 0 }}>
                    {error}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => handleSelect(src)}
                  style={{
                    padding: 0,
                    border: "2px solid #e5e5e5",
                    borderTop: "none",
                    borderRadius: "0 0 8px 8px",
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "none",
                    transition: "border-color 0.15s, box-shadow 0.15s",
                    width: "100%",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor =
                      id === "openai" ? "#10b981" : "#6366f1";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${
                      id === "openai"
                        ? "rgba(16,185,129,0.25)"
                        : "rgba(99,102,241,0.25)"
                    }`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "#e5e5e5";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <img
                    src={src}
                    alt={`Generated by ${label}`}
                    style={{
                      display: "block",
                      width: "100%",
                      height: 280,
                      objectFit: "cover",
                    }}
                  />
                </button>
              )}
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "8px 16px",
              fontSize: 14,
              color: "#525252",
              backgroundColor: "#f5f5f5",
              border: "1px solid #e5e5e5",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
