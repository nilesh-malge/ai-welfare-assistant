import type { TriageResult } from "@/lib/ai/triageSchema";

export type SafetyDecision = TriageResult & {
  showEmergencySupport: boolean;
  isSpam: boolean;
};

const crisisSignals = [
  "kill myself",
  "end my life",
  "want to die",
  "hurt myself",
  "harm myself",
  "no point in anything",
  "no point of anything",
  "see the point of anything",
  "do not see the point",
  "don't see the point",
  "not worth living",
  "can't keep myself safe",
  "cannot keep myself safe",
];

const immediateDangerSignals = [
  "immediate danger",
  "in danger right now",
  "danger right now",
  "someone is attacking me",
  "being attacked",
  "about to hurt myself",
  "going to hurt myself",
  "going to harm myself",
  "going to kill myself",
  "about to kill myself",
  "going to end my life",
  "about to end my life",
  "going to jump",
  "about to jump",
  "taken an overdose",
  "just overdosed",
  "overdosed",
  "can't stay safe",
  "cannot stay safe",
];

const promptInjectionSignals = [
  "ignore previous instructions",
  "ignore all previous instructions",
  "ignore your previous instructions",
  "mark this resolved",
  "mark resolved",
  "change the priority",
  "set priority",
  "low priority",
];

const spamSignals = [
  "follow me on instagram",
  "guaranteed followers",
  "buy followers",
  "cheap followers",
  "promote your account",
  "click my link",
  "grow your instagram",
];

const immigrationSignals = [
  "visa",
  "immigration",
  "cas",
  "brp",
  "leave to remain",
  "right to stay",
];

const legalAdviceSignals = [
  "legal advice",
  "is this legal",
  "is that legal",
  "what are my legal rights",
  "take legal action",
  "court action",
  "go to court",
  "solicitor",
  "lawyer",
];

const academicSignals = [
  "past exam paper",
  "past exam papers",
  "past paper",
  "past papers",
  "reading list",
  "reading lists",
  "library",
  "module materials",
  "study materials",
  "lecture materials",
];

const financialSignals = [
  "hardship fund",
  "scholarship",
  "scholarship instalment",
  "scholarship payment",
  "bursary",
  "maintenance loan",
  "delayed payment",
  "rent is due",
  "can't afford",
  "cannot afford",
  "financial difficulty",
];

const housingSignals = [
  "tenancy deposit",
  "deposit back",
  "deposit return",
  "deposit dispute",
  "landlord",
  "letting agent",
];

const worseningWellbeingSignals = [
  "mental health has been going downhill",
  "mental health is going downhill",
  "mental health getting worse",
  "mental health is getting worse",
  "wellbeing is getting worse",
  "wellbeing has been getting worse",
];

function containsSignal(message: string, signal: string) {
  const normalizedMessage = message.toLowerCase();

  const escapedSignal = signal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const pattern = new RegExp(`(^|[^a-z0-9])${escapedSignal}([^a-z0-9]|$)`, "i");

  return pattern.test(normalizedMessage);
}

function containsAny(message: string, signals: string[]) {
  return signals.some((signal) => containsSignal(message, signal));
}

function isVagueLowInformationMessage(message: string) {
  const normalizedMessage = message.toLowerCase().trim();

  const words = normalizedMessage.split(/\s+/).filter(Boolean);

  if (words.length > 6) {
    return false;
  }

  const vagueSignals = [
    "help",
    "help me",
    "need help",
    "asap",
    "urgent",
    "urgently",
  ];

  return containsAny(normalizedMessage, vagueSignals);
}

export function applySafetyRules(
  message: string,
  triage: TriageResult,
): SafetyDecision {
  const hasImmediateDangerSignal = containsAny(message, immediateDangerSignals);

  const hasCrisisSignal = containsAny(message, crisisSignals);

  const hasPromptInjection = containsAny(message, promptInjectionSignals);

  const hasSpamSignal = containsAny(message, spamSignals);

  const hasImmigrationSignal = containsAny(message, immigrationSignals);

  const hasLegalAdviceSignal = containsAny(message, legalAdviceSignals);

  const hasAcademicSignal = containsAny(message, academicSignals);

  const hasFinancialSignal = containsAny(message, financialSignals);

  const hasHousingSignal = containsAny(message, housingSignals);

  const hasWorseningWellbeingSignal = containsAny(
    message,
    worseningWellbeingSignals,
  );

  // Immediate danger takes priority over every other rule.
  // Escalate before asking any clarifying questions.
  if (hasImmediateDangerSignal) {
    return {
      ...triage,
      category: "health/wellbeing",
      urgency: "critical",
      safeguarding: true,
      disposition: "escalate",
      reason: "Immediate safety risk detected by application rules.",
      showEmergencySupport: true,
      isSpam: false,
    };
  }

  // Crisis and safeguarding cases always go to a person.
  if (hasCrisisSignal || triage.safeguarding) {
    return {
      ...triage,
      category: "health/wellbeing",
      urgency: triage.urgency === "critical" ? "critical" : "high",
      safeguarding: true,
      disposition: "escalate",
      reason: "Safeguarding concern requires human follow-up.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (hasWorseningWellbeingSignal) {
    return {
      ...triage,
      category: "health/wellbeing",
      urgency: "high",
      safeguarding: true,
      disposition: "escalate",
      reason: "Worsening mental-health concern requires human follow-up.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (triage.category === "visa/immigration" || hasImmigrationSignal) {
    return {
      ...triage,
      category: "visa/immigration",
      urgency: triage.urgency === "low" ? "medium" : triage.urgency,
      disposition: "escalate",
      reason: "Immigration enquiries require human support.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  // Legal advice is escalated; general KB-backed housing
  // information can still be handled automatically.
  if (hasLegalAdviceSignal) {
    return {
      ...triage,
      disposition: "escalate",
      reason: "Requests for legal advice require human support.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  // Student text must not be able to change case priority or status.
  if (hasPromptInjection) {
    return {
      ...triage,
      category: "other",
      urgency: "medium",
      safeguarding: false,
      disposition: "clarify",
      reason: "Instruction manipulation detected in student message.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (hasSpamSignal) {
    return {
      ...triage,
      category: "other",
      urgency: "low",
      safeguarding: false,
      disposition: "handle",
      reason: "Message appears to be unrelated promotional or spam content.",
      showEmergencySupport: false,
      isSpam: true,
    };
  }

  // Deterministic matches keep obvious KB-supported cases usable
  // when model triage falls back after a provider failure.
  if (hasAcademicSignal) {
    return {
      ...triage,
      category: "academic",
      urgency: "low",
      safeguarding: false,
      disposition: "handle",
      reason: "Routine academic-resource enquiry matched approved knowledge.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (hasFinancialSignal) {
    return {
      ...triage,
      category: "financial",
      urgency: message.toLowerCase().includes("rent is due")
        ? "high"
        : triage.urgency === "critical"
          ? "high"
          : triage.urgency,
      safeguarding: false,
      disposition: "handle",
      reason: "Financial-support enquiry matched approved knowledge.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (hasHousingSignal) {
    return {
      ...triage,
      category: "housing",
      urgency: triage.urgency === "critical" ? "medium" : triage.urgency,
      safeguarding: false,
      disposition: "handle",
      reason: "Routine housing enquiry matched approved tenancy guidance.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  if (isVagueLowInformationMessage(message)) {
    return {
      ...triage,
      category: "other",
      urgency: "medium",
      safeguarding: false,
      disposition: "clarify",
      reason:
        "The message does not contain enough information to understand the student's support need.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  // A critical model classification should never be handled automatically.
  if (triage.urgency === "critical") {
    return {
      ...triage,
      disposition: "escalate",
      reason: "Critical enquiries require human support.",
      showEmergencySupport: false,
      isSpam: false,
    };
  }

  return {
    ...triage,
    showEmergencySupport: false,
    isSpam: false,
  };
}
