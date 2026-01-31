/**
 * Service for generating images from text prompts
 * Uses the /api/generate-image endpoint which calls Google Gemini
 */

export type GenerateImageResult = {
  success: boolean;
  image?: string; // base64 data URL
  error?: string;
};

export const generateImageService = async (
  userPrompt: string
): Promise<GenerateImageResult> => {
  try {
    const response = await fetch("/api/generate-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: userPrompt }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      return {
        success: false,
        error: data.error || "Failed to generate image",
      };
    }

    return {
      success: true,
      image: data.image,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Network error",
    };
  }
};
