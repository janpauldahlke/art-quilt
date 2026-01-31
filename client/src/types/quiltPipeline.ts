/**
 * Type definitions for Quilt Generation Pipeline
 * 
 * This file defines all types used across the pipeline system, including
 * mock interfaces for existing dependencies (NanoBananaClient, UserPhoto, RawImage)
 */

// ============================================================================
// Processing Mode Enum
// ============================================================================

export enum ProcessingMode {
  MODE_A = "MODE_A", // Text Flow
  MODE_B = "MODE_B", // Photo Flow (Priority)
  MODE_C = "MODE_C", // Style Picker Flow
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Text prompt for image generation (Mode A)
 */
export type TextPrompt = string;

/**
 * User photo input - can be File, base64 string, or data URL
 * Assumed to exist elsewhere, but defined here for reference
 */
export type UserPhoto = File | string; // File or base64/data URL string

/**
 * Style configuration for fabric styling (Mode C)
 */
export interface StyleConfig {
  fabricType: string;
  colorPalette?: string[];
  patternIntensity?: number; // 0-1 scale
  stylePreset?: "traditional" | "modern" | "abstract" | "geometric";
  [key: string]: unknown; // Allow extensibility
}

// ============================================================================
// Intermediate Types
// ============================================================================

/**
 * Raw image result from text generation (Mode A)
 * Assumed to exist elsewhere, but defined here for reference
 */
export interface RawImage {
  data: string; // base64 or data URL
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Cleaner/stylized image result from photo processing (Mode B & C)
 * Critical type for Mode B - must be strictly typed
 */
export interface CleanerImage {
  data: string; // base64 or data URL
  width: number;
  height: number;
  mimeType: string;
  processedAt: Date;
  metadata?: {
    originalFormat?: string;
    processingParams?: Record<string, unknown>;
  };
}

// ============================================================================
// Output Types
// ============================================================================

/**
 * Final quilt output as SVG string
 */
export type FinalQuilt = string; // SVG XML string

// ============================================================================
// Result Wrapper Types
// ============================================================================

/**
 * Pipeline error types
 */
export class PipelineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "PipelineError";
  }
}

export class ValidationError extends PipelineError {
  constructor(message: string, details?: unknown) {
    super(message, "VALIDATION_ERROR", details);
    this.name = "ValidationError";
  }
}

export class ProcessingError extends PipelineError {
  constructor(message: string, details?: unknown) {
    super(message, "PROCESSING_ERROR", details);
    this.name = "ProcessingError";
  }
}

export class GenerationError extends PipelineError {
  constructor(message: string, details?: unknown) {
    super(message, "GENERATION_ERROR", details);
    this.name = "GenerationError";
  }
}

/**
 * Generic result wrapper for pipeline operations
 */
export interface PipelineResult<T> {
  success: boolean;
  data?: T;
  error?: PipelineError;
}

// ============================================================================
// NanoBananaClient Interface (Mock - assumes exists elsewhere)
// ============================================================================

/**
 * Mock interface for NanoBananaClient
 * Assumes this client exists elsewhere and provides these methods
 */
export interface NanoBananaClient {
  /**
   * Generate an image from a text prompt (Mode A)
   */
  generateImage(prompt: TextPrompt): Promise<RawImage>;

  /**
   * Stylize a user photo (Mode B - Priority)
   */
  stylizePhoto(photo: UserPhoto): Promise<CleanerImage>;

  /**
   * Apply fabric style to a photo (Mode C)
   */
  applyFabricStyle(
    photo: UserPhoto,
    config: StyleConfig,
  ): Promise<CleanerImage>;
}
