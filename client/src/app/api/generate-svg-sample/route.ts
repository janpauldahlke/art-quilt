import path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const potrace = require("potrace");

const IMAGE_PATH = path.join(process.cwd(), "src", "assets", "input.JPG");

/**
 * Converts image file to SVG using potrace.
 * Uses file path instead of Buffer to avoid instanceof issues.
 */
function imageToSvg(imagePath: string): Promise<string> {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:imageToSvg',message:'imageToSvg called with path',data:{imagePath},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  return new Promise((resolve, reject) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:beforeTrace',message:'About to call potrace.trace with path',data:{potraceType:typeof potrace,traceType:typeof potrace.trace},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    potrace.trace(imagePath, (err: Error | null, svg: string) => {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:traceCallback',message:'potrace.trace callback',data:{hasError:!!err,errorMsg:err?.message,svgLength:svg?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
      // #endregion
      if (err) {
        reject(err);
      } else {
        resolve(svg);
      }
    });
  });
}

export async function POST() {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:POST',message:'POST handler started',data:{imagePath:IMAGE_PATH},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
  // #endregion
  try {
    // Generate SVG using potrace with file path (avoids Buffer instanceof issues)
    const svg = await imageToSvg(IMAGE_PATH);

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:success',message:'SVG generated successfully',data:{svgLength:svg.length},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'success'})}).catch(()=>{});
    // #endregion

    return Response.json({ svg });
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/8b26f06e-9b4e-4c73-8130-6334ed2587e8',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'generate-svg-sample/route.ts:catch',message:'Error caught',data:{errorMsg:(error as Error).message,errorStack:(error as Error).stack},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'all'})}).catch(()=>{});
    // #endregion
    console.error("Error generating SVG:", error);
    return Response.json(
      { error: (error as Error).message ?? "Failed to generate SVG" },
      { status: 500 }
    );
  }
}
