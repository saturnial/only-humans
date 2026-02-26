import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getTodayUtc } from "@/lib/date";
import { getSessionFromRequest } from "@/lib/session";
import { verifyWorldIDProof } from "@/lib/worldid";

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

  // Compute action server-side — never trust client
  const today = getTodayUtc();
  const expectedAction = `daily-post:${today}`;

  // Validate proof result
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

  // For v3 legacy proofs, verify via Cloud API
  if (proof_result.protocol_version === "3.0") {
    const result = await verifyWorldIDProof({
      proof: response.proof,
      merkle_root: response.merkle_root,
      nullifier_hash: response.nullifier,
      action: expectedAction,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: "Verification failed" },
        { status: 401 }
      );
    }

    if (result.verification_level !== "orb") {
      return NextResponse.json(
        { error: "Orb verification required" },
        { status: 403 }
      );
    }
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
