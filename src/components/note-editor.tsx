import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ImagePlus,
  PenLine,
  Eraser,
  Highlighter,
  Undo2,
  Redo2,
  Type,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONT_FAMILIES = [
  { value: "Inter, sans-serif", label: "Padrão" },
  { value: "Georgia, serif", label: "Serifa" },
  { value: "'Courier New', monospace", label: "Mono" },
  { value: "'Comic Sans MS', cursive", label: "Manuscrita" },
];

const FONT_SIZES = [
  { value: "2", label: "Pequena" },
  { value: "3", label: "Normal" },
  { value: "4", label: "Média" },
  { value: "5", label: "Grande" },
  { value: "6", label: "Enorme" },
];

const PEN_COLORS = ["#37352F", "#EF4444", "#F59E0B", "#22C55E", "#2383E2", "#A855F7"];

type Props = {
  value: string;
  onChange: (html: string) => void;
};

export type NoteEditorHandle = {
  /** HTML content plus the pen drawing composited as an image at the end. */
  getContent: () => string;
};

/**
 * Apple-Notes-style editor: rich text (execCommand), image embedding (base64)
 * and a pen layer (canvas overlay) for drawing on top of the note.
 */
export const NoteEditor = forwardRef<NoteEditorHandle, Props>(function NoteEditor(
  { value, onChange },
  ref,
) {
  const areaRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const drawing = useRef(false);
  const lastPoint = useRef<{ x: number; y: number } | null>(null);

  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState(PEN_COLORS[4]);
  const [penSize, setPenSize] = useState(3);
  const [eraser, setEraser] = useState(false);

  // Load initial HTML once per note (parent remounts via key).
  useEffect(() => {
    if (areaRef.current) areaRef.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep canvas sized to the editable area.
  useEffect(() => {
    const area = areaRef.current;
    const canvas = canvasRef.current;
    if (!area || !canvas) return;
    const resize = () => {
      const rect = area.getBoundingClientRect();
      const snapshot = canvas.width > 0 ? canvas.toDataURL() : null;
      canvas.width = rect.width;
      canvas.height = rect.height;
      if (snapshot) {
        const img = new Image();
        img.onload = () => canvas.getContext("2d")?.drawImage(img, 0, 0);
        img.src = snapshot;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(area);
    return () => ro.disconnect();
  }, []);

  function emitChange() {
    onChange(areaRef.current?.innerHTML ?? "");
  }

  function exec(command: string, arg?: string) {
    areaRef.current?.focus();
    document.execCommand(command, false, arg);
    emitChange();
  }

  function insertImage(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      areaRef.current?.focus();
      document.execCommand("insertImage", false, String(reader.result));
      emitChange();
    };
    reader.readAsDataURL(file);
  }

  function canvasPoint(e: React.PointerEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function startDraw(e: React.PointerEvent) {
    if (!penMode) return;
    drawing.current = true;
    lastPoint.current = canvasPoint(e);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }

  function moveDraw(e: React.PointerEvent) {
    if (!drawing.current || !penMode) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    const from = lastPoint.current;
    if (!canvas || !ctx || !from) return;
    const to = canvasPoint(e);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    if (eraser) {
      ctx.globalCompositeOperation = "destination-out";
      ctx.lineWidth = penSize * 6;
    } else {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penSize;
    }
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
    lastPoint.current = to;
  }

  function endDraw() {
    drawing.current = false;
    lastPoint.current = null;
  }

  const toolBtn = (
    label: string,
    onClick: () => void,
    icon: React.ReactNode,
    active = false,
  ) => (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn("size-8", active && "bg-accent text-primary")}
    >
      {icon}
    </Button>
  );

  return (
    <div className="overflow-hidden rounded-md border border-input">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-muted/50 px-2 py-1.5">
        {toolBtn("Desfazer", () => exec("undo"), <Undo2 className="size-4" />)}
        {toolBtn("Refazer", () => exec("redo"), <Redo2 className="size-4" />)}
        <span className="mx-1 h-5 w-px bg-border" />
        {toolBtn("Negrito", () => exec("bold"), <Bold className="size-4" />)}
        {toolBtn("Itálico", () => exec("italic"), <Italic className="size-4" />)}
        {toolBtn("Sublinhado", () => exec("underline"), <Underline className="size-4" />)}
        {toolBtn("Tachado", () => exec("strikeThrough"), <Strikethrough className="size-4" />)}
        <span className="mx-1 h-5 w-px bg-border" />
        {toolBtn("Lista", () => exec("insertUnorderedList"), <List className="size-4" />)}
        {toolBtn("Lista numerada", () => exec("insertOrderedList"), <ListOrdered className="size-4" />)}
        <span className="mx-1 h-5 w-px bg-border" />

        <Select onValueChange={(v) => exec("fontName", v)}>
          <SelectTrigger className="h-8 w-32 text-xs" aria-label="Fonte">
            <Type className="size-3.5" />
            <SelectValue placeholder="Fonte" />
          </SelectTrigger>
          <SelectContent>
            {FONT_FAMILIES.map((f) => (
              <SelectItem key={f.value} value={f.value}>
                {f.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={(v) => exec("fontSize", v)}>
          <SelectTrigger className="h-8 w-28 text-xs" aria-label="Tamanho da letra">
            <SelectValue placeholder="Tamanho" />
          </SelectTrigger>
          <SelectContent>
            {FONT_SIZES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <label
          className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-accent"
          title="Cor da fonte"
        >
          <input
            type="color"
            className="sr-only"
            defaultValue="#37352F"
            onChange={(e) => exec("foreColor", e.target.value)}
          />
          <span className="flex flex-col items-center text-xs font-bold leading-none">
            A<span className="h-1 w-4 rounded-sm bg-primary" />
          </span>
        </label>

        <label
          className="grid size-8 cursor-pointer place-items-center rounded-md hover:bg-accent"
          title="Realce"
        >
          <input
            type="color"
            className="sr-only"
            defaultValue="#FDE68A"
            onChange={(e) => exec("hiliteColor", e.target.value)}
          />
          <Highlighter className="size-4" />
        </label>

        <span className="mx-1 h-5 w-px bg-border" />
        {toolBtn(
          "Inserir imagem",
          () => fileRef.current?.click(),
          <ImagePlus className="size-4" />,
        )}
        {toolBtn(
          penMode ? "Sair do pincel" : "Pincel (desenhar)",
          () => setPenMode((v) => !v),
          <PenLine className="size-4" />,
          penMode,
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) insertImage(file);
            e.target.value = "";
          }}
        />
      </div>

      {/* Pen options */}
      {penMode && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
          <span className="text-xs text-muted-foreground">Pincel:</span>
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`Cor do pincel ${c}`}
              onClick={() => {
                setPenColor(c);
                setEraser(false);
              }}
              className={cn(
                "size-5 rounded-full",
                penColor === c && !eraser && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
              style={{ backgroundColor: c }}
            />
          ))}
          <input
            type="range"
            min={1}
            max={12}
            value={penSize}
            onChange={(e) => setPenSize(Number(e.target.value))}
            className="w-24"
            aria-label="Espessura do pincel"
          />
          {toolBtn(
            "Borracha",
            () => setEraser((v) => !v),
            <Eraser className="size-4" />,
            eraser,
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => {
              const canvas = canvasRef.current;
              canvas?.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
            }}
          >
            Limpar desenho
          </Button>
        </div>
      )}

      {/* Editable area + drawing layer */}
      <div className="relative">
        <div
          ref={areaRef}
          contentEditable={!penMode}
          suppressContentEditableWarning
          onInput={emitChange}
          data-placeholder="Comece a escrever…"
          className={cn(
            "min-h-72 max-h-[50vh] overflow-y-auto px-4 py-3 text-sm outline-none",
            "empty:before:text-muted-foreground empty:before:content-[attr(data-placeholder)]",
            "[&_img]:my-2 [&_img]:max-w-full [&_img]:rounded-md",
            penMode && "select-none",
          )}
        />
        <canvas
          ref={canvasRef}
          onPointerDown={startDraw}
          onPointerMove={moveDraw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
          className={cn(
            "pointer-events-none absolute inset-0",
            penMode && "pointer-events-auto cursor-crosshair touch-none",
          )}
        />
      </div>
    </div>
  );
}
