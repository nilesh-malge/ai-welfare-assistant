import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

const urgencyOrder: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function GET() {
  try {
    const cases = await db.orm.public.SupportCase.all();

    const casesWithConversation = await Promise.all(
      cases.map(async (supportCase) => {
        const conversation = await db.orm.public.Conversation.where({
          id: supportCase.conversationId,
        }).first();

        const messages = await db.orm.public.Message.where({
          conversationId: supportCase.conversationId,
        }).all();

        return {
          ...supportCase,
          student: conversation
            ? {
                name: conversation.name,
                email: conversation.email,
              }
            : null,
          messages: messages.map((message) => ({
            id: message.id,
            role: message.role,
            content: message.content,
            category: message.category,
            urgency: message.urgency,
            safeguarding: message.safeguarding,
            disposition: message.disposition,
            createdAt: message.createdAt,
          })),
        };
      }),
    );

    const sortedCases = casesWithConversation.sort((a, b) => {
      if (a.safeguarding !== b.safeguarding) {
        return a.safeguarding ? -1 : 1;
      }

      const urgencyDifference =
        (urgencyOrder[b.urgency] ?? 0) - (urgencyOrder[a.urgency] ?? 0);

      if (urgencyDifference !== 0) {
        return urgencyDifference;
      }

      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

    return NextResponse.json({
      cases: sortedCases,
    });
  } catch (error) {
    console.error("Failed to load support cases:", error);

    return NextResponse.json(
      { error: "Unable to load support cases." },
      { status: 500 },
    );
  }
}
