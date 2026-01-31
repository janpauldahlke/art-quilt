/**
 * Image Processing Pipeline for Quilt Design
 * 
 * This module handles:
 * 1. Pixelation - converting image to a grid of solid color blocks
 * 2. Color quantization - reducing to a limited palette (2-10 colors)
 * 3. SVG generation with quilt metadata (angles, sizes for stitching)
 */

export type ShapeType = "pixel" | "triangle" | "hexagon";

export type QuiltShape = {
  id: string;
  type: ShapeType;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  // Stitching metadata
  stitchData: {
    /** Angle in degrees for the stitch direction */
    angle: number;
    /** Size in mm for real-world fabrication */
    sizeMm: number;
    /** Seam allowance in mm */
    seamAllowanceMm: number;
    /** Number of edges (4 for pixel, 3 for triangle, 6 for hexagon) */
    edges: number;
    /** Adjacent shape IDs for stitching order */
    neighbors: string[];
    /** Row and column in the grid */
    gridPosition: { row: number; col: number };
  };
};

export type QuiltDesign = {
  width: number;
  height: number;
  gridWidth: number;
  gridHeight: number;
  cellSize: number;
  shapeType: ShapeType;
  colorPalette: string[];
  shapes: QuiltShape[];
  /** Real-world dimensions */
  fabricData: {
    totalWidthMm: number;
    totalHeightMm: number;
    cellSizeMm: number;
    seamAllowanceMm: number;
  };
};

type RGB = [number, number, number];

/**
 * Load an image from a data URL into an ImageData object
 */
export function loadImageData(dataUrl: string): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas not supported"));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(ctx.getImageData(0, 0, img.width, img.height));
    };
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

/**
 * Pixelate an image by averaging colors in grid cells
 */
export function pixelateImage(
  imageData: ImageData,
  gridWidth: number
): { colors: RGB[][]; cellWidth: number; cellHeight: number } {
  const { width, height, data } = imageData;
  const cellWidth = Math.floor(width / gridWidth);
  const gridHeight = Math.floor(height / cellWidth);
  const cellHeight = cellWidth; // Keep cells square

  const colors: RGB[][] = [];

  for (let row = 0; row < gridHeight; row++) {
    const rowColors: RGB[] = [];
    for (let col = 0; col < gridWidth; col++) {
      // Sample all pixels in this cell and average them
      let r = 0, g = 0, b = 0, count = 0;

      const startX = col * cellWidth;
      const startY = row * cellHeight;
      const endX = Math.min(startX + cellWidth, width);
      const endY = Math.min(startY + cellHeight, height);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const i = (y * width + x) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          count++;
        }
      }

      if (count > 0) {
        rowColors.push([
          Math.round(r / count),
          Math.round(g / count),
          Math.round(b / count),
        ]);
      }
    }
    colors.push(rowColors);
  }

  return { colors, cellWidth, cellHeight };
}

/**
 * Calculate color distance (Euclidean in RGB space)
 */
function colorDistance(c1: RGB, c2: RGB): number {
  const dr = c1[0] - c2[0];
  const dg = c1[1] - c2[1];
  const db = c1[2] - c2[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Find the closest color in a palette
 */
function findClosestColor(color: RGB, palette: RGB[]): RGB {
  let minDist = Infinity;
  let closest = palette[0];
  for (const p of palette) {
    const dist = colorDistance(color, p);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  return closest;
}

/**
 * K-means clustering for color quantization
 */
export function quantizeColors(
  colors: RGB[][],
  numColors: number
): { quantized: RGB[][]; palette: RGB[] } {
  // Flatten all colors
  const allColors: RGB[] = colors.flat();
  
  if (allColors.length === 0) {
    return { quantized: [], palette: [] };
  }

  // Initialize centroids with k-means++ style selection
  const centroids: RGB[] = [];
  
  // First centroid: random
  centroids.push(allColors[Math.floor(Math.random() * allColors.length)]);
  
  // Remaining centroids: choose colors far from existing centroids
  while (centroids.length < numColors) {
    let maxDist = -1;
    let bestColor = allColors[0];
    
    for (const color of allColors) {
      const minDistToCentroid = Math.min(
        ...centroids.map((c) => colorDistance(color, c))
      );
      if (minDistToCentroid > maxDist) {
        maxDist = minDistToCentroid;
        bestColor = color;
      }
    }
    centroids.push(bestColor);
  }

  // K-means iterations
  const MAX_ITERATIONS = 20;
  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    // Assign each color to nearest centroid
    const clusters: RGB[][] = Array.from({ length: numColors }, () => []);
    
    for (const color of allColors) {
      let minDist = Infinity;
      let closestIdx = 0;
      for (let i = 0; i < centroids.length; i++) {
        const dist = colorDistance(color, centroids[i]);
        if (dist < minDist) {
          minDist = dist;
          closestIdx = i;
        }
      }
      clusters[closestIdx].push(color);
    }

    // Update centroids
    let converged = true;
    for (let i = 0; i < numColors; i++) {
      if (clusters[i].length === 0) continue;
      
      const newCentroid: RGB = [
        Math.round(clusters[i].reduce((s, c) => s + c[0], 0) / clusters[i].length),
        Math.round(clusters[i].reduce((s, c) => s + c[1], 0) / clusters[i].length),
        Math.round(clusters[i].reduce((s, c) => s + c[2], 0) / clusters[i].length),
      ];
      
      if (colorDistance(newCentroid, centroids[i]) > 1) {
        converged = false;
      }
      centroids[i] = newCentroid;
    }
    
    if (converged) break;
  }

  // Quantize all colors to nearest centroid
  const quantized: RGB[][] = colors.map((row) =>
    row.map((color) => findClosestColor(color, centroids))
  );

  return { quantized, palette: centroids };
}

/**
 * Convert RGB to hex color string
 */
function rgbToHex(rgb: RGB): string {
  return (
    "#" +
    rgb
      .map((v) => {
        const hex = v.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("")
  );
}

/**
 * Generate a QuiltDesign from pixelated, quantized colors
 */
export function generateQuiltDesign(
  quantizedColors: RGB[][],
  palette: RGB[],
  shapeType: ShapeType,
  cellSizeMm: number = 25, // Default 25mm (1 inch) per cell
  seamAllowanceMm: number = 6.35 // Default 1/4 inch seam
): QuiltDesign {
  const gridHeight = quantizedColors.length;
  const gridWidth = quantizedColors[0]?.length || 0;
  const cellSize = 20; // pixels for SVG display

  const shapes: QuiltShape[] = [];
  const colorPalette = palette.map(rgbToHex);

  for (let row = 0; row < gridHeight; row++) {
    for (let col = 0; col < gridWidth; col++) {
      const color = quantizedColors[row][col];
      const colorHex = rgbToHex(color);
      const id = `shape-${row}-${col}`;

      // Calculate neighbors for stitching order
      const neighbors: string[] = [];
      if (row > 0) neighbors.push(`shape-${row - 1}-${col}`); // top
      if (col < gridWidth - 1) neighbors.push(`shape-${row}-${col + 1}`); // right
      if (row < gridHeight - 1) neighbors.push(`shape-${row + 1}-${col}`); // bottom
      if (col > 0) neighbors.push(`shape-${row}-${col - 1}`); // left

      const shape: QuiltShape = {
        id,
        type: shapeType,
        x: col * cellSize,
        y: row * cellSize,
        width: cellSize,
        height: cellSize,
        color: colorHex,
        stitchData: {
          angle: 0, // Straight stitch for pixels
          sizeMm: cellSizeMm,
          seamAllowanceMm,
          edges: shapeType === "pixel" ? 4 : shapeType === "triangle" ? 3 : 6,
          neighbors,
          gridPosition: { row, col },
        },
      };

      shapes.push(shape);
    }
  }

  return {
    width: gridWidth * cellSize,
    height: gridHeight * cellSize,
    gridWidth,
    gridHeight,
    cellSize,
    shapeType,
    colorPalette,
    shapes,
    fabricData: {
      totalWidthMm: gridWidth * cellSizeMm,
      totalHeightMm: gridHeight * cellSizeMm,
      cellSizeMm,
      seamAllowanceMm,
    },
  };
}

/**
 * Generate SVG from QuiltDesign
 */
export function quiltDesignToSvg(design: QuiltDesign): string {
  const { width, height, shapes, shapeType } = design;

  let shapesXml = "";

  for (const shape of shapes) {
    const { id, x, y, width: w, height: h, color, stitchData } = shape;

    // Data attributes for stitching info
    const dataAttrs = `
      data-id="${id}"
      data-row="${stitchData.gridPosition.row}"
      data-col="${stitchData.gridPosition.col}"
      data-size-mm="${stitchData.sizeMm}"
      data-seam-mm="${stitchData.seamAllowanceMm}"
      data-edges="${stitchData.edges}"
      data-neighbors="${stitchData.neighbors.join(",")}"
    `.trim().replace(/\s+/g, " ");

    if (shapeType === "pixel") {
      shapesXml += `  <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" ${dataAttrs}/>\n`;
    } else if (shapeType === "triangle") {
      // For future: alternate triangles pointing up/down
      const isUpper = (stitchData.gridPosition.row + stitchData.gridPosition.col) % 2 === 0;
      const points = isUpper
        ? `${x + w / 2},${y} ${x + w},${y + h} ${x},${y + h}`
        : `${x},${y} ${x + w},${y} ${x + w / 2},${y + h}`;
      shapesXml += `  <polygon points="${points}" fill="${color}" ${dataAttrs}/>\n`;
    } else if (shapeType === "hexagon") {
      // For future: hexagon grid
      const cx = x + w / 2;
      const cy = y + h / 2;
      const r = w / 2;
      const points = Array.from({ length: 6 }, (_, i) => {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`;
      }).join(" ");
      shapesXml += `  <polygon points="${points}" fill="${color}" ${dataAttrs}/>\n`;
    }
  }

  // Add metadata as JSON in a comment for later extraction
  const metadata = {
    fabricData: design.fabricData,
    colorPalette: design.colorPalette,
    gridSize: { width: design.gridWidth, height: design.gridHeight },
    shapeType: design.shapeType,
    totalShapes: design.shapes.length,
  };

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${width}" 
     height="${height}" 
     viewBox="0 0 ${width} ${height}"
     data-quilt-design="true"
     data-grid-width="${design.gridWidth}"
     data-grid-height="${design.gridHeight}"
     data-shape-type="${shapeType}">
  <!-- Quilt Design Metadata: ${JSON.stringify(metadata)} -->
${shapesXml}</svg>`;
}

/**
 * Full pipeline: Image → Pixelated → Quantized → SVG
 */
export async function processImageToQuiltSvg(
  imageDataUrl: string,
  options: {
    gridWidth?: number;
    numColors?: number;
    shapeType?: ShapeType;
    cellSizeMm?: number;
    seamAllowanceMm?: number;
  } = {}
): Promise<{ svg: string; design: QuiltDesign }> {
  const {
    gridWidth = 30,
    numColors = 6,
    shapeType = "pixel",
    cellSizeMm = 25,
    seamAllowanceMm = 6.35,
  } = options;

  // Load image
  const imageData = await loadImageData(imageDataUrl);

  // Pixelate
  const { colors } = pixelateImage(imageData, gridWidth);

  // Quantize colors
  const { quantized, palette } = quantizeColors(colors, numColors);

  // Generate design with stitching metadata
  const design = generateQuiltDesign(
    quantized,
    palette,
    shapeType,
    cellSizeMm,
    seamAllowanceMm
  );

  // Generate SVG
  const svg = quiltDesignToSvg(design);

  return { svg, design };
}
