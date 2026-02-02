"use client";

import { useCallback } from "react";
import type { ShapeType, VoronoiSettings } from "@/app/util/imageProcessing";
import { DEFAULT_VORONOI_SETTINGS } from "@/app/util/imageProcessing";

export type QuiltSettings = {
  style: ShapeType;
  colorCount: number;
  granularity: number;
  // Voronoi-specific settings
  voronoi: VoronoiSettings;
};

export const DEFAULT_SETTINGS: QuiltSettings = {
  style: "pixel",
  colorCount: 6,
  granularity: 30,
  voronoi: DEFAULT_VORONOI_SETTINGS,
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

  const handleVoronoiChange = useCallback(
    (key: keyof VoronoiSettings, value: number | boolean) => {
      onChange({
        ...settings,
        voronoi: { ...settings.voronoi, [key]: value },
      });
    },
    [settings, onChange]
  );

  const styles: { value: ShapeType; label: string; available: boolean; icon: string }[] = [
    { value: "pixel", label: "Pixel", available: true, icon: "▦" },
    { value: "voronoi", label: "Voronoi", available: true, icon: "◈" },
    { value: "triangle", label: "Triangle", available: false, icon: "△" },
    { value: "hexagon", label: "Hexagon", available: false, icon: "⬡" },
  ];

  const isVoronoi = settings.style === "voronoi";

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
        <div className="grid grid-cols-2 gap-2">
          {styles.map(({ value, label, available, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => available && handleStyleChange(value)}
              disabled={!available}
              className={`py-2.5 px-3 text-xs font-medium rounded-lg transition-all flex flex-col items-center gap-0.5 ${
                settings.style === value
                  ? "bg-purple-600 text-white shadow-md ring-2 ring-purple-300"
                  : available
                  ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  : "bg-gray-50 text-gray-400 cursor-not-allowed"
              }`}
            >
              <span className="text-lg">{icon}</span>
              <span>{label}</span>
              {!available && <span className="text-[10px] opacity-70">Soon</span>}
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

      {/* Granularity Slider - Only for non-Voronoi */}
      {!isVoronoi && (
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
      )}

      {/* Voronoi-Specific Settings */}
      {isVoronoi && (
        <>
          {/* Number of Cells */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Cell Count</label>
              <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                {settings.voronoi.numSeeds}
              </span>
            </div>
            <input
              type="range"
              min={20}
              max={500}
              step={10}
              value={settings.voronoi.numSeeds}
              onChange={(e) => handleVoronoiChange("numSeeds", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Few (20)</span>
              <span>Many (500)</span>
            </div>
            <p className="text-xs text-gray-500">
              More cells = more detail, longer processing
            </p>
          </div>

          {/* Relaxation Iterations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Cell Regularity</label>
              <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                {settings.voronoi.relaxationIterations === 0 
                  ? "Random" 
                  : settings.voronoi.relaxationIterations <= 2 
                    ? "Natural" 
                    : settings.voronoi.relaxationIterations <= 5 
                      ? "Uniform" 
                      : "Very Uniform"}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={settings.voronoi.relaxationIterations}
              onChange={(e) => handleVoronoiChange("relaxationIterations", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Organic</span>
              <span>Regular</span>
            </div>
            <p className="text-xs text-gray-500">
              Higher values create more evenly-sized cells
            </p>
          </div>

          {/* Edge Weighting Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <label className="text-sm font-medium text-gray-700">Detail-Aware</label>
              <p className="text-xs text-gray-500">More cells in detailed areas</p>
            </div>
            <button
              type="button"
              onClick={() => handleVoronoiChange("edgeWeighted", !settings.voronoi.edgeWeighted)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.voronoi.edgeWeighted ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.voronoi.edgeWeighted ? "translate-x-6" : ""
                }`}
              />
            </button>
          </div>

          {/* Border Width */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-gray-700">Cell Borders</label>
              <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                {settings.voronoi.borderWidth === 0 ? "None" : `${settings.voronoi.borderWidth}px`}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              step={0.5}
              value={settings.voronoi.borderWidth}
              onChange={(e) => handleVoronoiChange("borderWidth", Number(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>None</span>
              <span>Thick</span>
            </div>
          </div>
        </>
      )}

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
