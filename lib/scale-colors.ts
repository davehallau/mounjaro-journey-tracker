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

// Light, washed-out versions of the scale hues — same colours as the picker
// swatches, used for the dashboard mood background tint.
export const SCALE_COLORS_LIGHT = [
  "#fecaca", // 1 — red
  "#fee2e2", // 2 — soft red
  "#fef3c7", // 3 — amber
  "#dcfce7", // 4 — green
  "#bbf7d0", // 5 — deeper green
  "#f3e8ff", // 6 — purple
  "#e9d5ff", // 7 — deeper purple
];

export const scaleColorLight = (value: number) =>
  SCALE_COLORS_LIGHT[Math.min(6, Math.max(0, Math.round(value) - 1))];

// Appetite on Mounjaro: reduced/normal (2–3) are good (green), suppressed (1)
// and very hungry (5) are bad (red), hungry (4) is amber.
const APPETITE_COLORS = [
  "#b91c1c", // 1 — suppressed (bad)
  "#22c55e", // 2 — reduced (good)
  "#22c55e", // 3 — normal (good)
  "#f59e0b", // 4 — hungry (amber)
  "#b91c1c", // 5 — very hungry (bad)
];

export const appetiteColor = (value: number) =>
  APPETITE_COLORS[Math.min(4, Math.max(0, Math.round(value) - 1))];
