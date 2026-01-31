/**
 * QuiltGenerator Service
 * 
 * Responsible for converting processed images (RawImage or CleanerImage) into
 * final quilt SVG patterns. Encapsulates all quilt assembly logic including
 * color quantization, grid analysis, and SVG construction.
 */

import type {
  RawImage,
  CleanerImage,
  FinalQuilt,
  GenerationError,
} from "@/types/quiltPipeline";
import { getSystemPrompt } from "@/app/svgService/svgPrompt";
import { GoogleGenerativeAI } from "@google/generative-ai";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const potrace = require("potrace");
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";

/**
 * Configuration for quilt generation
 */
export interface QuiltGeneratorConfig {
  gridWidth?: number; // Default: 100px
  colorPaletteSize?: number; // Default: 32 colors
  useGemini?: boolean; // Use Gemini API for SVG generation (default: false, uses Potrace)
  apiKey?: string; // Google API key (if using Gemini)
}

/**
 * QuiltGenerator class for final SVG assembly
 * 
 * Encapsulates the logic for converting images into quilt patterns:
 * - Grid analysis and downscaling
 * - Color quantization
 * - SVG DOM construction
 */
export class QuiltGenerator {
  private readonly config: Required<QuiltGeneratorConfig>;

  constructor(config: QuiltGeneratorConfig = {}) {
    this.config = {
      gridWidth: config.gridWidth ?? 100,
      colorPaletteSize: config.colorPaletteSize ?? 32,
      useGemini: config.useGemini ?? false, // Default to Potrace (faster, free)
      apiKey: config.apiKey ?? process.env.GOOGLE_API_KEY ?? "",
    };
  }

  /**
   * Generate a quilt SVG from a processed image
   * 
   * @param image - The processed image (RawImage or CleanerImage)
   * @returns Promise resolving to FinalQuilt (SVG string)
   * @throws GenerationError if quilt generation fails
   */
  async generateQuilt(
    image: RawImage | CleanerImage,
  ): Promise<FinalQuilt> {
    try {
      // Use Potrace by default (faster, free), fallback to Gemini if explicitly requested
      if (this.config.useGemini && this.config.apiKey) {
        return await this.generateQuiltWithGemini(image);
      } else {
        return await this.generateQuiltWithPotrace(image);
      }
    } catch (error) {
      // If Potrace fails and Gemini is available, try Gemini as fallback
      if (!this.config.useGemini && this.config.apiKey) {
        console.warn("Potrace failed, falling back to Gemini:", error);
        try {
          return await this.generateQuiltWithGemini(image);
        } catch (geminiError) {
          throw new GenerationError(
            `Failed to generate quilt with both Potrace and Gemini: ${error instanceof Error ? error.message : "Unknown error"}`,
            { originalError: error, image, geminiError },
          );
        }
      }
      throw new GenerationError(
        `Failed to generate quilt: ${error instanceof Error ? error.message : "Unknown error"}`,
        { originalError: error, image },
      );
    }
  }

  /**
   * Generate quilt using Gemini API (preferred method)
   * 
   * @private
   */
  private async generateQuiltWithGemini(
    image: RawImage | CleanerImage,
  ): Promise<FinalQuilt> {
    if (!this.config.apiKey) {
      throw new GenerationError("Google API key is required for Gemini generation");
    }

    const systemPrompt = getSystemPrompt();
    const userPrompt = `Convert this image to a quilting/stitching pattern SVG following the instructions. Use a grid width of ${this.config.gridWidth}px. Each pixel must be represented as its own <rect> element.

CRITICAL: You MUST include the complete <svg>...</svg> XML code directly in your response. Do not provide download links or references to files. The full SVG code must be present in your response, either in a code block or as plain XML.`;

    const genAI = new GoogleGenerativeAI(this.config.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      systemInstruction: systemPrompt,
      generationConfig: { 
        maxOutputTokens: 8192, // Increased for larger SVG responses
        temperature: 0.1, // Lower temperature for more consistent output
      },
    });

    // Extract base64 data from image
    const imageData = this.extractBase64Data(image.data);
    const mimeType = image.mimeType || "image/jpeg";

    const result = await model.generateContent([
      { text: userPrompt },
      {
        inlineData: {
          mimeType,
          data: imageData,
        },
      },
    ]);

    const rawContent = result.response.text();
    
    // Log the raw response for debugging
    console.log("Gemini raw response length:", rawContent.length);
    console.log("Gemini response preview:", rawContent.substring(0, 500));
    
    const svg = this.extractSvgFromResponse(rawContent);

    if (!svg || !svg.includes("<svg")) {
      // If no valid SVG found, log the full response for debugging
      console.error("Failed to extract SVG. Full response:", rawContent);
      throw new GenerationError(
        `Failed to extract SVG from Gemini response. Response may be too long or in unexpected format. Response preview: ${rawContent.substring(0, 200)}...`
      );
    }

    // Validate that we have a complete SVG
    if (!svg.includes("</svg>")) {
      throw new GenerationError("Incomplete SVG extracted - missing closing </svg> tag");
    }

    return svg;
  }

  /**
   * Generate quilt using potrace (main method - faster and free)
   * 
   * @private
   */
  private async generateQuiltWithPotrace(
    image: RawImage | CleanerImage,
  ): Promise<FinalQuilt> {
    try {
      // Extract image data and convert to Buffer
      const imageData = this.extractBase64Data(image.data);
      const imageBuffer = Buffer.from(imageData, "base64");

      console.log("Potrace: Starting SVG generation, buffer size:", imageBuffer.length);

      // Try using Buffer directly first (Potrace supports Buffer)
      try {
        const svg = await new Promise<string>((resolve, reject) => {
          potrace.trace(
            imageBuffer,
            {
              threshold: 128,
              color: "auto",
              background: "transparent",
              turdSize: 2,
              optCurve: true,
            },
            (err: Error | null, svg: string) => {
              if (err) {
                console.error("Potrace error with Buffer:", err);
                reject(err);
              } else {
                resolve(svg);
              }
            }
          );
        });

        if (!svg || svg.trim().length === 0) {
          throw new Error("Potrace returned empty SVG");
        }

        console.log("Potrace: SVG generated successfully, length:", svg.length);
        return svg;
      } catch (bufferError) {
        console.warn("Potrace failed with Buffer, trying file path method:", bufferError);
        
        // Fallback to file path method if Buffer doesn't work
        const tempDir = tmpdir();
        const tempFilePath = join(
          tempDir,
          `quilt-${Date.now()}-${Math.random().toString(36).substring(7)}.png`
        );

        try {
          // Write buffer to temporary file
          writeFileSync(tempFilePath, imageBuffer);
          console.log("Potrace: Created temp file:", tempFilePath);

          // Use potrace to generate SVG
          const svg = await new Promise<string>((resolve, reject) => {
            potrace.trace(
              tempFilePath,
              {
                threshold: 128,
                color: "auto",
                background: "transparent",
                turdSize: 2,
                optCurve: true,
              },
              (err: Error | null, svg: string) => {
                if (err) {
                  console.error("Potrace error with file path:", err);
                  reject(err);
                } else {
                  resolve(svg);
                }
              }
            );
          });

          // Clean up temporary file
          try {
            unlinkSync(tempFilePath);
          } catch (cleanupError) {
            console.warn("Failed to delete temp file:", cleanupError);
          }

          if (!svg || svg.trim().length === 0) {
            throw new Error("Potrace returned empty SVG");
          }

          console.log("Potrace: SVG generated successfully via file path, length:", svg.length);
          return svg;
        } catch (fileError) {
          // Clean up temp file on error
          try {
            unlinkSync(tempFilePath);
          } catch {
            // Ignore cleanup errors
          }
          throw fileError;
        }
      }
    } catch (error) {
      console.error("Potrace generation failed:", error);
      throw new GenerationError(
        `Potrace generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        { originalError: error, image },
      );
    }
  }

  /**
   * Extract base64 data from data URL or base64 string
   * 
   * @private
   */
  private extractBase64Data(data: string): string {
    // Handle data URLs (data:image/jpeg;base64,...)
    if (data.startsWith("data:")) {
      const base64Index = data.indexOf("base64,");
      if (base64Index !== -1) {
        return data.substring(base64Index + 7);
      }
    }
    // Assume it's already base64
    return data;
  }

  /**
   * Extract SVG from model response (handles code blocks, markdown links, and embedded SVG)
   * 
   * @private
   */
  private extractSvgFromResponse(text: string): string {
    // Try to extract from code blocks first (most common format)
    const codeBlockMatch = text.match(/```(?:xml|svg)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      const extracted = codeBlockMatch[1].trim();
      // Verify it contains SVG content
      if (extracted.includes("<svg") || extracted.includes("</svg>")) {
        return extracted;
      }
    }

    // Try to find SVG tag directly (even if embedded in text)
    const svgMatch = text.match(/<svg[\s\S]*?<\/svg>/i);
    if (svgMatch) {
      return svgMatch[0];
    }

    // Try multiline SVG match (handles cases where SVG spans multiple lines with text)
    const multilineSvgMatch = text.match(/<svg[^>]*>[\s\S]*?<\/svg>/i);
    if (multilineSvgMatch) {
      return multilineSvgMatch[0];
    }

    // If response mentions download but no SVG found, log warning
    if (text.toLowerCase().includes("download") && text.toLowerCase().includes("svg")) {
      console.warn("Gemini response mentions SVG download but no SVG code found. Full response:", text.substring(0, 500));
    }

    // Return trimmed text as fallback (might contain SVG if extraction failed)
    return text.trim();
  }

  /**
   * Calculate grid dimensions maintaining aspect ratio
   * 
   * @private
   */
  private calculateGridDimensions(
    width: number,
    height: number,
  ): { gridWidth: number; gridHeight: number } {
    const aspectRatio = height / width;
    const gridWidth = this.config.gridWidth;
    const gridHeight = Math.round(gridWidth * aspectRatio);
    return { gridWidth, gridHeight };
  }

  /**
   * Quantize colors to the specified palette size
   * 
   * @private
   */
  private quantizeColors(
    imageData: ImageData,
    paletteSize: number,
  ): Map<string, string> {
    // This would implement color quantization logic
    // For now, return empty map - actual implementation would use
    // a color quantization algorithm
    return new Map();
  }
}
