// Colour scale for the 1–7 wellbeing values (mood) and the 1–5 ones
// (energy, appetite, which simply stop at green). Two intensities per hue:
// red (low) → amber → green (good) → purple (hyper). Used by the dashboard
// mood tint and the recording-form dropdown swatches so they match.
export const SCALE_COLORS = [
  "#b91c1c", // 1 — intense red
  "#f87171", // 2 — red
  "#f59e0b", // 3 — amber
  "#22c55e", // 4 — green
  "#15803d", // 5 — intense green
  "#c084fc", // 6 — purple
  "#9333ea", // 7 — intense purple
];

export const scaleColor = (value: number) =>
  SCALE_COLORS[Math.min(6, Math.max(0, Math.round(value) - 1))];

// Appetite is a "middle is best" scale on Mounjaro: 3 (normal) is good (green),
// the extremes 1 (suppressed) and 5 (very hungry) are bad (red), 2/4 amber.
const APPETITE_COLORS = [
  "#b91c1c", // 1 — suppressed (bad)
  "#f59e0b", // 2 — amber
  "#22c55e", // 3 — normal (good)
  "#f59e0b", // 4 — amber
  "#b91c1c", // 5 — very hungry (bad)
];

export const appetiteColor = (value: number) =>
  APPETITE_COLORS[Math.min(4, Math.max(0, Math.round(value) - 1))];
