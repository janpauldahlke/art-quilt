import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ArtQuilt - Turn Images Into Quilt Designs",
  description:
    "Transform your photos or AI-generated images into beautiful, quilt-ready designs. Create printable patterns with color maps and fabric requirements for quilters and textile artists of all skill levels.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
