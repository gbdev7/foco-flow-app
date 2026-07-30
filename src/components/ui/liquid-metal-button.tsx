import { Sparkles } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface LiquidMetalButtonProps {
  label?: string;
  onClick?: () => void;
  viewMode?: "text" | "icon";
  className?: string;
}

export function LiquidMetalButton({
  label = "Get Started",
  onClick,
  viewMode = "text",
  className,
}: LiquidMetalButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; id: number }>>([]);
  const shaderRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const shaderMount = useRef<any>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const rippleId = useRef(0);

  useEffect(() => {
    const styleId = "liquid-metal-button-style";
    if (!document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        .liquid-metal-shader canvas {
          width: 100% !important;
          height: 100% !important;
          display: block !important;
          position: absolute !important;
          top: 0 !important;
          left: 0 !important;
          border-radius: 100px !important;
        }
        @keyframes liquid-ripple {
          0% { transform: translate(-50%, -50%) scale(0); opacity: 0.6; }
          100% { transform: translate(-50%, -50%) scale(4); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    let cancelled = false;
    (async () => {
      try {
        const { liquidMetalFragmentShader, ShaderMount } = await import("@paper-design/shaders");
        if (cancelled || !shaderRef.current) return;
        shaderMount.current?.destroy?.();
        shaderMount.current = new ShaderMount(
          shaderRef.current,
          liquidMetalFragmentShader,
          {
            u_repetition: 4,
            u_softness: 0.5,
            u_shiftRed: 0.3,
            u_shiftBlue: 0.3,
            u_distortion: 0,
            u_contour: 0,
            u_angle: 45,
            u_scale: 8,
            u_shape: 1,
            u_offsetX: 0.1,
            u_offsetY: -0.1,
          },
          undefined,
          0.6,
        );
      } catch (error) {
        console.error("Failed to load shader:", error);
      }
    })();

    return () => {
      cancelled = true;
      shaderMount.current?.destroy?.();
      shaderMount.current = null;
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    if (shaderMount.current?.setSpeed) {
      shaderMount.current.setSpeed(2.4);
      setTimeout(() => shaderMount.current?.setSpeed?.(isHovered ? 1 : 0.6), 300);
    }
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const ripple = { x: e.clientX - rect.left, y: e.clientY - rect.top, id: rippleId.current++ };
      setRipples((prev) => [...prev, ripple]);
      setTimeout(() => setRipples((prev) => prev.filter((r) => r.id !== ripple.id)), 600);
    }
    onClick?.();
  };

  return (
    <button
      ref={buttonRef}
      type="button"
      onClick={handleClick}
      onMouseEnter={() => {
        setIsHovered(true);
        shaderMount.current?.setSpeed?.(1);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
        shaderMount.current?.setSpeed?.(0.6);
      }}
      aria-label={label}
      className={[
        "relative isolate inline-flex h-[46px] items-center justify-center overflow-hidden rounded-full",
        viewMode === "icon" ? "w-[46px]" : "min-w-[142px] px-6",
        "cursor-pointer border border-white/15 outline-none transition-transform duration-300",
        "hover:scale-[1.03] active:scale-[0.98]",
        className ?? "",
      ].join(" ")}
      style={{ boxShadow: isHovered ? "0 10px 30px -10px rgba(0,0,0,0.6)" : undefined }}
    >
      <div ref={shaderRef} className="liquid-metal-shader absolute inset-0 -z-10 rounded-full" />
      <span className="pointer-events-none absolute inset-0 -z-10 rounded-full bg-black/25" />
      <span className="relative z-10 inline-flex items-center gap-2 text-sm font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
        {viewMode === "icon" ? <Sparkles className="size-4" /> : label}
      </span>
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="pointer-events-none absolute size-10 rounded-full bg-white/40"
          style={{
            left: ripple.x,
            top: ripple.y,
            animation: "liquid-ripple 0.6s ease-out forwards",
          }}
        />
      ))}
    </button>
  );
}