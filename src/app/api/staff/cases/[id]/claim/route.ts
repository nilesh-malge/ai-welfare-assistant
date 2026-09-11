import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const caseId = Number(id);

    const body = await request.json();

    const staffName =
      typeof body.staffName === "string" ? body.staffName.trim() : "";

    if (!Number.isInteger(caseId)) {
      return NextResponse.json({ error: "Invalid case." }, { status: 400 });
    }

    if (!staffName) {
      return NextResponse.json(
        { error: "Staff name is required." },
        { status: 400 },
      );
    }

    const supportCase = await db.orm.public.SupportCase.where({
      id: caseId,
    }).first();

    if (!supportCase) {
      return NextResponse.json({ error: "Case not found." }, { status: 404 });
    }

    try {
      await db.orm.public.CaseClaim.create({
        supportCaseId: caseId,
        staffName,
      });
    } catch (error) {
      const existingClaim = await db.orm.public.CaseClaim.where({
        supportCaseId: caseId,
      }).first();

      if (existingClaim) {
        return NextResponse.json(
          {
            error: "This case has already been claimed.",
            claimedBy: existingClaim.staffName,
          },
          { status: 409 },
        );
      }

      throw error;
    }

    const updatedCase = await db.orm.public.SupportCase.where({
      id: caseId,
    }).update({
      claimedBy: staffName,
      claimedAt: new Date().toISOString(),
      status: "in progress",
    });

    return NextResponse.json({
      case: updatedCase,
    });
  } catch (error) {
    console.error("Failed to claim support case:", error);

    return NextResponse.json(
      { error: "Unable to claim this case." },
      { status: 500 },
    );
  }
}
