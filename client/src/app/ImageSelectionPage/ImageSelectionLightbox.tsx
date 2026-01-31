"use client";

import { useCallback, useEffect } from "react";

/** Mock "LLM 1" image as data URL (small SVG). */
const MOCK_IMAGE_1 =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="%236366f1" width="320" height="240"/><text x="160" y="120" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="system-ui" font-size="24">LLM 1</text></svg>'
  );

/** Mock "LLM 2" image as data URL (small SVG). */
const MOCK_IMAGE_2 =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240" viewBox="0 0 320 240"><rect fill="%2310b981" width="320" height="240"/><text x="160" y="120" text-anchor="middle" dominant-baseline="middle" fill="white" font-family="system-ui" font-size="24">LLM 2</text></svg>'
  );

const MOCK_IMAGES = [
  { id: "1", src: MOCK_IMAGE_1, label: "Option 1" },
  { id: "2", src: MOCK_IMAGE_2, label: "Option 2" },
] as const;

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
          Select one of the generated images to use as your design base.
        </p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {MOCK_IMAGES.map(({ id, src, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(src)}
              style={{
                padding: 0,
                border: "2px solid #e5e5e5",
                borderRadius: 8,
                overflow: "hidden",
                cursor: "pointer",
                background: "none",
                transition: "border-color 0.15s, box-shadow 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#6366f1";
                e.currentTarget.style.boxShadow = "0 4px 12px rgba(99,102,241,0.25)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e5e5e5";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              <img
                src={src}
                alt={label}
                width={320}
                height={240}
                style={{ display: "block", width: "100%", height: "auto" }}
              />
            </button>
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
