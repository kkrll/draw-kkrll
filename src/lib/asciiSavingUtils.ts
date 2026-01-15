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
