"use client";

import { useCallback, useEffect, useState } from "react";

export type ImageSelectionLightboxProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (base64: string) => void;
  prompt?: string;
  provider?: "openai" | "gemini";
};

export function ImageSelectionLightbox({
  isOpen,
  onClose,
  onSelect,
  prompt,
  provider = "openai",
}: ImageSelectionLightboxProps) {
  const [images, setImages] = useState<{ id: string; src: string; label: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Fetch images when lightbox opens and prompt is available
  useEffect(() => {
    if (!isOpen || !prompt || prompt.trim().length === 0) {
      setImages([]);
      setError(null);
      return;
    }

    const fetchImages = async () => {
      setLoading(true);
      setError(null);
      try {
        console.log("Generating images with provider:", provider, "prompt:", prompt);
        const response = await fetch("/api/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ prompt, provider }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to generate images");
        }

        const data = await response.json();
        if (data.images && Array.isArray(data.images) && data.images.length > 0) {
          setImages(
            data.images.map((src: string, index: number) => ({
              id: String(index + 1),
              src,
              label: `Option ${index + 1}`,
            }))
          );
        } else {
          throw new Error("No images were generated");
        }
      } catch (err) {
        console.error("Error fetching images:", err);
        setError(err instanceof Error ? err.message : "Failed to generate images");
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    fetchImages();
  }, [isOpen, prompt, provider]);

  if (!isOpen) return null;

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
          maxWidth: 720,
          width: "100%",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
          position: "relative",
          zIndex: 1000,
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
          Choose an image
        </h2>
        <p
          style={{
            margin: "0 0 20px",
            fontSize: 14,
            color: "#525252",
          }}
        >
          {loading
            ? "Generating images..."
            : error
              ? `Error: ${error}`
              : "Select one of the generated images to use as your design base."}
        </p>
        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "40px 20px",
              color: "#737373",
            }}
          >
            Generating images with AI...
          </div>
        )}
        {error && (
          <div
            style={{
              padding: "16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              borderRadius: 8,
              color: "#991b1b",
              marginBottom: 24,
            }}
          >
            {error}
          </div>
        )}
        {!loading && !error && images.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 16,
              marginBottom: 24,
            }}
          >
            {images.map(({ id, src, label }) => (
              <button
                key={id}
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSelect(src);
                }}
                style={{
                  padding: 0,
                  border: "2px solid #e5e5e5",
                  borderRadius: 8,
                  overflow: "hidden",
                  cursor: "pointer",
                  background: "none",
                  transition: "border-color 0.15s, box-shadow 0.15s",
                  position: "relative",
                  zIndex: 1,
                  pointerEvents: "auto",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#6366f1";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.25)";
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#e5e5e5";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "scale(1)";
                }}
                aria-label={`Select ${label}`}
              >
                <img
                  src={src}
                  alt={label}
                  width={320}
                  height={240}
                  style={{
                    display: "block",
                    width: "100%",
                    height: "auto",
                    pointerEvents: "none",
                    userSelect: "none",
                  }}
                  draggable={false}
                />
              </button>
            ))}
          </div>
        )}
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
