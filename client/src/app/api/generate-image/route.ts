import { NextRequest } from "next/server";
import { generateImageService } from "@/app/util/generateImageService";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, provider = "openai" } = body;
    
    console.log("API received request - provider:", provider, "prompt:", prompt?.substring(0, 50));

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return Response.json(
        { error: "Prompt is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    if (provider !== "openai" && provider !== "gemini") {
      return Response.json(
        { error: "Provider must be 'openai' or 'gemini'" },
        { status: 400 }
      );
    }

    const images = await generateImageService(prompt.trim(), provider);

    return Response.json({ images });
  } catch (error) {
    console.error("Error in generate-image API:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to generate images",
      },
      { status: 500 }
    );
  }
}
