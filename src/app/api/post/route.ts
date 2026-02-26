import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/date";
import { getSessionFromRequest } from "@/lib/session";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { content, proof_result } = body;

  // Validate content server-side
  const trimmed = typeof content === "string" ? content.trim() : "";
  if (trimmed.length < 1 || trimmed.length > 200) {
    return NextResponse.json(
      { error: "Content must be between 1 and 200 characters" },
      { status: 400 }
    );
  }

  const today = getTodayUtc();

  // Validate proof result — RP-signed context (from /api/rp-context) authenticates
  // the request. We check for orb credential in the response.
  if (
    !proof_result ||
    !proof_result.responses ||
    proof_result.responses.length === 0
  ) {
    return NextResponse.json(
      { error: "Missing proof" },
      { status: 400 }
    );
  }

  const response = proof_result.responses[0];

  // Enforce orb credential
  if (response.identifier !== "orb") {
    return NextResponse.json(
      { error: "Orb verification required" },
      { status: 403 }
    );
  }

  // Insert post — unique constraint is the final backstop
  try {
    const post = await prisma.post.create({
      data: {
        content: trimmed,
        dayUtc: today,
        userId: session.userId,
      },
    });

    return NextResponse.json({ ok: true, postId: post.id });
  } catch (error: unknown) {
    // Prisma unique constraint violation
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Already posted today" },
        { status: 409 }
      );
    }
    throw error;
  }
}
