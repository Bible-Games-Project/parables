/**
 * Shared star grading for every parable: a 0-1 health/performance ratio and
 * how long the run took, folded into one 1-3 star result. Each parable
 * decides what "health ratio" means for itself (remaining HP, accuracy,
 * whatever fits) and what pace counts as fast/slow — this function only
 * knows how to combine the two consistently, so every parable's stars mean
 * roughly the same thing to the player.
 */
export function computeStars(
  healthRatio: number,
  elapsedSeconds: number,
  fastThresholdSeconds: number,
  slowThresholdSeconds: number,
): 1 | 2 | 3 {
  const clampedHealth = Math.max(0, Math.min(1, healthRatio));
  const timeScore =
    elapsedSeconds <= fastThresholdSeconds
      ? 1
      : elapsedSeconds >= slowThresholdSeconds
        ? 0
        : 1 - (elapsedSeconds - fastThresholdSeconds) / (slowThresholdSeconds - fastThresholdSeconds);

  const combined = clampedHealth * 0.6 + timeScore * 0.4;
  if (combined >= 0.75) return 3;
  if (combined >= 0.45) return 2;
  return 1;
}
