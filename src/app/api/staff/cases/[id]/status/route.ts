import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const allowedStatuses = ["new", "in progress", "resolved"] as const;

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const caseId = Number(id);

    const body = await request.json();
    const status =
      typeof body.status === "string" ? body.status.trim().toLowerCase() : "";

    if (!Number.isInteger(caseId)) {
      return NextResponse.json({ error: "Invalid case." }, { status: 400 });
    }

    if (!allowedStatuses.includes(status as (typeof allowedStatuses)[number])) {
      return NextResponse.json(
        { error: "Invalid case status." },
        { status: 400 },
      );
    }

    const existingCase = await db.orm.public.SupportCase.where({
      id: caseId,
    }).first();

    if (!existingCase) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    const updatedCase = await db.orm.public.SupportCase.where({
      id: caseId,
    }).update({
      status,
    });

    return NextResponse.json({
      case: updatedCase,
    });
  } catch (error) {
    console.error("Failed to update case status:", error);

    return NextResponse.json(
      { error: "Unable to update case status." },
      { status: 500 },
    );
  }
}
