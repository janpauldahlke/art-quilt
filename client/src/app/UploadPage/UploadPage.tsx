"use client";

/**
 * this page is for
 * 1. opening an exisitng project (mock, cause we dont have a dedicated user yet implemented)
 * 2. file upload of all image types in a max size
 * 3. split screen prompt
 * persist the prompt in like session storage
 * add button the clear propmt,
 * we do not save chat history somewhere each is prompt is alone for now
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ImageSelectionLightbox } from "@/app/ImageSelectionPage/ImageSelectionLightbox";
import { UploadComponent } from "./UploadComponent/UploadComponent";
import { UPLOAD_IMAGE_STORAGE_KEY } from "./UploadComponent/UploadComponent";
import { UserPromptComponent } from "./UserPromptComponent/UserPromptComponent";

export default function UploadPage() {
  const router = useRouter();
  const [hasImage, setHasImage] = useState(false);
  const [hasPrompt, setHasPrompt] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [uploadKey, setUploadKey] = useState(0);

  const openLightbox = useCallback(() => setLightboxOpen(true), []);
  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const handleLightboxSelect = useCallback(
    (base64: string) => {
      if (typeof window === "undefined") return;
      try {
        localStorage.setItem(UPLOAD_IMAGE_STORAGE_KEY, base64);
        setUploadKey((k) => k + 1);
        setHasImage(true);
        setLightboxOpen(false);
      } catch {
        // quota etc. – leave lightbox open or show error if you like
      }
    },
    []
  );

  return (
    <section>
      <h1>This is Upload Page</h1>
      <div className="flex flex-row flex-wrap items-start gap-6">
        <UserPromptComponent disabled={hasImage} onPromptChange={setHasPrompt} />
        <div>
          {!hasImage && (
            <button
              type="button"
              onClick={openLightbox}
              disabled={!hasPrompt}
              style={{
                marginBottom: 12,
                padding: "8px 16px",
                fontSize: 14,
                color: hasPrompt ? "#fff" : "#a3a3a3",
                backgroundColor: hasPrompt ? "#6366f1" : "#e5e5e5",
                border: "none",
                borderRadius: 8,
                cursor: hasPrompt ? "pointer" : "not-allowed",
              }}
            >
              Generate from prompt
            </button>
          )}
          <UploadComponent
            key={uploadKey}
            onImageChange={setHasImage}
          />
          {hasImage && (
            <button
              type="button"
              onClick={() => router.push("/designcreation")}
              style={{
                marginTop: 16,
                padding: "10px 20px",
                fontSize: 14,
                color: "#fff",
                backgroundColor: "#10b981",
                border: "none",
                borderRadius: 8,
                cursor: "pointer",
              }}
            >
              Next step
            </button>
          )}
        </div>
      </div>
      <ImageSelectionLightbox
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onSelect={handleLightboxSelect}
      />
    </section>
  );
}
