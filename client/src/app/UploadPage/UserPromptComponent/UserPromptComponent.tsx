"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "art-quilt-user-prompt";

type UserPromptComponentProps = {
  disabled?: boolean;
};

export const UserPromptComponent = ({ disabled = false }: UserPromptComponentProps) => {
  const [prompt, setPrompt] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) setPrompt(stored);
  }, []);

  const persist = useCallback((value: string) => {
    setPrompt(value);
    if (typeof window === "undefined") return;
    if (value) sessionStorage.setItem(STORAGE_KEY, value);
    else sessionStorage.removeItem(STORAGE_KEY);
  }, []);

  const clear = useCallback(() => persist(""), [persist]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, maxWidth: "40vw" }}>
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
