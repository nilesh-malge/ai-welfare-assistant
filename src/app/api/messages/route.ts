import { NextResponse } from "next/server";

import { db } from "@/prisma/db";

import { triageMessage } from "@/lib/ai/triageMessage";
import { generateGroundedAnswer } from "@/lib/ai/generateGroundedAnswer";
import { generateClarifyingQuestion } from "@/lib/ai/generateClarifyingQuestion";

import { applySafetyRules } from "@/lib/safety/applySafetyRules";

import { findRelevantResource } from "@/lib/knowledge/findRelevantResource";

import { getEscalationReply } from "@/lib/support/getEscalationReply";
import { createCaseSummary } from "@/lib/support/createCaseSummary";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const conversationId = Number(body.conversationId);

    const content = typeof body.content === "string" ? body.content.trim() : "";

    if (!Number.isInteger(conversationId) || !content) {
      return NextResponse.json(
        {
          error: "Conversation and message are required.",
        },
        {
          status: 400,
        },
      );
    }

    const conversation = await db.orm.public.Conversation.where({
      id: conversationId,
    }).first();

    if (!conversation) {
      return NextResponse.json(
        {
          error: "Conversation not found.",
        },
        {
          status: 404,
        },
      );
    }

    const previousMessages = await db.orm.public.Message.where({
      conversationId,
    }).all();

    const conversationHistory = previousMessages.map((item) => ({
      role:
        item.role === "assistant"
          ? ("assistant" as const)
          : ("student" as const),
      content: item.content,
    }));

    const triage = await triageMessage(content, conversationHistory);

    // The model helps interpret the message, but application rules
    // remain the final authority for safety decisions.
    let decision = applySafetyRules(content, triage);

    let assistantReply: string | null = null;

    if (decision.isSpam) {
      assistantReply =
        "I can help with student support questions, but I can't assist with promotional or unrelated messages.";
    } else if (decision.disposition === "handle") {
      const resource = findRelevantResource(content, decision);

      if (resource) {
        assistantReply = await generateGroundedAnswer(content, resource);

        // No approved answer is safer than an ungrounded one.
        if (!assistantReply) {
          decision = {
            ...decision,

            urgency: decision.urgency === "low" ? "medium" : decision.urgency,

            disposition: "escalate",

            reason:
              "The approved knowledge base was not sufficient to answer safely.",

            showEmergencySupport: false,
          };
        }
      } else {
        decision = {
          ...decision,

          urgency: decision.urgency === "low" ? "medium" : decision.urgency,

          disposition: "escalate",

          reason:
            "The knowledge base did not contain enough information to answer safely.",

          showEmergencySupport: false,
        };
      }
    }

    if (decision.disposition === "clarify") {
      assistantReply = await generateClarifyingQuestion(
        content,
        conversationHistory,
      );

      if (!assistantReply) {
        decision = {
          ...decision,

          urgency: decision.urgency === "low" ? "medium" : decision.urgency,

          disposition: "escalate",

          reason:
            "Unable to generate a safe clarification, so the enquiry was escalated.",

          showEmergencySupport: false,
        };
      }
    }

    let caseSummary: string | null = null;

    // Escalation messaging is deterministic so the safety response
    // does not depend on another model call.
    if (decision.disposition === "escalate") {
      assistantReply = getEscalationReply(decision);

      caseSummary = createCaseSummary(content, decision);
    }

    const studentMessage = await db.orm.public.Message.create({
      conversationId,

      role: "student",

      content,

      category: decision.category,

      urgency: decision.urgency,

      safeguarding: decision.safeguarding,

      disposition: decision.disposition,
    });

    let savedAssistantMessage = null;

    if (assistantReply) {
      savedAssistantMessage = await db.orm.public.Message.create({
        conversationId,

        role: "assistant",

        content: assistantReply,
      });
    }

    if (decision.disposition === "escalate" && caseSummary) {
      const existingCase = await db.orm.public.SupportCase.where({
        conversationId,
      }).first();

      let nextStatus = "new";

      if (existingCase) {
        if (existingCase.status === "resolved") {
          // A new escalation reopens a resolved case.
          // Keep the existing owner if the case was already claimed.
          nextStatus = existingCase.claimedBy ? "in progress" : "new";
        } else {
          nextStatus = existingCase.status;
        }
      }

      await db.orm.public.SupportCase.upsert({
        create: {
          conversationId,

          summary: caseSummary,

          status: "new",

          urgency: decision.urgency,

          safeguarding: decision.safeguarding,
        },

        update: {
          summary: caseSummary,

          status: nextStatus,

          urgency: decision.urgency,

          safeguarding: decision.safeguarding,
        },

        conflictOn: {
          conversationId,
        },
      });
    }

    return NextResponse.json(
      {
        studentMessage: {
          id: studentMessage.id,

          role: studentMessage.role,

          content: studentMessage.content,
        },

        assistantMessage: savedAssistantMessage
          ? {
              id: savedAssistantMessage.id,

              role: savedAssistantMessage.role,

              content: savedAssistantMessage.content,
            }
          : null,

        triage: {
          category: decision.category,

          urgency: decision.urgency,

          safeguarding: decision.safeguarding,

          disposition: decision.disposition,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error("Failed to process message:", error);

    return NextResponse.json(
      {
        error: "Unable to send the message.",
      },
      {
        status: 500,
      },
    );
  }
}
