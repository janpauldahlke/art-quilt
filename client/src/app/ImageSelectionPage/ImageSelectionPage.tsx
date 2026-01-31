// TODO: check to remove this later

/**
 * Image selection is implemented as a lightbox on the Upload page, not as a separate route.
 * See ImageSelectionLightbox and UploadPage: after the user creates a prompt and clicks
 * "Generate from prompt", the lightbox shows mock LLM results; the user picks one and it
 * is stored (base64) in localStorage and shown where the upload area was.
 *
 * /FROMGROUP
 * * style : pixelate | triangle | hexagaon
 * * color: how may colors 2-10
 * * granularity: how many parts per inch 10-100 // how large or small is an individual style
 */

export default function ImageSelectionPage() {
  return (
    <section>
      <h1>Image selection</h1>
      <p>
        Selection happens in the lightbox on the Upload page after generating
        from your prompt.
      </p>
    </section>
  );
}
