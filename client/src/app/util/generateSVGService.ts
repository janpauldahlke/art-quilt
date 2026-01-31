/**
 * Service for converting images to quilt-ready SVG patterns
 * Uses local image processing (pixelation + color quantization)
 */

import {
  processImageToQuiltSvg,
  type ShapeType,
  type QuiltDesign,
} from "./imageProcessing";

export type GenerateSVGOptions = {
  gridWidth?: number;
  numColors?: number;
  shapeType?: ShapeType;
  cellSizeMm?: number;
  seamAllowanceMm?: number;
};

export type GenerateSVGResult = {
  success: boolean;
  svg?: string;
  design?: QuiltDesign;
  error?: string;
};

/**
 * Convert an image file to a quilt SVG pattern
 */
export const generateSVGService = async (
  image: File,
  options: GenerateSVGOptions = {}
): Promise<GenerateSVGResult> => {
  try {
    // Convert File to data URL
    const dataUrl = await fileToDataUrl(image);

    // Process the image
    const result = await processImageToQuiltSvg(dataUrl, options);

    return {
      success: true,
      svg: result.svg,
      design: result.design,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
};

/**
 * Convert an image data URL to a quilt SVG pattern
 */
export const generateSVGFromDataUrl = async (
  dataUrl: string,
  options: GenerateSVGOptions = {}
): Promise<GenerateSVGResult> => {
  try {
    const result = await processImageToQuiltSvg(dataUrl, options);

    return {
      success: true,
      svg: result.svg,
      design: result.design,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Processing failed",
    };
  }
};

/**
 * Convert a File to a data URL
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = () => reject(reader.error || new Error("File read error"));
    reader.readAsDataURL(file);
  });
}
