// TGA (Australia) injectable weight-management / GLP-1 medications and their
// standard titration doses (mg). "None" carries no dose — pick it instead of 0.
export const MEDICATIONS = [
  { value: "none", label: "None", doses: [] as number[] },
  { value: "mounjaro", label: "Mounjaro", doses: [2.5, 5, 7.5, 10, 12.5, 15] },
  { value: "wegovy", label: "Wegovy", doses: [0.25, 0.5, 1, 1.7, 2.4] },
  { value: "ozempic", label: "Ozempic", doses: [0.25, 0.5, 1, 2] },
  { value: "saxenda", label: "Saxenda", doses: [0.6, 1.2, 1.8, 2.4, 3] },
] as const;

export type MedicationValue = (typeof MEDICATIONS)[number]["value"];

export const MEDICATION_VALUES = MEDICATIONS.map((m) => m.value) as [
  MedicationValue,
  ...MedicationValue[],
];

const BY_VALUE = Object.fromEntries(MEDICATIONS.map((m) => [m.value, m]));

export const dosesFor = (value: string): readonly number[] =>
  BY_VALUE[value]?.doses ?? [];

export const medicationLabel = (value: string | null | undefined): string =>
  value ? (BY_VALUE[value]?.label ?? value) : "None";
