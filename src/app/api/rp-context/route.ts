import { NextRequest, NextResponse } from "next/server";
import { signRequest } from "@worldcoin/idkit-core/signing";

export async function POST(request: NextRequest) {
  const { action } = await request.json();

  if (!action || typeof action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  const rpSigningKey = process.env.RP_SIGNING_KEY;
  const rpId = process.env.RP_ID;

  if (!rpSigningKey || !rpId) {
    return NextResponse.json(
      { error: "RP credentials not configured" },
      { status: 500 }
    );
  }

  const rpSig = signRequest(action, rpSigningKey);

  return NextResponse.json({
    rp_context: {
      rp_id: rpId,
      nonce: rpSig.nonce,
      created_at: rpSig.createdAt,
      expires_at: rpSig.expiresAt,
      signature: rpSig.sig,
    },
  });
}
