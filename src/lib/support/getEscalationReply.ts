import type { SafetyDecision } from "@/lib/safety/applySafetyRules";

export function getEscalationReply(decision: SafetyDecision): string {
  if (decision.showEmergencySupport) {
    return (
      "If you or someone else may be in immediate danger, call 999 now. " +
      "You can also contact Samaritans on 116 123. " +
      "I’m escalating this to the student support team now."
    );
  }

  if (decision.category === "visa/immigration") {
    return (
      "I can provide general information, but I can’t advise on your individual immigration situation. " +
      "I’m passing this to a human adviser who can follow up with you."
    );
  }

  if (decision.safeguarding) {
    return (
      "Thank you for telling me. I’m passing this to the student support team " +
      "so someone can follow up with you."
    );
  }

  return "I’m passing this enquiry to the student support team so a person can follow up with you.";
}
