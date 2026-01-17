import { Show } from "solid-js";
import { useAsciiCanvas } from "./AsciiCanvas/context";
import NavButton from "./NavButton";
import CellSizeSelector from "./CellSizeSelector";
import ColorModeToggle from "./ColorModeToggle";
import SymbolSelector from "./SymbolSelector";
import PaletteColorPicker from "./PaletteColorPicker";
import Divider from "./ui/Divider";
import { Darken, Lighten, Eraser } from "./ui/icons";
import { theme } from "../stores/theme";

export default function DrawingTools() {
  const {
    style,
    cellSize,
    cellSizeRange,
    colorMode,
    selectedSymbol,
    setSelectedSymbol,
    selectedPaletteColor,
    setSelectedPaletteColor,
    drawingMode,
    hasSourceImage,
    handlers,
  } = useAsciiCanvas();

  const handleSelectSymbol = (symbol: number) => {
    setSelectedSymbol(symbol);
  };

  const handleSelectPaletteColor = (color: string) => {
    setSelectedPaletteColor(color);
  };

  return (
    <div class="flex gap-1 items-center flex-wrap">
      {/* Style toggle */}
      <NavButton text={style()} onClick={handlers.onStyleToggle} />

      <Divider vertical class="bg-foreground-07/20 mx-2" />

      {/* Cell size selector */}
      <CellSizeSelector
        cellSize={cellSize()}
        onCellSizeChange={handlers.onCellSizeChange}
        style={style()}
        cellSizeRange={cellSizeRange()}
        onCellSizeRangeChange={handlers.onCellSizeRangeChange}
        onShuffle={handlers.onShuffleDimensions}
      />

      <Divider vertical class="bg-foreground-07/20 mx-2" />

      {/* Color mode toggle */}
      <ColorModeToggle
        colorMode={colorMode()}
        onToggle={handlers.onColorModeToggle}
        disabled={!hasSourceImage()}
      />

      <Divider vertical class="bg-foreground-07/20 mx-2" />

      {/* Drawing mode buttons */}
      <div class="flex gap-1 h-full">
        <NavButton
          onClick={() => {
            handlers.onModeSelect(theme() === "light" ? "increment" : "decrement");
          }}
          isSelected={drawingMode() === (theme() === "light" ? "increment" :
            "decrement")}
          text="Darken"
          icon={<Darken stroke={1} />}
        />
        <NavButton
          onClick={() => {
            handlers.onModeSelect(theme() === "light" ? "decrement" : "increment");
          }}
          isSelected={drawingMode() === (theme() === "light" ? "decrement" :
            "increment")}
          text="Lighten"
          icon={<Lighten stroke={1} />}
        />
        <NavButton
          onClick={() => handlers.onModeSelect("eraser")}
          isSelected={drawingMode() === "eraser"}
          text="Eraser"
          icon={<Eraser stroke={1} />}
        />

        {/* Symbol selector or Palette color picker */}
        <Show
          when={style() === "Palette" && colorMode() !== "monochrome"}
          fallback={
            <SymbolSelector
              selectedSymbol={selectedSymbol()}
              onSelectSymbol={handleSelectSymbol}
              onModeSelect={() => handlers.onModeSelect("brush")}
              isSelected={drawingMode() === "brush"}
              style={style()}
            />
          }
        >
          <PaletteColorPicker
            selectedColor={selectedPaletteColor()}
            onSelectColor={handleSelectPaletteColor}
            onModeSelect={() => handlers.onModeSelect("brush")}
            isSelected={drawingMode() === "brush"}
          />
        </Show>
      </div>
    </div>
  )
}
