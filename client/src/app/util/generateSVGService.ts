import { QuiltGenerator } from "./quiltGenerator";

/**
 * Generate SVG from an image file using Gemini (LLM2)
 * This service converts images to quilting pattern SVGs
 */
export const generateSVGService = async (image: File): Promise<string> => {
  // Convert File to base64 data URL
  const arrayBuffer = await image.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const mimeType = image.type || "image/jpeg";
  const dataUrl = `data:${mimeType};base64,${base64}`;

  // Create RawImage object for QuiltGenerator
  const rawImage = {
    data: dataUrl,
    mimeType,
    width: 0, // Will be determined by the image processing
    height: 0, // Will be determined by the image processing
  };

  // Use QuiltGenerator with Potrace (default - faster and free)
  // Falls back to Gemini if Potrace fails and API key is available
  const generator = new QuiltGenerator({
    useGemini: false, // Use Potrace by default
    apiKey: process.env.GOOGLE_API_KEY, // Available for fallback
    gridWidth: 100, // Default grid width
    colorPaletteSize: 32, // Default color palette size
  });

  const svg = await generator.generateQuilt(rawImage);
  return svg;
};
