"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "art-quilt-user-prompt";

type UserPromptComponentProps = {
  disabled?: boolean;
  onPromptChange?: (hasPrompt: boolean) => void;
};

export const UserPromptComponent = ({ disabled = false, onPromptChange }: UserPromptComponentProps) => {
  const [prompt, setPrompt] = useState("");

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

  return (
    <div className="flex flex-col gap-3">
      <label
        htmlFor="user-prompt"
        className={`text-sm font-medium ${disabled ? "text-gray-400" : "text-gray-700"}`}
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
        placeholder={disabled ? "Image already selected" : "Describe what you want to create… e.g., 'A sunset over mountains with warm orange and purple colors'"}
        rows={5}
        disabled={disabled}
        className={`w-full px-4 py-3 text-base rounded-xl border transition-all resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
          disabled
            ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
            : "bg-white text-gray-900 border-gray-200 hover:border-gray-300"
        }`}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {prompt.length > 0 ? `${prompt.length} characters` : "Be descriptive for best results"}
        </p>
        <button
          type="button"
          onClick={clear}
          disabled={!prompt || disabled}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            prompt && !disabled
              ? "text-gray-600 bg-gray-100 hover:bg-gray-200"
              : "text-gray-400 bg-gray-50 cursor-not-allowed"
          }`}
        >
          Clear
        </button>
      </div>
    </div>
  );
};
