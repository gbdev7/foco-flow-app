import { useEffect, useRef } from "react";

type InteractiveDotsProps = {
  spacing?: number;
  dotRadius?: number;
  dotColor?: string;
  repelRadius?: number;
  repelStrength?: number;
  className?: string;
};

/**
 * Interactive Dots — a canvas dot grid that gently repels from the cursor.
 * Inspired by the designali-in "Interactive Dots" component on 21st.dev.
 */
export function InteractiveDots({
  spacing = 24,
  dotRadius = 1.5,
  dotColor = "rgba(55, 53, 47, 0.16)",
  repelRadius = 120,
  repelStrength = 0.4,
  className,
}: InteractiveDotsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let width = 0;
    let height = 0;
    let dpr = 1;
    const mouse = { x: -9999, y: -9999, active: false };

    type Dot = { ox: number; oy: number; x: number; y: number; vx: number; vy: number };
    let dots: Dot[] = [];

    const buildGrid = () => {
      dots = [];
      const cols = Math.ceil(width / spacing) + 1;
      const rows = Math.ceil(height / spacing) + 1;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = c * spacing;
          const oy = r * spacing;
          dots.push({ ox, oy, x: ox, y: oy, vx: 0, vy: 0 });
        }
      }
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      buildGrid();
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = dotColor;

      for (const d of dots) {
        // Repel from cursor
        if (mouse.active) {
          const dx = d.x - mouse.x;
          const dy = d.y - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < repelRadius && dist > 0) {
            const force = (1 - dist / repelRadius) * repelStrength * repelRadius;
            d.vx += (dx / dist) * force * 0.05;
            d.vy += (dy / dist) * force * 0.05;
          }
        }

        // Spring back to origin
        d.vx += (d.ox - d.x) * 0.08;
        d.vy += (d.oy - d.y) * 0.08;
        // Damping
        d.vx *= 0.82;
        d.vy *= 0.82;
        d.x += d.vx;
        d.y += d.vy;

        const r = Math.max(0.5, dotRadius);
        ctx.beginPath();
        ctx.arc(d.x, d.y, r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(render);
    };

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = true;
    };
    const onLeave = () => {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    };

    resize();
    render();

    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerout", onLeave);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
    };
  }, [spacing, dotRadius, dotColor, repelRadius, repelStrength]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
}
