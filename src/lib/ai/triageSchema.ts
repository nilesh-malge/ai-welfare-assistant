import { z } from "zod";

export const triageSchema = z.object({
  category: z.enum([
    "academic",
    "financial",
    "visa/immigration",
    "housing",
    "health/wellbeing",
    "other",
  ]),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  safeguarding: z.boolean(),
  disposition: z.enum(["handle", "clarify", "escalate"]),
  reason: z.string().min(1),
});

export type TriageResult = z.infer<typeof triageSchema>;
