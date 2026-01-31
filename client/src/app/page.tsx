import { readFileSync } from "fs";
import path from "path";
import FlowerSvg from "./FlowerSvg";
import ImageToSvgResult from "./ImageToSvgResult";

const svgContent = readFileSync(
  path.join(process.cwd(), "src/assets/flower.svg"),
  "utf-8",
);

export default function Home() {
  return (
    <main className="mx-auto max-w-4xl space-y-8 p-8">
      <h1 className="text-2xl font-bold">Hello Jan, Roman and Ulla</h1>
      <ImageToSvgResult />
    </main>
  );
}
