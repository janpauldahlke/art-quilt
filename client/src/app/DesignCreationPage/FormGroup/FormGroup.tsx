"use client";

import { useCallback } from "react";
import type { ShapeType } from "@/app/util/imageProcessing";

export type QuiltSettings = {
  style: ShapeType;
  colorCount: number;
  granularity: number; // Grid size (10-100)
};

export const DEFAULT_SETTINGS: QuiltSettings = {
  style: "pixel",
  colorCount: 6,
  granularity: 30,
};

type FormGroupProps = {
  settings: QuiltSettings;
  onChange: (settings: QuiltSettings) => void;
  onProcess: () => void;
  processing?: boolean;
};

export const FormGroup = ({
  settings,
  onChange,
  onProcess,
  processing = false,
}: FormGroupProps) => {
  const handleStyleChange = useCallback(
    (style: ShapeType) => {
      onChange({ ...settings, style });
    },
    [settings, onChange]
  );

  const handleColorChange = useCallback(
    (colorCount: number) => {
      onChange({ ...settings, colorCount });
    },
    [settings, onChange]
  );

  const handleGranularityChange = useCallback(
    (granularity: number) => {
      onChange({ ...settings, granularity });
    },
    [settings, onChange]
  );

  const styles: { value: ShapeType; label: string; available: boolean }[] = [
    { value: "pixel", label: "Pixelate", available: true },
    { value: "triangle", label: "Triangle", available: false },
    { value: "hexagon", label: "Hexagon", available: false },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        padding: 20,
        backgroundColor: "#fafafa",
        borderRadius: 12,
        border: "1px solid #e5e5e5",
        minWidth: 280,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 600,
          color: "#171717",
        }}
      >
        Design Settings
      </h3>

      {/* Style Selection */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <label
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "#525252",
          }}
        >
          Pattern Style
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          {styles.map(({ value, label, available }) => (
            <button
              key={value}
              type="button"
              onClick={() => available && handleStyleChange(value)}
              disabled={!available}
              style={{
                flex: 1,
                padding: "10px 12px",
                fontSize: 13,
                fontWeight: 500,
                color:
                  settings.style === value
                    ? "#fff"
                    : available
                    ? "#525252"
                    : "#a3a3a3",
                backgroundColor:
                  settings.style === value
                    ? "#6366f1"
                    : available
                    ? "#fff"
                    : "#f5f5f5",
                border:
                  settings.style === value
                    ? "2px solid #6366f1"
                    : "2px solid #e5e5e5",
                borderRadius: 8,
                cursor: available ? "pointer" : "not-allowed",
                transition: "all 0.15s",
              }}
            >
              {label}
              {!available && (
                <span
                  style={{
                    display: "block",
                    fontSize: 10,
                    color: "#a3a3a3",
                    marginTop: 2,
                  }}
                >
                  Coming soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Color Count Slider */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label
            htmlFor="color-count"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#525252",
            }}
          >
            Number of Colors
          </label>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#6366f1",
            }}
          >
            {settings.colorCount}
          </span>
        </div>
        <input
          id="color-count"
          type="range"
          min={2}
          max={10}
          step={1}
          value={settings.colorCount}
          onChange={(e) => handleColorChange(Number(e.target.value))}
          style={{
            width: "100%",
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(to right, #6366f1 ${
              ((settings.colorCount - 2) / 8) * 100
            }%, #e5e5e5 ${((settings.colorCount - 2) / 8) * 100}%)`,
            outline: "none",
            cursor: "pointer",
            WebkitAppearance: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#a3a3a3",
          }}
        >
          <span>2 colors</span>
          <span>10 colors</span>
        </div>
      </div>

      {/* Granularity Slider */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <label
            htmlFor="granularity"
            style={{
              fontSize: 14,
              fontWeight: 500,
              color: "#525252",
            }}
          >
            Grid Size
          </label>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#6366f1",
            }}
          >
            {settings.granularity}×{settings.granularity}
          </span>
        </div>
        <input
          id="granularity"
          type="range"
          min={10}
          max={80}
          step={5}
          value={settings.granularity}
          onChange={(e) => handleGranularityChange(Number(e.target.value))}
          style={{
            width: "100%",
            height: 8,
            borderRadius: 4,
            background: `linear-gradient(to right, #6366f1 ${
              ((settings.granularity - 10) / 70) * 100
            }%, #e5e5e5 ${((settings.granularity - 10) / 70) * 100}%)`,
            outline: "none",
            cursor: "pointer",
            WebkitAppearance: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#a3a3a3",
          }}
        >
          <span>Coarse (10)</span>
          <span>Fine (80)</span>
        </div>
      </div>

      {/* Process Button */}
      <button
        type="button"
        onClick={onProcess}
        disabled={processing}
        style={{
          padding: "12px 20px",
          fontSize: 14,
          fontWeight: 600,
          color: "#fff",
          backgroundColor: processing ? "#a5b4fc" : "#6366f1",
          border: "none",
          borderRadius: 8,
          cursor: processing ? "wait" : "pointer",
          transition: "background-color 0.15s",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {processing ? (
          <>
            <span
              style={{
                width: 16,
                height: 16,
                border: "2px solid rgba(255,255,255,0.3)",
                borderTopColor: "#fff",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                display: "inline-block",
              }}
            />
            Processing...
          </>
        ) : (
          "Generate Quilt Pattern"
        )}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </button>
    </div>
  );
};
