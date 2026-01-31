/**
 * PhotoToQuiltStrategy - Mode B (Photo Flow - PRIORITY)
 * 
 * Implements the photo-to-quilt pipeline:
 * UserPhoto → NanoBananaClient.stylizePhoto() → CleanerImage → QuiltGenerator → FinalQuilt
 * 
 * This is the KEY/PRIORITY mode with enhanced error handling and retry logic.
 */

import type {
  UserPhoto,
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
 * Configuration for retry logic in Mode B
 */
interface RetryConfig {
  maxRetries: number;
  retryDelayMs: number;
}

/**
 * Strategy for converting photos to quilts (Mode B - Priority)
 * 
 * Features:
 * - Enhanced error handling
 * - Retry logic for CleanerImage step
 * - Comprehensive validation
 * - Detailed error messages
 */
export class PhotoToQuiltStrategy
  implements IQuiltPipeline<UserPhoto, FinalQuilt>
{
  private readonly retryConfig: RetryConfig;

  constructor(
    private readonly nanoBananaClient: NanoBananaClient,
    private readonly quiltGenerator: QuiltGenerator,
    retryConfig?: Partial<RetryConfig>,
  ) {
    this.retryConfig = {
      maxRetries: retryConfig?.maxRetries ?? 3,
      retryDelayMs: retryConfig?.retryDelayMs ?? 1000,
    };
  }

  /**
   * Get the processing mode
   */
  getMode(): ProcessingMode {
    return Mode.MODE_B;
  }

  /**
   * Validate user photo input
   */
  validate(input: UserPhoto): boolean {
    if (!input) {
      return false;
    }

    // Check if it's a File object
    if (input instanceof File) {
      // Validate file type
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(input.type)) {
        return false;
      }

      // Validate file size (max 10MB)
      const maxSizeBytes = 10 * 1024 * 1024;
      if (input.size > maxSizeBytes) {
        return false;
      }

      return true;
    }

    // Check if it's a string (base64 or data URL)
    if (typeof input === "string") {
      if (input.trim().length === 0) {
        return false;
      }

      // Basic validation for data URLs
      if (input.startsWith("data:")) {
        const validMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
        ];
        const hasValidMimeType = validMimeTypes.some((type) =>
          input.includes(type),
        );
        if (!hasValidMimeType) {
          return false;
        }
      }

      return true;
    }

    return false;
  }

  /**
   * Execute the photo-to-quilt pipeline with retry logic
   */
  async execute(input: UserPhoto): Promise<PipelineResult<FinalQuilt>> {
    try {
      // Validate input
      if (!this.validate(input)) {
        return {
          success: false,
          error: new ValidationError(
            "Invalid user photo: must be a valid image file (JPEG/PNG) or base64 string",
            { input },
          ),
        };
      }

      // Step 1: Stylize photo to CleanerImage (with retry logic)
      let cleanerImage: CleanerImage;
      try {
        cleanerImage = await this.stylizePhotoWithRetry(input);
      } catch (error) {
        return {
          success: false,
          error: new ProcessingError(
            `Failed to stylize photo after ${this.retryConfig.maxRetries} retries: ${error instanceof Error ? error.message : "Unknown error"}`,
            { input, originalError: error },
          ),
        };
      }

      // Strictly validate CleanerImage (critical step for Mode B)
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
            `Failed to generate quilt from cleaner image: ${error instanceof Error ? error.message : "Unknown error"}`,
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
          `Unexpected error in photo-to-quilt pipeline: ${error instanceof Error ? error.message : "Unknown error"}`,
          { input, originalError: error },
        ),
      };
    }
  }

  /**
   * Stylize photo with retry logic (encapsulated method)
   * 
   * @private
   */
  private async stylizePhotoWithRetry(
    photo: UserPhoto,
  ): Promise<CleanerImage> {
    let lastError: Error | unknown;

    for (let attempt = 1; attempt <= this.retryConfig.maxRetries; attempt++) {
      try {
        const result = await this.nanoBananaClient.stylizePhoto(photo);

        // Validate result immediately
        if (this.validateCleanerImage(result)) {
          return result;
        }

        throw new Error("CleanerImage validation failed");
      } catch (error) {
        lastError = error;

        // Log retry attempt (in production, use proper logging)
        console.warn(
          `Photo stylization attempt ${attempt}/${this.retryConfig.maxRetries} failed:`,
          error instanceof Error ? error.message : "Unknown error",
        );

        // Don't retry on the last attempt
        if (attempt < this.retryConfig.maxRetries) {
          // Wait before retrying
          await this.delay(this.retryConfig.retryDelayMs);
        }
      }
    }

    // All retries exhausted
    throw lastError instanceof Error
      ? lastError
      : new Error("Photo stylization failed after all retries");
  }

  /**
   * Strictly validate CleanerImage (critical for Mode B)
   * 
   * @private
   */
  private validateCleanerImage(image: CleanerImage): boolean {
    if (!image) {
      return false;
    }

    // Validate data
    if (!image.data || typeof image.data !== "string" || image.data.trim().length === 0) {
      return false;
    }

    // Validate dimensions
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

    // Validate mime type
    if (!image.mimeType || typeof image.mimeType !== "string") {
      return false;
    }

    const validMimeTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validMimeTypes.includes(image.mimeType)) {
      return false;
    }

    // Validate processedAt timestamp
    if (!image.processedAt || !(image.processedAt instanceof Date)) {
      return false;
    }

    return true;
  }

  /**
   * Delay helper for retry logic
   * 
   * @private
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
