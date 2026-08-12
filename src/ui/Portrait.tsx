import { useEffect, useRef } from "react";
import { drawPortrait, type Expression, type PortraitId } from "@/pixel-art/portraits";
import styles from "@/ui/Portrait.module.css";

interface PortraitProps {
  portraitId: PortraitId;
  expression: Expression;
}

const BLINK_MIN_INTERVAL = 2.5;
const BLINK_MAX_INTERVAL = 5;
const BLINK_DURATION = 0.12;
/** Seconds per full open/close cycle of the idle "talking" mouth animation — purely a life cue, never synced to real text-reveal timing (there is none). */
const MOUTH_CYCLE = 0.9;
const SWAY_AMPLITUDE = 0.25;

function randomBlinkDelay(): number {
  return BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
}

/**
 * The dialogue box's speaker portrait: a small canvas, redrawn every frame
 * via `requestAnimationFrame` (matching this repo's existing DOM-canvas
 * convention — see `PixelIcon.tsx` — rather than a second PixiJS
 * `Application`, which would be real overhead for one flat, non-interactive
 * face). The animation loop runs for the component's whole lifetime;
 * `portraitId`/`expression` are read from refs each frame so changing lines
 * mid-conversation never resets the blink/sway timers.
 */
export function Portrait({ portraitId, expression }: PortraitProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const portraitIdRef = useRef(portraitId);
  const expressionRef = useRef(expression);
  portraitIdRef.current = portraitId;
  expressionRef.current = expression;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // The canvas's drawing-buffer size always matches its actual CSS box
    // (measured, not assumed) — sized via ResizeObserver same as
    // `PixelSurface.tsx` — so `drawPortrait`'s coordinate math never mismatches
    // what's actually displayed (a fixed internal size here previously got
    // clipped/cropped by the frame's real, smaller responsive box).
    let displaySize = 64;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const next = parent.clientWidth;
      if (next === 0) return;
      displaySize = next;
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      canvas.style.width = `${displaySize}px`;
      canvas.style.height = `${displaySize}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
    };
    resize();
    const observer = new ResizeObserver(resize);
    if (canvas.parentElement) observer.observe(canvas.parentElement);

    let raf = 0;
    let last = performance.now();
    let idlePhase = Math.random() * 10;
    let blinkCountdown = randomBlinkDelay();
    let blinking = false;
    let blinkTimer = 0;

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      idlePhase += dt;

      if (blinking) {
        blinkTimer += dt;
        if (blinkTimer >= BLINK_DURATION) {
          blinking = false;
          blinkTimer = 0;
          blinkCountdown = randomBlinkDelay();
        }
      } else {
        blinkCountdown -= dt;
        if (blinkCountdown <= 0) blinking = true;
      }
      const blink = blinking ? 1 - Math.abs((blinkTimer / BLINK_DURATION) * 2 - 1) : 0;

      const mouthOpen = Math.max(0, Math.sin((idlePhase / MOUTH_CYCLE) * Math.PI * 2)) * 0.8;
      const swayX = Math.sin(idlePhase * 0.9) * SWAY_AMPLITUDE;

      drawPortrait(ctx, portraitIdRef.current, expressionRef.current, { blink, mouthOpen, swayX }, displaySize);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={styles.frame}>
      <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />
    </div>
  );
}
