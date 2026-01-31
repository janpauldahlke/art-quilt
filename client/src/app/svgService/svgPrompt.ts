import { readFileSync } from "fs";
import path from "path";

const DEFAULT_INSTRUCTIONS_PATH = path.join(
  process.cwd(),
  "src",
  "instructions",
  "imageToSVG.md",
);

/**
 * Returns the system prompt for the image-to-SVG (quilting pattern) task.
 * Use on the server only (reads from filesystem).
 */
export function getSystemPrompt(
  instructionsPath: string = DEFAULT_INSTRUCTIONS_PATH,
): string {
  return readFileSync(instructionsPath, "utf-8");
}
