/**
 * QuiltPipelineFactory
 * 
 * Factory for creating appropriate pipeline strategy instances based on mode.
 * Handles dependency injection and ensures correct strategy is returned.
 */

import type {
  ProcessingMode,
  NanoBananaClient,
  FinalQuilt,
} from "@/types/quiltPipeline";
import { ProcessingMode as Mode } from "@/types/quiltPipeline";
import { IQuiltPipeline } from "./IQuiltPipeline";
import { QuiltGenerator } from "../quiltGenerator";
import { TextToQuiltStrategy } from "./strategies/TextToQuiltStrategy";
import { PhotoToQuiltStrategy } from "./strategies/PhotoToQuiltStrategy";
import { StyledPhotoToQuiltStrategy } from "./strategies/StyledPhotoToQuiltStrategy";

/**
 * Factory for creating quilt pipeline strategies
 */
export class QuiltPipelineFactory {
  /**
   * Create a pipeline strategy instance for the given mode
   * 
   * @param mode - The processing mode (MODE_A, MODE_B, or MODE_C)
   * @param nanoBananaClient - The NanoBanana client instance
   * @param quiltGenerator - The QuiltGenerator instance (optional, will create default if not provided)
   * @returns An instance of the appropriate strategy implementing IQuiltPipeline
   * @throws Error if mode is invalid
   */
  static createPipeline(
    mode: ProcessingMode,
    nanoBananaClient: NanoBananaClient,
    quiltGenerator?: QuiltGenerator,
  ): IQuiltPipeline<unknown, FinalQuilt> {
    const generator = quiltGenerator ?? new QuiltGenerator();

    switch (mode) {
      case Mode.MODE_A:
        return new TextToQuiltStrategy(nanoBananaClient, generator);

      case Mode.MODE_B:
        return new PhotoToQuiltStrategy(nanoBananaClient, generator);

      case Mode.MODE_C:
        return new StyledPhotoToQuiltStrategy(nanoBananaClient, generator);

      default:
        throw new Error(`Invalid processing mode: ${mode}`);
    }
  }

  /**
   * Create a pipeline strategy instance for Mode A (Text Flow)
   */
  static createTextPipeline(
    nanoBananaClient: NanoBananaClient,
    quiltGenerator?: QuiltGenerator,
  ): TextToQuiltStrategy {
    const generator = quiltGenerator ?? new QuiltGenerator();
    return new TextToQuiltStrategy(nanoBananaClient, generator);
  }

  /**
   * Create a pipeline strategy instance for Mode B (Photo Flow - Priority)
   */
  static createPhotoPipeline(
    nanoBananaClient: NanoBananaClient,
    quiltGenerator?: QuiltGenerator,
  ): PhotoToQuiltStrategy {
    const generator = quiltGenerator ?? new QuiltGenerator();
    return new PhotoToQuiltStrategy(nanoBananaClient, generator);
  }

  /**
   * Create a pipeline strategy instance for Mode C (Style Picker Flow)
   */
  static createStyledPhotoPipeline(
    nanoBananaClient: NanoBananaClient,
    quiltGenerator?: QuiltGenerator,
  ): StyledPhotoToQuiltStrategy {
    const generator = quiltGenerator ?? new QuiltGenerator();
    return new StyledPhotoToQuiltStrategy(nanoBananaClient, generator);
  }
}
