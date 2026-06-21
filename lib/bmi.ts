// Single source of truth for BMI calculation and WHO categorisation.
// Used by both the charts (colour + bands) and any summary UI.

export type BmiBand = {
  label: string;
  /** inclusive lower bound */
  min: number;
  /** exclusive upper bound (Infinity for the top band) */
  max: number;
  color: string;
  explanation: string;
};

export const BMI_BANDS: BmiBand[] = [
  {
    label: "Underweight",
    min: 0,
    max: 18.5,
    color: "#3b82f6",
    explanation: "BMI below 18.5 — below the healthy range.",
  },
  {
    label: "Healthy weight",
    min: 18.5,
    max: 25,
    color: "#22c55e",
    explanation: "BMI 18.5–24.9 — the healthy weight range.",
  },
  {
    label: "Overweight",
    min: 25,
    max: 30,
    color: "#f59e0b",
    explanation: "BMI 25–29.9 — above the healthy range.",
  },
  {
    label: "Obese (class I)",
    min: 30,
    max: 35,
    color: "#f97316",
    explanation: "BMI 30–34.9 — obesity, class I.",
  },
  {
    label: "Obese (class II)",
    min: 35,
    max: 40,
    color: "#ef4444",
    explanation: "BMI 35–39.9 — obesity, class II.",
  },
  {
    label: "Obese (class III)",
    min: 40,
    max: Infinity,
    color: "#b91c1c",
    explanation: "BMI 40 or above — obesity, class III.",
  },
];

export function calcBmi(weightKg: number, heightCm: number): number {
  if (!heightCm) return 0;
  const m = heightCm / 100;
  return weightKg / (m * m);
}

export function bmiBand(bmi: number): BmiBand {
  return (
    BMI_BANDS.find((b) => bmi >= b.min && bmi < b.max) ??
    BMI_BANDS[BMI_BANDS.length - 1]
  );
}

/** Round for display. */
export function roundBmi(bmi: number): number {
  return Math.round(bmi * 10) / 10;
}
