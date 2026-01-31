import { readFileSync } from "fs";
import path from "path";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getSystemPrompt } from "@/app/svgService/svgPrompt";

const IMAGE_PATH = path.join(process.cwd(), "src", "assets", "input.JPG");

/** Extract raw SVG from model response (handles ```xml / ```svg code blocks). */
function extractSvgFromResponse(text: string): string {
  const codeBlockMatch = text.match(/```(?:xml|svg)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();
  const svgMatch = text.match(/<svg[\s\S]*<\/svg>/i);
  if (svgMatch) return svgMatch[0];
  return text.trim();
}

export async function POST() {
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "GOOGLE_API_KEY is not set in environment" },
      { status: 500 },
    );
  }

  let imageBase64: string;
  try {
    const buffer = readFileSync(IMAGE_PATH);
    imageBase64 = buffer.toString("base64");
  } catch (e) {
    return Response.json(
      {
        error: `Failed to read image at ${IMAGE_PATH}: ${(e as Error).message}`,
      },
      { status: 500 },
    );
  }

  const systemPrompt = getSystemPrompt();
  const userPrompt =
    "Convert this image to a quilting/stitching pattern SVG following the instructions. Use a small grid (e.g. WIDTH=20 or 30) so you can output the full SVG XML in this response—each pixel as its own <rect>. Reply with the complete <svg>...</svg> code.";

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-pro",
    systemInstruction: systemPrompt,
    generationConfig: { maxOutputTokens: 4096 },
  });

  const result = await model.generateContent([
    { text: userPrompt },
    {
      inlineData: {
        mimeType: "image/jpeg",
        data: imageBase64,
      },
    },
  ]);

  const rawContent = result.response.text();
  const svg = extractSvgFromResponse(rawContent);

  // Log the full model response as JSON (server console)
  const responsePayload = {
    candidates: result.response.candidates,
    usageMetadata: result.response.usageMetadata,
    rawContent,
  };
  console.log(
    "Gemini model response (JSON):",
    JSON.stringify(responsePayload, null, 2),
  );

  return Response.json({ svg, raw: rawContent });
}
