import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createSign } from "crypto";

// Helper to convert image URL to base64 data URL
async function urlToBase64(url: string): Promise<string> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString("base64");
  const contentType = response.headers.get("content-type") || "image/png";
  return `data:${contentType};base64,${base64}`;
}

const SYSTEM_PROMPT = `Generate images with the artistic vision and expressive style of a professional quilting artist. Each image should be visually striking and emotionally engaging.

CRITICAL REQUIREMENTS:
- Create bold, simplified compositions with clear, defined shapes and edges
- Use a limited color palette (approximately 20-32 distinct colors maximum)
- Avoid fine details, tiny patterns, or intricate textures that cannot be stitched or cut from fabric
- Focus on strong visual impact through color blocks, geometric shapes, and clear boundaries
- Ensure high contrast between adjacent areas for visibility and pattern clarity
- Compositions should be suitable for translation into fabric pieces

STYLE GUIDELINES:
- Think like a master art quilter creating an expressive, gallery-worthy piece
- Embrace bold artistic choices while maintaining practical stitch-ability
- Favor geometric, pixelated, or simplified organic forms over photorealistic detail
- Create depth through color and shape relationships, not fine texture
- Design for emotional resonance and visual impact

ALWAYS generate an image, never respond with text only.`;

const GEMINI_SYSTEM_PROMPT = `You are generating images for art quilt creation. Generate images with the artistic vision and expressive style of a professional quilting artist. Each image should be visually striking and emotionally engaging.

MANDATORY CONSTRAINTS:
1. Limited Color Palette: Use approximately 20-32 distinct, solid colors maximum
2. Clear Shapes: All shapes must have defined edges and clear boundaries
3. No Fine Details: Avoid intricate patterns, tiny textures, or details smaller than a fabric patch
4. Bold Composition: Create strong visual impact through color blocks and simplified forms
5. High Contrast: Ensure good contrast between adjacent areas for pattern visibility
6. Stitch-able Design: Every element must be practical to cut from fabric and sew

ARTISTIC APPROACH:
- Adopt the creative mindset of an expert art quilter
- Create expressive compositions that are both beautiful and buildable
- Use geometric, pixelated, or simplified organic forms
- Prioritize emotional impact and visual drama
- Balance artistic expression with practical construction

OUTPUT REQUIREMENT:
Always generate an image. Never respond with text only.`;

export const generateImageService = async (
  userPrompt: string,
  provider: "openai" | "gemini" = "openai"
): Promise<string[]> => {
  if (provider === "gemini") {
    return generateWithGemini(userPrompt);
  } else {
    return generateWithOpenAI(userPrompt);
  }
};

async function generateWithOpenAI(userPrompt: string): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set in environment");
  }

  const openai = new OpenAI({ apiKey });

  const fullPrompt = `${SYSTEM_PROMPT}

User Request: ${userPrompt}

Execute this as a quilt-suitable design following all requirements above.`;

  try {
    // DALL-E 3 only supports n=1, so we make 2 separate calls
    const [response1, response2] = await Promise.all([
      openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
      openai.images.generate({
        model: "dall-e-3",
        prompt: fullPrompt,
        size: "1024x1024",
        quality: "standard",
        response_format: "b64_json",
      }),
    ]);

    // Extract base64 data URLs from both responses
    const images: string[] = [];

    if (response1.data && response1.data.length > 0) {
      const image1 = response1.data[0];
      if ("b64_json" in image1 && image1.b64_json) {
        images.push(`data:image/png;base64,${image1.b64_json}`);
      } else if ("url" in image1 && image1.url) {
        // Fallback to URL if base64 not available
        const base64 = await urlToBase64(image1.url);
        images.push(base64);
      }
    }

    if (response2.data && response2.data.length > 0) {
      const image2 = response2.data[0];
      if ("b64_json" in image2 && image2.b64_json) {
        images.push(`data:image/png;base64,${image2.b64_json}`);
      } else if ("url" in image2 && image2.url) {
        // Fallback to URL if base64 not available
        const base64 = await urlToBase64(image2.url);
        images.push(base64);
      }
    }

    if (images.length === 0) {
      throw new Error("No images were generated");
    }

    return images;
  } catch (error) {
    console.error("Error generating images:", error);
    throw new Error(
      `Failed to generate images: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

async function generateWithGemini(userPrompt: string): Promise<string[]> {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || "us-central1";
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

  if (!projectId) {
    throw new Error("GOOGLE_CLOUD_PROJECT is not set in environment");
  }

  if (!credentialsPath) {
    throw new Error("GOOGLE_APPLICATION_CREDENTIALS is not set in environment");
  }

  try {
    // Read service account credentials
    const fs = await import("fs");
    const path = await import("path");
    
    // Resolve the credentials path relative to the project root
    const credentialsFullPath = path.isAbsolute(credentialsPath)
      ? credentialsPath
      : path.resolve(process.cwd(), credentialsPath);
    
    const credentials = JSON.parse(
      fs.readFileSync(credentialsFullPath, "utf8")
    );

    // Get access token using service account
    const accessToken = await getAccessToken(credentials);

    // Build the full prompt with quilting requirements
    const fullPrompt = `${GEMINI_SYSTEM_PROMPT}

Create a quilt-suitable design based on: ${userPrompt}

Generate an image following all the quilting requirements: limited color palette (20-32 colors), clear shapes, bold composition, high contrast, and stitch-able design.`;

    // Use Imagen 4.0 API via REST
    const apiUrl = `https://${location}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${location}/publishers/google/models/imagen-4.0-generate-001:predict`;

    const requestBody = {
      instances: [
        {
          prompt: fullPrompt,
        },
      ],
      parameters: {
        sampleCount: 2, // Generate 2 images
        aspectRatio: "1:1",
        addWatermark: true,
        enhancePrompt: true,
      },
    };

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Imagen API error:", errorText);
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.predictions || !Array.isArray(data.predictions)) {
      throw new Error("Invalid response from Imagen API");
    }

    // Convert base64 images to data URLs
    const images = data.predictions
      .map((prediction: { bytesBase64Encoded?: string; mimeType?: string }) => {
        if (prediction.bytesBase64Encoded) {
          const mimeType = prediction.mimeType || "image/png";
          return `data:${mimeType};base64,${prediction.bytesBase64Encoded}`;
        }
        return null;
      })
      .filter((img: string | null): img is string => img !== null);

    if (images.length === 0) {
      throw new Error("No images were generated by Imagen API");
    }

    return images;
  } catch (error) {
    console.error("Error with Google Imagen image generation:", error);
    throw new Error(
      `Google Imagen image generation failed: ${error instanceof Error ? error.message : "Unknown error"}`
    );
  }
}

// Helper function to create JWT token manually using Node's crypto
function createJWT(credentials: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): string {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const claim = {
    iss: credentials.client_email,
    sub: credentials.client_email,
    aud: credentials.token_uri,
    exp: now + 3600,
    iat: now,
    scope: "https://www.googleapis.com/auth/cloud-platform",
  };

  const encodedHeader = Buffer.from(JSON.stringify(header)).toString("base64url");
  const encodedClaim = Buffer.from(JSON.stringify(claim)).toString("base64url");
  const signatureInput = `${encodedHeader}.${encodedClaim}`;

  const sign = createSign("RSA-SHA256");
  sign.update(signatureInput);
  sign.end();
  const signature = sign.sign(credentials.private_key, "base64url");

  return `${signatureInput}.${signature}`;
}

// Helper function to get access token from service account
async function getAccessToken(credentials: {
  client_email: string;
  private_key: string;
  token_uri: string;
}): Promise<string> {
  const jwt = createJWT(credentials);

  const response = await fetch(credentials.token_uri, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to get access token: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (!data.access_token) {
    throw new Error("No access token in response");
  }
  return data.access_token;
}
