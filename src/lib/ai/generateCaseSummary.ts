import type { SafetyDecision } from "@/lib/safety/applySafetyRules";

export function createCaseSummary(
  message: string,
  decision: SafetyDecision,
): string {
  const safeguardingNote = decision.safeguarding
    ? " Safeguarding concern identified."
    : "";

  return `${decision.category} enquiry with ${decision.urgency} urgency.${safeguardingNote} Latest student message: ${message}`;
}
