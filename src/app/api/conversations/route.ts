import { NextResponse } from "next/server";
import { db } from "@/prisma/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    const conversation = await db.orm.public.Conversation.create({
      name,
      email,
    });

    return NextResponse.json(
      {
        id: conversation.id,
        name: conversation.name,
        email: conversation.email,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create conversation:", error);

    return NextResponse.json(
      {
        error: "Unable to start the conversation.",
      },
      { status: 500 },
    );
  }
}
