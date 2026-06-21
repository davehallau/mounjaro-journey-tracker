import { z } from "zod";
import { MEDICATION_VALUES, dosesFor } from "./medications";

export const GENDERS = ["male", "female", "other", "undisclosed"] as const;
export const GENDER_LABELS: Record<(typeof GENDERS)[number], string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  undisclosed: "Prefer not to say",
};

export const DOSES = [2.5, 5, 7.5, 10, 12.5, 15] as const;

// Scale labels shown in the form so values stay meaningful later. Mood runs
// 1–7 (7 = "hyper"); energy and appetite are 1–5.
export const SCALE_LABELS = {
  mood: [
    "1 — very low",
    "2 — low",
    "3 — meh",
    "4 — good",
    "5 — great",
    "6 — elated",
    "7 — hyper",
  ],
  energy: ["1 — exhausted", "2", "3 — okay", "4", "5 — energetic"],
  appetite: [
    "1 — suppressed",
    "2 — reduced",
    "3 — normal",
    "4 — hungry",
    "5 — very hungry",
  ],
} as const;

const isoDate = z
  .string()
  .min(1, "Date is required")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Enter a valid date");

const optionalScale = (max = 5) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().int().min(1).max(max).optional(),
  );

const optionalNumber = (min: number, max: number) =>
  z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.coerce.number().min(min).max(max).optional(),
  );

export const participantSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  dob: isoDate.refine(
    (v) => new Date(v) <= new Date(),
    "Date of birth can't be in the future",
  ),
  gender: z.enum(GENDERS),
  heightCm: z.coerce.number().min(50, "Too short").max(260, "Too tall"),
  targetBmi: optionalNumber(10, 60),
});

export const recordingSchema = z.object({
  recordedOn: isoDate,
  weightKg: z.coerce.number().min(20, "Too low").max(400, "Too high"),
  waistCm: optionalNumber(30, 300),
  mood: optionalScale(7),
  energy: optionalScale(5),
  appetite: optionalScale(5),
  notes: z.preprocess(
    (v) => (v === "" || v == null ? undefined : v),
    z.string().max(2000).optional(),
  ),
});

export const doseSchema = z
  .object({
    recordedOn: isoDate,
    medication: z.enum(MEDICATION_VALUES).refine(
      (m) => m !== "none",
      "Pick a medication",
    ),
    mounjaroDoseMg: z.preprocess(
      (v) => (v === "" || v == null || v === "none" ? undefined : v),
      z.coerce.number().optional(),
    ),
  })
  .superRefine((val, ctx) => {
    if (
      val.mounjaroDoseMg != null &&
      !dosesFor(val.medication).includes(val.mounjaroDoseMg)
    ) {
      ctx.addIssue({
        code: "custom",
        path: ["mounjaroDoseMg"],
        message: "Pick a valid dose",
      });
    }
  });

export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  password: z.string().min(8, "Use at least 8 characters").max(200),
});

export const activateSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export type ParticipantInput = z.infer<typeof participantSchema>;
export type RecordingInput = z.infer<typeof recordingSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;

/** Convert a flat FormData into a plain object for schema parsing. */
export function formToObject(formData: FormData): Record<string, unknown> {
  const obj: Record<string, unknown> = {};
  for (const [k, v] of formData.entries()) obj[k] = v;
  return obj;
}

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
};

export const EMPTY_FORM_STATE: FormState = { ok: false };

/** First error message per field, resilient across zod versions. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "_");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
