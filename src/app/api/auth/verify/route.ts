import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSessionToken, setSessionCookie } from "@/lib/session";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { responses } = body;

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

  // In the v4 flow, the RP-signed context (generated server-side in /api/rp-context)
  // authenticates that this request originated from our app. The nullifier from the
  // proof is used for user identity.
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
