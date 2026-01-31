/**
 * TextToQuiltStrategy - Mode A (Text Flow)
 * 
 * Implements the text-to-quilt pipeline:
 * TextPrompt → NanoBananaClient.generateImage() → RawImage → QuiltGenerator → FinalQuilt
 */

import type {
  TextPrompt,
  RawImage,
  FinalQuilt,
  PipelineResult,
  ProcessingMode,
  NanoBananaClient,
  ValidationError,
  ProcessingError,
} from "@/types/quiltPipeline";
import { ProcessingMode as Mode } from "@/types/quiltPipeline";
import { IQuiltPipeline } from "../IQuiltPipeline";
import { QuiltGenerator } from "../../quiltGenerator";

/**
 * Strategy for converting text prompts to quilts (Mode A)
 */
export class TextToQuiltStrategy
  implements IQuiltPipeline<TextPrompt, FinalQuilt>
{
  constructor(
    private readonly nanoBananaClient: NanoBananaClient,
    private readonly quiltGenerator: QuiltGenerator,
  ) {}

  /**
   * Get the processing mode
   */
  getMode(): ProcessingMode {
    return Mode.MODE_A;
  }

  /**
   * Validate text prompt input
   */
  validate(input: TextPrompt): boolean {
    if (!input || typeof input !== "string") {
      return false;
    }

    const trimmed = input.trim();
    if (trimmed.length === 0) {
      return false;
    }

    // Basic validation: prompt should be reasonable length
    if (trimmed.length > 1000) {
      return false;
    }

    return true;
  }

  /**
   * Execute the text-to-quilt pipeline
   */
  async execute(input: TextPrompt): Promise<PipelineResult<FinalQuilt>> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid text prompt: must be a non-empty string under 1000 characters",
            { input },
          ),
        };
      }

      // Step 1: Generate image from text prompt
      let rawImage: RawImage;
      try {
        rawImage = await this.nanoBananaClient.generateImage(input);
      } catch (error) {
        return {
          success: false,
          error: new ProcessingError(
            `Failed to generate image from text prompt: ${error instanceof Error ? error.message : "Unknown error"}`,
            { input, originalError: error },
          ),
        };
      }

      // Validate raw image
      if (!rawImage || !rawImage.data) {
        return {
          success: false,
          error: new ProcessingError("Generated image is invalid", { rawImage }),
        };
      }

      // Step 2: Generate quilt from raw image
      let finalQuilt: FinalQuilt;
      try {
        finalQuilt = await this.quiltGenerator.generateQuilt(rawImage);
      } catch (error) {
        return {
          success: false,
          error: new ProcessingError(
            `Failed to generate quilt from image: ${error instanceof Error ? error.message : "Unknown error"}`,
            { rawImage, originalError: error },
          ),
        };
      }

      // Validate final quilt
      if (!finalQuilt || typeof finalQuilt !== "string" || finalQuilt.trim().length === 0) {
        return {
          success: false,
          error: new ProcessingError("Generated quilt is invalid or empty", {
            finalQuilt,
          }),
        };
      }

      return {
        success: true,
        data: finalQuilt,
      };
    } catch (error) {
      return {
        success: false,
        error: new ProcessingError(
          `Unexpected error in text-to-quilt pipeline: ${error instanceof Error ? error.message : "Unknown error"}`,
          { input, originalError: error },
        ),
      };
    }
  }
}
