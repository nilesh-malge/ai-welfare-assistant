import { GoogleGenAI } from "@google/genai";
import type { ConversationMessage } from "@/lib/ai/triageMessage";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const CLARIFY_TIMEOUT_MS = 10000;

export async function generateClarifyingQuestion(
  message: string,
  conversationHistory: ConversationMessage[],
): Promise<string | null> {
  try {
    const recentHistory = conversationHistory
      .slice(-6)
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: `
You are a student support assistant.

The student's message does not contain enough information to decide what support they need.

Ask one or two short, specific follow-up questions that will help identify the issue.

Rules:
- Keep the tone calm and supportive.
- Do not give advice yet.
- Do not ask unnecessary questions.
- Do not ask for sensitive information unless it is needed.
- If the message suggests immediate danger, do not ask questions and return exactly:
ESCALATE_NOW

Recent conversation:
${recentHistory || "No previous messages."}

Current student message:
${message}
`,
      config: {
        httpOptions: {
          timeout: CLARIFY_TIMEOUT_MS,
        },
      },
    });

    const text = response.text?.trim();

    if (!text || text === "ESCALATE_NOW") {
      return null;
    }

    return text;
  } catch (error) {
    console.error("Clarifying question generation failed or timed out:", error);
    return null;
  }
}
