# draw.kkrll

Interactive ASCII art canvas. Draw with characters, upload images, export as PNG or TXT.

Live at [draw.kkrll.com](https://draw.kkrll.com)

## Stack

- SolidJS + Vite
- Tailwind CSS v4
- Canvas API + Web Workers

## Development

```bash
bun install
bun run dev
```

## Features

- Three render modes: ASCII, Dot, Palette
- Image-to-ASCII conversion with adjustable black/white points
- Variable cell sizes (4-32px)
- Color modes: monochrome, original, mixed
- Export as PNG or shareable TXT link
