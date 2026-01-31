/**
 * StyledPhotoToQuiltStrategy - Mode C (Style Picker Flow)
 * 
 * Implements the styled photo-to-quilt pipeline:
 * UserPhoto + StyleConfig → NanoBananaClient.applyFabricStyle() → CleanerImage → QuiltGenerator → FinalQuilt
 */

import type {
  UserPhoto,
  StyleConfig,
  CleanerImage,
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
 * Input type for Mode C (photo + style config)
 */
export interface StyledPhotoInput {
  photo: UserPhoto;
  style: StyleConfig;
}

/**
 * Strategy for converting styled photos to quilts (Mode C)
 */
export class StyledPhotoToQuiltStrategy
  implements IQuiltPipeline<StyledPhotoInput, FinalQuilt>
{
  constructor(
    private readonly nanoBananaClient: NanoBananaClient,
    private readonly quiltGenerator: QuiltGenerator,
  ) {}

  /**
   * Get the processing mode
   */
  getMode(): ProcessingMode {
    return Mode.MODE_C;
  }

  /**
   * Validate styled photo input (photo + style config)
   */
  validate(input: StyledPhotoInput): boolean {
    if (!input || typeof input !== "object") {
      return false;
    }

    // Validate photo
    if (!input.photo) {
      return false;
    }

    // Check if photo is a File object
    if (input.photo instanceof File) {
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(input.photo.type)) {
        return false;
      }
      const maxSizeBytes = 10 * 1024 * 1024;
      if (input.photo.size > maxSizeBytes) {
        return false;
      }
    } else if (typeof input.photo === "string") {
      if (input.photo.trim().length === 0) {
        return false;
      }
    } else {
      return false;
    }

    // Validate style config
    if (!input.style || typeof input.style !== "object") {
      return false;
    }

    // Validate required style properties
    if (!input.style.fabricType || typeof input.style.fabricType !== "string") {
      return false;
    }

    // Validate optional properties if present
    if (
      input.style.patternIntensity !== undefined &&
      (typeof input.style.patternIntensity !== "number" ||
        input.style.patternIntensity < 0 ||
        input.style.patternIntensity > 1)
    ) {
      return false;
    }

    if (
      input.style.stylePreset !== undefined &&
      !["traditional", "modern", "abstract", "geometric"].includes(
        input.style.stylePreset,
      )
    ) {
      return false;
    }

    if (
      input.style.colorPalette !== undefined &&
      (!Array.isArray(input.style.colorPalette) ||
        !input.style.colorPalette.every((c) => typeof c === "string"))
    ) {
      return false;
    }

    return true;
  }

  /**
   * Execute the styled photo-to-quilt pipeline
   */
  async execute(
    input: StyledPhotoInput,
  ): Promise<PipelineResult<FinalQuilt>> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid styled photo input: photo and style config must be valid",
            { input },
          ),
        };
      }

      // Step 1: Apply fabric style to photo
      let cleanerImage: CleanerImage;
      try {
        cleanerImage = await this.nanoBananaClient.applyFabricStyle(
          input.photo,
          input.style,
        );
      } catch (error) {
        return {
          success: false,
          error: new ProcessingError(
            `Failed to apply fabric style: ${error instanceof Error ? error.message : "Unknown error"}`,
            { input, originalError: error },
          ),
        };
      }

      // Validate cleaner image
      if (!this.validateCleanerImage(cleanerImage)) {
        return {
          success: false,
          error: new ProcessingError(
            "CleanerImage validation failed: image data is invalid",
            { cleanerImage },
          ),
        };
      }

      // Step 2: Generate quilt from cleaner image
      let finalQuilt: FinalQuilt;
      try {
        finalQuilt = await this.quiltGenerator.generateQuilt(cleanerImage);
      } catch (error) {
        return {
          success: false,
          error: new ProcessingError(
            `Failed to generate quilt from styled image: ${error instanceof Error ? error.message : "Unknown error"}`,
            { cleanerImage, originalError: error },
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
          `Unexpected error in styled photo-to-quilt pipeline: ${error instanceof Error ? error.message : "Unknown error"}`,
          { input, originalError: error },
        ),
      };
    }
  }

  /**
   * Validate CleanerImage
   * 
   * @private
   */
  private validateCleanerImage(image: CleanerImage): boolean {
    if (!image) {
      return false;
    }

    if (!image.data || typeof image.data !== "string" || image.data.trim().length === 0) {
      return false;
    }

    if (
      !image.width ||
      !image.height ||
      image.width <= 0 ||
      image.height <= 0 ||
      !Number.isInteger(image.width) ||
      !Number.isInteger(image.height)
    ) {
      return false;
    }

    if (!image.mimeType || typeof image.mimeType !== "string") {
      return false;
    }

    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validMimeTypes.includes(image.mimeType)) {
      return false;
    }

    if (!image.processedAt || !(image.processedAt instanceof Date)) {
      return false;
    }

    return true;
  }
}
