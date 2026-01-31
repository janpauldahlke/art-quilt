"use client";

import { useCallback } from "react";
import type { ShapeType } from "@/app/util/imageProcessing";

export type QuiltSettings = {
  style: ShapeType;
  colorCount: number;
  granularity: number;
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
    { value: "pixel", label: "Pixel", available: true },
    { value: "triangle", label: "Triangle", available: false },
    { value: "hexagon", label: "Hexagon", available: false },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900">Settings</h3>
          <p className="text-xs text-gray-500">Customize your pattern</p>
        </div>
      </div>

      {/* Style Selection */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">Pattern Style</label>
        <div className="grid grid-cols-3 gap-2">
          {styles.map(({ value, label, available }) => (
            <button
              key={value}
              type="button"
              onClick={() => available && handleStyleChange(value)}
              disabled={!available}
              className={`py-2 px-3 text-xs font-medium rounded-lg transition-all ${
                settings.style === value
                  ? "bg-purple-600 text-white shadow-md"
                  : available
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              {label}
              {!available && <span className="block text-[10px] opacity-70">Soon</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Color Count Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Colors</label>
          <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            {settings.colorCount}
          </span>
        </div>
        <input
          type="range"
          min={2}
          max={10}
          step={1}
          value={settings.colorCount}
          onChange={(e) => handleColorChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>2</span>
          <span>10</span>
        </div>
      </div>

      {/* Granularity Slider */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium text-gray-700">Grid Size</label>
          <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
            {settings.granularity}×{settings.granularity}
          </span>
        </div>
        <input
          type="range"
          min={10}
          max={80}
          step={5}
          value={settings.granularity}
          onChange={(e) => handleGranularityChange(Number(e.target.value))}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>Coarse</span>
          <span>Fine</span>
        </div>
      </div>

      {/* Process Button */}
      <button
        type="button"
        onClick={onProcess}
        disabled={processing}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-base transition-all flex items-center justify-center gap-2 ${
          processing
            ? "bg-purple-300 text-white cursor-wait"
            : "bg-purple-600 text-white hover:bg-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        }`}
      >
        {processing ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Processing...
          </>
        ) : (
          <>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Pattern
          </>
        )}
      </button>
    </div>
  );
};
