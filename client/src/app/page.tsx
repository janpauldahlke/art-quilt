import { readFileSync } from "fs";
import path from "path";
import FlowerSvg from "./FlowerSvg";

const svgContent = readFileSync(
  path.join(process.cwd(), "src/assets/flower.svg"),
  "utf-8",
);

const openaiApiKey = process.env.OPENAI_API_KEY;

export default function Home() {
  console.log(
    "OPENAI_API_KEY (from .env):",
    openaiApiKey ? "[set]" : "[not set]",
  );
  return (
    <main>
      <h1>Hello Jan, Roman and Ulla</h1>
      <FlowerSvg svgContent={svgContent} />
    </main>
  );
}
