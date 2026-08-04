export interface Vector2 {
  x: number;
  y: number;
}

const MOVE_KEYS: Record<string, Vector2> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  KeyW: { x: 0, y: -1 },
  KeyS: { x: 0, y: 1 },
  KeyA: { x: -1, y: 0 },
  KeyD: { x: 1, y: 0 },
};

/** Tracks held movement keys (WASD + arrows) and exposes a normalized direction vector. */
export class KeyboardController {
  private pressed = new Set<string>();
  private actionListeners = new Set<() => void>();

  constructor() {
    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
  }

  private handleKeyDown = (event: KeyboardEvent) => {
    if (event.code in MOVE_KEYS) this.pressed.add(event.code);
    if (event.code === "Space") {
      event.preventDefault();
      this.actionListeners.forEach((listener) => listener());
    }
  };

  private handleKeyUp = (event: KeyboardEvent) => {
    this.pressed.delete(event.code);
  };

  onAction(listener: () => void): () => void {
    this.actionListeners.add(listener);
    return () => this.actionListeners.delete(listener);
  }

  getDirection(): Vector2 {
    let x = 0;
    let y = 0;
    for (const code of this.pressed) {
      const vector = MOVE_KEYS[code];
      x += vector.x;
      y += vector.y;
    }
    const length = Math.hypot(x, y);
    if (length === 0) return { x: 0, y: 0 };
    return { x: x / length, y: y / length };
  }

  destroy(): void {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    this.actionListeners.clear();
  }
}
