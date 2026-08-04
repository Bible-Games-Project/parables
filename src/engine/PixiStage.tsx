import { Application } from "pixi.js";
import { useEffect, useRef } from "react";
import { VIRTUAL_HEIGHT, VIRTUAL_WIDTH } from "@/engine/constants";

interface PixiStageProps {
  /** Called once the Pixi Application is ready. May return a cleanup function. */
  onReady: (app: Application) => void | (() => void);
  className?: string;
}

/**
 * Mounts a single PixiJS Application rendered at the fixed virtual
 * resolution and scaled to fill its container with crisp pixel scaling.
 * This is the one canvas every scene (Home background, gameplay, etc.)
 * draws into.
 */
export function PixiStage({ onReady, className }: PixiStageProps) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    let cancelled = false;
    let observer: ResizeObserver | undefined;
    let readyCleanup: (() => void) | void;
    const app = new Application();

    void app
      .init({
        width: VIRTUAL_WIDTH,
        height: VIRTUAL_HEIGHT,
        backgroundColor: 0x0a0e14,
        antialias: false,
        resolution: 1,
        autoDensity: false,
      })
      .then(() => {
        if (cancelled) {
          app.destroy(true, { children: true });
          return;
        }

        const canvas = app.canvas;
        canvas.style.imageRendering = "pixelated";
        canvas.style.display = "block";
        host.appendChild(canvas);

        const resize = () => {
          const rect = host.getBoundingClientRect();
          const scale = Math.max(
            1,
            Math.floor(Math.min(rect.width / VIRTUAL_WIDTH, rect.height / VIRTUAL_HEIGHT) * 4) / 4,
          );
          canvas.style.width = `${VIRTUAL_WIDTH * scale}px`;
          canvas.style.height = `${VIRTUAL_HEIGHT * scale}px`;
        };
        resize();
        observer = new ResizeObserver(resize);
        observer.observe(host);

        readyCleanup = onReady(app);
      });

    return () => {
      cancelled = true;
      readyCleanup?.();
      observer?.disconnect();
      if (app.renderer) app.destroy(true, { children: true });
    };
  }, [onReady]);

  return (
    <div
      ref={hostRef}
      className={className}
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    />
  );
}
