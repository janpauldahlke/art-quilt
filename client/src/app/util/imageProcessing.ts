/**
 * Image Processing Pipeline for Quilt Design
 * 
 * This module handles:
 * 1. Pixelation - converting image to a grid of solid color blocks
 * 2. Color quantization - reducing to a limited palette (2-10 colors)
 * 3. SVG generation with quilt metadata (angles, sizes for stitching)
 * 4. Voronoi diagrams - organic cell-based patterns from seed points
 */

export type ShapeType = "pixel" | "triangle" | "hexagon" | "voronoi";

/**
 * Settings specific to Voronoi diagram generation
 */
export type VoronoiSettings = {
  /** Number of seed points (cells) - 20 to 500 */
  numSeeds: number;
  /** Lloyd's relaxation iterations for more uniform cells - 0 to 10 */
  relaxationIterations: number;
  /** Whether seeds should be weighted by image edges/detail */
  edgeWeighted: boolean;
  /** Border/stroke width for cells (0 = no border) */
  borderWidth: number;
};

export const DEFAULT_VORONOI_SETTINGS: VoronoiSettings = {
  numSeeds: 100,
  relaxationIterations: 3,
  edgeWeighted: true,
  borderWidth: 1,
};

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
    voronoiSettings?: VoronoiSettings;
  } = {}
): Promise<{ svg: string; design: QuiltDesign }> {
  const {
    gridWidth = 30,
    numColors = 6,
    shapeType = "pixel",
    cellSizeMm = 25,
    seamAllowanceMm = 6.35,
    voronoiSettings = DEFAULT_VORONOI_SETTINGS,
  } = options;

  // Load image
  const imageData = await loadImageData(imageDataUrl);

  // Use Voronoi pipeline if selected
  if (shapeType === "voronoi") {
    return processImageToVoronoiSvg(imageData, {
      numSeeds: voronoiSettings.numSeeds,
      numColors,
      relaxationIterations: voronoiSettings.relaxationIterations,
      edgeWeighted: voronoiSettings.edgeWeighted,
      borderWidth: voronoiSettings.borderWidth,
      cellSizeMm,
      seamAllowanceMm,
    });
  }

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


// ============================================================================
// VORONOI DIAGRAM IMPLEMENTATION
// ============================================================================

type Point = { x: number; y: number };

type VoronoiCell = {
  id: string;
  seed: Point;
  color: RGB;
  polygon: Point[];
  area: number;
};

/**
 * Compute Sobel edge magnitude for edge-weighted seed placement
 */
function computeEdgeMagnitude(imageData: ImageData): Float32Array {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  const magnitude = new Float32Array(width * height);
  
  // Convert to grayscale
  for (let i = 0; i < width * height; i++) {
    const idx = i * 4;
    gray[i] = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
  }
  
  // Sobel operator
  const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
  const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let gx = 0, gy = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = (y + ky) * width + (x + kx);
          const kidx = (ky + 1) * 3 + (kx + 1);
          gx += gray[idx] * sobelX[kidx];
          gy += gray[idx] * sobelY[kidx];
        }
      }
      magnitude[y * width + x] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  
  return magnitude;
}

/**
 * Generate seed points with optional edge weighting
 */
function generateVoronoiSeeds(
  width: number,
  height: number,
  numSeeds: number,
  edgeMagnitude?: Float32Array,
  edgeWeighted: boolean = true
): Point[] {
  const seeds: Point[] = [];
  
  if (edgeWeighted && edgeMagnitude) {
    // Weighted random sampling based on edge magnitude
    // Normalize magnitudes to create a probability distribution
    let sum = 0;
    for (let i = 0; i < edgeMagnitude.length; i++) {
      sum += edgeMagnitude[i] + 0.1; // Add small constant to ensure coverage
    }
    
    // Build cumulative distribution
    const cdf = new Float32Array(edgeMagnitude.length);
    let cumulative = 0;
    for (let i = 0; i < edgeMagnitude.length; i++) {
      cumulative += (edgeMagnitude[i] + 0.1) / sum;
      cdf[i] = cumulative;
    }
    
    // Sample points using inverse CDF
    for (let i = 0; i < numSeeds; i++) {
      const r = Math.random();
      let idx = 0;
      
      // Binary search for efficiency
      let lo = 0, hi = cdf.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (cdf[mid] < r) lo = mid + 1;
        else hi = mid;
      }
      idx = lo;
      
      const x = idx % width;
      const y = Math.floor(idx / width);
      seeds.push({ x, y });
    }
  } else {
    // Uniform random distribution
    for (let i = 0; i < numSeeds; i++) {
      seeds.push({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    }
  }
  
  return seeds;
}

/**
 * Lloyd's relaxation: move seeds to centroids of their cells
 */
function lloydRelaxation(
  seeds: Point[],
  width: number,
  height: number,
  iterations: number
): Point[] {
  if (iterations === 0) return seeds;
  
  let currentSeeds = [...seeds];
  
  for (let iter = 0; iter < iterations; iter++) {
    // For each pixel, find nearest seed
    const cellAssignment = new Int32Array(width * height);
    const cellSumX = new Float64Array(currentSeeds.length);
    const cellSumY = new Float64Array(currentSeeds.length);
    const cellCount = new Int32Array(currentSeeds.length);
    
    // Assign each pixel to nearest seed (use sampling for large images)
    const sampleStep = Math.max(1, Math.floor(Math.sqrt((width * height) / 50000)));
    
    for (let y = 0; y < height; y += sampleStep) {
      for (let x = 0; x < width; x += sampleStep) {
        let minDist = Infinity;
        let nearestIdx = 0;
        
        for (let i = 0; i < currentSeeds.length; i++) {
          const dx = x - currentSeeds[i].x;
          const dy = y - currentSeeds[i].y;
          const dist = dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            nearestIdx = i;
          }
        }
        
        cellAssignment[y * width + x] = nearestIdx;
        cellSumX[nearestIdx] += x;
        cellSumY[nearestIdx] += y;
        cellCount[nearestIdx]++;
      }
    }
    
    // Move seeds to centroids
    const newSeeds: Point[] = [];
    for (let i = 0; i < currentSeeds.length; i++) {
      if (cellCount[i] > 0) {
        newSeeds.push({
          x: cellSumX[i] / cellCount[i],
          y: cellSumY[i] / cellCount[i],
        });
      } else {
        // Keep original if no pixels assigned
        newSeeds.push(currentSeeds[i]);
      }
    }
    
    currentSeeds = newSeeds;
  }
  
  return currentSeeds;
}

/**
 * Compute Voronoi cell boundaries using marching along edges
 * This uses a pixel-based approach for robustness
 */
function computeVoronoiCells(
  seeds: Point[],
  width: number,
  height: number,
  imageData: ImageData,
  palette: RGB[]
): VoronoiCell[] {
  const { data } = imageData;
  
  // Assign each pixel to nearest seed
  const cellAssignment = new Int32Array(width * height);
  const cellColorSum: { r: number; g: number; b: number; count: number }[] = 
    seeds.map(() => ({ r: 0, g: 0, b: 0, count: 0 }));
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let minDist = Infinity;
      let nearestIdx = 0;
      
      for (let i = 0; i < seeds.length; i++) {
        const dx = x - seeds[i].x;
        const dy = y - seeds[i].y;
        const dist = dx * dx + dy * dy;
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      
      cellAssignment[y * width + x] = nearestIdx;
      
      // Accumulate color for this cell
      const pixelIdx = (y * width + x) * 4;
      cellColorSum[nearestIdx].r += data[pixelIdx];
      cellColorSum[nearestIdx].g += data[pixelIdx + 1];
      cellColorSum[nearestIdx].b += data[pixelIdx + 2];
      cellColorSum[nearestIdx].count++;
    }
  }
  
  // Compute average color for each cell and quantize to palette
  const cellColors: RGB[] = seeds.map((_, i) => {
    const sum = cellColorSum[i];
    if (sum.count === 0) return [128, 128, 128] as RGB;
    const avgColor: RGB = [
      Math.round(sum.r / sum.count),
      Math.round(sum.g / sum.count),
      Math.round(sum.b / sum.count),
    ];
    return findClosestColor(avgColor, palette);
  });
  
  // Extract cell boundaries using contour tracing
  const cells: VoronoiCell[] = seeds.map((seed, idx) => {
    const polygon = extractCellPolygon(cellAssignment, width, height, idx);
    const area = computePolygonArea(polygon);
    
    return {
      id: `voronoi-${idx}`,
      seed,
      color: cellColors[idx],
      polygon,
      area,
    };
  });
  
  return cells;
}

/**
 * Extract the polygon boundary of a Voronoi cell
 * Uses a simplified approach: find boundary pixels and order them
 */
function extractCellPolygon(
  assignment: Int32Array,
  width: number,
  height: number,
  cellIdx: number
): Point[] {
  // Find boundary pixels (pixels of this cell adjacent to other cells or image edge)
  const boundaryPixels: Point[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (assignment[y * width + x] !== cellIdx) continue;
      
      // Check if this is a boundary pixel
      const isBoundary = 
        x === 0 || x === width - 1 || y === 0 || y === height - 1 ||
        assignment[y * width + (x - 1)] !== cellIdx ||
        assignment[y * width + (x + 1)] !== cellIdx ||
        assignment[(y - 1) * width + x] !== cellIdx ||
        assignment[(y + 1) * width + x] !== cellIdx;
      
      if (isBoundary) {
        boundaryPixels.push({ x, y });
      }
    }
  }
  
  if (boundaryPixels.length === 0) return [];
  
  // Order boundary pixels by angle from centroid
  const cx = boundaryPixels.reduce((s, p) => s + p.x, 0) / boundaryPixels.length;
  const cy = boundaryPixels.reduce((s, p) => s + p.y, 0) / boundaryPixels.length;
  
  boundaryPixels.sort((a, b) => {
    const angleA = Math.atan2(a.y - cy, a.x - cx);
    const angleB = Math.atan2(b.y - cy, b.x - cx);
    return angleA - angleB;
  });
  
  // Simplify polygon (Douglas-Peucker or simple angle-based)
  const simplified = simplifyPolygon(boundaryPixels, Math.max(width, height) / 100);
  
  return simplified;
}

/**
 * Douglas-Peucker polygon simplification
 */
function simplifyPolygon(points: Point[], epsilon: number): Point[] {
  if (points.length <= 2) return points;
  
  // Find the point with max distance from the line between first and last
  let maxDist = 0;
  let maxIdx = 0;
  
  const start = points[0];
  const end = points[points.length - 1];
  
  for (let i = 1; i < points.length - 1; i++) {
    const dist = perpendicularDistance(points[i], start, end);
    if (dist > maxDist) {
      maxDist = dist;
      maxIdx = i;
    }
  }
  
  if (maxDist > epsilon) {
    // Recursively simplify
    const left = simplifyPolygon(points.slice(0, maxIdx + 1), epsilon);
    const right = simplifyPolygon(points.slice(maxIdx), epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(point: Point, lineStart: Point, lineEnd: Point): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lineLengthSq = dx * dx + dy * dy;
  
  if (lineLengthSq === 0) {
    return Math.sqrt(
      (point.x - lineStart.x) ** 2 + (point.y - lineStart.y) ** 2
    );
  }
  
  const t = Math.max(0, Math.min(1,
    ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lineLengthSq
  ));
  
  const projX = lineStart.x + t * dx;
  const projY = lineStart.y + t * dy;
  
  return Math.sqrt((point.x - projX) ** 2 + (point.y - projY) ** 2);
}

function computePolygonArea(polygon: Point[]): number {
  if (polygon.length < 3) return 0;
  
  let area = 0;
  for (let i = 0; i < polygon.length; i++) {
    const j = (i + 1) % polygon.length;
    area += polygon[i].x * polygon[j].y;
    area -= polygon[j].x * polygon[i].y;
  }
  
  return Math.abs(area) / 2;
}

/**
 * Generate SVG for Voronoi diagram
 */
function voronoiToSvg(
  cells: VoronoiCell[],
  width: number,
  height: number,
  borderWidth: number,
  palette: RGB[],
  fabricData: QuiltDesign["fabricData"]
): string {
  const svgWidth = 600; // Fixed output size
  const svgHeight = Math.round((height / width) * svgWidth);
  const scaleX = svgWidth / width;
  const scaleY = svgHeight / height;
  
  let pathsXml = "";
  
  for (const cell of cells) {
    if (cell.polygon.length < 3) continue;
    
    const color = `rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})`;
    
    // Scale polygon points to SVG coordinates
    const points = cell.polygon.map(p => ({
      x: p.x * scaleX,
      y: p.y * scaleY,
    }));
    
    // Create SVG path
    const d = points.map((p, i) => 
      `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`
    ).join(" ") + " Z";
    
    const strokeAttr = borderWidth > 0 
      ? `stroke="#333" stroke-width="${borderWidth * 0.5}" stroke-linejoin="round"` 
      : "";
    
    pathsXml += `  <path d="${d}" fill="${color}" ${strokeAttr}
      data-id="${cell.id}"
      data-seed-x="${cell.seed.x.toFixed(1)}"
      data-seed-y="${cell.seed.y.toFixed(1)}"
      data-area="${cell.area.toFixed(0)}"
    />\n`;
  }
  
  const metadata = {
    type: "voronoi",
    fabricData,
    colorPalette: palette.map(c => `rgb(${c[0]},${c[1]},${c[2]})`),
    numCells: cells.length,
  };
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     width="${svgWidth}" 
     height="${svgHeight}" 
     viewBox="0 0 ${svgWidth} ${svgHeight}"
     data-quilt-design="true"
     data-shape-type="voronoi"
     data-num-cells="${cells.length}">
  <!-- Voronoi Design Metadata: ${JSON.stringify(metadata)} -->
${pathsXml}</svg>`;
}

/**
 * Main Voronoi processing pipeline
 */
export async function processImageToVoronoiSvg(
  imageData: ImageData,
  options: {
    numSeeds: number;
    numColors: number;
    relaxationIterations: number;
    edgeWeighted: boolean;
    borderWidth: number;
    cellSizeMm: number;
    seamAllowanceMm: number;
  }
): Promise<{ svg: string; design: QuiltDesign }> {
  const {
    numSeeds,
    numColors,
    relaxationIterations,
    edgeWeighted,
    borderWidth,
    cellSizeMm,
    seamAllowanceMm,
  } = options;
  
  const { width, height } = imageData;
  
  // Compute edge magnitude for weighted seed placement
  const edgeMagnitude = edgeWeighted ? computeEdgeMagnitude(imageData) : undefined;
  
  // Generate initial seed points
  let seeds = generateVoronoiSeeds(width, height, numSeeds, edgeMagnitude, edgeWeighted);
  
  // Apply Lloyd's relaxation
  seeds = lloydRelaxation(seeds, width, height, relaxationIterations);
  
  // Compute color palette from image
  const { colors } = pixelateImage(imageData, Math.ceil(Math.sqrt(numSeeds * 4)));
  const { palette } = quantizeColors(colors, numColors);
  
  // Compute Voronoi cells with colors
  const cells = computeVoronoiCells(seeds, width, height, imageData, palette);
  
  // Generate fabrication data
  const fabricData: QuiltDesign["fabricData"] = {
    totalWidthMm: Math.round((width / Math.max(width, height)) * 1000),
    totalHeightMm: Math.round((height / Math.max(width, height)) * 1000),
    cellSizeMm,
    seamAllowanceMm,
  };
  
  // Generate SVG
  const svg = voronoiToSvg(cells, width, height, borderWidth, palette, fabricData);
  
  // Create QuiltDesign for compatibility
  const design: QuiltDesign = {
    width: 600,
    height: Math.round((height / width) * 600),
    gridWidth: Math.ceil(Math.sqrt(numSeeds)),
    gridHeight: Math.ceil(Math.sqrt(numSeeds)),
    cellSize: 20,
    shapeType: "voronoi",
    colorPalette: palette.map(c => `rgb(${c[0]},${c[1]},${c[2]})`),
    shapes: cells.map(cell => ({
      id: cell.id,
      type: "voronoi" as ShapeType,
      x: cell.seed.x,
      y: cell.seed.y,
      width: Math.sqrt(cell.area),
      height: Math.sqrt(cell.area),
      color: `rgb(${cell.color[0]},${cell.color[1]},${cell.color[2]})`,
      stitchData: {
        angle: 0,
        sizeMm: cellSizeMm,
        seamAllowanceMm,
        edges: cell.polygon.length,
        neighbors: [],
        gridPosition: { row: 0, col: 0 },
      },
    })),
    fabricData,
  };
  
  return { svg, design };
}
