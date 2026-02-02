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
 * Compute Sobel edge magnitude and direction for contour-aware seed placement
 */
function computeEdgeData(imageData: ImageData): { 
  magnitude: Float32Array; 
  direction: Float32Array;
  gray: Float32Array;
} {
  const { width, height, data } = imageData;
  const gray = new Float32Array(width * height);
  const magnitude = new Float32Array(width * height);
  const direction = new Float32Array(width * height);
  
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
      const idx = y * width + x;
      magnitude[idx] = Math.sqrt(gx * gx + gy * gy);
      direction[idx] = Math.atan2(gy, gx);
    }
  }
  
  return { magnitude, direction, gray };
}

/**
 * Non-maximum suppression for edge thinning (Canny-style)
 */
function nonMaxSuppression(
  magnitude: Float32Array,
  direction: Float32Array,
  width: number,
  height: number
): Float32Array {
  const result = new Float32Array(width * height);
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const mag = magnitude[idx];
      const dir = direction[idx];
      
      // Quantize direction to 4 angles (0, 45, 90, 135 degrees)
      const angle = ((dir + Math.PI) / Math.PI * 4) % 4;
      
      let neighbor1 = 0, neighbor2 = 0;
      
      if (angle < 1 || angle >= 3) {
        // Horizontal edge, compare with vertical neighbors
        neighbor1 = magnitude[(y - 1) * width + x];
        neighbor2 = magnitude[(y + 1) * width + x];
      } else if (angle < 2) {
        // 45-degree edge
        neighbor1 = magnitude[(y - 1) * width + (x + 1)];
        neighbor2 = magnitude[(y + 1) * width + (x - 1)];
      } else if (angle < 3) {
        // Vertical edge, compare with horizontal neighbors
        neighbor1 = magnitude[y * width + (x - 1)];
        neighbor2 = magnitude[y * width + (x + 1)];
      } else {
        // 135-degree edge
        neighbor1 = magnitude[(y - 1) * width + (x - 1)];
        neighbor2 = magnitude[(y + 1) * width + (x + 1)];
      }
      
      // Keep only local maxima
      if (mag >= neighbor1 && mag >= neighbor2) {
        result[idx] = mag;
      }
    }
  }
  
  return result;
}

/**
 * Extract edge pixels above threshold using hysteresis
 */
function extractEdgePixels(
  magnitude: Float32Array,
  width: number,
  height: number,
  highThresholdRatio: number = 0.15,
  lowThresholdRatio: number = 0.05
): Point[] {
  // Find max magnitude for adaptive thresholding
  let maxMag = 0;
  for (let i = 0; i < magnitude.length; i++) {
    if (magnitude[i] > maxMag) maxMag = magnitude[i];
  }
  
  const highThreshold = maxMag * highThresholdRatio;
  const lowThreshold = maxMag * lowThresholdRatio;
  
  const edgePixels: Point[] = [];
  const visited = new Uint8Array(width * height);
  
  // First pass: find strong edges
  const strongEdges: Point[] = [];
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (magnitude[idx] >= highThreshold) {
        strongEdges.push({ x, y });
        visited[idx] = 1;
        edgePixels.push({ x, y });
      }
    }
  }
  
  // Hysteresis: trace from strong edges through weak edges
  const queue = [...strongEdges];
  while (queue.length > 0) {
    const p = queue.shift()!;
    
    // Check 8-connected neighbors
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        
        const nx = p.x + dx;
        const ny = p.y + dy;
        
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        
        const nidx = ny * width + nx;
        if (visited[nidx]) continue;
        
        if (magnitude[nidx] >= lowThreshold) {
          visited[nidx] = 1;
          edgePixels.push({ x: nx, y: ny });
          queue.push({ x: nx, y: ny });
        }
      }
    }
  }
  
  return edgePixels;
}

/**
 * Sample points along detected edges at regular intervals
 */
function sampleEdgePoints(
  edgePixels: Point[],
  targetCount: number,
  minDistance: number
): Point[] {
  if (edgePixels.length === 0) return [];
  
  const sampled: Point[] = [];
  const used = new Set<string>();
  
  // Shuffle edge pixels for better distribution
  const shuffled = [...edgePixels].sort(() => Math.random() - 0.5);
  
  for (const p of shuffled) {
    if (sampled.length >= targetCount) break;
    
    // Check minimum distance to existing samples
    let tooClose = false;
    for (const s of sampled) {
      const dx = p.x - s.x;
      const dy = p.y - s.y;
      if (dx * dx + dy * dy < minDistance * minDistance) {
        tooClose = true;
        break;
      }
    }
    
    if (!tooClose) {
      sampled.push(p);
      used.add(`${p.x},${p.y}`);
    }
  }
  
  return sampled;
}

/**
 * Generate Voronoi seeds with contour-anchored placement
 * Places seeds ON detected edges to force cell boundaries to follow contours
 */
function generateVoronoiSeeds(
  width: number,
  height: number,
  numSeeds: number,
  edgeData?: { magnitude: Float32Array; direction: Float32Array; gray: Float32Array },
  edgeWeighted: boolean = true
): Point[] {
  if (!edgeWeighted || !edgeData) {
    // Uniform random distribution
    const seeds: Point[] = [];
    for (let i = 0; i < numSeeds; i++) {
      seeds.push({
        x: Math.random() * width,
        y: Math.random() * height,
      });
    }
    return seeds;
  }
  
  // Apply non-maximum suppression to get thin edges
  const thinEdges = nonMaxSuppression(edgeData.magnitude, edgeData.direction, width, height);
  
  // Extract edge pixels using Canny-style hysteresis
  const edgePixels = extractEdgePixels(thinEdges, width, height);
  
  // Calculate how many seeds to place on edges vs. fill
  // More seeds on edges = sharper contours
  const edgeSeedRatio = 0.6; // 60% of seeds on edges
  const numEdgeSeeds = Math.floor(numSeeds * edgeSeedRatio);
  const numFillSeeds = numSeeds - numEdgeSeeds;
  
  // Minimum distance between edge seeds (based on density)
  const avgCellSize = Math.sqrt((width * height) / numSeeds);
  const minEdgeDistance = avgCellSize * 0.5;
  
  // Sample seeds along edges
  const edgeSeeds = sampleEdgePoints(edgePixels, numEdgeSeeds, minEdgeDistance);
  
  // Create a set of occupied areas for fill seeds
  const occupiedCells = new Set<string>();
  const cellSize = avgCellSize;
  
  for (const s of edgeSeeds) {
    const cx = Math.floor(s.x / cellSize);
    const cy = Math.floor(s.y / cellSize);
    occupiedCells.add(`${cx},${cy}`);
  }
  
  // Fill remaining area with seeds, avoiding edge seed locations
  const fillSeeds: Point[] = [];
  let attempts = 0;
  const maxAttempts = numFillSeeds * 20;
  
  while (fillSeeds.length < numFillSeeds && attempts < maxAttempts) {
    attempts++;
    
    const x = Math.random() * width;
    const y = Math.random() * height;
    
    // Check if too close to edge seeds
    let tooClose = false;
    for (const s of edgeSeeds) {
      const dx = x - s.x;
      const dy = y - s.y;
      if (dx * dx + dy * dy < (minEdgeDistance * 0.8) ** 2) {
        tooClose = true;
        break;
      }
    }
    
    // Also check against other fill seeds
    if (!tooClose) {
      for (const s of fillSeeds) {
        const dx = x - s.x;
        const dy = y - s.y;
        if (dx * dx + dy * dy < (minEdgeDistance * 0.6) ** 2) {
          tooClose = true;
          break;
        }
      }
    }
    
    if (!tooClose) {
      fillSeeds.push({ x, y });
    }
  }
  
  // Combine edge seeds and fill seeds
  const allSeeds = [...edgeSeeds, ...fillSeeds];
  
  console.log(`Voronoi seeds: ${edgeSeeds.length} on edges, ${fillSeeds.length} fill, ${allSeeds.length} total`);
  
  return allSeeds;
}

// Keep backward compatibility with old function signature
function computeEdgeMagnitude(imageData: ImageData): Float32Array {
  return computeEdgeData(imageData).magnitude;
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

// ============================================================================
// DELAUNAY TRIANGULATION (Bowyer-Watson Algorithm)
// ============================================================================

type Triangle = {
  p1: number; // Index into points array
  p2: number;
  p3: number;
};

type Edge = {
  p1: number;
  p2: number;
};

/**
 * Compute circumcenter of a triangle
 */
function circumcenter(p1: Point, p2: Point, p3: Point): Point | null {
  const ax = p1.x, ay = p1.y;
  const bx = p2.x, by = p2.y;
  const cx = p3.x, cy = p3.y;
  
  const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
  if (Math.abs(d) < 1e-10) return null; // Degenerate triangle
  
  const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d;
  const uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d;
  
  return { x: ux, y: uy };
}

/**
 * Check if a point is inside the circumcircle of a triangle
 */
function inCircumcircle(p: Point, p1: Point, p2: Point, p3: Point): boolean {
  const ax = p1.x - p.x, ay = p1.y - p.y;
  const bx = p2.x - p.x, by = p2.y - p.y;
  const cx = p3.x - p.x, cy = p3.y - p.y;
  
  const det = (
    (ax * ax + ay * ay) * (bx * cy - cx * by) -
    (bx * bx + by * by) * (ax * cy - cx * ay) +
    (cx * cx + cy * cy) * (ax * by - bx * ay)
  );
  
  // For counter-clockwise triangles, det > 0 means inside
  // We need to check orientation first
  const orient = (p1.x - p3.x) * (p2.y - p3.y) - (p1.y - p3.y) * (p2.x - p3.x);
  
  return orient > 0 ? det > 0 : det < 0;
}

/**
 * Bowyer-Watson algorithm for Delaunay triangulation
 */
function delaunayTriangulation(points: Point[], width: number, height: number): Triangle[] {
  // Create super-triangle that contains all points
  const margin = Math.max(width, height) * 10;
  const superTriangle: Point[] = [
    { x: -margin, y: -margin },
    { x: width + margin * 2, y: -margin },
    { x: width / 2, y: height + margin * 2 },
  ];
  
  // Add super-triangle vertices to points array (they'll be at the end)
  const allPoints = [...points, ...superTriangle];
  const superIndices = [points.length, points.length + 1, points.length + 2];
  
  // Initialize triangulation with super-triangle
  let triangles: Triangle[] = [{ p1: superIndices[0], p2: superIndices[1], p3: superIndices[2] }];
  
  // Add each point one at a time
  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const badTriangles: Triangle[] = [];
    
    // Find all triangles whose circumcircle contains the point
    for (const tri of triangles) {
      const p1 = allPoints[tri.p1];
      const p2 = allPoints[tri.p2];
      const p3 = allPoints[tri.p3];
      
      if (inCircumcircle(p, p1, p2, p3)) {
        badTriangles.push(tri);
      }
    }
    
    // Find the boundary of the polygonal hole
    const polygon: Edge[] = [];
    for (const tri of badTriangles) {
      const edges: Edge[] = [
        { p1: tri.p1, p2: tri.p2 },
        { p1: tri.p2, p2: tri.p3 },
        { p1: tri.p3, p2: tri.p1 },
      ];
      
      for (const edge of edges) {
        // Check if this edge is shared with another bad triangle
        let shared = false;
        for (const other of badTriangles) {
          if (other === tri) continue;
          const otherEdges = [
            [other.p1, other.p2],
            [other.p2, other.p3],
            [other.p3, other.p1],
          ];
          for (const [a, b] of otherEdges) {
            if ((edge.p1 === a && edge.p2 === b) || (edge.p1 === b && edge.p2 === a)) {
              shared = true;
              break;
            }
          }
          if (shared) break;
        }
        if (!shared) {
          polygon.push(edge);
        }
      }
    }
    
    // Remove bad triangles from triangulation
    triangles = triangles.filter(t => !badTriangles.includes(t));
    
    // Re-triangulate the polygonal hole with the new point
    for (const edge of polygon) {
      triangles.push({ p1: edge.p1, p2: edge.p2, p3: i });
    }
  }
  
  // Remove triangles that share vertices with super-triangle
  triangles = triangles.filter(t => 
    !superIndices.includes(t.p1) && 
    !superIndices.includes(t.p2) && 
    !superIndices.includes(t.p3)
  );
  
  return triangles;
}

/**
 * Compute Voronoi cells from Delaunay triangulation
 * Each Voronoi cell is formed by connecting circumcenters of triangles
 * that share a common vertex (seed point)
 */
function computeVoronoiFromDelaunay(
  seeds: Point[],
  triangles: Triangle[],
  width: number,
  height: number
): Point[][] {
  const cells: Point[][] = seeds.map(() => []);
  
  // For each seed, find all triangles containing it
  const seedTriangles: Map<number, Triangle[]> = new Map();
  for (let i = 0; i < seeds.length; i++) {
    seedTriangles.set(i, []);
  }
  
  for (const tri of triangles) {
    seedTriangles.get(tri.p1)?.push(tri);
    seedTriangles.get(tri.p2)?.push(tri);
    seedTriangles.get(tri.p3)?.push(tri);
  }
  
  // For each seed, compute its Voronoi cell
  for (let i = 0; i < seeds.length; i++) {
    const tris = seedTriangles.get(i) || [];
    if (tris.length === 0) continue;
    
    // Get circumcenters of all triangles
    const circumcenters: Point[] = [];
    for (const tri of tris) {
      const cc = circumcenter(seeds[tri.p1], seeds[tri.p2], seeds[tri.p3]);
      if (cc) {
        circumcenters.push(cc);
      }
    }
    
    if (circumcenters.length < 3) continue;
    
    // Sort circumcenters by angle around seed
    const seed = seeds[i];
    circumcenters.sort((a, b) => {
      const angleA = Math.atan2(a.y - seed.y, a.x - seed.x);
      const angleB = Math.atan2(b.y - seed.y, b.x - seed.x);
      return angleA - angleB;
    });
    
    cells[i] = circumcenters;
  }
  
  return cells;
}

/**
 * Clip a polygon to a rectangle (image bounds)
 * Uses Sutherland-Hodgman algorithm
 */
function clipPolygonToRect(polygon: Point[], width: number, height: number): Point[] {
  if (polygon.length === 0) return [];
  
  let output = [...polygon];
  
  // Clip against each edge of the rectangle
  const edges = [
    { x1: 0, y1: 0, x2: width, y2: 0 },      // Top
    { x1: width, y1: 0, x2: width, y2: height }, // Right
    { x1: width, y1: height, x2: 0, y2: height }, // Bottom
    { x1: 0, y1: height, x2: 0, y2: 0 },     // Left
  ];
  
  for (const edge of edges) {
    if (output.length === 0) break;
    
    const input = output;
    output = [];
    
    for (let i = 0; i < input.length; i++) {
      const current = input[i];
      const next = input[(i + 1) % input.length];
      
      const currentInside = isInsideEdge(current, edge);
      const nextInside = isInsideEdge(next, edge);
      
      if (currentInside) {
        output.push(current);
        if (!nextInside) {
          const intersection = lineIntersection(current, next, edge);
          if (intersection) output.push(intersection);
        }
      } else if (nextInside) {
        const intersection = lineIntersection(current, next, edge);
        if (intersection) output.push(intersection);
      }
    }
  }
  
  return output;
}

function isInsideEdge(p: Point, edge: { x1: number; y1: number; x2: number; y2: number }): boolean {
  return (edge.x2 - edge.x1) * (p.y - edge.y1) - (edge.y2 - edge.y1) * (p.x - edge.x1) >= 0;
}

function lineIntersection(
  p1: Point,
  p2: Point,
  edge: { x1: number; y1: number; x2: number; y2: number }
): Point | null {
  const x1 = p1.x, y1 = p1.y;
  const x2 = p2.x, y2 = p2.y;
  const x3 = edge.x1, y3 = edge.y1;
  const x4 = edge.x2, y4 = edge.y2;
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (Math.abs(denom) < 1e-10) return null;
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom;
  
  return {
    x: x1 + t * (x2 - x1),
    y: y1 + t * (y2 - y1),
  };
}

/**
 * Compute polygon area using shoelace formula
 */
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
 * Sample average color from image within a polygon
 */
function samplePolygonColor(
  polygon: Point[],
  imageData: ImageData,
  palette: RGB[]
): RGB {
  if (polygon.length < 3) return [128, 128, 128];
  
  const { width, height, data } = imageData;
  
  // Find bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const p of polygon) {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  }
  
  minX = Math.max(0, Math.floor(minX));
  minY = Math.max(0, Math.floor(minY));
  maxX = Math.min(width - 1, Math.ceil(maxX));
  maxY = Math.min(height - 1, Math.ceil(maxY));
  
  let r = 0, g = 0, b = 0, count = 0;
  
  // Sample pixels inside polygon
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pointInPolygon({ x, y }, polygon)) {
        const idx = (y * width + x) * 4;
        r += data[idx];
        g += data[idx + 1];
        b += data[idx + 2];
        count++;
      }
    }
  }
  
  if (count === 0) {
    // Fallback: sample center point
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const idx = (Math.floor(cy) * width + Math.floor(cx)) * 4;
    return findClosestColor([data[idx], data[idx + 1], data[idx + 2]], palette);
  }
  
  const avgColor: RGB = [
    Math.round(r / count),
    Math.round(g / count),
    Math.round(b / count),
  ];
  
  return findClosestColor(avgColor, palette);
}

/**
 * Point-in-polygon test using ray casting
 */
function pointInPolygon(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    if (((yi > p.y) !== (yj > p.y)) && 
        (p.x < (xj - xi) * (p.y - yi) / (yj - yi) + xi)) {
      inside = !inside;
    }
  }
  return inside;
}

/**
 * Compute proper Voronoi cells using Delaunay triangulation
 * This guarantees seamless, gap-free tessellation
 */
function computeVoronoiCells(
  seeds: Point[],
  width: number,
  height: number,
  imageData: ImageData,
  palette: RGB[]
): VoronoiCell[] {
  // Compute Delaunay triangulation
  const triangles = delaunayTriangulation(seeds, width, height);
  
  // Derive Voronoi cells from Delaunay
  const rawCells = computeVoronoiFromDelaunay(seeds, triangles, width, height);
  
  // Clip cells to image bounds and compute colors
  const cells: VoronoiCell[] = [];
  
  for (let i = 0; i < seeds.length; i++) {
    let polygon = rawCells[i];
    
    // Skip empty cells
    if (polygon.length < 3) continue;
    
    // Clip to image bounds
    polygon = clipPolygonToRect(polygon, width, height);
    
    if (polygon.length < 3) continue;
    
    // Sample color from image
    const color = samplePolygonColor(polygon, imageData, palette);
    const area = computePolygonArea(polygon);
    
    cells.push({
      id: `voronoi-${i}`,
      seed: seeds[i],
      color,
      polygon,
      area,
    });
  }
  
  return cells;
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
  
  // Compute edge data for contour-aware seed placement
  const edgeData = edgeWeighted ? computeEdgeData(imageData) : undefined;
  
  // Generate initial seed points with contour anchoring
  let seeds = generateVoronoiSeeds(width, height, numSeeds, edgeData, edgeWeighted);
  
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
