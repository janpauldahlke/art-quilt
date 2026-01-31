import { NextRequest } from "next/server";
import { generateSVGService } from "@/app/util/generateSVGService";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return Response.json({ error: "No image provided" }, { status: 400 });
    }

    console.log("Starting SVG generation with Potrace (Gemini fallback available)");
    const svg = await generateSVGService(imageFile);

    console.log("Generated SVG successfully, length:", svg.length);

    return Response.json({ svg });
  } catch (error) {
    console.error("Error generating SVG:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to generate SVG";
    
    // Check if it's a module not found error (potrace not installed)
    if (errorMessage.includes("Cannot find module") || errorMessage.includes("potrace")) {
      return Response.json(
        { 
          error: "Potrace module not found. Please install it by running: npm install potrace (or pnpm install if using pnpm)",
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return Response.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
