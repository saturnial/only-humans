import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorldIDProof } from "@/lib/worldid";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { proof, merkle_root, nullifier_hash } = body;

  if (!proof || !merkle_root || !nullifier_hash) {
    return NextResponse.json({ error: "Missing proof fields" }, { status: 400 });
  }

  // Verify proof server-side with action "enter"
  const result = await verifyWorldIDProof({
    proof,
    merkle_root,
    nullifier_hash,
    action: "enter",
  });

  if (!result.success) {
    return NextResponse.json({ error: "Verification failed" }, { status: 401 });
  }

  // Enforce orb verification server-side
  if (result.verification_level !== "orb") {
    return NextResponse.json(
      { error: "Orb verification required" },
      { status: 403 }
    );
  }

  // Upsert user by nullifierHash
  const user = await prisma.user.upsert({
    where: { nullifierHash: result.nullifier_hash! },
    update: {
      verificationLevel: result.verification_level,
      lastVerifiedAt: new Date(),
    },
    create: {
      nullifierHash: result.nullifier_hash!,
      verificationLevel: result.verification_level,
      lastVerifiedAt: new Date(),
    },
  });

  // Create session and set cookie
  const token = await createSessionToken(user.id);
  const response = NextResponse.json({ ok: true });
  setSessionCookie(response, token);

  return response;
}
