import { readFileSync } from "fs";
import path from "path";
import OpenAI from "openai";
import { getSystemPrompt } from "@/app/svgService/svgPrompt";

const openai = new OpenAI({
  apiKey: process.env.GOOGLE_API_KEY,
});

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
      { error: "GOOGLE API KEY is not set in environment" },
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

  const completion = await openai.chat.completions.create({
    model: "gemini-3",
    reasoning_effort: "high",
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Convert this image to a quilting/stitching pattern SVG following the instructions. Use a small grid (e.g. WIDTH=20 or 30) so you can output the full SVG XML in this response—each pixel as its own <rect>. Reply with the complete <svg>...</svg> code.",
          },
          {
            type: "image_url",
            image_url: {
              url: `data:image/jpeg;base64,${imageBase64}`,
            },
          },
        ],
      },
    ],
    max_tokens: 4096,
  });

  const rawContent = completion.choices[0]?.message?.content ?? "";
  console.log("-->", rawContent);
  const svg = extractSvgFromResponse(rawContent);

  // Log the full model response as JSON (server console)
  console.log(
    "OpenAI model response (JSON):",
    JSON.stringify(
      {
        id: completion.id,
        model: completion.model,
        choices: completion.choices?.map((c) => ({
          index: c.index,
          message: c.message,
          finish_reason: c.finish_reason,
        })),
        usage: completion.usage,
      },
      null,
      2,
    ),
  );

  return Response.json({ svg, raw: rawContent });
}
