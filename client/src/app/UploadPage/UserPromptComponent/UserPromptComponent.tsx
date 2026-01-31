"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "art-quilt-user-prompt";

type UserPromptComponentProps = {
  disabled?: boolean;
  onPromptChange?: (hasPrompt: boolean) => void;
  provider?: "openai" | "gemini";
  onProviderChange?: (provider: "openai" | "gemini") => void;
};

const PROVIDER_STORAGE_KEY = "art-quilt-image-provider";

export const UserPromptComponent = ({
  disabled = false,
  onPromptChange,
  provider = "openai",
  onProviderChange,
}: UserPromptComponentProps) => {
  const [prompt, setPrompt] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<"openai" | "gemini">(provider);

  // Sync with prop changes
  useEffect(() => {
    setSelectedProvider(provider);
  }, [provider]);

  // Load from sessionStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(PROVIDER_STORAGE_KEY);
    if (stored === "openai" || stored === "gemini") {
      setSelectedProvider(stored);
      onProviderChange?.(stored);
    } else {
      // If no stored value, use the prop and save it
      sessionStorage.setItem(PROVIDER_STORAGE_KEY, provider);
      onProviderChange?.(provider);
    }
  }, [onProviderChange, provider]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      setPrompt(stored);
      onPromptChange?.(!!stored.trim());
    }
  }, [onPromptChange]);

  const persist = useCallback(
    (value: string) => {
      setPrompt(value);
      if (typeof window === "undefined") return;
      if (value) sessionStorage.setItem(STORAGE_KEY, value);
      else sessionStorage.removeItem(STORAGE_KEY);
      onPromptChange?.(!!value.trim());
    },
    [onPromptChange]
  );

  const clear = useCallback(() => persist(""), [persist]);

  const handleProviderChange = useCallback(
    (newProvider: "openai" | "gemini") => {
      setSelectedProvider(newProvider);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(PROVIDER_STORAGE_KEY, newProvider);
      }
      onProviderChange?.(newProvider);
    },
    [onProviderChange]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "40vw" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: disabled ? "#a3a3a3" : "#525252",
          }}
        >
          Image Generation Provider
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => handleProviderChange("openai")}
            disabled={disabled}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: selectedProvider === "openai" ? 600 : 400,
              color: selectedProvider === "openai" ? "#fff" : "#525252",
              backgroundColor:
                selectedProvider === "openai" ? "#6366f1" : disabled ? "#f5f5f5" : "#fafafa",
              border: `1px solid ${selectedProvider === "openai" ? "#6366f1" : "#e5e5e5"}`,
              borderRadius: 6,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            OpenAI (DALL-E)
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange("gemini")}
            disabled={disabled}
            style={{
              padding: "6px 12px",
              fontSize: 12,
              fontWeight: selectedProvider === "gemini" ? 600 : 400,
              color: selectedProvider === "gemini" ? "#fff" : "#525252",
              backgroundColor:
                selectedProvider === "gemini" ? "#10b981" : disabled ? "#f5f5f5" : "#fafafa",
              border: `1px solid ${selectedProvider === "gemini" ? "#10b981" : "#e5e5e5"}`,
              borderRadius: 6,
              cursor: disabled ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            Google (Gemini)
          </button>
        </div>
      </div>
      <label
        htmlFor="user-prompt"
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: disabled ? "#a3a3a3" : "#525252",
        }}
      >
        Your prompt
      </label>
      <textarea
        id="user-prompt"
        value={prompt}
        onChange={(e) => persist(e.target.value)}
        onBlur={(e) => {
          if (typeof window !== "undefined") {
            const v = e.target.value;
            if (v) sessionStorage.setItem(STORAGE_KEY, v);
            else sessionStorage.removeItem(STORAGE_KEY);
          }
        }}
        placeholder={disabled ? "Add prompt before uploading an image" : "Describe what you want to create…"}
        rows={4}
        disabled={disabled}
        style={{
          width: "100%",
          maxWidth: "40vw",
          minHeight: "4lh",
          padding: "12px 14px",
          fontSize: 14,
          lineHeight: 1.5,
          color: disabled ? "#737373" : "#171717",
          backgroundColor: disabled ? "#f5f5f5" : "#fafafa",
          border: "1px solid #e5e5e5",
          borderRadius: 8,
          resize: "vertical",
          outline: "none",
          cursor: disabled ? "not-allowed" : undefined,
        }}
      />
      <button
        type="button"
        onClick={clear}
        disabled={!prompt || disabled}
        style={{
          alignSelf: "flex-start",
          padding: "6px 12px",
          fontSize: 12,
          color: prompt && !disabled ? "#737373" : "#a3a3a3",
          backgroundColor: "#f5f5f5",
          border: "1px solid #e5e5e5",
          borderRadius: 6,
          cursor: prompt && !disabled ? "pointer" : "not-allowed",
        }}
      >
        Clear prompt
      </button>
    </div>
  );
};
