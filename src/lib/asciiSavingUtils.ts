import type { CharCell } from "./types";

interface GenerateTxtOptions {
  grid: CharCell[];
  symbols: string[];
  cols: number;
  rows: number;
  theme: string;
}

export function generateAsciiTxt(options: GenerateTxtOptions): string {
  const { grid, symbols, cols, rows, theme } = options;

  const metadata = [
    `chars: ${JSON.stringify(symbols)}`,
    `created: ${new Date().toISOString()}`,
    `theme: ${theme}`,
    `dimensions: ${cols}x${rows}`,
    "---",
  ];

  const artLines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const index = row * cols + col;
      const cell = grid[index];
      line += cell ? symbols[cell.currentLevel] || " " : " ";
    }
    artLines.push(line);
  }

  return [...metadata, ...artLines].join("\n");
}

interface GenerateLevelsTxtOptions {
  grid: CharCell[];
  cols: number;
  rows: number;
  levels: number;
}

/**
 * Serialize the grid as raw levels instead of rendered glyphs.
 * One base36 digit per cell; "." marks transparent/missing cells so they
 * stay empty under theme inversion (unlike level 0, which inverts to max).
 */
export function generateLevelsTxt(options: GenerateLevelsTxtOptions): string {
  const { grid, cols, rows, levels } = options;

  const metadata = [
    `levels: ${levels}`,
    `dimensions: ${cols}x${rows}`,
    `created: ${new Date().toISOString()}`,
    "---",
  ];

  const artLines: string[] = [];
  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < cols; col++) {
      const cell = grid[row * cols + col];
      line +=
        !cell || cell.isTransparent ? "." : cell.currentLevel.toString(36);
    }
    artLines.push(line);
  }

  return [...metadata, ...artLines].join("\n");
}

export async function uploadAsciiToR2(
  txtContent: string,
): Promise<string | null> {
  try {
    // Use CORS to call the main site's API
    const response = await fetch("https://kkrll.com/api/ascii/upload", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: txtContent,
    });

    const data = await response.json();

    if (data.success) {
      return data.url;
    }

    return null;
  } catch (error) {
    console.error("Upload failed:", error);
    return null;
  }
}
