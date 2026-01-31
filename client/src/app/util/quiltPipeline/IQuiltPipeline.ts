/**
 * Core interface for Quilt Generation Pipeline strategies
 * 
 * All pipeline modes implement this interface, enabling polymorphic usage
 * through the Strategy pattern.
 */

import type {
  ProcessingMode,
  PipelineResult,
  FinalQuilt,
} from "@/types/quiltPipeline";

/**
 * Generic pipeline interface for quilt generation workflows
 * 
 * @template TInput - The input type for this pipeline mode
 * @template TOutput - The output type (always FinalQuilt for quilt pipelines)
 */
export interface IQuiltPipeline<TInput, TOutput extends FinalQuilt> {
  /**
   * Execute the pipeline with the given input
   * 
   * @param input - The input data for processing
   * @returns Promise resolving to a PipelineResult containing the final quilt or error
   */
  execute(input: TInput): Promise<PipelineResult<TOutput>>;

  /**
   * Validate the input before processing
   * 
   * @param input - The input data to validate
   * @returns true if input is valid, false otherwise
   */
  validate(input: TInput): boolean;

  /**
   * Get the processing mode this pipeline handles
   * 
   * @returns The ProcessingMode enum value
   */
  getMode(): ProcessingMode;
}
