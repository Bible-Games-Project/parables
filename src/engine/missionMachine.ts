/**
 * Minimal generic state machine every parable's mission (intro -> objective
 * -> ... -> victory) can reuse without hardcoding any particular parable's
 * states here.
 */
export interface MissionMachine<S extends string> {
  readonly state: S;
  set(next: S): void;
  subscribe(listener: (state: S) => void): () => void;
}

export function createMissionMachine<S extends string>(initial: S): MissionMachine<S> {
  let state = initial;
  const listeners = new Set<(state: S) => void>();

  return {
    get state() {
      return state;
    },
    set(next) {
      if (next === state) return;
      state = next;
      listeners.forEach((listener) => listener(next));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
