/**
 * Mode B (Photo Flow) Usage Example
 * 
 * Demonstrates how to instantiate and run the PhotoToQuiltStrategy pipeline.
 * This is the KEY/PRIORITY mode with enhanced error handling.
 */

import type { UserPhoto, PipelineResult, FinalQuilt } from "@/types/quiltPipeline";
import type { NanoBananaClient } from "@/types/quiltPipeline";
import { ValidationError } from "@/types/quiltPipeline";
import { QuiltPipelineFactory } from "../QuiltPipelineFactory";
import { QuiltGenerator } from "../../quiltGenerator";
import { PhotoToQuiltStrategy } from "../strategies/PhotoToQuiltStrategy";

/**
 * Example: Run Mode B pipeline with a user photo
 * 
 * @param nanoBananaClient - The existing NanoBananaClient instance
 * @param userPhoto - The user photo (File or base64 string)
 * @returns Promise resolving to the final quilt SVG or error
 */
export async function runModeBPipeline(
  nanoBananaClient: NanoBananaClient,
  userPhoto: UserPhoto,
): Promise<PipelineResult<FinalQuilt>> {
  // Create QuiltGenerator with optional configuration
  const quiltGenerator = new QuiltGenerator({
    gridWidth: 100,
    colorPaletteSize: 32,
    useGemini: true,
    // apiKey will be read from process.env.GOOGLE_API_KEY if not provided
  });

  // Option 1: Use factory to create pipeline
  const pipeline = QuiltPipelineFactory.createPhotoPipeline(
    nanoBananaClient,
    quiltGenerator,
  );

  // Option 2: Create strategy directly (alternative approach)
  // const pipeline = new PhotoToQuiltStrategy(nanoBananaClient, quiltGenerator);

  // Execute the pipeline
  const result = await pipeline.execute(userPhoto);

  // Handle results
  if (result.success && result.data) {
    console.log("Quilt generated successfully!");
    console.log(`SVG length: ${result.data.length} characters`);
    return result;
  } else {
    console.error("Pipeline failed:", result.error);
    return result;
  }
}

/**
 * Example: Run Mode B pipeline with photo from File object
 */
export async function runModeBWithFile(
  nanoBananaClient: NanoBananaClient,
  file: File,
): Promise<PipelineResult<FinalQuilt>> {
  const pipeline = QuiltPipelineFactory.createPhotoPipeline(nanoBananaClient);

  // Validate before executing
  if (!pipeline.validate(file)) {
    return {
      success: false,
      error: new ValidationError("Invalid file: must be JPEG or PNG image", {
        file,
      }),
    };
  }

  return await pipeline.execute(file);
}

/**
 * Example: Run Mode B pipeline with base64 photo from localStorage
 */
export async function runModeBWithBase64(
  nanoBananaClient: NanoBananaClient,
): Promise<PipelineResult<FinalQuilt>> {
  // Get photo from localStorage (as used in UploadComponent)
  if (typeof window === "undefined") {
    return {
      success: false,
      error: new ValidationError(
        "localStorage is not available in this environment",
      ),
    };
  }

  const UPLOAD_IMAGE_STORAGE_KEY = "art-quilt-upload-image";
  const base64Photo = localStorage.getItem(UPLOAD_IMAGE_STORAGE_KEY);

  if (!base64Photo) {
    return {
      success: false,
      error: new ValidationError("No photo found in localStorage"),
    };
  }

  const pipeline = QuiltPipelineFactory.createPhotoPipeline(nanoBananaClient);
  return await pipeline.execute(base64Photo);
}

/**
 * Example: Complete workflow with error handling
 */
export async function completeModeBWorkflow(
  nanoBananaClient: NanoBananaClient,
  userPhoto: UserPhoto,
): Promise<void> {
  try {
    console.log("Starting Mode B (Photo Flow) pipeline...");

    // Create pipeline
    const pipeline = QuiltPipelineFactory.createPhotoPipeline(nanoBananaClient);

    // Validate input
    if (!pipeline.validate(userPhoto)) {
      console.error("Invalid photo input");
      return;
    }

    // Execute pipeline
    const result = await pipeline.execute(userPhoto);

    if (result.success && result.data) {
      console.log("✓ Pipeline completed successfully");
      console.log(`✓ Generated quilt SVG (${result.data.length} chars)`);

      // Here you would typically:
      // 1. Save the SVG to a file or database
      // 2. Display it in the UI
      // 3. Allow user to download it
      // Example: saveQuiltToFile(result.data);

      return;
    } else {
      console.error("✗ Pipeline failed:", result.error?.message);
      console.error("Error code:", result.error?.code);
      console.error("Error details:", result.error?.details);
    }
  } catch (error) {
    console.error("Unexpected error:", error);
  }
}

/**
 * Example usage in a Next.js API route or React component:
 * 
 * ```typescript
 * import { runModeBPipeline } from '@/app/util/quiltPipeline/examples/modeBExample';
 * import { nanoBananaClient } from '@/path/to/existing/client';
 * 
 * // In an API route:
 * export async function POST(request: Request) {
 *   const formData = await request.formData();
 *   const photoFile = formData.get('photo') as File;
 *   
 *   const result = await runModeBPipeline(nanoBananaClient, photoFile);
 *   
 *   if (result.success) {
 *     return Response.json({ svg: result.data });
 *   } else {
 *     return Response.json({ error: result.error?.message }, { status: 500 });
 *   }
 * }
 * 
 * // In a React component:
 * const handleGenerate = async () => {
 *   const photo = await getPhotoFromStorage(); // Your existing logic
 *   const result = await runModeBPipeline(nanoBananaClient, photo);
 *   
 *   if (result.success) {
 *     setQuiltSvg(result.data);
 *   } else {
 *     setError(result.error?.message);
 *   }
 * };
 * ```
 */
