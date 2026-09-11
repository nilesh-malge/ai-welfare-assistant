import type { TriageResult } from "@/lib/ai/triageSchema";

export function getFallbackTriage(): TriageResult {
  return {
    category: "other",
    urgency: "high",
    safeguarding: false,
    disposition: "escalate",
    reason: "AI triage was unavailable, so the enquiry was escalated safely.",
  };
}
