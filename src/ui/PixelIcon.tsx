import { useEffect, useRef } from "react";
import { drawPixelGridSprite, spriteSize, type PixelGridSprite } from "@/pixel-art/pixelGrid";

interface PixelIconProps {
  sprite: PixelGridSprite;
  size?: number;
  className?: string;
}

export function PixelIcon({ sprite, size = 32, className }: PixelIconProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { cols, rows } = spriteSize(sprite);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || cols === 0 || rows === 0) return;
    const dpr = window.devicePixelRatio || 1;
    const pixelSize = size / Math.max(cols, rows);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, size, size);
    const offsetX = (size - cols * pixelSize) / 2;
    const offsetY = (size - rows * pixelSize) / 2;
    drawPixelGridSprite(ctx, sprite, offsetX, offsetY, pixelSize);
  }, [sprite, size, cols, rows]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
