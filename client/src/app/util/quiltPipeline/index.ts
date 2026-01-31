/**
 * Quilt Pipeline - Public API
 * 
 * Central export point for the Quilt Generation Pipeline system.
 * Provides easy access to all pipeline components.
 */

// Core interface
export { IQuiltPipeline } from "./IQuiltPipeline";

// Factory
export { QuiltPipelineFactory } from "./QuiltPipelineFactory";

// Strategies
export { TextToQuiltStrategy } from "./strategies/TextToQuiltStrategy";
export { PhotoToQuiltStrategy } from "./strategies/PhotoToQuiltStrategy";
export {
  StyledPhotoToQuiltStrategy,
  type StyledPhotoInput,
} from "./strategies/StyledPhotoToQuiltStrategy";

// Re-export types for convenience
export type {
  ProcessingMode,
  TextPrompt,
  UserPhoto,
  StyleConfig,
  RawImage,
  CleanerImage,
  FinalQuilt,
  PipelineResult,
  PipelineError,
  ValidationError,
  ProcessingError,
  GenerationError,
  NanoBananaClient,
} from "@/types/quiltPipeline";
