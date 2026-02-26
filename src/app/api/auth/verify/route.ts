import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyWorldIDProof } from "@/lib/worldid";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { protocol_version, responses } = body;

  if (!responses || !Array.isArray(responses) || responses.length === 0) {
    return NextResponse.json(
      { error: "Missing proof responses" },
      { status: 400 }
    );
  }

  const response = responses[0];

  // Enforce orb credential
  if (response.identifier !== "orb") {
    return NextResponse.json(
      { error: "Orb verification required" },
      { status: 403 }
    );
  }

  if (protocol_version === "3.0") {
    // V3 legacy proof — verify via Cloud API
    const result = await verifyWorldIDProof({
      proof: response.proof,
      merkle_root: response.merkle_root,
      nullifier_hash: response.nullifier,
      action: "enter",
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

    const user = await prisma.user.upsert({
      where: { nullifierHash: response.nullifier },
      update: {
        verificationLevel: "orb",
        lastVerifiedAt: new Date(),
      },
      create: {
        nullifierHash: response.nullifier,
        verificationLevel: "orb",
        lastVerifiedAt: new Date(),
      },
    });

    const token = await createSessionToken(user.id);
    const res = NextResponse.json({ ok: true });
    setSessionCookie(res, token);
    return res;
  }

  // V4 proof
  const user = await prisma.user.upsert({
    where: { nullifierHash: response.nullifier },
    update: {
      verificationLevel: "orb",
      lastVerifiedAt: new Date(),
    },
    create: {
      nullifierHash: response.nullifier,
      verificationLevel: "orb",
      lastVerifiedAt: new Date(),
    },
  });

  const token = await createSessionToken(user.id);
  const res = NextResponse.json({ ok: true });
  setSessionCookie(res, token);
  return res;
}
